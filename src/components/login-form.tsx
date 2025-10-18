'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, User, Lock } from 'lucide-react';
import Link from 'next/link';
import FormInputRow from './ui/form-input-row';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';

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
      router.push('/home');
    }
  };

  return (
    <div className="flex h-full bg-strawberry-matcha">
      <div className="w-full h-full max-w-md">
        <div className="text-center mb-8 hidden md:block">
          <h1 className="text-2xl font-bold strawberry-matcha-gradient flex items-center justify-center space-x-2">
            <Heart className="h-8 w-8 text-pink-400 fill-current mr-2" />
            Strawberry Matcha
          </h1>
          <p className="text-gray-600">
            Welcome back! Let&apos;s brew some sweet connections.
          </p>
        </div>
        <Card className="bg-white h-fit max-h-full">
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
                  icon={<User className="h-5 w-5 text-gray-400" />}
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
                  icon={<Lock className="h-5 w-5 text-gray-400" />}
                />
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full strawberry-matcha-btn hover:opacity-90 text-white"
                  >
                    Sign In
                  </Button>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline flex items-center justify-center md:m-5 m-2 w-full gap-1 text-green-600 hover:text-green-800"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Don&apos;t have an account?
                  <Link
                    href="/register"
                    className="text-pink-500 hover:text-pink-700 font-semibold ml-5"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
