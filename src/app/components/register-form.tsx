'use client';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import FormInputRow from './ui/form-input-row';
import { useRef, useState } from 'react';
import { Parser, Su } from '@/lib/validator';
import { cn, yearsBetween } from '@/lib/utils';

const MIN_REGISTRATION_AGE = 18;

const isValidBirthDate = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length === 0) return false;
  const date = new Date(value);
  if (isNaN(date.getTime())) return false;
  return yearsBetween(date, new Date()) >= MIN_REGISTRATION_AGE;
};
import { apiClient } from '@/lib/api/client';
import { registerResponseSchema } from '@/lib/api/schemas';

type RegisterResponse = {
  id: string;
  email: string;
  isVerified: boolean;
};

const recipeFieldClass =
  'flex h-11 items-center border-b border-dashed border-recipe-dash bg-transparent';

const recipeInputClass =
  'h-full border-0 px-0 text-base font-semibold text-recipe-ink shadow-none placeholder:text-recipe-ink focus-visible:ring-0 md:text-lg';

const recipeErrorClass =
  'ml-11 text-xs font-semibold uppercase tracking-widest text-rose-600 animate-in fade-in slide-in-from-top-1 duration-150';

export const validateField = (value: unknown, validator: Parser<unknown>) => {
  if (!value) return true;
  try {
    validator.parse(value);
    return true;
  } catch {
    return false;
  }
};

