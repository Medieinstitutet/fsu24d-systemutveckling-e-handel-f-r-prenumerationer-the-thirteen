import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const secret = process.env.NEXTAUTH_SECRET

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret })

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (token && token.role !== "admin") {
      return NextResponse.redirect(new URL('/', request.url))
    }
  };

  if (token && request.nextUrl.pathname === '/login' || token && request.nextUrl.pathname === '/register') {
    return NextResponse.redirect(new URL('/', request.url));
  };

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/register'
  ],
}