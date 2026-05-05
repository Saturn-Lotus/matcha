'use client';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Heart,
  User,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import FormInputRow from './ui/form-input-row';
import { useRef, useState } from 'react';
import { Parser, Su } from '@/lib/validator';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { registerResponseSchema } from '@/lib/api/schemas';

type RegisterResponse = {
  id: string;
  email: string;
  isVerified: boolean;
};

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
      }).parse(obj);
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
      <div className="w-full flex-1 flex-col flex bg-strawberry-matcha py-8 justify-center px-4">
        <div className="text-center md:mb-8 mb-4">
          <h1 className="text-2xl font-bold strawberry-matcha-gradient flex items-center justify-center space-x-2">
            <Heart className="h-8 w-8 fill-current mr-2 text-icon-primary" />
            Strawberry Matcha
          </h1>
        </div>
        <Card className="h-fit max-h-full md:w-[400px] card-bg self-center animate-in fade-in zoom-in-95 duration-300">
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-text-strong">
                Account Created!
              </h3>
              <p className="text-text-muted text-sm">
                We&apos;ve sent a verification email to your inbox. Please check
                your email to verify your account.
              </p>
              <Link href="/login">
                <Button className="w-full mt-4 strawberry-matcha-btn hover:opacity-90 text-white">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex-col flex bg-strawberry-matcha py-8 justify-center px-4">
      <div className="text-center md:mb-8 mb-4">
        <h1 className="text-2xl font-bold strawberry-matcha-gradient flex items-center justify-center space-x-2">
          <Heart className="h-8 w-8 fill-current mr-2 text-icon-primary" />
          Strawberry Matcha
        </h1>
        <p className="text-text-muted">
          Join thousands finding love every day!
        </p>
      </div>
      <Card className="h-fit max-h-full md:w-[400px] card-bg self-center">
        <CardHeader className="justify-center text-xl">
          <CardTitle className="font-bold text-md md:text-lg">
            Sign Up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={registerUser}>
            <div className="flex flex-col gap-3">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <FormInputRow
                id="firstname"
                type="text"
                name="firstName"
                placeholder="First Name"
                errorMessage="First name must be between 2 and 50 characters"
                icon={<User className="h-5 w-5 text-icon-muted" />}
                handleValidate={(value) =>
                  validateField(value, Su.string().length({ min: 2, max: 50 }))
                }
              />
              <FormInputRow
                id="lastname"
                type="text"
                name="lastName"
                placeholder="Last Name"
                errorMessage="Last name must be between 2 and 50 characters"
                icon={<User className="h-5 w-5 text-icon-muted" />}
                handleValidate={(value) =>
                  validateField(value, Su.string().length({ min: 2, max: 50 }))
                }
              />
              <FormInputRow
                id="username"
                type="username"
                name="username"
                placeholder="Username"
                errorMessage="Username must be between 2 and 50 characters"
                icon={
                  <User
                    className="h-5 w-5"
                    style={{ color: 'var(--gray-400, #9ca3af)' }}
                  />
                }
                handleValidate={(value) =>
                  validateField(value, Su.string().length({ min: 2, max: 50 }))
                }
              />
              <FormInputRow
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                errorMessage="Please enter a valid email address"
                icon={<Mail className="h-5 w-5 text-icon-muted" />}
                handleValidate={(value) =>
                  validateField(value, Su.string().email())
                }
              />
              <FormInputRow
                id="password"
                type="password"
                placeholder="Password"
                name="password"
                errorMessage="Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number"
                icon={<Lock className="h-5 w-5 text-icon-muted" />}
                handleValidate={(value) =>
                  validateField(value, Su.string().password())
                }
              />
              <FormInputRow
                id="confirmedpassword"
                type="password"
                name="confirmedPassword"
                placeholder="Confirm Password"
                errorMessage="Passwords do not match"
                icon={<Lock className="h-5 w-5 text-icon-muted" />}
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
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full h-10 mt-1 strawberry-matcha-btn hover:opacity-90 text-white bg-card-bg transition-all duration-200',
                  isLoading && 'opacity-80',
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </div>
            <div className="text-center pt-4 mt-2 border-t border-border">
              <p className="text-text-muted text-sm">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
