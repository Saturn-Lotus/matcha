import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProfileView } from './profile-view';

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

  return <ProfileView id={id} />;
}
