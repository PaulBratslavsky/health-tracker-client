import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { FieldText } from '#/components/forms/FieldText';
import { updateMyProfile } from '#/data/server-functions/profile';
import { SetHeightFormSchema, type SetHeightFormValues } from '#/lib/validations/post';

export function SetHeightForm({ profileDocumentId }: { profileDocumentId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      height: '' as number | '',
      unit: 'cm' as 'cm' | 'in',
    } satisfies SetHeightFormValues,
    validators: { onChange: SetHeightFormSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const parsed = SetHeightFormSchema.safeParse(value);
      if (!parsed.success) return;
      const result = await updateMyProfile({
        data: {
          documentId: profileDocumentId,
          heightCm: parsed.data.heightCm,
        },
      });
      if (result.success) {
        await router.invalidate();
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
      className="grid gap-4"
    >
      <p className="text-sm text-[var(--sea-ink-soft)]">
        Your waist-to-height ratio needs both numbers. Set your height once — it
        gets snapshotted onto every post you make so old check-ins stay accurate.
      </p>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <form.Field name="height">
            {(field) => (
              <FieldText
                field={field}
                label="Height"
                type="number"
                placeholder={form.state.values.unit === 'cm' ? '170' : '67'}
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

      {serverError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={form.state.isSubmitting || !form.state.canSubmit}
      >
        {form.state.isSubmitting ? 'Saving…' : 'Save height'}
      </Button>
    </form>
  );
}
