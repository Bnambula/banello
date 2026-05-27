// ============================================================
// BANELLO — POST /api/auth/logout
// Clears all auth cookies and invalidates session
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import { buildClearCookies } from '../../../lib/auth'

export default function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  res.setHeader('Set-Cookie', buildClearCookies())
  return res.status(200).json({ success: true, message: 'Logged out successfully' })
}
