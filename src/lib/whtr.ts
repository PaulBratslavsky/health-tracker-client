// Single source of truth for waist-to-height ratio computation, banding,
// and visual identity. Imported by PostCard, the new-post live preview,
// and any future place that displays a WHtR. Never inline thresholds.
//
// Bands sourced from the UK NICE 2022 guideline + Ashwell research,
// collapsed from 4 clinical bands to 3 motivational bands.
// See plan.md "WHtR scoring" section for the source citations.

export const cmFromIn = (inches: number) => inches * 2.54;
export const inFromCm = (cm: number) => cm / 2.54;

export const computeWhtr = (waistCm: number, heightCm: number) =>
  waistCm / heightCm;

export type WhtrBand = 'green' | 'yellow' | 'red';

// NICE 2022 WHtR bands.
//   0.40 – 0.49  → healthy, not increased risk → "OK"
//   0.50 – 0.59  → increased central adiposity → "Take care"
//   0.60 or more → high central adiposity      → "Take action"
// WHtR < 0.40 is below the healthy range (too low); we fold it into "Take
// care" since the three-band UI collapses NICE's top/bottom outliers.
// Source: https://en.wikipedia.org/wiki/Waist-to-height_ratio#NICE_guidance
export const bandFor = (whtr: number): WhtrBand => {
  if (whtr >= 0.4 && whtr < 0.5) return 'green';
  if (whtr >= 0.6) return 'red';
  return 'yellow';
};

export const BAND_LABEL: Record<WhtrBand, string> = {
  green: 'Healthy',
  yellow: 'Take care',
  red: 'Take action',
};

// Pastel pill surfaces — used for the small "Healthy zone" / etc. badge.
// Subtle, dark text on a light tinted background.
export const BAND_BG: Record<WhtrBand, string> = {
  green: 'bg-[var(--band-green-bg)]',
  yellow: 'bg-[var(--band-yellow-bg)]',
  red: 'bg-[var(--band-red-bg)]',
};

export const BAND_DOT: Record<WhtrBand, string> = {
  green: 'bg-[var(--band-green-dot)]',
  yellow: 'bg-[var(--band-yellow-dot)]',
  red: 'bg-[var(--band-red-dot)]',
};

export const BAND_FG: Record<WhtrBand, string> = {
  green: 'text-[var(--band-green-text)]',
  yellow: 'text-[var(--band-yellow-text)]',
  red: 'text-[var(--band-red-text)]',
};

// Saturated hero block for the measurement card — the visual identity.
// Everything else in the app is quiet so this can carry weight.
export const BAND_HERO_BG: Record<WhtrBand, string> = {
  green: 'bg-[var(--band-green-hero)]',
  yellow: 'bg-[var(--band-yellow-hero)]',
  red: 'bg-[var(--band-red-hero)]',
};

export const BAND_HERO_FG: Record<WhtrBand, string> = {
  green: 'text-[var(--band-green-hero-fg)]',
  yellow: 'text-[var(--band-yellow-hero-fg)]',
  red: 'text-[var(--band-red-hero-fg)]',
};
