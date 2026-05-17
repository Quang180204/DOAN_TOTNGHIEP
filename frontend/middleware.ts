import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/contact',
  '/search',
  '/products',
  '/account/login',
  '/account/register',
  '/account/forgot-password',
  '/account/reset-password',
];

const CLIENT_PROTECTED_PREFIXES = [
  '/account/profile',
  '/account/address',
  '/account/change-password',
  '/cart',
  '/checkout',
  '/orders',
  '/wishlist',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isClientProtectedPath(pathname: string) {
  return CLIENT_PROTECTED_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/Content') ||
    pathname.startsWith('/Scripts') ||
    pathname.startsWith('/uploads') ||
    pathname === '/favicon.ico' ||
    /\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|webp|map|txt)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/account/login', request.url));
    }

    if (userRole !== '0') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isClientProtectedPath(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL('/account/login', request.url));
    }

    if (userRole === '0') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api).*)'],
};
