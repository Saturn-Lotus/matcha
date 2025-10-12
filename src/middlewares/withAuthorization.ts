import { NextResponse } from 'next/server';
import { MiddlewareFactory } from './core';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth/session';

const publicRoutes = [
  '/login',
  '/register',
  '/signup',
  '/',
  '/api/auth/register',
  '/api/auth/signin',
  '/api/auth/register',
  '/api/auth/reset-password',
];

const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';

export const withAuthorization: MiddlewareFactory = (next) => {
  return async (request, event) => {
    if (!ENABLE_AUTH) {
      return next(request, event);
    }

    const path = request.nextUrl.pathname;
    const isPublicRoute = publicRoutes.includes(path);
    if (!isPublicRoute) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get('session')?.value;
      const session = await decrypt(sessionCookie);
      if (!session?.userId) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
      }
    }
    return next(request, event);
  };
};
