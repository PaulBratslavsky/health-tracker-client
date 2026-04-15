import { z } from 'zod';

// Hard cap — must match the server-side clamp in `index.ts` Pattern D Rule 5.
// This is the safety guardrail for the fasting feature.
export const MAX_FAST_HOURS = 36;

export const StartFastInputSchema = z.object({
  targetHours: z.union([z.literal(16), z.literal(24), z.literal(36)]).optional(),
});

export type StartFastInput = z.infer<typeof StartFastInputSchema>;

export const EndFastInputSchema = z.object({
  documentId: z.string().min(1),
  cancelled: z.boolean().optional().default(false),
});

export type EndFastInput = z.infer<typeof EndFastInputSchema>;

export const DeleteFastInputSchema = z.object({
  documentId: z.string().min(1),
});

export type DeleteFastInput = z.infer<typeof DeleteFastInputSchema>;
