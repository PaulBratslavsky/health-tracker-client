import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { Label } from '#/components/ui/label';
import { Textarea } from '#/components/ui/textarea';
import { FieldText } from '#/components/forms/FieldText';
import { FieldImage, type ImageAttachment } from '#/components/forms/FieldImage';
import { createPost } from '#/data/server-functions/posts';
import { CheckinFormSchema, type CheckinFormValues } from '#/lib/validations/post';
import {
  BAND_BG,
  BAND_FG,
  BAND_LABEL,
  bandFor,
  cmFromIn,
  computeWhtr,
} from '#/lib/whtr';

type Props = { heightCm: number; isPremium: boolean };

export function CheckinSubForm({ heightCm, isPremium }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [image, setImage] = useState<ImageAttachment | null>(null);

  const form = useForm({
    defaultValues: {
      caption: '',
      waist: '' as number | '',
      unit: 'cm' as 'cm' | 'in',
    } satisfies CheckinFormValues,
    validators: { onChange: CheckinFormSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const parsed = CheckinFormSchema.safeParse(value);
      if (!parsed.success) {
        setServerError('Fix the highlighted fields and try again');
        return;
      }
      const result = await createPost({
        data: { ...parsed.data, image: image ?? undefined },
      });
      if (result.success) {
        await router.invalidate();
        router.navigate({ to: '/' });
      } else {
        setServerError(result.error);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="grid gap-5"
    >
      <form.Subscribe selector={(s) => [s.values.waist, s.values.unit] as const}>
        {([waistRaw, unit]) => {
          const waist = typeof waistRaw === 'number' ? waistRaw : Number(waistRaw);
          const waistCm = unit === 'in' ? cmFromIn(waist) : waist;
          const whtr = waist > 0 ? computeWhtr(waistCm, heightCm) : null;
          const band = whtr ? bandFor(whtr) : 'green';
          return (
            <div
              className={`rounded-2xl px-6 py-8 text-center transition-colors ${
                whtr ? `${BAND_BG[band]} ${BAND_FG[band]}` : 'bg-muted text-muted-foreground'
              }`}
            >
              <div className="text-6xl font-bold tabular-nums tracking-tight drop-shadow-sm">
                {whtr ? whtr.toFixed(2) : '—.——'}
              </div>
              <div className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] opacity-90">
                {whtr ? BAND_LABEL[band] : 'Type your waist to see your ratio'}
              </div>
            </div>
          );
        }}
      </form.Subscribe>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <form.Field name="waist">
            {(field) => (
              <FieldText
                field={field}
                label="Waist measurement"
                type="number"
                placeholder={form.state.values.unit === 'cm' ? '80' : '32'}
                disabled={form.state.isSubmitting}
              />
            )}
          </form.Field>
        </div>
        <form.Field name="unit">
          {(field) => (
            <div className="inline-flex rounded-lg border border-input p-0.5">
              {(['cm', 'in'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => field.handleChange(u)}
                  className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                    field.state.value === u
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </form.Field>
      </div>

      <div>
        <Label htmlFor="caption" className="mb-1.5 block text-sm font-medium">
          Caption (optional)
        </Label>
        <form.Field name="caption">
          {(field) => (
            <Textarea
              id="caption"
              placeholder="What's the story behind today's number?"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={form.state.isSubmitting}
              rows={3}
              className="resize-none"
            />
          )}
        </form.Field>
      </div>

      <FieldImage
        value={image}
        onChange={setImage}
        disabled={form.state.isSubmitting}
        isPremium={isPremium}
      />

      <p className="text-xs text-muted-foreground">
        Your height ({heightCm} cm) is snapshotted onto this post when you submit.
      </p>

      {serverError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <FormFooter
        isSubmitting={form.state.isSubmitting}
        canSubmit={form.state.canSubmit}
        submitLabel="Share check-in"
      />
    </form>
  );
}

export function FormFooter({
  isSubmitting,
  canSubmit,
  submitLabel,
}: {
  isSubmitting: boolean;
  canSubmit: boolean;
  submitLabel: string;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        disabled={isSubmitting}
        onClick={() => router.navigate({ to: '/' })}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting || !canSubmit}>
        {isSubmitting ? 'Posting…' : submitLabel}
      </Button>
    </div>
  );
}
