import { z } from 'zod';
import { cmFromIn } from '#/lib/whtr';

// =============================================================================
// FORM SCHEMAS — what each tab in the new-post form validates against
// =============================================================================

// Tab 1: Check-in. Waist + caption (optional). Unit toggle is purely UI.
export const CheckinFormSchema = z
  .object({
    caption: z.string().max(500, 'Caption is too long').optional().default(''),
    waist: z.coerce
      .number({ message: 'Enter your waist measurement' })
      .positive('Must be a positive number')
      .max(250, 'Too large'),
    unit: z.enum(['cm', 'in']),
  })
  .transform(({ caption, waist, unit }) => ({
    type: 'measurement' as const,
    caption: caption.trim() || undefined,
    waistCm: Math.round(unit === 'in' ? cmFromIn(waist) : waist),
  }));

export type CheckinFormValues = {
  caption: string;
  waist: number | '';
  unit: 'cm' | 'in';
};

// Tabs 2-4 share the same shape: a URL plus an optional caption. The
// post type and metadata fields differ — fetched server-side from
// fetchUrlMetadata before submit.
const SharedShareFields = {
  caption: z.string().max(500, 'Caption is too long').optional().default(''),
  url: z.url('Enter a valid URL'),
};

export const ShareLinkFormSchema = z
  .object({
    ...SharedShareFields,
    linkTitle: z.string().max(200).optional().default(''),
    linkDescription: z.string().max(500).optional().default(''),
    linkImageUrl: z.string().max(2000).optional().default(''),
    linkSiteName: z.string().max(100).optional().default(''),
  })
  .transform(({ caption, url, linkTitle, linkDescription, linkImageUrl, linkSiteName }) => ({
    type: 'link' as const,
    caption: caption.trim() || undefined,
    url,
    linkTitle: linkTitle.trim() || undefined,
    linkDescription: linkDescription.trim() || undefined,
    linkImageUrl: linkImageUrl.trim() || undefined,
    linkSiteName: linkSiteName.trim() || undefined,
  }));

export const ShareImageFormSchema = z
  .object({ ...SharedShareFields })
  .transform(({ caption, url }) => ({
    type: 'image_embed' as const,
    caption: caption.trim() || undefined,
    url,
  }));

export const ShareYoutubeFormSchema = z
  .object({
    ...SharedShareFields,
    youtubeVideoId: z.string().min(1, 'Could not find a video id in that URL').max(20),
    linkTitle: z.string().max(200).optional().default(''),
    linkImageUrl: z.string().max(2000).optional().default(''),
  })
  .transform(({ caption, url, youtubeVideoId, linkTitle, linkImageUrl }) => ({
    type: 'youtube' as const,
    caption: caption.trim() || undefined,
    url,
    youtubeVideoId,
    linkTitle: linkTitle.trim() || undefined,
    linkImageUrl: linkImageUrl.trim() || undefined,
  }));

// =============================================================================
// SERVER INPUT SCHEMA — discriminated union covering all four post types
// =============================================================================

// Optional image attachment for measurement posts. Premium-gated server-side
// in the createPost server function.
const ImageAttachmentSchema = z
  .object({
    base64: z.string().min(1),
    filename: z.string().min(1).max(255),
    mimeType: z.string().regex(/^image\//, 'Must be an image'),
  })
  .optional();

export const NewMeasurementInputSchema = z.object({
  type: z.literal('measurement'),
  caption: z.string().min(1).max(500).optional(),
  waistCm: z.number().int().positive().max(250),
  image: ImageAttachmentSchema,
});

export const NewLinkInputSchema = z.object({
  type: z.literal('link'),
  caption: z.string().min(1).max(500).optional(),
  url: z.url().max(2000),
  linkTitle: z.string().max(200).optional(),
  linkDescription: z.string().max(500).optional(),
  linkImageUrl: z.string().max(2000).optional(),
  linkSiteName: z.string().max(100).optional(),
});

// image_embed accepts EITHER a third-party URL (free users) OR an uploaded
// image (premium users), with at least one required. The server function
// tier-gates the upload path.
export const NewImageEmbedInputSchema = z
  .object({
    type: z.literal('image_embed'),
    caption: z.string().min(1).max(500).optional(),
    url: z.url().max(2000).optional(),
    image: ImageAttachmentSchema,
  })
  .refine((d) => d.url != null || d.image != null, {
    message: 'Either a URL or an uploaded image is required',
  });

export const NewYoutubeInputSchema = z.object({
  type: z.literal('youtube'),
  caption: z.string().min(1).max(500).optional(),
  url: z.url().max(2000),
  youtubeVideoId: z.string().min(1).max(20),
  linkTitle: z.string().max(200).optional(),
  linkImageUrl: z.string().max(2000).optional(),
});

export const NewPostInputSchema = z.discriminatedUnion('type', [
  NewMeasurementInputSchema,
  NewLinkInputSchema,
  NewImageEmbedInputSchema,
  NewYoutubeInputSchema,
]);

export type NewPostInput = z.infer<typeof NewPostInputSchema>;

// =============================================================================
// PROFILE FORMS (unchanged from earlier phases, kept here for collocation)
// =============================================================================

export const SetHeightFormSchema = z
  .object({
    height: z.coerce
      .number({ message: 'Enter your height' })
      .positive('Must be a positive number')
      .max(300, 'Too large'),
    unit: z.enum(['cm', 'in']),
  })
  .transform(({ height, unit }) => ({
    heightCm: Math.round(unit === 'in' ? cmFromIn(height) : height),
  }));

export type SetHeightFormValues = {
  height: number | '';
  unit: 'cm' | 'in';
};

export const ProfileUpdateInputSchema = z.object({
  documentId: z.string().min(1),
  heightCm: z.number().int().min(80).max(260).optional(),
  bio: z.string().max(280).optional(),
  displayName: z.string().min(2).max(40).optional(),
});

export const ProfileEditFormSchema = z
  .object({
    displayName: z.string().min(2, 'At least 2 characters').max(40, 'Too long'),
    bio: z.string().max(280, 'Bio is too long'),
    height: z.coerce
      .number({ message: 'Enter your height' })
      .positive('Must be a positive number')
      .max(300, 'Too large'),
    unit: z.enum(['cm', 'in']),
  })
  .transform(({ displayName, bio, height, unit }) => ({
    displayName: displayName.trim(),
    bio: bio.trim(),
    heightCm: Math.round(unit === 'in' ? cmFromIn(height) : height),
  }));

export type ProfileEditFormValues = {
  displayName: string;
  bio: string;
  height: number | '';
  unit: 'cm' | 'in';
};
