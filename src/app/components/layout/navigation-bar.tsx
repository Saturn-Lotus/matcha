'use client';
import { Heart, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api';

const NO_HEADER_ROUTES = ['/login', '/register', '/reset-password', '/onboarding'];

interface NavigationBarProps {
  isAuthenticated: boolean;
  avatarSrc?: string | null;
  avatarSeed?: string;
}

function AvatarImage({ src, seed }: { src?: string | null; seed?: string }) {
  const [errored, setErrored] = useState(false);
  const fallback = seed
    ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`
    : null;
  const imgSrc = !errored && src ? src : fallback;

  if (!imgSrc) {
    return (
      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
        <User className="w-4 h-4 text-pink-400" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt="avatar"
      width={32}
      height={32}
      unoptimized
      onError={() => setErrored(true)}
      className="w-8 h-8 rounded-full object-cover border-2 border-pink-200"
    />
  );
}

export const NavigationBar = ({ isAuthenticated, avatarSrc, avatarSeed }: NavigationBarProps) => {
  const pathName = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await apiClient.get('/auth/logout');
    router.push('/');
    router.refresh();
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

      <div className="flex items-center">
        {isAuthenticated ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full p-0.5 ring-2 ring-transparent hover:ring-pink-200 transition-all cursor-pointer focus:outline-none"
                aria-label="Open user menu"
              >
                <AvatarImage src={avatarSrc} seed={avatarSeed} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-pink-600">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="flex items-center gap-2 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="md:space-x-2 space-x-1 flex items-center">
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
          </div>
        )}
      </div>
    </header>
  );
};
