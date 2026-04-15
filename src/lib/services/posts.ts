const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

export type StrapiMedia = {
  url: string;
  alternativeText: string | null;
} | null;

export type StrapiPostType = 'measurement' | 'link' | 'image_embed' | 'youtube';

export type StrapiPostStatus = 'visible' | 'in_review' | 'hidden';

export type StrapiTier = 'free' | 'premium';

export type StrapiPost = {
  id: number;
  documentId: string;
  type: StrapiPostType;
  status: StrapiPostStatus;
  reportCount: number | null;
  caption: string | null;
  // Uploaded image (Pro feature). Only present when the post's author was a
  // premium user at upload time. Never populated for free users.
  image: StrapiMedia;
  // measurement-only
  waistCm: number | null;
  heightSnapshotCm: number | null;
  // link / image_embed / youtube — all third-party URLs, never hosted by us
  url: string | null;
  linkTitle: string | null;
  linkDescription: string | null;
  linkImageUrl: string | null;
  linkSiteName: string | null;
  youtubeVideoId: string | null;
  createdAt: string;
  author: {
    documentId: string;
    displayName: string;
    slug: string | null;
    avatar: StrapiMedia;
    tier: StrapiTier | null;
    premiumUntil: string | null;
  } | null;
};

function buildFeedQuery(pageSize: number): string {
  return [
    'populate%5Bauthor%5D%5Bpopulate%5D=avatar',
    'populate%5Bimage%5D=true',
    'filters%5Bstatus%5D%5B%24eq%5D=visible',
    'sort=createdAt:desc',
    `pagination%5BpageSize%5D=${pageSize}`,
  ].join('&');
}

export async function fetchFeedService(jwt?: string): Promise<StrapiPost[]> {
  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  const res = await fetch(`${STRAPI_URL}/api/posts?${buildFeedQuery(20)}`, { headers });
  if (!res.ok) return [];

  const json = (await res.json()) as { data?: StrapiPost[] };
  return json.data ?? [];
}

// Unauthenticated variant for the landing-page preview. The Strapi document
// service middleware filters these results to only posts from profiles with
// `isPublic === true`, so no JWT is needed (and intentionally none is sent).
export async function fetchPublicFeedService(limit = 3): Promise<StrapiPost[]> {
  const res = await fetch(`${STRAPI_URL}/api/posts?${buildFeedQuery(limit)}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: StrapiPost[] };
  return json.data ?? [];
}

export async function fetchPostByDocumentIdService(
  documentId: string,
  jwt?: string,
): Promise<StrapiPost | null> {
  const params = new URLSearchParams();
  params.set('populate[author][populate]', 'avatar');
  params.set('populate[image]', 'true');
  params.set('filters[status][$eq]', 'visible');

  const headers: Record<string, string> = {};
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  const res = await fetch(
    `${STRAPI_URL}/api/posts/${documentId}?${params.toString()}`,
    { headers },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: StrapiPost };
  return json.data ?? null;
}

export async function fetchMyPostsService(
  jwt: string,
  profileDocumentId: string,
  typeFilter?: StrapiPostType,
): Promise<StrapiPost[]> {
  const params = new URLSearchParams();
  params.set('populate[author][populate]', 'avatar');
  params.set('populate[image]', 'true');
  params.set('filters[author][documentId][$eq]', profileDocumentId);
  if (typeFilter) {
    params.set('filters[type][$eq]', typeFilter);
  }
  params.set('sort', 'createdAt:desc');
  params.set('pagination[pageSize]', '50');

  const res = await fetch(`${STRAPI_URL}/api/posts?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: StrapiPost[] };
  return json.data ?? [];
}

export type MeasurementPoint = {
  documentId: string;
  createdAt: string;
  waistCm: number;
  heightSnapshotCm: number;
};

