'use client';

import { useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { HeartCrack } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <HeartCrack className="w-10 h-10 text-gray-300 mb-4" />
      <h1 className="text-xl font-bold text-gray-900 mb-1">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset} className="strawberry-matcha-btn text-white">
        Try again
      </Button>
    </div>
  );
}
