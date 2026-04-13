import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { OnboardingForm } from './onboarding-form';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const session = await decrypt(token);

  if (!session?.userId) {
    redirect('/login');
  }

  return <OnboardingForm userId={session.userId as string} />;
}
