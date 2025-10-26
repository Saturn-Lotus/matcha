'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { ArrowLeft, Heart, Lock, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Su } from '@/lib/validator';
import { useSearchParams } from 'next/navigation';

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
}

const SetNewPasswordCard = ({
  newPassword,
  setNewPassword,
  token,
}: SetNewPasswordCardProps) => {
  const [confirmedPassword, setConfirmedPassword] = useState('');

  const resetPassword = async () => {
    const params = new URLSearchParams();
    params.append('token', token);
    await fetch(`/api/auth/reset-password?${params.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  };

  return (
    <>
      <div className=" space-y-2">
        <div className="border border-gray-300 rounded-sm h-10 flex items-center px-3">
          <Lock className="h-5 w-5 text-gray-400" />
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="text-gray-700 placeholder:text-gray-400 md:text-lg text-xs"
          />
        </div>
        <div className="border border-gray-300 rounded-sm h-10 flex items-center px-3">
          <Lock className="h-5 w-5 text-gray-400" />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmedPassword}
            onChange={(e) => setConfirmedPassword(e.target.value)}
            className="text-gray-700 placeholder:text-gray-400 md:text-lg text-xs"
          />
        </div>
      </div>

      <Button
        className="w-full h-12 strawberry-matcha-btn hover:opacity-90 text-white rounded-xl font-semibold"
        onClick={resetPassword}
      >
        Change password
      </Button>
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
    if (token)
      return (
        <SetNewPasswordCard
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          token={token}
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
            <Heart className="h-8 w-8 text-pink-400 fill-current mr-2" />
            Strawberry Matcha
          </h1>
          <p className="text-gray-600">
            Welcome back! Let&apos;s brew some sweet connections.
          </p>
        </div>
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-bold text-gray-800 text-md md:text-2xl">
              Reset Password
            </CardTitle>
            {!sent ? (
              <p className="text-center text-gray-600 text-sm">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>
            ) : (
              ''
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {renderContent()}
            <div className="text-center pt-4 border-t border-gray-200">
              <Link
                href="/login"
                className="text-pink-500 hover:text-pink-700 font-semibold inline-flex items-center gap-2"
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
