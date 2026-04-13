import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { useAppSession } from '#/lib/session';
import {
  createReportService,
  type CreateReportResult,
} from '#/lib/services/posts';

const ReportInputSchema = z.object({
  postDocumentId: z.string().min(1),
  reason: z.enum(['spam', 'inappropriate', 'misleading', 'harmful', 'other']),
  details: z.string().max(500).optional(),
});

export const reportPost = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => ReportInputSchema.parse(data))
  .handler(async ({ data }): Promise<CreateReportResult> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return { success: false, error: 'You must be signed in to report' };
    return await createReportService(jwt, data);
  });
