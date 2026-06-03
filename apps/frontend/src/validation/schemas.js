import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your username or email'),
  password: z.string().min(10, 'Password must be at least 10 characters'),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Keep it under 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(10, 'Use at least 10 characters')
      .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), 'Use at least one letter and one number'),
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export const identitySchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(40),
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
  bio: z.string().max(180, 'Keep your bio under 180 characters').optional(),
  location: z.string().max(60).optional(),
  status: z.string().max(60).optional(),
});

export const linkSchema = z.object({
  label: z.string().min(1, 'Label required').max(40),
  url: z.string().url('Enter a valid URL'),
  icon: z.string().optional(),
  style: z.string().optional(),
});

export const badgeSchema = z.object({
  label: z.string().min(1, 'Label required').max(24),
  color: z.string().min(1),
  tooltip: z.string().max(80).optional(),
  glow: z.boolean().optional(),
});

export const metadataSchema = z.object({
  title: z.string().max(60).optional(),
  description: z.string().max(160).optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
});

export const settingsSchema = z.object({
  displayName: z.string().min(1).max(40),
  email: z.string().email(),
});
