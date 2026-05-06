'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/app/components/chat/chat-store';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { User } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ConversationsPage() {
  const router = useRouter();
  const { conversations, setConversations } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [peerUsername, setPeerUsername] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const list = await apiClient.get<unknown[]>('/conversations');
        setConversations(list);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [setConversations]);

  const handleStartConversation = async () => {
    const name = peerUsername.trim();
    if (!name) return;
    setStarting(true);
    try {
      const conv = await apiClient.post<{ id: string }>('/conversations', {
        username: name,
      });
      const list = await apiClient.get<unknown[]>('/conversations');
      setConversations(list);
      setPeerUsername('');
      router.push(`/messages/${conv.id}`);
      toast.success('Conversation opened');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start conversation');
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading conversations...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 strawberry-matcha-gradient">Messages</h1>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-6">
        <Input
          placeholder="Peer username (e.g. beta)"
          value={peerUsername}
          onChange={(e) => setPeerUsername(e.target.value)}
          className="sm:max-w-xs"
          autoComplete="off"
        />
        <Button
          type="button"
          className="strawberry-matcha-btn text-white shrink-0"
          disabled={starting || !peerUsername.trim()}
          onClick={() => void handleStartConversation()}
        >
          Start conversation
        </Button>
      </div>
      <div className="space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No conversations yet. Start matching!
          </div>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.id} href={`/messages/${conv.id}`}>
              <Card className="p-4 hover:bg-pink-50 transition-colors cursor-pointer flex items-center gap-4">
                <div className="relative w-12 h-12 flex-shrink-0">
                  {conv.avatarUrl ? (
                    <Image
                      src={conv.avatarUrl}
                      alt={conv.firstName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-pink-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-pink-400" />
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h2 className="font-semibold text-gray-900 truncate">
                      {conv.firstName} {conv.lastName}
                    </h2>
                    {conv.lastMessageCreatedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(conv.lastMessageCreatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessageBody || 'Start the conversation!'}
                  </p>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