export async function fetchMyMeasurementsService(
  jwt: string,
  profileDocumentId: string,
  sinceIso: string | null,
): Promise<MeasurementPoint[]> {
  const params = new URLSearchParams();
  params.set('filters[author][documentId][$eq]', profileDocumentId);
  params.set('filters[type][$eq]', 'measurement');
  if (sinceIso) {
    params.set('filters[createdAt][$gte]', sinceIso);
  }
  params.set('sort', 'createdAt:asc');
  params.set('pagination[pageSize]', '500');
  params.set('fields[0]', 'createdAt');
  params.set('fields[1]', 'waistCm');
  params.set('fields[2]', 'heightSnapshotCm');

  const res = await fetch(`${STRAPI_URL}/api/posts?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: Array<{
      documentId: string;
      createdAt: string;
      waistCm: number | null;
      heightSnapshotCm: number | null;
    }>;
  };
  return (json.data ?? [])
    .filter((p) => p.waistCm != null && p.heightSnapshotCm != null)
    .map((p) => ({
      documentId: p.documentId,
      createdAt: p.createdAt,
      waistCm: p.waistCm as number,
      heightSnapshotCm: p.heightSnapshotCm as number,
    }));
}


export const strapiAssetUrl = (path: string | null | undefined) => {
  if (!path) return null;
  // Strapi Cloud's media CDN returns absolute URLs; local upload provider
  // returns paths like `/uploads/...`. Only prepend the API origin for the
  // relative case. Also pass through data: URIs and protocol-relative URLs.
  if (path.startsWith('data:') || path.startsWith('http') || path.startsWith('//')) {
    return path;
  }
  return `${STRAPI_URL}${path}`;
};

export type CreatePostInput =
  | {
      type: 'measurement';
      caption?: string;
      waistCm: number;
      imageId?: number;
    }
  | {
      type: 'link';
      caption?: string;
      url: string;
      linkTitle?: string;
      linkDescription?: string;
      linkImageUrl?: string;
      linkSiteName?: string;
    }
  | {
      type: 'image_embed';
      caption?: string;
      url?: string;
      imageId?: number;
    }
  | {
      type: 'youtube';
      caption?: string;
      url: string;
      youtubeVideoId: string;
      linkTitle?: string;
      linkImageUrl?: string;
    };

export type UploadImageResult =
  | { success: true; id: number; url: string }
  | { success: false; error: string };

/**
 * Upload an image to Strapi /api/upload. Server-side only (uses Buffer +
 * Blob from Node fetch). Called from the createPost server function so the
 * JWT never enters the browser.
 */
export async function uploadImageBase64Service(
  jwt: string,
  base64: string,
  filename: string,
  mimeType: string,
): Promise<UploadImageResult> {
  const stripped = base64.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(stripped, 'base64');
  const blob = new Blob([buffer], { type: mimeType });

  const formData = new FormData();
  formData.append('files', blob, filename);

  const res = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message: string };
    };
    return {
      success: false,
      error: json.error?.message ?? `Upload failed (${res.status})`,
    };
  }

  const json = (await res.json()) as Array<{ id: number; url: string }>;
  if (!json[0]) return { success: false, error: 'Upload returned no file' };
  return { success: true, id: json[0].id, url: json[0].url };
}

export type CreatePostResult =
  | { success: true; post: StrapiPost }
  | { success: false; error: string };

export async function createPostService(
  jwt: string,
  input: CreatePostInput,
): Promise<CreatePostResult> {
  // Media relations in Strapi REST are referenced by numeric id. The
  // client hands us `imageId` on measurement posts (premium feature);
  // we translate that to the `image` field in the create body.
  const { imageId, ...rest } = input as CreatePostInput & { imageId?: number };
  const data: Record<string, unknown> = { ...rest };
  if (imageId != null) data.image = imageId;

  const res = await fetch(`${STRAPI_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ data }),
  });
  const json = (await res.json().catch(() => ({}))) as
    | { data: StrapiPost }
    | { error: { message: string } };
  if (!res.ok || 'error' in json) {
    const message =
      'error' in json ? json.error.message : `Strapi error ${res.status}`;
    return { success: false, error: message };
  }
  return { success: true, post: json.data };
}

export type DeletePostResult =
  | { success: true }
  | { success: false; error: string };

export async function deletePostService(
  jwt: string,
  documentId: string,
): Promise<DeletePostResult> {
  const res = await fetch(`${STRAPI_URL}/api/posts/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message: string };
    };
    return {
      success: false,
      error: json.error?.message ?? `Strapi error ${res.status}`,
    };
  }
  return { success: true };
}

export type ReportReason =
  | 'spam'
  | 'inappropriate'
  | 'misleading'
  | 'harmful'
  | 'other';

export type CreateReportInput = {
  postDocumentId: string;
  reason: ReportReason;
  details?: string;
};

export type CreateReportResult =
  | { success: true }
  | { success: false; error: string };

export async function createReportService(
  jwt: string,
  input: CreateReportInput,
): Promise<CreateReportResult> {
  const body = {
    data: {
      post: input.postDocumentId,
      reason: input.reason,
      details: input.details,
    },
  };
  const res = await fetch(`${STRAPI_URL}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message: string };
    };
    return {
      success: false,
      error: json.error?.message ?? `Strapi error ${res.status}`,
    };
  }
  return { success: true };
}

export type ProfileUpdateInput = {
  documentId: string;
  heightCm?: number;
  bio?: string;
  displayName?: string;
  isPublic?: boolean;
};

export type ProfileUpdateResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfileService(
  jwt: string,
  input: ProfileUpdateInput,
): Promise<ProfileUpdateResult> {
  const { documentId, ...fields } = input;
  const res = await fetch(`${STRAPI_URL}/api/profiles/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ data: fields }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message: string };
    };
    return { success: false, error: json.error?.message ?? `Strapi error ${res.status}` };
  }
  return { success: true };
}
