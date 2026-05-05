'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '@/app/components/chat/chat-store';
import { apiClient } from '@/lib/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Send, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ChatThreadPage() {
  const { id } = useParams();
  const conversationId = id as string;
  const router = useRouter();
  const { messages, setMessages, addMessage, markAsRead, conversations } = useChatStore();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const threadMessages = messages[conversationId] || [];

  useEffect(() => {
    const initChat = async () => {
      try {
        // Get current user ID (hacky way for now, usually you'd have an auth store)
        // We can get it from the headers if we make a dummy request or have a /me endpoint
        // Let's assume we can get it from a simple API call
        const me = await apiClient.get<{id: string}>('/auth/me').catch(() => null);
        if (me) setCurrentUserId(me.id);

        const msgs = await apiClient.get<any[]>(`/conversations/${conversationId}/messages`);
        setMessages(conversationId, msgs);

        await apiClient.post(`/conversations/${conversationId}/read`);
        markAsRead(conversationId);
      } catch (error) {
        console.error('Failed to initialize chat', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [conversationId, setMessages, markAsRead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const msg = await apiClient.post<any>(`/conversations/${conversationId}/messages`, {
        body: newMessage,
      });
      // The message will be added via WebSocket event, but we can optimistically add it too
      // or just wait for the WS event. 
      // SocketProvider already adds it to the store.
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading messages...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8vh-64px)] max-w-2xl mx-auto border-x bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-4 bg-pink-50">
        <Link href="/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          {conversation?.avatarUrl ? (
            <Image
              src={conversation.avatarUrl}
              alt={conversation.firstName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-400">
              <User className="w-6 h-6" />
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900">
              {conversation ? `${conversation.firstName} ${conversation.lastName}` : 'Chat'}
            </h2>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse"
      >
        {threadMessages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  isOwn
                    ? 'bg-pink-500 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <span className={`text-[10px] block mt-1 ${isOwn ? 'text-pink-100' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2 bg-white">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          maxLength={2000}
        />
        <Button type="submit" size="icon" className="strawberry-matcha-btn text-white">
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
