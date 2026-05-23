import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { BrowseContent } from './browse-content';
import { getUserRepository } from '@/server/factories';

export default async function BrowsePage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const profile = await getUserRepository().findProfileByUserId(userId);
  const viewerHasAvatar = (profile?.pictures?.length ?? 0) > 0;

  return <BrowseContent userId={userId} viewerHasAvatar={viewerHasAvatar} />;
}
