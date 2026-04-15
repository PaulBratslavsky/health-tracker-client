import { createServerFn } from '@tanstack/react-start';
import { useAppSession } from '#/lib/session';
import {
  deleteFastService,
  endFastService,
  fetchActiveFastService,
  fetchMyFastsService,
  startFastService,
  type StrapiFast,
} from '#/lib/services/fasts';
import {
  DeleteFastInputSchema,
  EndFastInputSchema,
  StartFastInputSchema,
  type DeleteFastInput,
  type EndFastInput,
  type StartFastInput,
} from '#/lib/validations/fast';

type MutationResult<T> = { success: true; data: T } | { success: false; error: string };

export const getActiveFast = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StrapiFast | null> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return null;
    return await fetchActiveFastService(jwt);
  },
);

export const getMyFasts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StrapiFast[]> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return [];
    return await fetchMyFastsService(jwt);
  },
);

export const startFast = createServerFn({ method: 'POST' })
  .inputValidator((data: StartFastInput) => StartFastInputSchema.parse(data))
  .handler(async ({ data }): Promise<MutationResult<StrapiFast>> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return { success: false, error: 'You must be signed in' };
    return await startFastService(jwt, data.targetHours);
  });

export const endFast = createServerFn({ method: 'POST' })
  .inputValidator((data: EndFastInput) => EndFastInputSchema.parse(data))
  .handler(async ({ data }): Promise<MutationResult<StrapiFast>> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return { success: false, error: 'You must be signed in' };
    return await endFastService(jwt, data.documentId, data.cancelled);
  });

export const deleteFast = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteFastInput) => DeleteFastInputSchema.parse(data))
  .handler(async ({ data }): Promise<MutationResult<null>> => {
    const session = await useAppSession();
    const jwt = session.data?.jwt;
    if (!jwt) return { success: false, error: 'You must be signed in' };
    return await deleteFastService(jwt, data.documentId);
  });
