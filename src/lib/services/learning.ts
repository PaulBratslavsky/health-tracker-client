import { generateText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { StrapiMedia } from '#/lib/services/posts';

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';
const TRANSCRIPT_URL =
  process.env.TRANSCRIPT_URL ??
  'https://deserving-harmony-9f5ca04daf.strapiapp.com/api/ai-sdk-yt-transcripts/yt-transcript';

// Anthropic model for summary generation. Haiku 4.5 is the sweet spot: great
// structured-output adherence with zod, crisp prose, ~$0.013 per summary at
// typical 8K-input transcripts. Swap if quality needs change.
const SUMMARY_MODEL = 'claude-haiku-4-5-20251001';

// Rate limit: a Pro member can trigger N successful generations per rolling
// 24h window. Counted by looking at their recent content entries — no extra
// schema needed. Dedupe hits short-circuit before this runs.
export const RATE_LIMIT_PER_24H = 10;

type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

// -----------------------------------------------------------------------------
// Types — shared with server functions + route components
// -----------------------------------------------------------------------------

export type StrapiTakeaway = {
  id: number;
  text: string;
};

export type StrapiSection = {
  id: number;
  timeSec: number | null;
  heading: string;
  body: string;
};

export type StrapiActionStep = {
  id: number;
  title: string;
  body: string;
};

export type StrapiContentType = 'video' | 'article' | 'blog' | 'guide';

export type StrapiContent = {
  id: number;
  documentId: string;
  title: string;
  description: string | null;
  slug: string | null;
  content: string | null;
  contentType: StrapiContentType;
  sourceUrl: string | null;
  youtubeVideoId: string | null;
  videoTitle: string | null;
  videoAuthor: string | null;
  videoThumbnailUrl: string | null;
  aiModel: string | null;
  transcriptLanguage: string | null;
  keyTakeaways: StrapiTakeaway[] | null;
  sections: StrapiSection[] | null;
  actionSteps: StrapiActionStep[] | null;
  createdAt: string;
  author: {
    documentId: string;
    displayName: string;
    avatar: StrapiMedia;
  } | null;
};

// -----------------------------------------------------------------------------
// Transcript endpoint (upstream Strapi service)
// -----------------------------------------------------------------------------

type UpstreamTranscript = {
  fullTranscript?: string;
  transcript?: string;
  title?: string;
  videoId?: string;
};

type TranscriptData = {
  transcript: string;
  upstreamTitle?: string;
  language: string;
  videoId: string;
};

async function fetchTranscript(videoId: string): Promise<ServiceResult<TranscriptData>> {
  const res = await fetch(`${TRANSCRIPT_URL}/${encodeURIComponent(videoId)}`);
  if (!res.ok) {
    return { success: false, error: `Transcript fetch failed (${res.status})` };
  }
  const json = (await res.json()) as {
    data?: UpstreamTranscript;
  } & UpstreamTranscript;
  const body = json.data ?? json;
  const transcript = body.fullTranscript ?? body.transcript;
  if (!transcript || typeof transcript !== 'string') {
    return { success: false, error: 'No transcript available for this video' };
  }
  return {
    success: true,
    data: {
      transcript,
      upstreamTitle: body.title,
      language: 'en',
      videoId,
    },
  };
}

// -----------------------------------------------------------------------------
// YouTube oEmbed (public, no API key)
// -----------------------------------------------------------------------------

type OEmbedResponse = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

type VideoMeta = {
  title?: string;
  author?: string;
  thumbnailUrl?: string;
};

async function fetchYouTubeMeta(videoId: string): Promise<VideoMeta> {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const json = (await res.json()) as OEmbedResponse;
    return {
      title: json.title,
      author: json.author_name,
      thumbnailUrl: json.thumbnail_url,
    };
  } catch {
    // oEmbed is best-effort — never block summary generation on missing
    // metadata. Summaries work without it.
    return {};
  }
}

// -----------------------------------------------------------------------------
// Strapi queries / mutations on the content collection
// -----------------------------------------------------------------------------

export async function findContentByVideoIdService(
  videoId: string,
  jwt?: string,
): Promise<StrapiContent | null> {
  const params = new URLSearchParams();
  params.set('filters[contentType][$eq]', 'video');
  params.set('filters[youtubeVideoId][$eq]', videoId);
  params.set('populate[author][populate]', 'avatar');
  params.set('populate[keyTakeaways]', 'true');
  params.set('populate[sections]', 'true');
  params.set('populate[actionSteps]', 'true');
  params.set('pagination[pageSize]', '1');

  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  const res = await fetch(`${STRAPI_URL}/api/contents?${params.toString()}`, { headers });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: StrapiContent[] };
  return json.data?.[0] ?? null;
}

