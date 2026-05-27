import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { BrowseContent } from './browse-content';
import { getUserRepository } from '@/server/factories';
import type { StoredSearchPreferences } from '@/server/schemas';

const EMPTY_PREFS: StoredSearchPreferences = {
  prefMinAge: null,
  prefMaxAge: null,
  prefMinFame: null,
  prefMaxFame: null,
  prefMaxDistanceKm: null,
  prefTags: null,
};

export default async function BrowsePage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  const userRepository = getUserRepository();
  const [profile, searchPreferences] = await Promise.all([
    userRepository.findProfileByUserId(userId),
    userRepository.getSearchPreferences(userId),
  ]);
  const viewerHasAvatar = (profile?.pictures?.length ?? 0) > 0;

  return (
    <BrowseContent
      userId={userId}
      viewerHasAvatar={viewerHasAvatar}
      searchPreferences={searchPreferences ?? EMPTY_PREFS}
    />
  );
}
