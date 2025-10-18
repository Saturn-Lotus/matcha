'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, User, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import FormInputRow from './ui/form-input-row';
import { useRef } from 'react';
import { Parser, Su } from '@/lib/validator';

export const RegisterForm = () => {
  const formRef = useRef(null);

  const registerUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch('api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
    });
  };

  const validateField = (value: unknown, validator: Parser<any>) => {
    if (!value) return true;
    try {
      validator.parse(value);
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  };

  return (
    <div className="h-full flex bg-strawberry-matcha justify-center items-center">
      <div className="w-full max-w-md h-full">
        <div className="text-center mb-8 hidden sm:block">
          <h1 className="text-2xl font-bold strawberry-matcha-gradient flex items-center justify-center space-x-2">
            <Heart className="h-8 w-8 text-pink-400 fill-current mr-2" />
            Strawberry Matcha
          </h1>
          <p className="text-gray-600">
            Join thousands finding love every day!
          </p>
        </div>
        <Card className="bg-white h-fit max-h-full">
          <CardHeader className="justify-center text-xl">
            <CardTitle className="font-bold text-md md:text-lg">
              Sign Up
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-full overflow-y-auto">
            <form ref={formRef} onSubmit={registerUser}>
              <div className="flex flex-col gap-4">
                <FormInputRow
                  id="firstname"
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  errorMessage="First name must be between 2 and 50 characters"
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  handleValidate={(value) =>
                    validateField(
                      value,
                      Su.string().length({ min: 2, max: 50 }),
                    )
                  }
                />
                <FormInputRow
                  id="lastname"
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  errorMessage="Last name must be between 2 and 50 characters"
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  handleValidate={(value) =>
                    validateField(
                      value,
                      Su.string().length({ min: 2, max: 50 }),
                    )
                  }
                />
                <FormInputRow
                  id="username"
                  type="username"
                  name="username"
                  placeholder="Username"
                  errorMessage="Username must be between 2 and 50 characters"
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  handleValidate={(value) =>
                    validateField(
                      value,
                      Su.string().length({ min: 2, max: 50 }),
                    )
                  }
                />
                <FormInputRow
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  errorMessage="Please enter a valid email address"
                  icon={<Mail className="h-5 w-5 text-gray-400" />}
                  handleValidate={(value) =>
                    validateField(value, Su.string().email())
                  }
                />
                <FormInputRow
                  id="password"
                  type="password"
                  placeholder="Password"
                  name="password"
                  errorMessage="Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character"
                  icon={<Lock className="h-5 w-5 text-gray-400" />}
                  handleValidate={(value) =>
                    validateField(value, Su.string().password())
                  }
                />
                <FormInputRow
                  id="confirmedpassword"
                  type="password"
                  name="password"
                  placeholder="Confirm Password"
                  errorMessage="Passwords do not match"
                  icon={<Lock className="h-5 w-5 text-gray-400" />}
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
                    className="w-full h-10 strawberry-matcha-btn hover:opacity-90 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-pink-500 hover:text-pink-700 font-semibold"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