export async function countRecentContentGenerations(
  jwt: string,
  profileDocumentId: string,
): Promise<number> {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams();
  params.set('filters[author][documentId][$eq]', profileDocumentId);
  params.set('filters[createdAt][$gte]', sinceIso);
  params.set('pagination[pageSize]', '1');
  params.set('pagination[withCount]', 'true');

  const res = await fetch(`${STRAPI_URL}/api/contents?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return 0;
  const json = (await res.json()) as {
    meta?: { pagination?: { total?: number } };
  };
  return json.meta?.pagination?.total ?? 0;
}

type ContentCreate = {
  title: string;
  description: string;
  content: string;
  contentType: StrapiContentType;
  sourceUrl: string;
  youtubeVideoId: string;
  videoTitle?: string;
  videoAuthor?: string;
  videoThumbnailUrl?: string;
  aiModel: string;
  transcriptLanguage: string;
  keyTakeaways: Array<{ text: string }>;
  sections: Array<{ timeSec?: number; heading: string; body: string }>;
  actionSteps: Array<{ title: string; body: string }>;
  author: string; // profile documentId
};

async function createContentService(
  jwt: string,
  payload: ContentCreate,
): Promise<ServiceResult<StrapiContent>> {
  const res = await fetch(`${STRAPI_URL}/api/contents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) {
    const raw = await res.text();
    let parsed: {
      error?: {
        message?: string;
        details?: { errors?: Array<{ path?: string[]; message?: string }> };
      };
    } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // keep empty parsed, fall through
    }
    // Surface field-level errors when Strapi returns them. `2 errors occurred`
    // by itself is useless — we want to know WHICH fields.
    const fieldErrors = parsed.error?.details?.errors ?? [];
    const detail = fieldErrors.length
      ? fieldErrors
          .map((e) => `${(e.path ?? []).join('.')}: ${e.message ?? 'invalid'}`)
          .join('; ')
      : (parsed.error?.message ?? `Strapi error ${res.status}`);
    // Server-side log so the full payload is also visible in the terminal.
    console.error('[content create] failed', {
      status: res.status,
      body: raw,
      payload,
    });
    return { success: false, error: detail };
  }
  const json = (await res.json()) as { data: StrapiContent };
  return { success: true, data: json.data };
}

// -----------------------------------------------------------------------------
// AI generation (structured output)
// -----------------------------------------------------------------------------

// Tool-use path (not strict Structured Outputs) — accepts the full JSON
// Schema including `minLength`, `min`, `minItems` bounds, so we can keep the
// zod schema expressive. Anthropic's tool-use schema is permissive; we just
// need to force the model to call the tool exactly once.
const SummarySchema = z.object({
  title: z.string().min(4).max(200).describe('Short title for the summary. Punchy, not a sentence.'),
  description: z
    .string()
    .min(20)
    .max(500)
    .describe('One-sentence subtitle describing what the viewer will learn.'),
  content: z
    .string()
    .min(100)
    .max(4000)
    .describe(
      'Markdown TL;DR — one or two paragraphs. Do NOT duplicate the key takeaways or sections here.',
    ),
  keyTakeaways: z
    .array(z.object({ text: z.string().min(4).max(280) }))
    .min(3)
    .max(7)
    .describe('Punchy bullets, one sentence each, no markdown.'),
  sections: z
    .array(
      z.object({
        timeSec: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Second-offset into the video where this section begins.'),
        heading: z.string().min(3).max(200),
        body: z.string().min(20).max(2000).describe('Markdown body of the section.'),
      }),
    )
    .min(2)
    .max(10)
    .describe(
      'Timestamped walkthrough. timeSec should correspond to a real moment in the transcript.',
    ),
  actionSteps: z
    .array(
      z.object({
        title: z.string().min(3).max(120),
        body: z.string().min(10).max(600),
      }),
    )
    .min(2)
    .max(5)
    .describe('Concrete plan the reader can follow this week. Verb-led title + body explaining how.'),
});

export type GeneratedSummary = z.infer<typeof SummarySchema>;

