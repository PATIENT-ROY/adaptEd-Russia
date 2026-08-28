import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = (forwardedHost || request.headers.get('host') || '').split(':')[0];

  if (host === 'www.adaptedrussia.ru') {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = 'https:';
    canonicalUrl.host = 'adaptedrussia.ru';
    canonicalUrl.port = '';
    return NextResponse.redirect(canonicalUrl, 308);
  }

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
  // Исключаем _next/static — статика должна обходиться без middleware (фикс 404/502 на Netlify)
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};
