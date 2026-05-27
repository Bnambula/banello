// ============================================================
// BANELLO — JWT Authentication Library
// Uses jose (lightweight, Edge-compatible JWT library)
// No NextAuth dependency — custom implementation for full control
// ============================================================

import { SignJWT, jwtVerify, JWTPayload } from 'jose'

// These MUST be set as Vercel environment variables
// Never hardcode secrets — this value is only a fallback for local dev
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'banello-dev-secret-change-in-production-minimum-32-chars'
)
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'banello-refresh-secret-change-in-production-min-32'
)

const ACCESS_TOKEN_EXPIRY  = '15m'  // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '30d'  // Long-lived refresh token

export interface TokenPayload extends JWTPayload {
  userId:    string
  email:     string
  role:      'admin' | 'manager' | 'rider' | 'customer'
  isAdmin:   boolean
}

// ─── GENERATE TOKENS ──────────────────────────────────────────
export async function generateAccessToken(payload: Omit<TokenPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('banello.ug')
    .setAudience('banello-platform')
    .sign(JWT_SECRET)
}

export async function generateRefreshToken(payload: Omit<TokenPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('banello.ug')
    .setAudience('banello-refresh')
    .sign(JWT_REFRESH_SECRET)
}

// ─── VERIFY TOKENS ────────────────────────────────────────────
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer:   'banello.ug',
      audience: 'banello-platform',
    })
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET, {
      issuer:   'banello.ug',
      audience: 'banello-refresh',
    })
    return payload as TokenPayload
  } catch {
    return null
  }
}

// ─── COOKIE HELPERS ───────────────────────────────────────────
export const COOKIE_ACCESS  = 'banello_access'
export const COOKIE_REFRESH = 'banello_refresh'

export function buildAccessCookie(token: string): string {
  const maxAge = 15 * 60 // 15 minutes
  return [
    `${COOKIE_ACCESS}=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ')
}

export function buildRefreshCookie(token: string): string {
  const maxAge = 30 * 24 * 60 * 60 // 30 days
  return [
    `${COOKIE_REFRESH}=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/api/auth',          // Refresh cookie only sent to auth routes
    'HttpOnly',
    'SameSite=Strict',
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ')
}

export function buildClearCookies(): string[] {
  return [
    `${COOKIE_ACCESS}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`,
    `${COOKIE_REFRESH}=; Max-Age=0; Path=/api/auth; HttpOnly; SameSite=Strict`,
  ]
}

// ─── REQUEST HELPERS ──────────────────────────────────────────
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${COOKIE_ACCESS}=([^;]+)`))
  return match ? match[1] : null
}

export function getRefreshFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`${COOKIE_REFRESH}=([^;]+)`))
  return match ? match[1] : null
}

// ─── ADMIN PATH GUARD ─────────────────────────────────────────
export const ADMIN_PATH_SLUG = process.env.ADMIN_PATH_SLUG || 'ops-centre-bg2026'
export const ADMIN_BASE_PATH = `/${ADMIN_PATH_SLUG}`

// Allowed IPs for admin access — add your team's IPs in Vercel env vars
// Format: comma-separated list e.g. "197.136.1.1,41.210.0.1"
export function getAdminAllowedIps(): string[] {
  const raw = process.env.ADMIN_ALLOWED_IPS || ''
  return raw.split(',').map(ip => ip.trim()).filter(Boolean)
}
