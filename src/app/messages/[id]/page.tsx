import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ThreadContent } from './thread-content';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  if (!userId) redirect('/login');
  const { id } = await params;
  return <ThreadContent userId={userId} conversationId={id} />;
}
