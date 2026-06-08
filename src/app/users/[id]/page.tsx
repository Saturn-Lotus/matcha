import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProfileView } from './profile-view';
import { getUserRepository } from '@/server/factories';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const viewerId = headersList.get('x-user-id');

  if (viewerId === id) {
    redirect('/settings');
  }

  let viewerHasAvatar = false;
  if (viewerId) {
    const profile = await getUserRepository().findProfileByUserId(viewerId);
    viewerHasAvatar = (profile?.pictures?.length ?? 0) > 0;
  }

  return (
    <ProfileView
      id={id}
      viewerId={viewerId ?? ''}
      viewerHasAvatar={viewerHasAvatar}
    />
  );
}
