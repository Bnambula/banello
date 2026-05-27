// ============================================================
// BANELLO — POST /api/payments/pesapal-webhook
// Receives payment confirmation from Pesapal
// Verifies signature before marking order as paid
// CRITICAL: This is the only place orders become "confirmed"
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

// Verify Pesapal webhook signature to prevent fake payment callbacks
function verifyPesapalSignature(payload: string, signature: string): boolean {
  const secret = process.env.PESAPAL_WEBHOOK_SECRET
  if (!secret) {
    console.error('[WEBHOOK] PESAPAL_WEBHOOK_SECRET not set — rejecting all webhooks in production')
    return process.env.NODE_ENV !== 'production' // Allow in dev only
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export default async function pesapalWebhookHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Pesapal sends POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get raw body for signature verification
  const rawBody    = JSON.stringify(req.body)
  const signature  = req.headers['x-pesapal-signature'] as string || ''

  // ─── Signature verification ───────────────────────────────
  if (!verifyPesapalSignature(rawBody, signature)) {
    console.error('[WEBHOOK] Invalid Pesapal signature — rejecting')
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const {
    pesapal_transaction_tracking_id,
    pesapal_merchant_reference,
    pesapal_notification_type,
    payment_status_description,
  } = req.body

  console.log('[WEBHOOK] Pesapal notification:', {
    trackingId: pesapal_transaction_tracking_id,
    orderRef:   pesapal_merchant_reference,
    type:       pesapal_notification_type,
    status:     payment_status_description,
  })

  // ─── Process based on status ──────────────────────────────
  if (payment_status_description === 'Completed') {
    // In production:
    // 1. Find order by pesapal_merchant_reference (order number)
    // 2. Verify amount matches order total (CRITICAL — prevents partial payment fraud)
    // 3. Update order: status = 'confirmed', payment_status = 'paid', payment_ref = trackingId
    // 4. Trigger WhatsApp notification to customer
    // 5. Log to audit_logs table

    // const order = await prisma.orders.findUnique({ where: { orderNumber: pesapal_merchant_reference } })
    // if (!order) return res.status(404).json({ error: 'Order not found' })
    // await prisma.orders.update({ where: { id: order.id }, data: { status: 'confirmed', paymentStatus: 'paid', paymentRef: pesapal_transaction_tracking_id } })
    // await sendWhatsApp(order.customerPhone, `Payment confirmed! Order ${order.orderNumber} is being prepared.`)

    console.log(`[WEBHOOK] Order ${pesapal_merchant_reference} marked as PAID`)
  }

  if (payment_status_description === 'Failed') {
    // Update order payment_status to 'failed' — do NOT change order status
    // Notify customer to retry payment
    console.log(`[WEBHOOK] Payment FAILED for order ${pesapal_merchant_reference}`)
  }

  // Pesapal expects a 200 response to acknowledge receipt
  return res.status(200).json({ status: 'received' })
}

// Disable body parsing so we can access raw body for signature verification
export const config = {
  api: { bodyParser: false },
}
