import { Su } from '@/lib/validator';

const errorDetailSchema = Su.object({
  field: Su.string(),
  issue: Su.string(),
});

const errorSchema = Su.object({
  code: Su.string(),
  message: Su.optional(Su.string()),
  details: Su.optional(Su.array(errorDetailSchema)),
});

export const apiErrorSchema = Su.object({
  error: errorSchema,
});

export const signInResponseSchema = Su.object({
  id: Su.string(),
  email: Su.string().email(),
});

export const registerResponseSchema = Su.object({
  id: Su.string(),
  email: Su.string().email(),
  isVerified: Su.boolean(),
});

export const resetPasswordResponseSchema = Su.object({
  success: Su.boolean(),
});
