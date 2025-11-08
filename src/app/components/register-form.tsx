'use client';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Heart, User, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import FormInputRow from './ui/form-input-row';
import { useRef, useState } from 'react';
import { Parser, Su } from '@/lib/validator';
import { toast } from 'sonner';

export const validateField = (value: unknown, validator: Parser<any>) => {
  if (!value) return true;
  try {
    validator.parse(value);
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
};

export const RegisterForm = () => {
  const formRef = useRef(null);
  const [error, setError] = useState<boolean>(false);

  const registerUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setError(false);
    } catch (error: any) {
      toast.error('Error: unable to register user', error.message);
      setError(true);
      return;
    }
    await fetch('api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
    });
  };

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
            <div className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full h-10 strawberry-matcha-btn hover:opacity-90 text-white bg-card-bg"
                >
                  Sign Up
                </Button>
              </div>
            </div>
            <div className="text-center pt-6 border-t border-border">
              <p className="text-text-muted">
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
