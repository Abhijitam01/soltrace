import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60_000;

// Requests per minute per IP per route
const LIMITS: Record<string, number> = {
  '/api/decode': 30,
  '/api/explain': 10,
  '/api/simulate': 60,
};

const counters = new Map<string, { count: number; windowStart: number }>();

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const limit = LIMITS[pathname];
  if (limit === undefined) return NextResponse.next();

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = counters.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    counters.set(key, { count: 1, windowStart: now });
    return NextResponse.next();
  }

  if (entry.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests — slow down', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000)),
        },
      }
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/decode', '/api/explain', '/api/simulate'],
};
