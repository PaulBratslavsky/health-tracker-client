import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { FieldText } from '#/components/forms/FieldText';
import { loginUser } from '#/data/server-functions/auth';
import {
  SignInFormSchema,
  type SignInFormValues,
} from '#/lib/validations/auth';

export function SignInForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      identifier: '',
      password: '',
    } as SignInFormValues,
    validators: { onChange: SignInFormSchema },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const result = await loginUser({ data: value });
        if (result.success) {
          await router.invalidate();
          router.navigate({ to: '/' });
        } else {
          setServerError(result.error);
        }
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : 'Sign-in failed unexpectedly',
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
      <form.Field name="identifier">
        {(field) => (
          <FieldText
            field={field}
            label="Username or email"
            autoComplete="username"
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
            autoComplete="current-password"
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
        {form.state.isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
