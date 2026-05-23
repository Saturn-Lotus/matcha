'use client';
import {
  Heart,
  LogOut,
  Settings,
  User,
  Compass,
  Flame,
} from 'lucide-react';
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
import { UserSearch } from '@/app/components/user-search';
import { useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

const NO_HEADER_ROUTES = [
  '/login',
  '/register',
  '/reset-password',
  '/onboarding',
  '/pending-verification',
];

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
      <div className="w-full h-full rounded-full bg-pink-100 flex items-center justify-center">
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
      className="w-full h-full rounded-full object-cover"
    />
  );
}

const NavLink = ({
  href,
  children,
  active,
  badge,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  badge?: number;
}) => (
  <Link
    href={href}
    className={cn(
      'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
      active
        ? 'text-gray-900 bg-gray-100'
        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
    )}
  >
    {children}
    {badge !== undefined && badge > 0 && (
      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full text-white strawberry-matcha-btn leading-none">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </Link>
);

export const NavigationBar = ({
  isAuthenticated,
  avatarSrc,
  avatarSeed,
}: NavigationBarProps) => {
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
    <div className="sticky top-0 z-50 w-full px-4 pt-3 pb-1.5">
      <header className="max-w-5xl mx-auto rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] flex items-center justify-between px-3 h-14 gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0 pl-1 group">
          <Heart className="h-5 w-5 text-pink-400 fill-current transition-transform duration-200 group-hover:scale-110" />
          <span className="text-[15px] font-bold strawberry-matcha-gradient tracking-tight hidden sm:block">
            Strawberry Matcha
          </span>
        </Link>

        {isAuthenticated ? (
          <>
            <nav className="flex items-center gap-0.5">
              <NavLink href="/browse" active={pathName === '/browse'}>
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Browse</span>
              </NavLink>
              <NavLink href="/settings" active={pathName === '/settings'}>
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Settings</span>
              </NavLink>
            </nav>

            <div className="flex items-center gap-1.5">
              <UserSearch />

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Open user menu"
                    className="relative w-8 h-8 rounded-full ring-2 ring-gray-200 hover:ring-pink-300 transition-all duration-200 focus:outline-none"
                  >
                    <AvatarImage src={avatarSrc} seed={avatarSeed} />
                    <span className="absolute -bottom-px -right-px w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-44 rounded-xl border border-gray-200/80 shadow-lg shadow-black/5 bg-white p-1"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 cursor-pointer text-gray-700 rounded-lg px-2.5 py-2 text-sm"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    variant="destructive"
                    className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 text-sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                className="strawberry-matcha-btn text-white text-xs font-semibold h-8 px-3.5 rounded-lg hover:opacity-90 shadow-sm hidden sm:flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                Discover
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 pr-1">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium rounded-lg transition-all duration-150"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="h-8 px-4 text-sm font-semibold text-white strawberry-matcha-btn hover:opacity-90 rounded-lg shadow-sm transition-all duration-150"
              >
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </header>
    </div>
  );
};
