import './globals.css';
import { Toaster } from '@/app/components/ui/sonner';
import { NavigationBar } from '@/app/components/layout/navigation-bar';
import { Footer } from '@/app/components/layout/footer';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth/session';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = await decrypt(cookieStore.get('session')?.value);
  const isAuthenticated = !!session?.userId;

  const avatarSrc =
    session?.userId && session?.avatarUrl
      ? `/api/users/${session.userId}/avatar`
      : null;

  return (
    <html lang="en">
      <head />
      <body className="w-screen h-screen flex flex-col items-center container mx-auto strawberry-matcha-bg">
        <NavigationBar
          isAuthenticated={isAuthenticated}
          avatarSrc={avatarSrc}
          avatarSeed={session?.userId as string | undefined}
        />
        <main className="flex-1 w-screen">
          <Toaster />
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
