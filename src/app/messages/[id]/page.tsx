import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Messenger } from '../messenger';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');
  const { id } = await params;
  return <Messenger userId={userId} initialConversationId={id} />;
}