// The single tool we hand to Claude. Input schema == our output shape. The
// model is forced to call this tool via `toolChoice`, fills the input with
// structured content, and we read that back out of the toolCall.
const submitVideoSummaryTool = tool({
  description:
    'Submit the complete structured summary of the video. Call exactly once, with every field populated. Do not return plain text — always use this tool.',
  inputSchema: SummarySchema,
});

async function generateSummaryWithAI(
  transcript: TranscriptData,
  meta: VideoMeta,
): Promise<ServiceResult<GeneratedSummary>> {
  try {
    const displayTitle = meta.title ?? transcript.upstreamTitle;
    const result = await generateText({
      model: anthropic(SUMMARY_MODEL),
      tools: { submit_video_summary: submitVideoSummaryTool },
      toolChoice: { type: 'tool', toolName: 'submit_video_summary' },
      system: [
        'You are a health-content summarizer for a community of people tracking waist-to-height ratio, nutrition, and fasting habits.',
        'Given a YouTube video transcript, produce a structured summary optimized for someone who wants to act on the content, not just read about it.',
        'Be specific and evidence-oriented. Avoid marketing language, motivational fluff, or generic wellness phrases.',
        'For sections, extract natural narrative beats (not fixed intervals) and estimate the `timeSec` where each begins from the transcript.',
        'Action steps must be concrete and doable this week, not abstract ("do more cardio") — prefer measurable actions ("walk 8,000 steps on 5 days this week").',
        'Do not invent timestamps you cannot ground in the transcript.',
        'Always respond by calling the `submit_video_summary` tool. Never produce plain text.',
      ].join('\n'),
      prompt: [
        displayTitle ? `Video title: ${displayTitle}` : null,
        meta.author ? `Channel: ${meta.author}` : null,
        '',
        'Transcript:',
        transcript.transcript,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    const call = result.toolCalls.find(
      (c): c is typeof c & { toolName: 'submit_video_summary' } =>
        c.toolName === 'submit_video_summary',
    );
    if (!call) {
      return {
        success: false,
        error: 'Model did not submit a summary via the expected tool',
      };
    }
    return { success: true, data: call.input as GeneratedSummary };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return { success: false, error: message };
  }
}

// -----------------------------------------------------------------------------
// Orchestration — the single service used by the server function
// -----------------------------------------------------------------------------

export type GenerateVideoLearningInput = {
  jwt: string;
  videoId: string;
  profileDocumentId: string;
};

export async function generateVideoLearningService(
  input: GenerateVideoLearningInput,
): Promise<ServiceResult<StrapiContent>> {
  // 1. Dedupe: if a video content entry already exists for this videoId,
  // return it.
  const existing = await findContentByVideoIdService(input.videoId, input.jwt);
  if (existing) return { success: true, data: existing };

  // 2. Rate limit — scoped to the generator's profile.
  const recentCount = await countRecentContentGenerations(input.jwt, input.profileDocumentId);
  if (recentCount >= RATE_LIMIT_PER_24H) {
    return {
      success: false,
      error: `You've generated ${RATE_LIMIT_PER_24H} summaries in the last 24 hours. Try again later.`,
    };
  }

  // 3. Fetch transcript + YouTube metadata in parallel. oEmbed is
  // best-effort; the transcript is required.
  const [transcriptResult, meta] = await Promise.all([
    fetchTranscript(input.videoId),
    fetchYouTubeMeta(input.videoId),
  ]);
  if (!transcriptResult.success) return transcriptResult;

  // 4. Generate the structured summary.
  const summary = await generateSummaryWithAI(transcriptResult.data, meta);
  if (!summary.success) return summary;

  // 5. Persist to the content collection.
  return await createContentService(input.jwt, {
    title: summary.data.title,
    description: summary.data.description,
    content: summary.data.content,
    contentType: 'video',
    sourceUrl: `https://www.youtube.com/watch?v=${input.videoId}`,
    youtubeVideoId: input.videoId,
    videoTitle: meta.title ?? transcriptResult.data.upstreamTitle,
    videoAuthor: meta.author,
    videoThumbnailUrl: meta.thumbnailUrl ?? `https://i.ytimg.com/vi/${input.videoId}/hqdefault.jpg`,
    aiModel: SUMMARY_MODEL,
    transcriptLanguage: transcriptResult.data.language,
    keyTakeaways: summary.data.keyTakeaways,
    sections: summary.data.sections,
    actionSteps: summary.data.actionSteps,
    author: input.profileDocumentId,
  });
}
