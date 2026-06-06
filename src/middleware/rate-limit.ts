// ============================================
// RATE LIMITING MIDDLEWARE
// Protects against brute force attacks on login and API
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter for development
// For production, use Redis-based rate limiting (Upstash, Redis Cloud)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Rate limit configurations for different routes
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  '/api/auth': {
    maxRequests: 5,        // 5 attempts per 15 minutes
    windowMs: 15 * 60 * 1000,
  },
  '/api/documents': {
    maxRequests: 100,      // 100 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
  },
  '/api/clients': {
    maxRequests: 100,      // 100 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
  },
  '/default': {
    maxRequests: 200,      // 200 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
  },
};

/**
 * Get rate limit config for the given pathname
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  for (const [route, config] of Object.entries(rateLimitConfigs)) {
    if (pathname.startsWith(route)) {
      return config;
    }
  }
  return rateLimitConfigs['/default'];
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check and update rate limit for the given identifier
 */
function checkRateLimit(identifier: string, config: RateLimitConfig): {
  success: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitMap.delete(identifier);
  }

  // Get or create entry
  const currentEntry = rateLimitMap.get(identifier) || {
    count: 0,
    resetTime: now + config.windowMs,
  };

  // Check if rate limit exceeded
  if (currentEntry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: currentEntry.resetTime,
    };
  }

  // Increment count
  currentEntry.count++;
  rateLimitMap.set(identifier, currentEntry);

  return {
    success: true,
    remaining: config.maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime,
  };
}

/**
 * Get client identifier (IP address)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a session-based identifier
  return request.ip || 'unknown';
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const pathname = new URL(request.url).pathname;

  // Skip rate limiting for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/auth')
  ) {
    return null;
  }

  // Disable rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  // Get rate limit config
  const config = getRateLimitConfig(pathname);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries();
  }

  // Get client identifier
  const identifier = getClientIdentifier(request) + ':' + pathname;

  // Check rate limit
  const result = checkRateLimit(identifier, config);

  // Add rate limit headers to response
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };

  // If rate limit exceeded, return 429
  if (!result.success) {
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again after ${new Date(result.resetTime).toLocaleString()}`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      { status: 429 },
    );

    // Add headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add Retry-After header
    response.headers.set(
      'Retry-After',
      Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
    );

    return response;
  }

  // Store headers to add to the actual response
  (request as any).rateLimitHeaders = headers;

  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  const headers = (request as any).rateLimitHeaders;
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

// ============================================
// PRODUCTION RATE LIMITING (Redis-based)
// ============================================
/**
 * For production, use Redis-based rate limiting with Upstash or Redis Cloud
 *
 * Example with Upstash:
 *
 * import { Redis } from '@upstash/redis';
 *
 * const redis = new Redis({
 *   url: process.env.UPSTASH_REDIS_REST_URL!,
 *   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
 * });
 *
 * export async function redisRateLimit(
 *   identifier: string,
 *   config: RateLimitConfig,
 * ): Promise<{ success: boolean; remaining: number; resetTime: number }> {
 *   const key = `ratelimit:${identifier}`;
 *   const now = Date.now();
 *   const window = Math.floor(now / config.windowMs);
 *   const windowKey = `${key}:${window}`;
 *
 *   const count = await redis.incr(windowKey);
 *
 *   if (count === 1) {
 *     await redis.expire(windowKey, Math.ceil(config.windowMs / 1000));
 *   }
 *
 *   const remaining = Math.max(0, config.maxRequests - count);
 *
 *   return {
 *     success: count <= config.maxRequests,
 *     remaining,
 *     resetTime: (window + 1) * config.windowMs,
 *   };
 * }
 */