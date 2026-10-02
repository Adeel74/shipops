// ShipOps — Simple in-memory rate limiter
// Tracks requests per IP address and enforces limits.
// In production, use Redis-based rate limiting for multi-instance deployments.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  max: number
  /** Time window in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request should be rate limited.
 * Call this at the start of API handlers.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const entry = rateLimitMap.get(key)

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    rateLimitMap.set(key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.max - 1, resetAt: now + options.windowMs }
  }

  if (entry.count >= options.max) {
    // Rate limited
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  // Increment count
  entry.count++
  return { allowed: true, remaining: options.max - entry.count, resetAt: entry.resetAt }
}

/**
 * Get client IP from a Next.js request.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP

  return 'unknown'
}

// Pre-configured rate limits for different endpoint types
export const RATE_LIMITS = {
  // Auth endpoints: 10 requests per minute per IP
  AUTH: { max: 10, windowMs: 60 * 1000 },
  // API read endpoints: 100 requests per minute per IP
  API_READ: { max: 100, windowMs: 60 * 1000 },
  // API write endpoints: 30 requests per minute per IP
  API_WRITE: { max: 30, windowMs: 60 * 1000 },
  // Webhook endpoints: 200 requests per minute per IP
  WEBHOOK: { max: 200, windowMs: 60 * 1000 },
  // Public tracking: 30 requests per minute per IP
  PUBLIC: { max: 30, windowMs: 60 * 1000 },
}
