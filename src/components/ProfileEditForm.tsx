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
    isPublic: boolean;
  };
  onDone: () => void;
  onCancel: () => void;
};

export function ProfileEditForm({ profileDocumentId, initial, onDone, onCancel }: Readonly<Props>) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      displayName: initial.displayName,
      bio: initial.bio ?? '',
      height: (initial.heightCm ?? '') as number | '',
      unit: 'cm' as 'cm' | 'in',
      isPublic: initial.isPublic,
    } satisfies ProfileEditFormValues,
    // Cast: the transform schema's input has `unknown` height (z.coerce),
    // which conflicts with the form's `number | ''`. Submit-time safeParse is
    // the real validation gate — this is only for live UX hints.
    validators: { onChange: ProfileEditFormSchema as never },
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
          isPublic: parsed.data.isPublic,
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

      <form.Field name="isPublic">
        {(field) => {
          const isPublic = field.state.value;
          return (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-(--line) bg-(--bg-subtle) px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <Label className="text-sm font-medium text-foreground">Public profile</Label>
                <span className="group relative inline-flex">
                  <button
                    type="button"
                    aria-label="What does public profile mean?"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-(--line-strong) text-[0.6rem] font-semibold text-(--ink-muted) transition hover:bg-card"
                  >
                    ?
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg border border-(--line) bg-card px-3 py-2 text-[0.7rem] leading-snug text-(--ink-soft) opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    <strong className="font-semibold text-(--ink)">Public</strong> — your posts
                    appear on the landing page and in the feed for anyone, signed in or not.
                    <br />
                    <strong className="font-semibold text-(--ink)">Private</strong> — your posts
                    only show to people who are signed in.
                  </span>
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                aria-label="Public profile"
                onClick={() => field.handleChange(!isPublic)}
                disabled={form.state.isSubmitting}
                className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full border border-(--line) transition-colors ${
                  isPublic ? 'bg-(--ink)' : 'bg-card'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        }}
      </form.Field>

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
