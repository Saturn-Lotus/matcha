import { NextResponse } from 'next/server';
import { MiddlewareFactory } from './core';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth/session';

const UNVERIFIED_ALLOWED_ROUTES = [
  '/pending-verification',
  '/api/auth/verify',
  '/api/auth/resend-verification',
  '/api/auth/logout',
];

const INCOMPLETE_PROFILE_ALLOWED_ROUTES = [
  '/onboarding',
  '/api/auth/logout',
  '/api/users/profiles/',
];

const isAllowed = (path: string, routes: string[]) =>
  routes.some(
    (r) =>
      path === r ||
      path.startsWith(r + '/') ||
      (r.endsWith('/') && path.startsWith(r)),
  );

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';

export const withProfileComplete: MiddlewareFactory = (next) => {
  return async (request, event) => {
    if (DISABLE_AUTH) return next(request, event);

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = await decrypt(sessionCookie);

    if (!session?.userId) return next(request, event);

    const path = request.nextUrl.pathname;
    const isVerified = Boolean(session.isVerified);
    const isProfileComplete = Boolean(session.isProfileComplete);

    if (!isVerified) {
      if (!isAllowed(path, UNVERIFIED_ALLOWED_ROUTES)) {
        return NextResponse.redirect(
          new URL('/pending-verification', request.nextUrl),
        );
      }
    } else if (!isProfileComplete) {
      if (!isAllowed(path, INCOMPLETE_PROFILE_ALLOWED_ROUTES)) {
        return NextResponse.redirect(new URL('/onboarding', request.nextUrl));
      }
    }

    return next(request, event);
  };
};
