import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { FieldText } from '#/components/forms/FieldText';
import { registerUser } from '#/data/server-functions/auth';
import {
  SignUpFormSchema,
  type SignUpFormValues,
} from '#/lib/validations/auth';

export function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    } as SignUpFormValues,
    validators: { onChange: SignUpFormSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const result = await registerUser({ data: value });
        if (result.success) {
          await router.invalidate();
          router.navigate({ to: '/' });
        } else {
          setServerError(result.error);
        }
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : 'Sign-up failed unexpectedly',
        );
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
      <form.Field name="username">
        {(field) => (
          <FieldText
            field={field}
            label="Username"
            placeholder="alice"
            autoComplete="username"
            disabled={form.state.isSubmitting}
          />
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <FieldText
            field={field}
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={form.state.isSubmitting}
          />
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <FieldText
            field={field}
            label="Password"
            type="password"
            placeholder="at least 8 characters"
            autoComplete="new-password"
            disabled={form.state.isSubmitting}
          />
        )}
      </form.Field>

      {serverError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={form.state.isSubmitting || !form.state.canSubmit}
        className="mt-1"
      >
        {form.state.isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
