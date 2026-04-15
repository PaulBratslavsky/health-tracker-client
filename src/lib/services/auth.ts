const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

export type StrapiAuthSuccess = {
  jwt: string;
  user: {
    id: number;
    documentId: string;
    username: string;
    email: string;
    confirmed: boolean;
    blocked: boolean;
  };
};

export type StrapiAuthError = {
  error: { status: number; name: string; message: string };
};

export type StrapiAuthResult = StrapiAuthSuccess | StrapiAuthError;

export const isAuthError = (r: StrapiAuthResult): r is StrapiAuthError =>
  'error' in r;
export const isAuthSuccess = (r: StrapiAuthResult): r is StrapiAuthSuccess =>
  'jwt' in r;

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

async function postJson(path: string, body: unknown): Promise<StrapiAuthResult> {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({
    error: { status: res.status, name: 'ParseError', message: 'Bad response' },
  }));
  return json as StrapiAuthResult;
}

export const registerUserService = (input: RegisterInput) =>
  postJson('/api/auth/local/register', input);

export const loginUserService = (input: LoginInput) =>
  postJson('/api/auth/local', input);

export type StrapiUserMe = {
  id: number;
  documentId: string;
  username: string;
  email: string;
  profile?: {
    documentId: string;
    displayName: string;
    bio: string | null;
    heightCm: number | null;
    slug: string | null;
    avatar: { url: string; alternativeText: string | null } | null;
    reputationScore?: number | null;
    postingStatus?: 'active' | 'frozen' | null;
    frozenUntil?: string | null;
    tier?: 'free' | 'premium' | null;
    premiumSince?: string | null;
    premiumUntil?: string | null;
    isPublic?: boolean | null;
  } | null;
};

export async function fetchCurrentUserService(jwt: string): Promise<StrapiUserMe | null> {
  const res = await fetch(
    `${STRAPI_URL}/api/users/me?populate%5Bprofile%5D%5Bpopulate%5D=avatar`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  if (!res.ok) return null;
  return (await res.json()) as StrapiUserMe;
}
