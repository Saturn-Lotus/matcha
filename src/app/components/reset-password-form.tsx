'use client';
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { ArrowLeft, Heart, Lock, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Su } from '@/lib/validator';
import { useSearchParams } from 'next/navigation';
import FormInputRow from './ui/form-input-row';
import { validateField } from './register-form';

interface SendVerificationCardProps {
  email: string;
  setEmail: (email: string) => void;
  handleResetPassword: () => Promise<void>;
  loading: boolean;
}

const SendVerificationCard = ({
  email,
  setEmail,
  handleResetPassword,
  loading,
}: SendVerificationCardProps) => {
  return (
    <>
      <div className="relative">
        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10 h-12 rounded-xl border-1 text-gray-600 placeholder:text-gray-500 border-gray-200 focus:border-pink-300"
        />
      </div>

      <Button
        className="w-full h-12 strawberry-matcha-btn hover:opacity-90 text-white rounded-xl font-semibold"
        onClick={handleResetPassword}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>
    </>
  );
};

interface ReSendVerificationCardProps {
  email: string;
  setSent: (sent: boolean) => void;
}

const ReSendVerificationCard = ({
  email,
  setSent,
}: ReSendVerificationCardProps) => {
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Check your email
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        We&apos;ve sent a password reset link to{' '}
        <span className="font-semibold">{email}</span>
      </p>
      <Button
        variant="outline"
        className="strawberry-matcha-btn hover:opacity-90 text-white"
        onClick={() => setSent(false)}
      >
        Resend Email
      </Button>
    </div>
  );
};

interface SetNewPasswordCardProps {
  newPassword: string;
  setNewPassword: (password: string) => void;
  token: string;
  id: string;
}

const SetNewPasswordCard = ({ token, id }: SetNewPasswordCardProps) => {
  const formRef = useRef(null);

  const resetPassword = async (newPassword: string) => {
    try {
      Su.string().password().parse(newPassword);
    } catch (error) {
      toast.error('Error: unable to reset password');
      return;
    }
    const params = new URLSearchParams();
    params.append('token', token);
    params.append('id', id);
    await fetch(`/api/auth/reset-password?${params.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await resetPassword(Object.fromEntries(formData)?.password as string);
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <FormInputRow
          id="password"
          name="password"
          type="password"
          placeholder="New password"
          icon={<Lock className="h-5 w-5 text-gray-400" />}
          handleValidate={(value) =>
            validateField(value, Su.string().password())
          }
          errorMessage="Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number"
        />
        <FormInputRow
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          icon={<Lock className="h-5 w-5 text-gray-400" />}
          errorMessage="Passwords do not match"
          handleValidate={(value) =>
            validateField(
              value,
              Su.string().match(
                (
                  (formRef.current as HTMLFormElement | null)?.querySelector(
                    'input[name="password"]',
                  ) as HTMLInputElement | null
                )?.value,
              ),
            )
          }
        />
        <Button
          type="submit"
          className="w-full h-12 strawberry-matcha-btn hover:opacity-90 text-white rounded-xl font-semibold"
        >
          Change password
        </Button>
      </form>
    </>
  );
};

const ResetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  const handleResetPassword = async () => {
    try {
      Su.string().email().parse(email);
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    setSent(true);
  };

  const renderContent = () => {
    if (token && id)
      return (
        <SetNewPasswordCard
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          token={token}
          id={id}
        />
      );
    else if (sent)
      return <ReSendVerificationCard email={email} setSent={setSent} />;
    return (
      <SendVerificationCard
        email={email}
        setEmail={setEmail}
        handleResetPassword={handleResetPassword}
        loading={loading}
      />
    );
  };

  return (
    <div className="flex h-full bg-strawberry-matcha">
      <div className="w-full h-full max-w-md">
        <div className="text-center mb-8 hidden md:block">
          <h1 className="text-2xl font-bold strawberry-matcha-gradient flex items-center justify-center space-x-2">
            <Heart className="h-8 w-8 fill-current mr-2 text-icon-primary" />
            Strawberry Matcha
          </h1>
          <p className="text-text-muted">
            Welcome back! Let&apos;s brew some sweet connections.
          </p>
        </div>
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-bold text-md md:text-2xl text-text-strong">
              Reset Password
            </CardTitle>
            {!sent ? (
              <p className="text-center text-sm text-text-muted">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>
            ) : (
              ''
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {renderContent()}
            <div className="text-center pt-4 border-t border-border">
              <Link
                href="/login"
                className="font-semibold inline-flex items-center gap-2 text-link"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
