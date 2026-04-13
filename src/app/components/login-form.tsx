'use client';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Heart, User, Lock, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import FormInputRow from './ui/form-input-row';
import { useRef, useState } from 'react';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { signInResponseSchema } from '@/lib/api/schemas';

type SignInResponse = {
  id: string;
  email: string;
};

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
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex-col flex bg-strawberry-matcha py-8 justify-center px-4">
      <div className="text-center md:mb-8 mb-4">
        <h1 className="text-2xl font-bold strawberry-matcha-gradient flex items-center justify-center space-x-2">
          <Heart className="h-8 w-8 fill-current mr-2 text-icon-primary" />
          Strawberry Matcha
        </h1>
        <p className="text-text-muted">
          Welcome back! Let&apos;s brew some sweet connections.
        </p>
      </div>
      <Card className="h-fit max-h-full md:w-[400px] card-bg self-center">
        <CardHeader className="justify-center text-xl">
          <CardTitle className="font-bold text-md md:text-lg">
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-full overflow-y-auto">
          <form ref={formRef} onSubmit={loginUser}>
            <div className="flex flex-col gap-3">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <FormInputRow
                id="username"
                type="username"
                placeholder="Username"
                name="username"
                handleValidate={() => true}
                errorMessage=""
                icon={<User className="h-5 w-5 text-icon-muted" />}
              />
              <FormInputRow
                id="password"
                type="password"
                placeholder="Password"
                name="password"
                handleValidate={() => true}
                errorMessage=""
                icon={<Lock className="h-5 w-5 text-icon-muted" />}
              />
              <div className="flex flex-col gap-2 mt-1">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full strawberry-matcha-btn hover:opacity-90 text-white bg-card transition-all duration-200',
                    isLoading && 'opacity-80',
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                <Link
                  href="/reset-password"
                  className="text-sm text-center underline-offset-4 hover:underline flex items-center justify-center w-full text-link-alt"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="text-center">
              <p className="text-text-muted text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-link">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
