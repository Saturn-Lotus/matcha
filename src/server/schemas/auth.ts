import { Su } from '@/lib/validator';

export const RegisterUserSchema = Su.object({
  username: Su.string().length({ min: 2, max: 50 }).username(),
  email: Su.string().email(),
  lastName: Su.string().length({ min: 2, max: 50 }),
  firstName: Su.string().length({ min: 2, max: 50 }),
  password: Su.string().password(),
});

export const ResetPasswordSchema = Su.object({
  newPassword: Su.string().password(),
});

export const CredentialsSchema = Su.object({
  username: Su.string(),
  password: Su.string().password(),
});

export const ForgotPasswordSchema = Su.object({
  email: Su.string().email(),
});
