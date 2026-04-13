'use client';
import { Heart, LogOut, User } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
const NO_HEADER_ROUTES = ['/login', '/register', '/reset-password', '/onboarding'];

interface NavigationBarProps {
  isAuthenticated: boolean;
  avatarSrc?: string | null;
  avatarSeed?: string;
}

function Avatar({ src, seed }: { src?: string | null; seed?: string }) {
  const [errored, setErrored] = useState(false);
  const fallback = seed
    ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`
    : null;
  const imgSrc = !errored && src ? src : fallback;

  if (!imgSrc) {
    return <User className="w-4 h-4" />;
  }

  return (
    <Image
      src={imgSrc}
      alt="avatar"
      width={28}
      height={28}
      onError={() => setErrored(true)}
      className="w-7 h-7 rounded-full object-cover border border-gray-200"
    />
  );
}

export const NavigationBar = ({ isAuthenticated, avatarSrc, avatarSeed }: NavigationBarProps) => {
  const pathName = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    window.location.href = '/';
  };

  if (NO_HEADER_ROUTES.includes(pathName)) {
    return null;
  }

  return (
    <header className="flex md:h-[8vh] justify-between w-screen items-center px-4 md:px-20">
      <Link href="/" className="flex items-center space-x-2 py-4">
        <Heart className="md:h-8 md:w-8 w-6 h-6 text-pink-400 fill-current" />
        <h1 className="md:text-2xl text-md font-bold strawberry-matcha-gradient">
          Strawberry Matcha
        </h1>
      </Link>

      <div className="md:space-x-2 space-x-1 flex items-center">
        {isAuthenticated ? (
          <>
            <Link href="/profile">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-green-600 text-xs md:text-base flex items-center gap-2"
              >
                <Avatar src={avatarSrc} seed={avatarSeed} />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-500 text-xs md:text-base flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-green-600 text-xs md:text-lg"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="strawberry-matcha-btn hover:opacity-90 text-white md:px-6 px-4 text-xs md:text-lg">
                Sign Up
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
