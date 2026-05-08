'use client';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

const PendingVerification = () => {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await apiClient.post('/auth/resend-verification');
      toast.success('Verification email sent. Please check your inbox.');
    } catch {
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect border-0 shadow-xl text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold strawberry-matcha-gradient">
            Check your inbox
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            We sent a verification link to your email address. Click the link to
            activate your account before continuing.
          </p>
          <p className="text-sm text-gray-400">
            Didn&apos;t receive it? Check your spam folder or request a new one.
          </p>
          <Button
            onClick={handleResend}
            disabled={resending}
            className="w-full strawberry-matcha-btn hover:opacity-90 text-white"
          >
            {resending ? 'Sending...' : 'Resend verification email'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingVerification;
