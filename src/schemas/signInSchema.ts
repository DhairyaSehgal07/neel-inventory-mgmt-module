import { z } from 'zod';

export const signInSchema = z.object({
  mobileNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(/^\d{10,15}$/, 'Mobile number must contain only 10-15 digits'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type SignInInput = z.infer<typeof signInSchema>;
