import type { Block } from '#/components/blocks/block-renderer';

export const LANDING_BLOCKS: Block[] = [
  {
    __component: 'blocks.hero',
    id: 1,
    eyebrow: 'Track one number',
    heading: 'Your waist ÷ your height.',
    highlightedText: "That's the whole app.",
    description:
      'Health is a small social network built around a single metric — waist-to-height ratio (WHtR). Measure weekly, post your check-in, watch the number trend. The benchmark is simple: stay under 0.5.',
    links: [
      { id: 1, label: 'Get started', href: '/sign-up', variant: 'primary' },
      { id: 2, label: 'Sign in', href: '/sign-in', variant: 'secondary' },
    ],
  },
  {
    __component: 'blocks.feed-preview',
    id: 7,
    eyebrow: 'Live from the community',
    heading: 'This is what a check-in looks like.',
    description:
      "A sample of the most recent posts from members who've made their profile public.",
    // Populated at request time by the `/` route loader with posts from
    // public-profile members via `getPublicFeed`.
    posts: [],
  },
  {
    __component: 'blocks.feature-grid',
    id: 2,
    eyebrow: 'Why join',
    heading: 'Quiet accountability, zero noise.',
    description:
      "A feed built for consistency — not calories, not streaks, not gamified guilt. Just one number, logged on your schedule, visible to people doing the same.",
    cards: [
      {
        id: 1,
        icon: '📏',
        heading: 'One metric, weekly',
        body: 'Measure waist, divide by height, post. No macros, no calorie logs, no step goals. Under two minutes per week.',
      },
      {
        id: 2,
        icon: '📈',
        heading: 'See your trend',
        body: 'Your history chart shows the line that actually matters — WHtR over time. Green band is under 0.5; your job is to stay there.',
      },
      {
        id: 3,
        icon: '🫶',
        heading: 'A small community',
        body: "See what other people's numbers look like without the curated-life theater. Everyone's tracking the same thing.",
      },
      {
        id: 4,
        icon: '🔒',
        heading: 'Private by default',
        body: 'Your profile shows only what you post. No auto-generated feeds, no tracking pixels, no ad surface. Delete a post and it is gone.',
      },
      {
        id: 5,
        icon: '🆓',
        heading: 'Free forever',
        body: 'Posting, history, the feed, and the ratio math — all free, no cap, no trial. Pro is opt-in for a couple of quality-of-life features.',
      },
      {
        id: 6,
        icon: '🧠',
        heading: 'Evidence-based',
        body: 'WHtR correlates with cardiometabolic risk better than BMI across age, sex, and ethnicity. The science is linked below.',
      },
    ],
  },
  {
    __component: 'blocks.premium-callout',
    id: 3,
    badge: 'Pro',
    heading: 'Upload photos directly — or don’t.',
    description:
      "Every member can attach photos to a post by sharing a link (paste any image URL and it renders inline). Pro members get the quality-of-life upgrade of uploading straight from their phone — no hosting, no link-copying, HEIC auto-converted. Pro is here for people who want to chip in and support the app; it isn’t required to share a photo.",
    bullets: [
      { id: 1, text: 'Free: paste any image URL, it renders in the card' },
      { id: 2, text: 'Pro: upload straight from camera roll, no URL needed' },
      { id: 3, text: 'Pro: iPhone HEIC auto-converted to JPEG' },
      { id: 4, text: 'Support keeps the app free and ad-free for everyone else' },
    ],
    ctaLabel: 'Support with Pro',
    ctaHref: '/upgrade',
  },
  {
    __component: 'blocks.content-section',
    id: 4,
    eyebrow: 'The science',
    heading: 'What is waist-to-height ratio, and why this number?',
    paragraphs: [
      {
        id: 1,
        text: 'Waist-to-height ratio (WHtR) is exactly what it sounds like — your waist circumference divided by your height, measured in the same unit. A 32-inch waist on a 70-inch frame is 0.457. Under 0.5 is the widely-cited target; the phrase researchers use is "keep your waist less than half your height."',
      },
      {
        id: 2,
        text: 'Why not BMI? BMI only knows weight and height. It cannot tell a powerlifter from a couch potato, and it systematically mis-classifies muscular, short, and non-European bodies. WHtR measures central adiposity — belly fat — which is the fat that actually drives cardiometabolic risk. Multiple meta-analyses since 2010 (Ashwell, Browning, Schneider, and others) have found WHtR is a better predictor of diabetes, hypertension, and cardiovascular events than BMI across every population studied.',
      },
      {
        id: 3,
        text: "Why this one? Because it is the best cheap metric we have. It needs a soft tape measure and a wall. No scale, no DEXA scan, no lab draw. You can do it in under a minute, and the number is meaningful the same day. The bar for a consumer tracking metric is 'accurate enough, simple enough to do weekly' — WHtR clears both.",
      },
      {
        id: 4,
        text: 'Is it perfect? No. WHtR undercounts visceral fat in very short people, does not account for body composition directly, and is a snapshot not a diagnosis. It will not catch metabolic problems in someone with a flat stomach and a bad liver. It is a screening signal, not a final answer — but as a daily-driver metric for "am I generally moving in the right direction," nothing else in the consumer health space comes close.',
      },
    ],
    footnote:
      'If your number is trending up or already above 0.6, do not panic and do not rely on an app. Talk to a clinician; WHtR is a signal, not a diagnosis.',
    links: [
      {
        id: 1,
        label: 'Waist-to-height ratio on Wikipedia',
        href: 'https://en.wikipedia.org/wiki/Waist-to-height_ratio',
      },
      { id: 2, label: 'Read our about page', href: '/about' },
    ],
  },
  {
    __component: 'blocks.faqs',
    id: 5,
    eyebrow: 'FAQ',
    heading: 'Questions people actually ask.',
    items: [
      {
        id: 1,
        question: 'How do I measure my waist correctly?',
        answer:
          'Stand relaxed, exhale normally, wrap a soft tape around the narrowest point between your lowest rib and your hip bone (usually around the navel). Keep the tape level, snug but not compressing skin. Same time of day, same clothing, same tape — consistency matters more than precision.',
      },
      {
        id: 2,
        question: 'What is a good WHtR?',
        answer:
          'Under 0.5 is the healthy band for adults regardless of age, sex, or ethnicity. 0.5 – 0.59 is "take care" — increased central adiposity. 0.6 and above is "take action". Under 0.4 is below the healthy range and is also a flag worth discussing with a clinician.',
      },
      {
        id: 3,
        question: 'Why is WHtR better than BMI?',
        answer:
          'BMI only knows weight and height. It cannot distinguish muscle from fat, and it under-flags people who carry weight centrally at a "normal" BMI. WHtR directly measures central fat, which is the fat that drives cardiometabolic risk. Multiple peer-reviewed meta-analyses find WHtR is a stronger predictor across every population studied.',
      },
      {
        id: 4,
        question: 'Does WHtR replace a doctor visit?',
        answer:
          'No. It is a fast screening metric, not a diagnosis. Use it to catch trends early and to have more informed conversations with a clinician. If your number is rising or you have other symptoms, book an appointment — an app should never be your only data point.',
      },
      {
        id: 5,
        question: 'Do I need a Pro account to use Health?',
        answer:
          'No. Posting check-ins, seeing your history, browsing the feed, and all the core ratio math are free forever. Pro unlocks photo uploads on check-ins and a few quality-of-life extras, and helps keep the app running.',
      },
    ],
  },
];
