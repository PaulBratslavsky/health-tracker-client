import { z } from 'zod';

export const SignUpFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters'),
  email: z.email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

export const SignInFormSchema = z.object({
  identifier: z.string().min(1, 'Enter your username or email'),
  password: z.string().min(1, 'Enter your password'),
});

export type SignUpFormValues = z.infer<typeof SignUpFormSchema>;
export type SignInFormValues = z.infer<typeof SignInFormSchema>;
