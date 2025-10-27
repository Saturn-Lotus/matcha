'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, User, Lock } from 'lucide-react';
import Link from 'next/link';
import FormInputRow from './ui/form-input-row';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Separator } from './ui/separator';

export function LoginForm() {
  const router = useRouter();

  const formRef = useRef(null);
  const loginUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch('api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    if (response.ok) {
      router.push('/');
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
            <div className="flex flex-col gap-4">
              <FormInputRow
                id="username"
                type="username"
                placeholder="Username"
                name="username"
                handleValidate={() => {
                  return true;
                }}
                errorMessage=""
                icon={<User className="h-5 w-5 text-icon-muted" />}
              />
              <FormInputRow
                id="password"
                type="password"
                placeholder="Password"
                name="password"
                handleValidate={() => {
                  return true;
                }}
                errorMessage=""
                icon={<Lock className="h-5 w-5 text-icon-muted" />}
              />
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full strawberry-matcha-btn hover:opacity-90 text-white bg-card"
                >
                  Sign In
                </Button>
                <Link
                  href="/reset-password"
                  className="text-sm text-cente underline-offset-4 hover:underline flex items-center justify-center md:my-4 my-2 w-full gap-1 text-link-alt"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
            <Separator />
            <div className="text-center pt-6">
              <p className="text-text-muted">
                Don&apos;t have an account?
                <Link href="/register" className="font-semibold ml-5 text-link">
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
