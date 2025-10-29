'use client';
import { Heart } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NO_HEADER_ROUTES = ['/login', '/register', '/reset-password'];

export const NavigationBar = () => {
  const pathName = usePathname();
  const shouldDisplayHeader = !NO_HEADER_ROUTES.includes(pathName);
  if (!shouldDisplayHeader) {
    return null;
  }
  return (
    <header className="flex md:h-[8vh] justify-between w-screen items-center px-4 md:px-20">
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
  );
};
