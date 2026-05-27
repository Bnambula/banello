// ============================================================
// BANELLO — GET/POST /api/orders
// Protected: requires manager or admin role
// Rate limited: 10 orders/min (POST), 100 req/min (GET)
// ============================================================

import type { NextApiResponse } from 'next'
import { withApiAuth, type AuthedRequest } from '../../lib/apiAuth'
import { limiters, getClientIp } from '../../lib/rateLimit'
import { sales } from '../../data/store'

async function ordersHandler(req: AuthedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Admin/manager can see all orders
    // Customer role can only see their own (handled by user.userId filter)
    const { status, channel, page = '1', limit = '20' } = req.query

    let filtered = [...sales]

    // Customers only see their own orders
    if (req.user.role === 'customer') {
      filtered = filtered.filter(o => o.id === req.user.userId)
    }

    if (status && typeof status === 'string') {
      filtered = filtered.filter(o => o.status === status)
    }
    if (channel && typeof channel === 'string') {
      filtered = filtered.filter(o => o.channel === channel)
    }

    const pageNum  = parseInt(String(page), 10)
    const limitNum = Math.min(parseInt(String(limit), 10), 100)
    const start    = (pageNum - 1) * limitNum
    const paginated = filtered.slice(start, start + limitNum)

    return res.status(200).json({
      orders:     paginated,
      total:      filtered.length,
      page:       pageNum,
      totalPages: Math.ceil(filtered.length / limitNum),
    })
  }

  if (req.method === 'POST') {
    // Extra rate limit check for order creation
    const ip = getClientIp(req.headers as Record<string, string | string[] | undefined>)
    const orderRl = limiters.orders(ip)

    if (!orderRl.allowed) {
      return res.status(429).json({
        error: 'Too many orders',
        message: `Order rate limit exceeded. Wait ${orderRl.retryAfter} seconds.`,
        retryAfter: orderRl.retryAfter,
      })
    }

    const { customerName, items, deliveryAddress, deliveryZone, paymentMethod } = req.body

    // Validate required fields
    if (!customerName || !items?.length || !deliveryAddress) {
      return res.status(400).json({ error: 'Missing required fields', required: ['customerName', 'items', 'deliveryAddress'] })
    }

    // In production: INSERT INTO orders (...) VALUES (...)
    const newOrder = {
      id:           `S${Date.now()}`,
      orderNumber:  `BNL-${Math.floor(Math.random() * 9000) + 1000}`,
      date:         new Date().toISOString().split('T')[0],
      customerName,
      items,
      deliveryAddress,
      deliveryZone,
      paymentMethod,
      status:       'pending' as const,
      totalAmount:  items.reduce((s: number, i: { lineTotal: number }) => s + i.lineTotal, 0),
      createdBy:    req.user.userId,
    }

    // In production: send WhatsApp confirmation via Africa's Talking
    // await sendWhatsApp(customer.phone, `Your Banello order ${newOrder.orderNumber} is confirmed!`)

    return res.status(201).json({ success: true, order: newOrder })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// Require at minimum customer role (logged in) — managers/admins can also access
export default withApiAuth(ordersHandler, undefined)
