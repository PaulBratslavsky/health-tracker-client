import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
  fetchUrlMetadataService,
  type UrlMetadataResult,
} from '#/lib/services/url-metadata';

const FetchMetadataInputSchema = z.object({
  url: z.string().min(1).max(2000),
});

export const fetchUrlMetadata = createServerFn({ method: 'POST' })
  .inputValidator((data: { url: string }) => FetchMetadataInputSchema.parse(data))
  .handler(async ({ data }): Promise<UrlMetadataResult> => {
    return await fetchUrlMetadataService(data.url);
  });
