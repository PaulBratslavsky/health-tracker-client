const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

export type StrapiFast = {
  id: number;
  documentId: string;
  startedAt: string;
  endedAt: string | null;
  targetHours: number | null;
  cancelled: boolean;
  createdAt: string;
};

type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

async function parseError(res: Response): Promise<string> {
  const json = (await res.json().catch(() => ({}))) as {
    error?: { message: string };
  };
  return json.error?.message ?? `Strapi error ${res.status}`;
}

export async function fetchActiveFastService(
  jwt: string,
): Promise<StrapiFast | null> {
  const params = new URLSearchParams();
  params.set('filters[endedAt][$null]', 'true');
  params.set('filters[cancelled][$eq]', 'false');
  params.set('sort', 'startedAt:desc');
  params.set('pagination[pageSize]', '1');

  const res = await fetch(`${STRAPI_URL}/api/fasts?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: StrapiFast[] };
  return json.data?.[0] ?? null;
}

export async function fetchMyFastsService(
  jwt: string,
  limit = 30,
): Promise<StrapiFast[]> {
  const params = new URLSearchParams();
  params.set('sort', 'startedAt:desc');
  params.set('pagination[pageSize]', String(limit));

  const res = await fetch(`${STRAPI_URL}/api/fasts?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: StrapiFast[] };
  return json.data ?? [];
}

export async function startFastService(
  jwt: string,
  targetHours?: number,
): Promise<ServiceResult<StrapiFast>> {
  const body = {
    data: {
      startedAt: new Date().toISOString(),
      targetHours: targetHours ?? null,
    },
  };
  const res = await fetch(`${STRAPI_URL}/api/fasts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, error: await parseError(res) };
  const json = (await res.json()) as { data: StrapiFast };
  return { success: true, data: json.data };
}

export async function endFastService(
  jwt: string,
  documentId: string,
  cancelled = false,
): Promise<ServiceResult<StrapiFast>> {
  const body = {
    data: {
      endedAt: new Date().toISOString(),
      cancelled,
    },
  };
  const res = await fetch(`${STRAPI_URL}/api/fasts/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, error: await parseError(res) };
  const json = (await res.json()) as { data: StrapiFast };
  return { success: true, data: json.data };
}

export async function deleteFastService(
  jwt: string,
  documentId: string,
): Promise<ServiceResult<null>> {
  const res = await fetch(`${STRAPI_URL}/api/fasts/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return { success: false, error: await parseError(res) };
  return { success: true, data: null };
}
