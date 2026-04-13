import { createServerFn } from '@tanstack/react-start';
import { useAppSession } from '#/lib/session';
import { updateProfileService, type ProfileUpdateResult } from '#/lib/services/posts';
import { ProfileUpdateInputSchema } from '#/lib/validations/post';

export const updateMyProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => ProfileUpdateInputSchema.parse(data))
  .handler(async ({ data }): Promise<ProfileUpdateResult> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return { success: false, error: 'You must be signed in' };
    return await updateProfileService(jwt, data);
  });
