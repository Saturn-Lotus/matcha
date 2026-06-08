import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { MatchesContent } from './matches-content';

export default async function MatchesPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  return <MatchesContent userId={userId} />;
}
