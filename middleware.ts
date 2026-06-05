// ============================================
// MIDDLEWARE - Security & Rate Limiting
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware, addRateLimitHeaders } from '@/middleware/rate-limit';

/**
 * Security Headers Configuration
 * These headers protect against XSS, CSRF, and other attacks
 */
const securityHeaders = {
  // Content Security Policy
  // Prevents XSS attacks by controlling which resources can be loaded
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://chatscope.chatglm.cn",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.vercel.app",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),

  // Strict Transport Security (HSTS)
  // Forces HTTPS connections for 1 year (31536000 seconds)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // X-Frame-Options
  // Prevents clickjacking attacks
  'X-Frame-Options': 'DENY',

  // X-XSS-Protection
  // Enables XSS filtering in older browsers
  'X-XSS-Protection': '1; mode=block',

  // Referrer-Policy
  // Controls how much referrer information is sent
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions-Policy (formerly Feature-Policy)
  // Controls which browser features can be used
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),

  // X-DNS-Prefetch-Control
  // Disables DNS prefetching (reduces side-channel attacks)
  'X-DNS-Prefetch-Control': 'off',

  // Cross-Origin-Opener-Policy
  // Controls cross-origin opening behavior
  'Cross-Origin-Opener-Policy': 'same-origin',

  // Cross-Origin-Embedder-Policy
  // Controls cross-origin embedding
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

/**
 * Trusted Origins for CORS
 * Add your production domain here
 */
const trustedOrigins = [
  process.env.APP_URL || 'http://localhost:3000',
  'https://yourdomain.com',
  'https://staging.yourdomain.com',
];

/**
 * Check if origin is trusted
 */
function isTrustedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return trustedOrigins.some((trusted) => origin === trusted);
}

/**
 * Main Middleware Function
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Apply Security Headers
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });

  // 2. CORS Configuration
  const origin = request.headers.get('origin');
  if (origin && isTrustedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS',
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With',
    );
  }

  // 3. Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  // 4. Rate Limiting for API routes
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = rateLimitMiddleware(request);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    addRateLimitHeaders(response, request);
  }

  // 5. Add custom headers
  response.headers.set('X-Powered-By', 'NotaryOS');
  response.headers.set('X-Request-ID', crypto.randomUUID());

  // 6. Log suspicious activity (in production, use proper logging service)
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /\.\./,
  ];

  const isSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(request.url) || pattern.test(userAgent),
  );

  if (isSuspicious) {
    console.warn('[SECURITY] Suspicious request detected:', {
      ip: request.ip,
      url: request.url,
      userAgent,
    });
  }

  return response;
}

/**
 * Middleware Configuration
 */
export const config = {
  // Apply middleware to all routes except static files and API routes
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\..*).*)',
  ],
};