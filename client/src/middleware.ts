import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Кэширование статических ресурсов
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Кэширование шрифтов
  if (request.nextUrl.pathname.match(/\.(woff|woff2|ttf|otf)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Кэширование изображений
  if (request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=604800, must-revalidate');
  }

  // Отключение X-Frame-Options для встраиваемых элементов
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/image|favicon.ico).*)'],
};
