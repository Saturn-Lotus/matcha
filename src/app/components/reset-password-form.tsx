'use client';
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Su } from '@/lib/validator';
import { useSearchParams, useRouter } from 'next/navigation';
import FormInputRow from './ui/form-input-row';
import { validateField } from './register-form';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { resetPasswordResponseSchema } from '@/lib/api/schemas';

type ResetPasswordResponse = {
  success: boolean;
};

interface SendVerificationCardProps {
  email: string;
  setEmail: (email: string) => void;
  handleResetPassword: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const SendVerificationCard = ({
  email,
  setEmail,
  handleResetPassword,
  loading,
  error,
}: SendVerificationCardProps) => {
  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
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
        className={cn(
          'w-full h-12 strawberry-matcha-btn hover:opacity-90 text-white rounded-xl font-semibold transition-all duration-200',
          loading && 'opacity-80',
        )}
        onClick={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Reset Link'
        )}
      </Button>
    </div>
  );
};

interface ReSendVerificationCardProps {
  email: string;
  setSent: (sent: boolean) => void;
  onResend: () => Promise<void>;
  loading: boolean;
}

const ReSendVerificationCard = ({
  email,
  setSent,
  onResend,
  loading,
}: ReSendVerificationCardProps) => {
  return (
    <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
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
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className={cn(
            'strawberry-matcha-btn hover:opacity-90 text-white transition-all duration-200',
            loading && 'opacity-80',
          )}
          onClick={onResend}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resending...
            </>
          ) : (
            'Resend Email'
          )}
        </Button>
        <Button
          variant="ghost"
          className="text-text-muted hover:text-text-strong"
          onClick={() => setSent(false)}
        >
          Try another email
        </Button>
      </div>
    </div>
  );
};

interface SetNewPasswordCardProps {
  token: string;
  id: string;
}

const SetNewPasswordCard = ({ token, id }: SetNewPasswordCardProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      Su.string().password().parse(password);
    } catch {
      setError(
        'Password must meet security requirements',
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.patch<ResetPasswordResponse>(
        `/auth/reset-password?token=${token}&id=${id}`,
        { newPassword: password },
      );

      const validationResult = resetPasswordResponseSchema.safeParse(response);
      if (!validationResult.success || !response.success) {
        setError('Unable to reset password. Please try again.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Password Reset!
        </h3>
        <p className="text-gray-600 text-sm">
          Your password has been successfully changed. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
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
        disabled={isLoading}
        className={cn(
          'w-full h-12 strawberry-matcha-btn hover:opacity-90 text-white rounded-xl font-semibold transition-all duration-200',
          isLoading && 'opacity-80',
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Changing password...
          </>
        ) : (
          'Change password'
        )}
      </Button>
    </form>
  );
};

const ResetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  const handleResetPassword = async () => {
    setError(null);

    try {
      Su.string().email().parse(email);
    } catch {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post<ResetPasswordResponse>('/auth/reset-password', {
        email,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await apiClient.post<ResetPasswordResponse>('/auth/reset-password', {
        email,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (token && id) {
      return <SetNewPasswordCard token={token} id={id} />;
    }

    if (sent) {
      return (
        <ReSendVerificationCard
          email={email}
          setSent={setSent}
          onResend={handleResend}
          loading={loading}
        />
      );
    }

    return (
      <SendVerificationCard
        email={email}
        setEmail={setEmail}
        handleResetPassword={handleResetPassword}
        loading={loading}
        error={error}
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
            {!sent && !token && (
              <p className="text-center text-sm text-text-muted">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">{renderContent()}</CardContent>
          <div className="text-center pb-6 px-6 pt-4 border-t border-border">
            <Link
              href="/login"
              className="font-semibold inline-flex items-center gap-2 text-link hover:text-link-hover transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
