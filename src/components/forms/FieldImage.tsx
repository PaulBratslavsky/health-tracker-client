import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { Label } from '#/components/ui/label';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type ImageAttachment = {
  base64: string;
  filename: string;
  mimeType: string;
};

type Props = {
  label?: string;
  value: ImageAttachment | null;
  onChange: (value: ImageAttachment | null) => void;
  disabled?: boolean;
  /** Pro feature gate — when false, the picker is replaced with an upgrade
   *  prompt. Non-binding UI hint; real enforcement is server-side. */
  isPremium: boolean;
};

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FieldImage({
  label = 'Photo (optional)',
  value,
  onChange,
  disabled,
  isPremium,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    setError(null);
    if (!file) {
      onChange(null);
      setPreviewUrl(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Pick an image file');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 5 MB');
      return;
    }
    const dataUrl = await readAsDataURL(file);
    setPreviewUrl(dataUrl);
    onChange({
      base64: dataUrl,
      filename: file.name,
      mimeType: file.type,
    });
  };

  const handleClear = () => {
    setError(null);
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (!isPremium) {
    return (
      <div className="grid gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--bg-subtle)] px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
            <span className="inline-flex items-center rounded-full bg-[var(--band-yellow-bg)] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--band-yellow-text)]">
              Pro
            </span>
            <span>Upload photos with a Pro plan</span>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 rounded-full border-[var(--line)] text-xs"
          >
            <Link to="/upgrade">Upgrade</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        <div className="grid gap-2">
          <div className="relative overflow-hidden rounded-xl border border-[var(--line)]">
            <img src={previewUrl} alt="Preview" className="aspect-square w-full object-cover" />
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
            <span className="truncate">{value?.filename}</span>
            <button
              type="button"
              onClick={handleClear}
              className="font-medium text-[var(--coral-deep)] hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="h-24 rounded-xl border-dashed border-[var(--line-strong)] text-[var(--ink-muted)]"
        >
          + Pick a photo
        </Button>
      )}
      {error && <p className="text-xs text-[var(--coral-deep)]">{error}</p>}
    </div>
  );
}
