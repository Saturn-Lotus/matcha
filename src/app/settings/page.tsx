import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserService, getUserRepository, getStorage } from '@/server/factories';
import { SettingsForm } from './settings-form';
import { Heart } from 'lucide-react';

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
  const resolvedUrls = await Promise.all(pictureKeys.map((key) => storage.getFileUrl(key)));
  const presignedUrls: Record<string, string> = Object.fromEntries(
    pictureKeys.map((key, i) => [key, resolvedUrls[i]]),
  );

  return (
    <div className="min-h-screen strawberry-matcha-bg py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold strawberry-matcha-gradient flex items-center justify-center gap-2">
            <Heart className="w-7 h-7 fill-current text-pink-400" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your profile and account information</p>
        </div>

        <SettingsForm
          userId={userId}
          currentEmail={user.email}
          profile={profile}
          presignedUrls={presignedUrls}
        />
      </div>
    </div>
  );
}
