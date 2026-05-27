// ============================================================
// BANELLO — POST /api/auth/refresh
// Uses the refresh token cookie to issue a new access token
// Called automatically by the frontend when access token expires
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import {
  verifyRefreshToken, generateAccessToken,
  buildAccessCookie, getRefreshFromCookies,
} from '../../../lib/auth'
import { limiters, getClientIp } from '../../../lib/rateLimit'

export default async function refreshHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>)

  // Rate limit refresh attempts — 20 per minute per IP
  const rl = limiters.api(ip)
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests', retryAfter: rl.retryAfter })
  }

  const cookieHeader = req.headers.cookie || null
  const refreshToken = getRefreshFromCookies(cookieHeader)

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token', message: 'Please log in again' })
  }

  const payload = await verifyRefreshToken(refreshToken)
  if (!payload) {
    return res.status(401).json({ error: 'Invalid refresh token', message: 'Session expired. Please log in again.' })
  }

  const newAccessToken = await generateAccessToken({
    userId:  payload.userId,
    email:   payload.email,
    role:    payload.role,
    isAdmin: payload.isAdmin,
  })

  res.setHeader('Set-Cookie', buildAccessCookie(newAccessToken))

  return res.status(200).json({ success: true, accessToken: newAccessToken })
}
