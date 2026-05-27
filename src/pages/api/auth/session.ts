// ============================================================
// BANELLO — GET /api/auth/session
// Returns current user from access token cookie
// Frontend calls this on app load to restore session
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyAccessToken, getTokenFromCookies } from '../../../lib/auth'

export default async function sessionHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = getTokenFromCookies(req.headers.cookie || null)

  if (!token) {
    return res.status(200).json({ authenticated: false, user: null })
  }

  const payload = await verifyAccessToken(token)

  if (!payload) {
    return res.status(200).json({ authenticated: false, user: null })
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      id:      payload.userId,
      email:   payload.email,
      role:    payload.role,
      isAdmin: payload.isAdmin,
    },
  })
}
