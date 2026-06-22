import './globals.css';
import { Toaster } from '@/app/components/ui/sonner';
import { NavigationBar } from '@/app/components/layout/navigation-bar';
import { Footer } from '@/app/components/layout/footer';
import { HeartbeatProvider } from '@/app/components/heartbeat-provider';
import { ChatSocketProvider } from '@/app/components/chat-socket-provider';
import { headers } from 'next/headers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const isAuthenticated = !!userId;

  const avatarSrc = userId ? `/api/users/${userId}/avatar` : null;

  return (
    <html lang="en">
      <head />
      <body className="w-screen min-h-screen flex flex-col items-center container mx-auto strawberry-matcha-bg">
        <NavigationBar
          isAuthenticated={isAuthenticated}
          avatarSrc={avatarSrc}
          avatarSeed={userId ?? undefined}
        />
        <main className="flex-1 w-screen flex flex-col">
          <Toaster />
          {isAuthenticated && <HeartbeatProvider />}
          {isAuthenticated && userId && <ChatSocketProvider userId={userId} />}
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
