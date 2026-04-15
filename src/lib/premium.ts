// Single source of truth for "is this user premium right now".
// Imported by the UI hint layer (FieldImage), the enforcement layer
// (createPost server function), the display layer (PostCard premium badge),
// and anywhere else we display or gate on tier. Never inline the check.

export type ProfileTierFields = {
  tier: 'free' | 'premium' | null | undefined;
  premiumUntil: string | null | undefined;
};

/**
 * True if the profile is currently premium. Handles the "paid for a year
 * but just cancelled, still has access until the end of the cycle" case via
 * `premiumUntil`.
 */
export function isPremium(profile: ProfileTierFields | null | undefined): boolean {
  if (!profile) return false;
  if (profile.tier !== 'premium') return false;
  if (profile.premiumUntil == null) return true;
  return new Date(profile.premiumUntil).getTime() > Date.now();
}

/** Human-readable label: "Pro" or "Free". */
export function formatTier(
  profile: ProfileTierFields | null | undefined,
): 'Pro' | 'Free' {
  return isPremium(profile) ? 'Pro' : 'Free';
}
