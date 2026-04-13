import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { useAppSession } from '#/lib/session';
import {
  createPostService,
  fetchFeedService,
  fetchMyMeasurementsService,
  fetchMyPostsService,
  fetchPostByDocumentIdService,
  type CreatePostResult,
  type MeasurementPoint,
  type StrapiPost,
} from '#/lib/services/posts';
import { fetchCurrentUserService } from '#/lib/services/auth';
import { NewPostInputSchema, type NewPostInput } from '#/lib/validations/post';

export const getFeed = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StrapiPost[]> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    return await fetchFeedService(jwt);
  },
);

export const getPostByDocumentId = createServerFn({ method: 'GET' })
  .inputValidator((data: { documentId: string }) =>
    z.object({ documentId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<StrapiPost | null> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    return await fetchPostByDocumentIdService(data.documentId, jwt);
  });

export const createPost = createServerFn({ method: 'POST' })
  .inputValidator((data: NewPostInput) => NewPostInputSchema.parse(data))
  .handler(async ({ data }): Promise<CreatePostResult> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return { success: false, error: 'You must be signed in to post' };
    return await createPostService(jwt, data);
  });

const MyPostsFilterSchema = z.object({
  type: z
    .enum(['all', 'measurement', 'link', 'image_embed', 'youtube'])
    .optional()
    .default('all'),
});

export const getMyPosts = createServerFn({ method: 'GET' })
  .inputValidator((data: { type?: string }) => MyPostsFilterSchema.parse(data))
  .handler(async ({ data }): Promise<StrapiPost[]> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return [];
    const me = await fetchCurrentUserService(jwt);
    if (!me?.profile?.documentId) return [];
    const typeFilter = data.type === 'all' ? undefined : data.type;
    return await fetchMyPostsService(jwt, me.profile.documentId, typeFilter);
  });

const MeasurementsRangeSchema = z.object({
  days: z.union([
    z.literal(7),
    z.literal(14),
    z.literal(30),
    z.literal(90),
    z.literal(365),
    z.literal(0),
  ]),
});

export const getMyMeasurements = createServerFn({ method: 'GET' })
  .inputValidator((data: { days: number }) => MeasurementsRangeSchema.parse(data))
  .handler(async ({ data }): Promise<MeasurementPoint[]> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return [];
    const me = await fetchCurrentUserService(jwt);
    if (!me?.profile?.documentId) return [];

    const sinceIso =
      data.days > 0
        ? new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString()
        : null;

    return await fetchMyMeasurementsService(jwt, me.profile.documentId, sinceIso);
  });
