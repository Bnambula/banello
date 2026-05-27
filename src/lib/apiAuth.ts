// ============================================================
// BANELLO — Protected API Route Wrapper
// Wraps any API handler to require valid JWT + role check
// Usage: export default withApiAuth(handler, 'admin')
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyAccessToken, getTokenFromCookies, type TokenPayload } from './auth'
import { limiters, getClientIp, setRateLimitHeaders } from './rateLimit'

export interface AuthedRequest extends NextApiRequest {
  user: TokenPayload
}

type ApiHandler = (req: AuthedRequest, res: NextApiResponse) => Promise<void> | void

export function withApiAuth(
  handler: ApiHandler,
  requiredRole?: 'admin' | 'manager' | 'rider'
) {
  return async function(req: NextApiRequest, res: NextApiResponse) {
    const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>)

    // General API rate limit
    const rl = limiters.api(ip)
    const headers: Record<string, string> = {}
    setRateLimitHeaders(headers, rl, 100)
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))

    if (!rl.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: rl.retryAfter,
        message: `Rate limit exceeded. Retry in ${rl.retryAfter} seconds.`,
      })
    }

    // Verify JWT from cookie
    const token = getTokenFromCookies(req.headers.cookie || null)
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session. Please log in again.' })
    }

    // Role check
    if (requiredRole) {
      const roleHierarchy = { admin: 3, manager: 2, rider: 1, customer: 0 }
      const userLevel    = roleHierarchy[payload.role as keyof typeof roleHierarchy] || 0
      const requiredLevel = roleHierarchy[requiredRole] || 0
      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions for this action' })
      }
    }

    // Attach user to request and call handler
    const authedReq = req as AuthedRequest
    authedReq.user = payload
    return handler(authedReq, res)
  }
}

// Lightweight version — just rate limit, no auth (for public endpoints)
export function withRateLimit(handler: (req: NextApiRequest, res: NextApiResponse) => void, type: 'api' | 'orders' = 'api') {
  return async function(req: NextApiRequest, res: NextApiResponse) {
    const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>)
    const rl = type === 'orders' ? limiters.orders(ip) : limiters.api(ip)
    const limit = type === 'orders' ? 10 : 100
    const headers: Record<string, string> = {}
    setRateLimitHeaders(headers, rl, limit)
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Too many requests', retryAfter: rl.retryAfter })
    }
    return handler(req, res)
  }
}
