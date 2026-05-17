// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lấy token từ cookie
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  
  // Cho phép truy cập trang login và register
  if (pathname.startsWith('/account/login') || pathname.startsWith('/account/register')) {
    return NextResponse.next();
  }
  
  // Cho phép truy cập file tĩnh
  if (pathname.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2)$/)) {
    return NextResponse.next();
  }
  
  // Nếu không có token -> redirect về login
  if (!token) {
    const loginUrl = new URL('/account/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Nếu là admin (Role=0)
  if (userRole === '0') {
    // Nếu đang ở trang client (không phải admin) -> về admin
    if (!pathname.startsWith('/admin')) {
      const adminUrl = new URL('/admin', request.url);
      return NextResponse.redirect(adminUrl);
    }
    return NextResponse.next();
  }
  
  // Nếu là client (Role!=0)
  if (userRole !== '0') {
    // Nếu đang ở trang admin -> về home
    if (pathname.startsWith('/admin')) {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|Images|Content|Scripts).*)',
  ],
};