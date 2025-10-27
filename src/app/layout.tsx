'use client';
import { Heart } from 'lucide-react';
import './globals.css';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Toaster } from '@/components/ui/sonner';
import { usePathname } from 'next/navigation';

const noHeaderRoutes = ['/login', '/register', '/reset-password'];
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathName = usePathname();
  const shouldDisplayHeader = !noHeaderRoutes.includes(pathName);

  return (
    <html lang="en">
      <head />
      <body className="w-screen h-screen flex flex-col items-center container mx-auto strawberry-matcha-bg">
        {shouldDisplayHeader && (
          <header className="flex md:h-[8vh] justify-between w-screen items-center border-b border-gray-300 px-4 md:px-20">
            <div className="flex items-center space-x-2 py-4">
              <Heart className="md:h-8 md:w-8 w-6 h-6 text-pink-400 fill-current" />
              <h1 className="md:text-2xl text-md font-bold strawberry-matcha-gradient">
                Strawberry Matcha
              </h1>
            </div>
            <div className="md:space-x-4 space-x-2">
              <Link href={'/login'}>
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-green-600 w-[50px] text-xs md:text-lg"
                >
                  Login
                </Button>
              </Link>
              <Link href={'/register'}>
                <Button className="strawberry-matcha-btn hover:opacity-90 text-white md:px-6 px-4 w-[60px] md:w-[100px] text-xs md:text-lg">
                  Sign Up
                </Button>
              </Link>
            </div>
          </header>
        )}
        <main className="flex-1 w-screen">
          <Toaster />
          {children}
        </main>
        <footer className="text-center w-full text-gray-500 md:py-1 py-1 h-[6vh] flex justify-center">
          <p className="md:text-lg text-xs word-break px-2">
            &copy; 2025 Strawberry Matcha. Made with 🍓 and 🍵 for finding love.
          </p>
        </footer>
      </body>
    </html>
  );
}
