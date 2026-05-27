'use client';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import FormInputRow from './ui/form-input-row';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { signInResponseSchema } from '@/lib/api/schemas';

type SignInResponse = {
  id: string;
  email: string;
};

const recipeFieldClass =
  'flex h-12 items-center border-b border-dashed border-recipe-dash bg-transparent';

const recipeInputClass =
  'h-full border-0 px-0 text-lg font-semibold text-recipe-ink shadow-none placeholder:text-recipe-ink focus-visible:ring-0';

const recipeErrorClass =
  'ml-11 text-xs font-semibold uppercase tracking-widest text-rose-600 animate-in fade-in slide-in-from-top-1 duration-150';

export function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username?.trim() || !password?.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post<SignInResponse>(
        '/auth/signin',
        Object.fromEntries(formData),
      );

      const validationResult = signInResponseSchema.safeParse(response);
      if (!validationResult.success) {
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
        return;
      }

      window.location.href = '/';
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-recipe-bg flex w-full flex-1 items-start justify-center px-4 py-8 text-recipe-ink sm:py-12">
      <section className="recipe-lined-paper relative min-h-screen w-full max-w-3xl overflow-hidden rounded-md border border-recipe-edge px-6 pb-10 pt-9 shadow-2xl sm:px-12 lg:px-16">
        <div className="absolute left-0 right-0 top-0 h-2 border-b border-recipe-rule bg-recipe-paper-soft" />
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-pink-500">
              Recipe no 02 . sign in
            </p>
            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-none tracking-tight sm:text-6xl lg:text-7xl">
              Pick up where
              <span className="block font-serif italic font-normal text-recipe-matcha">
                you left off.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
              Pop the jar open with your two ingredients. Forgot one? We&apos;ll
              write you a new label.
            </p>
          </div>
          <div className="hidden rotate-3 rounded-full border border-pink-400 px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-pink-500 sm:block">
            Welcome back
          </div>
        </div>

        <form ref={formRef} onSubmit={loginUser}>
          <div className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-slate-500">
            <span>-</span>
            <span>Ingredients</span>
            <span>-</span>
          </div>

          <div className="flex flex-col gap-6">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 animate-in fade-in slide-in-from-top-1 duration-150">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <FormInputRow
              id="username"
              type="username"
              placeholder="@yourname"
              name="username"
              label="Username"
              marker="i."
              handleValidate={() => true}
              errorMessage=""
              fieldClassName={recipeFieldClass}
              inputClassName={recipeInputClass}
              errorClassName={recipeErrorClass}
            />
            <FormInputRow
              id="password"
              type="password"
              placeholder="password"
              name="password"
              label="Password"
              marker="ii."
              handleValidate={() => true}
              errorMessage=""
              fieldClassName={recipeFieldClass}
              inputClassName={recipeInputClass}
              errorClassName={recipeErrorClass}
            />

            <div className="mt-6 flex flex-col items-start justify-between gap-6 border-b border-recipe-rule pb-10 sm:flex-row sm:items-center">
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
                    Opening jar...
                  </>
                ) : (
                  <>
                    Open the jar
                    <ArrowRight className="size-7 rounded-full bg-recipe-matcha-soft p-1.5 text-recipe-dark" />
                  </>
                )}
              </Button>
              <Link
                href="/reset-password"
                className="font-mono text-sm font-semibold text-link-alt underline decoration-link-alt underline-offset-4 hover:text-link-alt-hover"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="flex flex-col justify-between gap-3 pt-6 font-mono text-xs tracking-widest text-slate-500 sm:flex-row">
              <p>
                New here?{' '}
                <Link
                  href="/register"
                  className="font-bold text-pink-500 underline decoration-pink-300 underline-offset-4"
                >
                  Start a fresh batch -&gt;
                </Link>
              </p>
              <p>est. 2025</p>
            </div>
          </div>
        </form>

        <div className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 translate-y-1/2 border border-recipe-rule bg-recipe-paper px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-pink-500 sm:block">
          Strawberry x Matcha
        </div>
      </section>
    </div>
  );
}
