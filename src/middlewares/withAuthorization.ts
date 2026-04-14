import { NextRequest, NextResponse } from 'next/server';
import { MiddlewareFactory } from './core';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth/session';

const publicRoutes = [
  '/login',
  '/register',
  '/signup',
  '/reset-password',
  '/',
  '/api/auth/register',
  '/api/auth/signin',
  '/api/auth/register',
  '/api/auth/reset-password',
];

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';

export const withAuthorization: MiddlewareFactory = (next) => {
  return async (request, event) => {
    if (DISABLE_AUTH) {
      return next(request, event);
    }

    const path = request.nextUrl.pathname;
    const isPublicRoute = publicRoutes.includes(path);

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = await decrypt(sessionCookie);

    if (!isPublicRoute && !session?.userId) {
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    if (session?.userId) {
      const headers = new Headers(request.headers);
      headers.set('x-user-id', session.userId as string);
      return next(new NextRequest(request, { headers }), event);
    }

    return next(request, event);
  };
};
