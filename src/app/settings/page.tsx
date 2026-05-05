import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getUserService,
  getUserRepository,
  getStorage,
} from '@/server/factories';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const userRepository = getUserRepository();
  const [userService, storage] = await Promise.all([
    getUserService(userRepository),
    getStorage(),
  ]);

  const [user, profile] = await Promise.all([
    userService.getUserById(userId).catch(() => null),
    userService.getProfileByUserId(userId).catch(() => null),
  ]);

  if (!user) redirect('/login');
  if (!profile) redirect('/onboarding');

  const pictureKeys = profile.pictures ?? [];
  const resolvedUrls = await Promise.all(
    pictureKeys.map((key) => storage.getFileUrl(key)),
  );
  const presignedUrls: Record<string, string> = Object.fromEntries(
    pictureKeys.map((key, i) => [key, resolvedUrls[i]]),
  );

  return (
    <div className="min-h-screen bg-settings-bg">
      <SettingsForm
        userId={userId}
        currentEmail={user.email}
        profile={profile}
        presignedUrls={presignedUrls}
      />
    </div>
  );
}
