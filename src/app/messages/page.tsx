import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Messenger } from './messenger';

export default async function MessagesPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');
  return <Messenger userId={userId} initialConversationId={null} />;
}
