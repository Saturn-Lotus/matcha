import ResetPasswordForm from '@/components/reset-password-form';
import React, { Suspense } from 'react';

const page = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-6 md:p-10">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
};

export default page;
