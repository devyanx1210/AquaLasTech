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
    // view=history : show only older-than-today delivered/completed
    // view=active  : today's + pending online orders (default)

    try {
        const db = await connectToDatabase()

        let query = `
            SELECT
                o.order_id, o.order_reference, o.total_amount,
                o.payment_mode, o.order_status, o.created_at,
                u.full_name  AS customer_name,
                u.email      AS customer_email,
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

        if (view === 'history') {
            // Orders from before today that are delivered/cancelled/returned
            query += ` AND DATE(o.created_at) < CURDATE()`
        } else {
            // Active: today's orders + any pending/confirmed/preparing/delivering regardless of date
            query += ` AND (DATE(o.created_at) = CURDATE() OR o.order_status IN ('confirmed','preparing','delivering'))`
        }

        if (status && status !== 'all') {
            query += ` AND o.order_status = ?`
            params.push(status)
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

// ── PUT /orders/:id/status — update order status ──────────────────────────
router.put('/:id/status', async (req, res) => {
    const { id } = req.params
    const { order_status } = req.body
    const valid = ['confirmed', 'preparing', 'delivering', 'cancelled', 'returned']
    if (!valid.includes(order_status))
        return res.status(400).json({ message: 'Invalid status' })

    try {
        const db = await connectToDatabase()
        await db.query(
            `UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?`,
            [order_status, id]
        )
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

        // If rejected, move order back to delivered state
        if (return_status === 'rejected') {
            await db.query(
                `UPDATE orders SET order_status = 'delivering', updated_at = NOW() WHERE order_id = ?`,
                [id]
            )
        }

        return res.json({ message: 'Return updated' })
    } catch (err) {
        console.error('PUT /orders/:id/return error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

export default router