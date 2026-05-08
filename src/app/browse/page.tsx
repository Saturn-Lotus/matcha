import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { BrowseContent } from './browse-content';

export default async function BrowsePage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');

  return <BrowseContent userId={userId} />;
}
