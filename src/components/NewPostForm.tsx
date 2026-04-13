import { useState } from 'react';
import { CheckinSubForm } from '#/components/forms/CheckinSubForm';
import { ShareSubForm, type ShareKind } from '#/components/forms/ShareSubForm';

type Tab = 'checkin' | ShareKind;

const TABS: Array<{ id: Tab; label: string; description: string }> = [
  { id: 'checkin', label: 'Check-in', description: 'Log a waist measurement' },
  { id: 'link', label: 'Link', description: 'Share an article or resource' },
  { id: 'image_embed', label: 'Photo', description: 'Embed an image URL' },
  { id: 'youtube', label: 'Video', description: 'Embed a YouTube video' },
];

type Props = {
  heightCm: number | null;
};

export function NewPostForm({ heightCm }: Props) {
  const [tab, setTab] = useState<Tab>('checkin');

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`pill-chip ${tab === t.id ? 'is-active pill-chip--sage' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-[var(--ink-soft)]">
        {TABS.find((t) => t.id === tab)?.description}
      </p>

      {tab === 'checkin' ? (
        heightCm ? (
          <CheckinSubForm heightCm={heightCm} />
        ) : (
          <p className="rounded-md border border-amber-300/40 bg-amber-50/40 px-3 py-2 text-sm text-amber-900">
            Set your height in your profile before posting a check-in.
          </p>
        )
      ) : (
        <ShareSubForm kind={tab as ShareKind} />
      )}
    </div>
  );
}
