import './globals.css';
import { Toaster } from '@/app/components/ui/sonner';
import { NavigationBar } from '@/app/components/layout/navigation-bar';
import { Footer } from '@/app/components/layout/footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className="w-screen h-screen flex flex-col items-center container mx-auto strawberry-matcha-bg">
        <NavigationBar />
        <main className="flex-1 w-screen">
          <Toaster />
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
