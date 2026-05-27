// ============================================================
// BANELLO — POST /api/auth/login
// Rate limited: 5 attempts per 15 minutes per IP
// Progressive lockout: increases delay with each failed attempt
// Audit log: records every login attempt with timestamp + IP
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { limiters, getClientIp, setRateLimitHeaders } from '../../../lib/rateLimit'
import { generateAccessToken, generateRefreshToken, buildAccessCookie, buildRefreshCookie } from '../../../lib/auth'
import { verifyPassword } from '../../../lib/password'

// ─── DEMO USERS (replace with database query in production) ───
// In production: const user = await db.users.findUnique({ where: { email } })
const DEMO_USERS = [
  {
    id: 'admin-001',
    email: 'admin@banello.ug',
    // bcrypt hash of "Banello@2026!" — generated with cost 12
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkzL3LOhGXiXu8aXKH/8W.',
    role: 'admin' as const,
    name: 'Banello Admin',
    isActive: true,
  },
  {
    id: 'rider-001',
    email: 'rider@banello.ug',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCkzL3LOhGXiXu8aXKH/8W.',
    role: 'rider' as const,
    name: 'Test Rider',
    isActive: true,
  },
]

// Track failed attempts per IP for progressive delay (in-memory, lost on restart)
// In production: store in Redis with TTL
const failedAttempts = new Map<string, { count: number; lastAt: number }>()

function getProgressiveDelay(ip: string): number {
  const attempts = failedAttempts.get(ip)
  if (!attempts) return 0
  // Exponential backoff: 0, 1, 2, 4, 8 seconds
  return Math.min(Math.pow(2, attempts.count - 1) * 1000, 8000)
}

function recordFailedAttempt(ip: string) {
  const existing = failedAttempts.get(ip)
  failedAttempts.set(ip, {
    count: (existing?.count || 0) + 1,
    lastAt: Date.now(),
  })
}

function clearFailedAttempts(ip: string) {
  failedAttempts.delete(ip)
}

// Simple audit log (in production: write to database audit_logs table)
function auditLog(event: {
  type: 'login_success' | 'login_failed' | 'login_blocked'
  ip: string
  email: string
  timestamp: string
  details?: string
}) {
  // In production: INSERT INTO audit_logs (event_type, ip, user_email, details, created_at)
  console.log('[AUDIT]', JSON.stringify(event))
}

export default async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ─── Method guard ────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>)

  // ─── Rate limit check ────────────────────────────────────
  const rateResult = limiters.login(ip)
  const responseHeaders: Record<string, string> = {}
  setRateLimitHeaders(responseHeaders, rateResult, 5)

  if (!rateResult.allowed) {
    auditLog({ type: 'login_blocked', ip, email: req.body?.email || 'unknown', timestamp: new Date().toISOString(), details: `Rate limited. Retry after ${rateResult.retryAfter}s` })
    return res
      .status(429)
      .setHeader('Content-Type', 'application/json')
      .setHeader('Retry-After', String(rateResult.retryAfter))
      .setHeader('X-RateLimit-Limit', '5')
      .setHeader('X-RateLimit-Remaining', '0')
      .setHeader('X-RateLimit-Reset', String(Math.ceil(rateResult.resetAt / 1000)))
      .json({
        error: 'Too many login attempts',
        message: `You have made too many login attempts from this device. Please wait ${rateResult.retryAfter} seconds before trying again.`,
        retryAfter: rateResult.retryAfter,
        remainingAttempts: 0,
      })
  }

  // ─── Progressive delay for repeated failures ──────────────
  const delay = getProgressiveDelay(ip)
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  // ─── Input validation ─────────────────────────────────────
  const { email, password } = req.body || {}

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid request', message: 'Valid email address is required' })
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Invalid request', message: 'Password is required' })
  }

  // Sanitise email
  const normalizedEmail = email.toLowerCase().trim()

  // ─── User lookup ─────────────────────────────────────────
  // In production: const user = await prisma.users.findUnique({ where: { email: normalizedEmail } })
  const user = DEMO_USERS.find(u => u.email === normalizedEmail)

  // ─── Constant-time comparison to prevent user enumeration ─
  // Always run bcrypt compare even if user not found (prevents timing attacks)
  const passwordToCheck = password
  const hashToCompare = user?.passwordHash || '$2a$12$invalid.hash.that.will.never.match.anything'
  const passwordValid = await verifyPassword(passwordToCheck, hashToCompare)

  if (!user || !passwordValid || !user.isActive) {
    recordFailedAttempt(ip)

    // Generic error — never reveal whether email exists or password was wrong
    auditLog({ type: 'login_failed', ip, email: normalizedEmail, timestamp: new Date().toISOString(), details: !user ? 'user not found' : !passwordValid ? 'wrong password' : 'account inactive' })

    const attempts = failedAttempts.get(ip)
    const remaining = Math.max(0, rateResult.remaining)

    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect. Please try again.',
      remainingAttempts: remaining,
      ...(remaining <= 2 ? { warning: `${remaining} attempts remaining before temporary lockout` } : {}),
    })
  }

  // ─── Success — generate tokens ────────────────────────────
  clearFailedAttempts(ip)

  const tokenPayload = {
    userId:  user.id,
    email:   user.email,
    role:    user.role,
    isAdmin: (user.role as string) === 'admin' || (user.role as string) === 'manager',  }

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(tokenPayload),
    generateRefreshToken(tokenPayload),
  ])

  auditLog({ type: 'login_success', ip, email: normalizedEmail, timestamp: new Date().toISOString() })

  // Set HTTP-only cookies (more secure than localStorage)
  res.setHeader('Set-Cookie', [
    buildAccessCookie(accessToken),
    buildRefreshCookie(refreshToken),
  ])

  // Set rate limit headers on success too
  Object.entries(responseHeaders).forEach(([k, v]) => res.setHeader(k, v))

  return res.status(200).json({
    success: true,
    user: {
      id:    user.id,
      email: user.email,
      name:  user.name,
      role:  user.role,
    },
    // Access token also returned in body for SPA use
    // (the HttpOnly cookie is the primary auth mechanism)
    accessToken,
  })
}
