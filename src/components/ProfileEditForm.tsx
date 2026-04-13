import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { Label } from '#/components/ui/label';
import { Textarea } from '#/components/ui/textarea';
import { FieldText } from '#/components/forms/FieldText';
import { updateMyProfile } from '#/data/server-functions/profile';
import {
  ProfileEditFormSchema,
  type ProfileEditFormValues,
} from '#/lib/validations/post';

type Props = {
  profileDocumentId: string;
  initial: {
    displayName: string;
    bio: string | null;
    heightCm: number | null;
  };
  onDone: () => void;
  onCancel: () => void;
};

export function ProfileEditForm({ profileDocumentId, initial, onDone, onCancel }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      displayName: initial.displayName,
      bio: initial.bio ?? '',
      height: (initial.heightCm ?? '') as number | '',
      unit: 'cm' as 'cm' | 'in',
    } satisfies ProfileEditFormValues,
    validators: { onChange: ProfileEditFormSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const parsed = ProfileEditFormSchema.safeParse(value);
      if (!parsed.success) {
        setServerError('Fix the highlighted fields and try again');
        return;
      }
      const result = await updateMyProfile({
        data: {
          documentId: profileDocumentId,
          displayName: parsed.data.displayName,
          bio: parsed.data.bio,
          heightCm: parsed.data.heightCm,
        },
      });
      if (result.success) {
        await router.invalidate();
        onDone();
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
      <form.Field name="displayName">
        {(field) => (
          <FieldText
            field={field}
            label="Display name"
            placeholder="alice"
            disabled={form.state.isSubmitting}
          />
        )}
      </form.Field>

      <div>
        <Label htmlFor="bio" className="mb-1.5 block text-sm font-medium">
          Bio
        </Label>
        <form.Field name="bio">
          {(field) => (
            <Textarea
              id="bio"
              placeholder="A few words about your wellness journey"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              disabled={form.state.isSubmitting}
              rows={2}
              className="resize-none"
            />
          )}
        </form.Field>
      </div>

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

      <p className="text-xs text-muted-foreground">
        Editing your height does not change historical posts — each post remembers the height at
        the time it was created.
      </p>

      {serverError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={form.state.isSubmitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting || !form.state.canSubmit}>
          {form.state.isSubmitting ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </form>
  );
}
