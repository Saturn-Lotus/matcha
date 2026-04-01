'use client';
import {
  Heart,
  LogOut,
  MessageSquare,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PUBLIC_HEADER_ROUTES = ['/', '/login', '/register', '/reset-password'];

const APP_NAV_ITEMS = [
  { href: '/browse', label: 'Browse', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/setting', label: 'Settings', icon: Settings },
];

const NavLink = ({
  item,
  pathName,
  variant = 'desktop',
}: {
  item: (typeof APP_NAV_ITEMS)[number];
  pathName: string;
  variant?: 'desktop' | 'mobile';
}) => {
  const isActive = pathName.startsWith(item.href);
  const Icon = item.icon;

  if (variant === 'mobile') {
    return (
      <Link
        href={item.href}
        className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
          isActive ? 'text-pink-500' : 'text-gray-500'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-full px-6 py-2.5 text-base font-medium transition-colors ${
        isActive
          ? 'strawberry-matcha-btn text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  );
};

export const NavigationBar = () => {
  const pathName = usePathname();
  const isPublicRoute = PUBLIC_HEADER_ROUTES.includes(pathName);

  return (
    <>
      <header className="flex md:h-[8vh] justify-between w-screen items-center px-4 md:px-8 border-b bg-white">
        <div className="flex items-center space-x-2 py-4 shrink-0">
          <Heart className="md:h-8 md:w-8 w-6 h-6 text-pink-400 fill-current" />
          <h1 className="md:text-2xl text-md font-bold strawberry-matcha-gradient">
            Strawberry Matcha
          </h1>
        </div>

        {isPublicRoute ? (
          <div className="md:space-x-4 space-x-2">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-green-600 w-[50px] text-xs md:text-lg"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="strawberry-matcha-btn hover:opacity-90 text-white md:px-6 px-4 w-[60px] md:w-[100px] text-xs md:text-lg">
                Sign Up
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <nav className="hidden md:flex items-center gap-4">
              {APP_NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} pathName={pathName} />
              ))}
            </nav>
            <a
              href="/api/auth/logout"
              className="hidden md:flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </a>
          </>
        )}
      </header>

      {!isPublicRoute && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
          {APP_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathName={pathName}
              variant="mobile"
            />
          ))}
          <a
            href="/api/auth/logout"
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:text-red-500"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </a>
        </nav>
      )}
    </>
  );
};
