import { Heart } from 'lucide-react';
import './globals.css';
import { Button } from '@/components/ui/button';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const is_authenticated = false;
  return (
    <html lang="en">
      <head />
      <body className="w-screen h-screen flex flex-col items-center container mx-auto strawberry-matcha-bg">
        <header className="flex h-[8vh] justify-between w-screen items-center border-b border-gray-300 px-20">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-pink-400 fill-current" />
            <h1 className="text-2xl font-bold strawberry-matcha-gradient">
              Strawberry Matcha
            </h1>
          </div>
          <div className="space-x-4">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-green-600"
            >
              Login
            </Button>
            <Button className="strawberry-matcha-btn hover:opacity-90 text-white px-6">
              Sign Up
            </Button>
          </div>
        </header>
        <main className="flex-1 w-screen overflow-hidden">{children}</main>
        <footer className="text-center text-gray-500 py-4 h-[6vh]">
          <p>
            &copy; 2025 Strawberry Matcha. Made with 🍓 and 🍵 for finding love.
          </p>
        </footer>
      </body>
    </html>
  );
}
