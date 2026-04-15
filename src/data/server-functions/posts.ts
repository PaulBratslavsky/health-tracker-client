import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { useAppSession } from '#/lib/session';
import {
  createPostService,
  deletePostService,
  fetchFeedService,
  fetchMyMeasurementsService,
  fetchMyPostsService,
  fetchPostByDocumentIdService,
  uploadImageBase64Service,
  type CreatePostInput,
  type CreatePostResult,
  type DeletePostResult,
  type MeasurementPoint,
  type StrapiPost,
} from '#/lib/services/posts';
import { fetchCurrentUserService } from '#/lib/services/auth';
import { isPremium } from '#/lib/premium';
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

    // Defense layer 2: tier gate on image uploads. Uploads are allowed on
    // measurement posts (attach a photo to a check-in) and image_embed posts
    // (share a photo directly). Both require premium. See
    // docs/premium-tier-plan.md for the full three-layer rationale.
    const hasImage =
      (data.type === 'measurement' && data.image != null) ||
      (data.type === 'image_embed' && data.image != null);

    if (hasImage) {
      const me = await fetchCurrentUserService(jwt);
      if (!isPremium(me?.profile)) {
        return {
          success: false,
          error: 'Photo uploads are a Pro feature. Upgrade to attach images.',
        };
      }
    }

    // Upload the image first (if present), then create the post referencing
    // the returned media id. Does the upload server-side so the JWT never
    // enters the browser.
    let imageId: number | undefined;
    if (hasImage) {
      const attachment = (data as { image?: { base64: string; filename: string; mimeType: string } }).image;
      if (attachment) {
        const upload = await uploadImageBase64Service(
          jwt,
          attachment.base64,
          attachment.filename,
          attachment.mimeType,
        );
        if (!upload.success) return { success: false, error: upload.error };
        imageId = upload.id;
      }
    }

    // Strip the image attachment from the post body — only the id lands in
    // Strapi. Other post types pass through unchanged.
    if (data.type === 'measurement') {
      const { image: _image, ...rest } = data;
      return await createPostService(jwt, { ...rest, imageId } as CreatePostInput);
    }
    if (data.type === 'image_embed') {
      const { image: _image, ...rest } = data;
      return await createPostService(jwt, { ...rest, imageId } as CreatePostInput);
    }
    return await createPostService(jwt, data);
  });

export const deletePost = createServerFn({ method: 'POST' })
  .inputValidator((data: { documentId: string }) =>
    z.object({ documentId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<DeletePostResult> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return { success: false, error: 'You must be signed in' };
    return await deletePostService(jwt, data.documentId);
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
