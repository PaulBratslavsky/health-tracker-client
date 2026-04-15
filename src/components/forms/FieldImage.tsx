import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { Label } from '#/components/ui/label';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// iPhones default to HEIC, which no browser decodes natively (not even Safari).
// We detect by extension as a fallback because drag-and-drop and some browsers
// report an empty `file.type` for valid HEICs.
async function isHeicFile(file: File): Promise<boolean> {
  if (/\.hei[cf]$/i.test(file.name)) return true;
  const { isHeic } = await import('heic-to');
  return isHeic(file);
}

// Dynamically imported so the libheif WASM (~1MB) only loads when someone
// actually picks a HEIC.
async function convertHeicToJpeg(file: File): Promise<File> {
  const { heicTo } = await import('heic-to');
  const jpegBlob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.9,
  });
  const jpegName = file.name.replace(/\.hei[cf]$/i, '.jpg');
  return new File([jpegBlob], jpegName, { type: 'image/jpeg' });
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'unknown error';
}

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
    reader.onload = () => {
      const { result } = reader;
      if (typeof result === 'string') resolve(result);
      else reject(new Error('FileReader returned non-string result'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

export function FieldImage({
  label = 'Photo (optional)',
  value,
  onChange,
  disabled,
  isPremium,
}: Readonly<Props>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const handleFile = async (rawFile: File | null) => {
    setError(null);
    if (!rawFile) {
      onChange(null);
      setPreviewUrl(null);
      return;
    }

    // Accept by mime OR extension — drag-and-drop and some browsers
    // report an empty `file.type` for valid images.
    const mimeIsImage = rawFile.type.startsWith('image/');
    const extIsImage = /\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(
      rawFile.name,
    );
    if (!mimeIsImage && !extIsImage) {
      setError('Pick an image file');
      return;
    }

    if (rawFile.size > MAX_BYTES) {
      setError('Image must be under 5 MB');
      return;
    }

    // If it's an iPhone HEIC, decode to JPEG client-side so the preview
    // renders in every browser and Strapi stores a browser-friendly format.
    let file: File = rawFile;
    if (await isHeicFile(rawFile)) {
      setConverting(true);
      try {
        file = await convertHeicToJpeg(rawFile);
      } catch (err) {
        console.error('HEIC conversion failed', err);
        setError(`Couldn't read that photo: ${toErrorMessage(err)}`);
        return;
      } finally {
        setConverting(false);
      }
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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-(--line-strong) bg-(--bg-subtle) px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-(--ink-muted)">
            <span className="inline-flex items-center rounded-full bg-(--band-yellow-bg) px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-(--band-yellow-text)">
              Pro
            </span>
            <span>Upload photos with a Pro plan</span>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 rounded-full border-(--line) text-xs"
          >
            <Link to="/upgrade">Upgrade</Link>
          </Button>
        </div>
      </div>
    );
  }

  let picker: React.ReactNode;
  if (previewUrl) {
    picker = (
      <div className="grid gap-2">
        <div className="relative overflow-hidden rounded-xl border border-(--line)">
          <img src={previewUrl} alt="Preview" className="aspect-square w-full object-cover" />
        </div>
        <div className="flex items-center justify-between text-xs text-(--ink-muted)">
          <span className="truncate">{value?.filename}</span>
          <button
            type="button"
            onClick={handleClear}
            className="font-medium text-(--coral-deep) hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    );
  } else if (converting) {
    picker = (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-(--line-strong) bg-(--bg-subtle) text-sm text-(--ink-muted)">
        Converting iPhone photo…
      </div>
    );
  } else {
    picker = (
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || converting}
        className="h-24 rounded-xl border-dashed border-(--line-strong) text-(--ink-muted)"
      >
        + Pick a photo
      </Button>
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
      {picker}
      {error && <p className="text-xs text-(--coral-deep)">{error}</p>}
    </div>
  );
}
