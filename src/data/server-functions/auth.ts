import { createServerFn } from '@tanstack/react-start';
import { useAppSession } from '#/lib/session';
import {
  fetchCurrentUserService,
  isAuthError,
  isAuthSuccess,
  loginUserService,
  registerUserService,
  type StrapiUserMe,
} from '#/lib/services/auth';
import {
  SignInFormSchema,
  SignUpFormSchema,
  type SignInFormValues,
  type SignUpFormValues,
} from '#/lib/validations/auth';

export type AuthActionResult =
  | { success: true; user: StrapiUserMe }
  | { success: false; error: string };

export const registerUser = createServerFn({ method: 'POST' })
  .inputValidator((data: SignUpFormValues) => SignUpFormSchema.parse(data))
  .handler(async ({ data }): Promise<AuthActionResult> => {
    const result = await registerUserService(data);

    if (isAuthError(result)) {
      return { success: false, error: result.error.message };
    }
    if (!isAuthSuccess(result)) {
      return { success: false, error: 'Unexpected response from auth service' };
    }

    const session = await useAppSession();
    await session.update({ jwt: result.jwt, userId: result.user.id });

    const me = await fetchCurrentUserService(result.jwt);
    if (!me) return { success: false, error: 'Could not load profile after register' };
    return { success: true, user: me };
  });

export const loginUser = createServerFn({ method: 'POST' })
  .inputValidator((data: SignInFormValues) => SignInFormSchema.parse(data))
  .handler(async ({ data }): Promise<AuthActionResult> => {
    const result = await loginUserService(data);

    if (isAuthError(result)) {
      return { success: false, error: result.error.message };
    }
    if (!isAuthSuccess(result)) {
      return { success: false, error: 'Unexpected response from auth service' };
    }

    const session = await useAppSession();
    await session.update({ jwt: result.jwt, userId: result.user.id });

    const me = await fetchCurrentUserService(result.jwt);
    if (!me) return { success: false, error: 'Could not load profile after login' };
    return { success: true, user: me };
  });

export const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession();
  await session.clear();
  return { success: true as const };
});

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StrapiUserMe | null> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return null;
    return await fetchCurrentUserService(jwt);
  },
);