export const RegisterForm = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const registerUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const obj = Object.fromEntries(formData);
      Su.object({
        username: Su.string().length({ min: 2, max: 50 }).username(),
        email: Su.string().email(),
        lastName: Su.string().length({ min: 2, max: 50 }),
        firstName: Su.string().length({ min: 2, max: 50 }),
        password: Su.string().password(),
        confirmedPassword: Su.string()
          .password()
          .match(obj.password as string),
        birthDate: Su.string(),
      }).parse(obj);
      if (!isValidBirthDate(obj.birthDate)) {
        throw new Error('birthDate');
      }
    } catch {
      setError('Please check your information and try again');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post<RegisterResponse>(
        '/auth/register/',
        Object.fromEntries(formData),
      );

      const validationResult = registerResponseSchema.safeParse(response);
      if (!validationResult.success) {
        setError(
          'Registration completed but something went wrong. Please sign in.',
        );
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create account. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex w-full flex-1 items-center justify-center bg-recipe-shell px-4 py-10 text-recipe-ink">
        <section className="recipe-lined-paper relative w-full max-w-xl overflow-hidden rounded-md border border-recipe-edge px-6 py-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300 sm:px-12">
          <div className="absolute left-0 right-0 top-0 h-2 border-b border-recipe-rule bg-recipe-paper-soft" />
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-pink-500">
            Recipe no 01 . verified
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full border border-recipe-matcha bg-recipe-matcha-soft text-recipe-matcha">
              <CheckCircle2 className="size-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                Profile baked.
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                We&apos;ve sent a verification email to your inbox. Please check
                your email to verify your account.
              </p>
            </div>
          </div>
          <Link href="/login" className="mt-10 inline-flex">
            <Button className="h-14 rounded-full bg-recipe-dark px-7 font-mono text-xs font-bold uppercase tracking-widest text-recipe-cream hover:bg-recipe-ink">
              Continue to sign in
              <ArrowRight className="size-4 rounded-full bg-recipe-matcha-soft p-0.5 text-recipe-dark" />
            </Button>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="register-recipe-bg flex w-full flex-1 items-start justify-center px-4 py-8 text-recipe-ink sm:py-12">
      <section className="recipe-lined-paper relative min-h-screen w-full max-w-4xl overflow-hidden rounded-md border border-recipe-edge px-6 pb-10 pt-9 shadow-2xl sm:px-12 lg:px-16">
        <div className="absolute left-0 right-0 top-0 h-2 border-b border-recipe-rule bg-recipe-paper-soft" />
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-recipe-rule pb-6">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-pink-500">
              Recipe no 01 . sign up
            </p>
            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-none tracking-tight sm:text-6xl">
              Brew a sweeter
              <span className="block font-serif italic font-normal text-recipe-matcha">
                kind of you.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
              Seven simple ingredients, gently folded together. Takes about
              ninety seconds to prep, with no credit card and no hidden
              additives.
            </p>
          </div>
          <div className="hidden rotate-3 rounded-full border border-pink-400 px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-pink-500 sm:block">
            New batch . 2026
          </div>
        </div>

        <div className="mb-9 grid gap-4 border-b border-recipe-rule pb-5 font-mono text-xs uppercase tracking-widest text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
          <p>
            Yields .{' '}
            <span className="font-black tracking-normal text-slate-800">
              1 profile
            </span>
          </p>
          <p>
            Prep time .{' '}
            <span className="font-black tracking-normal text-slate-800">
              ~90 sec
            </span>
          </p>
          <p>
            Difficulty .{' '}
            <span className="font-black tracking-normal text-slate-800">
              Easy
            </span>
          </p>
          <p>
            Storage .{' '}
            <span className="font-black tracking-normal text-slate-800">
              Delete anytime
            </span>
          </p>
        </div>

        <form ref={formRef} onSubmit={registerUser}>
          <div className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-slate-500">
            <span>-</span>
            <span>Ingredients</span>
            <span>-</span>
          </div>

          <div className="flex flex-col gap-3">
            {error && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
              <FormInputRow
                id="firstname"
                type="text"
                name="firstName"
                label="First name"
                marker="i."
                placeholder="e.g. Mei"
                errorMessage="First name must be between 2 and 50 characters"
                fieldClassName={recipeFieldClass}
                inputClassName={recipeInputClass}
                errorClassName={recipeErrorClass}
                handleValidate={(value) =>
                  validateField(value, Su.string().length({ min: 2, max: 50 }))
                }
              />
              <FormInputRow
                id="lastname"
                type="text"
                name="lastName"
                label="Last name"
                marker="ii."
                placeholder="e.g. Tanaka"
                errorMessage="Last name must be between 2 and 50 characters"
                fieldClassName={recipeFieldClass}
                inputClassName={recipeInputClass}
                errorClassName={recipeErrorClass}
                handleValidate={(value) =>
                  validateField(value, Su.string().length({ min: 2, max: 50 }))
                }
              />
            </div>
            <FormInputRow
              id="birthdate"
              type="date"
              name="birthDate"
              label="Date of birth . 18+ only"
              marker="iii."
              placeholder="MM / DD / YYYY"
              errorMessage={`You must be at least ${MIN_REGISTRATION_AGE} years old`}
              fieldClassName={recipeFieldClass}
              inputClassName={recipeInputClass}
              errorClassName={recipeErrorClass}
              handleValidate={isValidBirthDate}
            />
            <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
              <FormInputRow
                id="username"
                type="username"
                name="username"
                label="Username . the handle on your jar"
                marker="iv."
                placeholder="@yourname"
                errorMessage="Username must be between 2 and 50 characters"
                fieldClassName={recipeFieldClass}
                inputClassName={recipeInputClass}
                errorClassName={recipeErrorClass}
                handleValidate={(value) =>
                  validateField(value, Su.string().length({ min: 2, max: 50 }))
                }
              />
              <FormInputRow
                id="email"
                type="email"
                name="email"
                label="Email"
                marker="v."
                placeholder="you@kitchen.com"
                errorMessage="Please enter a valid email address"
                fieldClassName={recipeFieldClass}
                inputClassName={recipeInputClass}
                errorClassName={recipeErrorClass}
                handleValidate={(value) =>
                  validateField(value, Su.string().email())
                }
              />
            </div>
            <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
              <FormInputRow
                id="password"
                type="password"
                label="Password"
                marker="vi."
                placeholder="at least 8"
                name="password"
                errorMessage="Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number"
                fieldClassName={recipeFieldClass}
                inputClassName={recipeInputClass}
                errorClassName={recipeErrorClass}
                handleValidate={(value) =>
                  validateField(value, Su.string().password())
                }
              />
              <FormInputRow
                id="confirmedpassword"
                type="password"
                name="confirmedPassword"
                label="Confirm password"
                marker="vii."
                placeholder="repeat it"
                errorMessage="Passwords do not match"
                fieldClassName={recipeFieldClass}
                inputClassName={recipeInputClass}
                errorClassName={recipeErrorClass}
                handleValidate={(value) =>
                  validateField(
                    value,
                    Su.string().match(
                      (
                        (
                          formRef.current as HTMLFormElement | null
                        )?.querySelector(
                          'input[name="password"]',
                        ) as HTMLInputElement | null
                      )?.value,
                    ),
                  )
                }
              />
            </div>

            <div className="mt-7 flex flex-col items-start justify-between gap-6 border-b border-recipe-rule pb-9 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'h-16 rounded-full bg-recipe-dark px-8 font-mono text-xs font-black uppercase tracking-widest text-recipe-cream shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-recipe-ink sm:min-w-64',
                  isLoading && 'opacity-80',
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Baking profile...
                  </>
                ) : (
                  <>
                    Bake the profile
                    <ArrowRight className="size-7 rounded-full bg-recipe-matcha-soft p-1.5 text-recipe-dark" />
                  </>
                )}
              </Button>

              <p className="max-w-44 font-mono text-xs font-bold leading-5 tracking-widest text-slate-600">
                Yields one warm, verified account.
              </p>
            </div>

            <div className="flex flex-col justify-between gap-3 pt-6 font-mono text-xs tracking-widest text-slate-500 sm:flex-row">
              <p>
                Already on the shelf?{' '}
                <Link
                  href="/login"
                  className="font-bold text-pink-500 underline decoration-pink-300 underline-offset-4"
                >
                  Sign in here -&gt;
                </Link>
              </p>
              <p>v.2026 . house recipe</p>
            </div>
          </div>
        </form>

        <div className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 border border-recipe-rule bg-recipe-paper px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-pink-500 sm:block">
          Strawberry x Matcha . hand-folded since &apos;25
        </div>
      </section>
    </div>
  );
};
