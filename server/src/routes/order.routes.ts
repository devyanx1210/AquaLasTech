import express from 'express'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'

const router = express.Router()
router.use(verifyToken)

// ── GET /orders — all orders for a station ────────────────────────────────
router.get('/', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id
    if (!station_id) return res.status(400).json({ message: 'No station assigned' })

    const { status, search, view } = req.query
    const payment_mode = (req.query as any).payment_mode
    // view=history : show only older-than-today delivered/completed
    // view=active  : today's + pending online orders (default)

    try {
        const db = await connectToDatabase()

        let query = `
            SELECT
                o.order_id, o.order_reference, o.total_amount,
                o.payment_mode, o.order_status, o.created_at,
                u.full_name  AS customer_name,
                u.email AS customer_email,
                u.phone_number AS customer_contact,
                p.payment_type, p.payment_status, p.proof_image_path,
                r.reason     AS return_reason, r.return_status, r.return_id,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count
            FROM orders o
            LEFT JOIN users u   ON u.user_id  = o.user_id
            LEFT JOIN payments p ON p.order_id = o.order_id
            LEFT JOIN order_returns r ON r.order_id = o.order_id
            WHERE o.station_id = ?
        `
        const params: any[] = [station_id]

        if (status && status !== 'all') {
            // Explicit status filter: just show all orders with that status, ignore date bucketing
            query += ` AND o.order_status = ?`
            params.push(status)
        } else if (view === 'history') {
            // History: all orders from previous days + today's done orders
            query += ` AND (
                DATE(o.created_at) < CURDATE()
                OR (DATE(o.created_at) = CURDATE() AND o.order_status IN ('cancelled','returned','delivered'))
            )`
        } else {
            // Active: today's open orders + previous-day in-progress + any returned with pending review
            query += ` AND (
                (DATE(o.created_at) = CURDATE() AND o.order_status NOT IN ('cancelled','delivered'))
                OR (DATE(o.created_at) < CURDATE() AND o.order_status IN ('confirmed','preparing','out_for_delivery'))
                OR (o.order_status = 'returned' AND EXISTS (
                    SELECT 1 FROM order_returns r2 WHERE r2.order_id = o.order_id AND r2.return_status = 'pending'
                ))
            )`
        }

        if (payment_mode && payment_mode !== 'all') {
            query += ` AND o.payment_mode = ?`
            params.push(payment_mode)
        }

        if (search) {
            query += ` AND (o.order_reference LIKE ? OR u.full_name LIKE ?)`
            params.push(`%${search}%`, `%${search}%`)
        }

        query += ` ORDER BY o.created_at DESC`

        const [rows]: any = await db.query(query, params)
        return res.json(rows)
    } catch (err) {
        console.error('GET /orders error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── GET /orders/:id — single order with items ─────────────────────────────
router.get('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const db = await connectToDatabase()

        const [orders]: any = await db.query(
            `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email,
                    p.payment_type, p.payment_status, p.proof_image_path, p.payment_id,
                    r.reason AS return_reason, r.return_status, r.return_id
             FROM orders o
             LEFT JOIN users    u ON u.user_id  = o.user_id
             LEFT JOIN payments p ON p.order_id = o.order_id
             LEFT JOIN order_returns r ON r.order_id = o.order_id
             WHERE o.order_id = ?`,
            [id]
        )
        if (!orders.length) return res.status(404).json({ message: 'Order not found' })

        const [items]: any = await db.query(
            `SELECT oi.*, p.product_name, p.unit, p.image_url
             FROM order_items oi
             JOIN products p ON p.product_id = oi.product_id
             WHERE oi.order_id = ?`,
            [id]
        )
        return res.json({ ...orders[0], items })
    } catch (err) {
        console.error('GET /orders/:id error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── Notification messages per status ──────────────────────────────────────
const STATUS_MESSAGES: Record<string, string> = {
    confirmed: 'Your order has been confirmed and is being processed.',
    preparing: 'Your order is now being prepared at the station.',
    out_for_delivery: 'Your order is out for delivery and on its way to you.',
    delivered: 'Your order has been delivered. Thank you for your purchase.',
    cancelled: 'Your order has been cancelled. Please contact us for assistance.',
    returned: 'Your return request has been processed.',
}

// ── PUT /orders/:id/status — update order status ──────────────────────────
router.put('/:id/status', async (req, res) => {
    const { id } = req.params
    const { order_status } = req.body
    const valid = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'returned']
    if (!valid.includes(order_status))
        return res.status(400).json({ message: 'Invalid status' })

    try {
        const db = await connectToDatabase()

        // Update order status
        await db.query(
            `UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?`,
            [order_status, id]
        )

        // When delivered: auto-mark all non-gcash payments as verified
        if (order_status === 'delivered') {
            await db.query(
                `UPDATE payments
                 SET payment_status = 'verified'
                 WHERE order_id = ? AND payment_status = 'pending'
                   AND payment_type != 'gcash'`,
                [id]
            )
        }

        // When cancelled: restore stock to inventory
        if (order_status === 'cancelled') {
            const [items]: any = await db.query(
                `SELECT oi.product_id, oi.quantity, p.station_id
                 FROM order_items oi
                 JOIN products p ON p.product_id = oi.product_id
                 WHERE oi.order_id = ?`,
                [id]
            )
            for (const item of items) {
                await db.query(
                    `UPDATE inventory SET quantity = quantity + ? WHERE product_id = ? AND station_id = ?`,
                    [item.quantity, item.product_id, item.station_id]
                )
            }
        }

        // Get the order's user_id and station_id to send notification
        const [orderRows]: any = await db.query(
            `SELECT user_id, station_id FROM orders WHERE order_id = ?`,
            [id]
        )

        // Only notify if the order belongs to a registered user (not walk-in)
        if (orderRows.length > 0 && orderRows[0].user_id) {
            const { user_id, station_id } = orderRows[0]
            const message = STATUS_MESSAGES[order_status]
            if (message) {
                await db.query(
                    `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read)
                     VALUES (?, ?, ?, 'order_update', 0)`,
                    [user_id, station_id, message]
                )
            }
        }

        return res.json({ message: 'Status updated' })
    } catch (err) {
        console.error('PUT /orders/:id/status error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── PUT /orders/:id/payment — verify or reject gcash payment ──────────────
router.put('/:id/payment', async (req, res) => {
    const { id } = req.params
    const { payment_status } = req.body
    const user = (req as any).user

    if (!['verified', 'rejected'].includes(payment_status))
        return res.status(400).json({ message: 'Invalid payment status' })

    try {
        const db = await connectToDatabase()
        await db.query(
            `UPDATE payments SET payment_status = ?, verified_by = ?, verified_at = NOW()
             WHERE order_id = ?`,
            [payment_status, user.id, id]
        )

        // If verified, automatically move order to preparing
        if (payment_status === 'verified') {
            await db.query(
                `UPDATE orders SET order_status = 'preparing', updated_at = NOW()
                 WHERE order_id = ? AND order_status = 'confirmed'`,
                [id]
            )
        }

        return res.json({ message: 'Payment updated' })
    } catch (err) {
        console.error('PUT /orders/:id/payment error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── POST /orders/:id/return — customer requests return ────────────────────
router.post('/:id/return', async (req, res) => {
    const { id } = req.params
    const { reason } = req.body

    if (!reason?.trim())
        return res.status(400).json({ message: 'Return reason is required' })

    try {
        const db = await connectToDatabase()

        // Check if return already exists
        const [existing]: any = await db.query(
            `SELECT return_id FROM order_returns WHERE order_id = ?`, [id]
        )
        if (existing.length)
            return res.status(409).json({ message: 'Return request already exists' })

        await db.query(
            `INSERT INTO order_returns (order_id, reason, return_status, created_at)
             VALUES (?, ?, 'pending', NOW())`,
            [id, reason.trim()]
        )

        await db.query(
            `UPDATE orders SET order_status = 'returned', updated_at = NOW() WHERE order_id = ?`,
            [id]
        )

        return res.status(201).json({ message: 'Return request submitted' })
    } catch (err) {
        console.error('POST /orders/:id/return error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── PUT /orders/:id/return — admin approves or rejects return ─────────────
router.put('/:id/return', async (req, res) => {
    const { id } = req.params
    const { return_status } = req.body // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(return_status))
        return res.status(400).json({ message: 'Invalid return status' })

    try {
        const db = await connectToDatabase()
        await db.query(
            `UPDATE order_returns SET return_status = ?, updated_at = NOW() WHERE order_id = ?`,
            [return_status, id]
        )

        // If rejected, move order back to out_for_delivery
        if (return_status === 'rejected') {
            await db.query(
                `UPDATE orders SET order_status = 'out_for_delivery', updated_at = NOW() WHERE order_id = ?`,
                [id]
            )
        }

        // Notify the customer about return resolution
        const [orderRows]: any = await db.query(
            `SELECT user_id, station_id FROM orders WHERE order_id = ?`,
            [id]
        )
        if (orderRows.length > 0 && orderRows[0].user_id) {
            const { user_id, station_id } = orderRows[0]
            const message = return_status === 'approved'
                ? 'Your return request has been approved. We will process your refund shortly.'
                : 'Your return request was rejected. Your order has been restored to Out for Delivery.'
            await db.query(
                `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read)
                 VALUES (?, ?, ?, 'order_update', 0)`,
                [user_id, station_id, message]
            )
        }

        return res.json({ message: 'Return updated' })
    } catch (err) {
        console.error('PUT /orders/:id/return error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

export default router