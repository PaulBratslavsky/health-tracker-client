import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { useAppSession } from '#/lib/session';
import {
  countRecentContentGenerations,
  findContentByVideoIdService,
  generateVideoLearningService,
  RATE_LIMIT_PER_24H,
  type StrapiContent,
} from '#/lib/services/learning';
import { fetchCurrentUserService } from '#/lib/services/auth';
import { isPremium } from '#/lib/premium';

const VideoIdSchema = z.object({
  videoId: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[\w-]+$/, 'Invalid video id'),
});

// -----------------------------------------------------------------------------
// Pure lookup — called by the route loader and by the polling loop.
// -----------------------------------------------------------------------------
export const findVideoContent = createServerFn({ method: 'GET' })
  .inputValidator((data: { videoId: string }) => VideoIdSchema.parse(data))
  .handler(async ({ data }): Promise<StrapiContent | null> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    return await findContentByVideoIdService(data.videoId, jwt);
  });

// -----------------------------------------------------------------------------
// Trigger — kicks off generation and returns immediately.
//
// Synchronous pre-checks (rate limit, auth, tier) happen BEFORE the detached
// task fires so they can be reported back to the UI. Background failures
// (AI error, Strapi error) are recorded in `recentFailures` so the polling
// loop sees them on the next invalidate.
// -----------------------------------------------------------------------------

export type TriggerResult =
  | { status: 'found'; content: StrapiContent }
  | { status: 'started' }
  | { status: 'not_authed' }
  | { status: 'not_pro' }
  | { status: 'rate_limited'; error: string }
  | { status: 'error'; error: string };

// In-process set so two concurrent clicks on the same videoId don't spawn
// duplicate AI calls. Cleared when the detached task finishes.
const inflight = new Set<string>();

// Recent background failures, keyed by videoId. The polling loop checks
// these on subsequent calls so a silently-failed generation surfaces as an
// error state instead of an infinite "generating" spinner. Entries self-
// expire after 5 minutes so a later retry can proceed.
type RecentFailure = { error: string; at: number };
const recentFailures = new Map<string, RecentFailure>();
const FAILURE_TTL_MS = 5 * 60 * 1000;

function readRecentFailure(videoId: string): string | null {
  const entry = recentFailures.get(videoId);
  if (!entry) return null;
  if (Date.now() - entry.at > FAILURE_TTL_MS) {
    recentFailures.delete(videoId);
    return null;
  }
  return entry.error;
}

export const triggerContentGeneration = createServerFn({ method: 'POST' })
  .inputValidator((data: { videoId: string }) => VideoIdSchema.parse(data))
  .handler(async ({ data }): Promise<TriggerResult> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;

    // 1. Dedupe — already generated.
    const existing = await findContentByVideoIdService(data.videoId, jwt);
    if (existing) {
      recentFailures.delete(data.videoId);
      return { status: 'found', content: existing };
    }

    // 2. Auth gate.
    if (!jwt) return { status: 'not_authed' };

    const me = await fetchCurrentUserService(jwt);
    if (!me?.profile?.documentId) return { status: 'not_authed' };
    if (!isPremium(me.profile)) return { status: 'not_pro' };

    // 3. Already in flight for this video in this process — polling will
    //    pick up the result (or the failure) as it comes back.
    if (inflight.has(data.videoId)) return { status: 'started' };

    // 4. Surface a recent background failure so the UI can render an error
    //    state instead of polling forever. The user can hit Retry which
    //    clears the cache and tries again.
    const previousError = readRecentFailure(data.videoId);
    if (previousError) {
      return { status: 'error', error: previousError };
    }

    // 5. Rate limit check — synchronous, so we can return an explanatory
    //    status to the client BEFORE spawning a background task that would
    //    fail anyway.
    const recentCount = await countRecentContentGenerations(
      jwt,
      me.profile.documentId,
    );
    if (recentCount >= RATE_LIMIT_PER_24H) {
      return {
        status: 'rate_limited',
        error: `You've generated ${RATE_LIMIT_PER_24H} summaries in the last 24 hours. Try again later.`,
      };
    }

    // 6. Fire-and-forget. Errors are captured in `recentFailures` so the
    //    next poll surfaces them. `inflight` is cleared in `finally`.
    inflight.add(data.videoId);
    void (async () => {
      try {
        const profileDocumentId = me.profile!.documentId;
        const result = await generateVideoLearningService({
          jwt,
          videoId: data.videoId,
          profileDocumentId,
        });
        if (!result.success) {
          recentFailures.set(data.videoId, {
            error: result.error,
            at: Date.now(),
          });
          console.error('[bg generation] failed', {
            videoId: data.videoId,
            error: result.error,
          });
        } else {
          recentFailures.delete(data.videoId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        recentFailures.set(data.videoId, { error: message, at: Date.now() });
        console.error('[bg generation] exception', {
          videoId: data.videoId,
          err,
        });
      } finally {
        inflight.delete(data.videoId);
      }
    })();

    return { status: 'started' };
  });

// -----------------------------------------------------------------------------
// Clear the last failure for a video, so the user can retry after an error.
// -----------------------------------------------------------------------------
export const clearVideoFailure = createServerFn({ method: 'POST' })
  .inputValidator((data: { videoId: string }) => VideoIdSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    recentFailures.delete(data.videoId);
    return { ok: true };
  });
