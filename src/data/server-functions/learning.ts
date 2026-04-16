import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { useAppSession } from '#/lib/session';
import {
  findContentByVideoIdService,
  generateVideoLearningService,
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
// Fast, cacheable, works with or without a JWT.
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
// The actual AI + Strapi work runs DETACHED on the server; the user can
// navigate away and the job keeps going (as long as the Node process is
// alive). Idempotent: re-triggering for a video that already has content or
// is already being generated just short-circuits.
// -----------------------------------------------------------------------------

export type TriggerResult =
  | { status: 'found'; content: StrapiContent }
  | { status: 'started' }
  | { status: 'not_authed' }
  | { status: 'not_pro' }
  | { status: 'rate_limited'; error: string }
  | { status: 'error'; error: string };

// Module-level lock set so concurrent triggers for the same videoId don't
// spawn duplicate AI calls. In-memory — fine for a single Node process; if
// we ever scale horizontally this moves to Redis. The `findContentByVideoId`
// dedupe check still covers multi-process races (second worker finds the
// content created by the first on the next query).
const inflight = new Set<string>();

export const triggerContentGeneration = createServerFn({ method: 'POST' })
  .inputValidator((data: { videoId: string }) => VideoIdSchema.parse(data))
  .handler(async ({ data }): Promise<TriggerResult> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;

    // Short-circuit if already done.
    const existing = await findContentByVideoIdService(data.videoId, jwt);
    if (existing) return { status: 'found', content: existing };

    if (!jwt) return { status: 'not_authed' };

    const me = await fetchCurrentUserService(jwt);
    if (!me?.profile?.documentId) return { status: 'not_authed' };
    if (!isPremium(me.profile)) return { status: 'not_pro' };

    // Deduplicate concurrent in-process triggers for the same videoId.
    if (inflight.has(data.videoId)) return { status: 'started' };

    inflight.add(data.videoId);

    // FIRE AND FORGET. The client's response doesn't wait for this. The
    // Node process keeps the promise alive; the client can navigate away
    // freely. On serverless this would need platform-specific `waitUntil`.
    void (async () => {
      try {
        const profileDocumentId = me.profile!.documentId;
        const result = await generateVideoLearningService({
          jwt,
          videoId: data.videoId,
          profileDocumentId,
        });
        if (!result.success) {
          console.error('[bg generation] failed', {
            videoId: data.videoId,
            error: result.error,
          });
        }
      } catch (err) {
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
