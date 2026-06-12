import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { MessagesContent } from './messages-content';

export default async function MessagesPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');
  return <MessagesContent userId={userId} />;
}
