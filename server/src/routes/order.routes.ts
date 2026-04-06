// order.routes - /orders/* endpoints for placing and managing orders
import express from 'express'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'
import {
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_MODE,
    NOTIFICATION_TYPE,
    RETURN_STATUS,
    PAYMENT_MODE_NAMES,
    VALID_ORDER_STATUSES,
    VALID_PAYMENT_STATUSES,
    VALID_RETURN_STATUSES,
    isFinalOrderStatus,
    getEnumName,
} from '../constants/dbEnums.js'

// Maps string names sent by the frontend to DB TINYINT values
const ORDER_STATUS_MAP: Record<string, number> = {
    confirmed: ORDER_STATUS.CONFIRMED,
    preparing: ORDER_STATUS.PREPARING,
    out_for_delivery: ORDER_STATUS.OUT_FOR_DELIVERY,
    delivered: ORDER_STATUS.DELIVERED,
    cancelled: ORDER_STATUS.CANCELLED,
    returned: ORDER_STATUS.RETURNED,
}
const PAYMENT_STATUS_MAP: Record<string, number> = {
    pending: PAYMENT_STATUS.PENDING,
    verified: PAYMENT_STATUS.VERIFIED,
    rejected: PAYMENT_STATUS.REJECTED,
}
const PAYMENT_MODE_MAP: Record<string, number> = {
    gcash: PAYMENT_MODE.GCASH,
    cash: PAYMENT_MODE.CASH,
    cash_on_delivery: PAYMENT_MODE.CASH_ON_DELIVERY,
    cash_on_pickup: PAYMENT_MODE.CASH_ON_PICKUP,
}

const router = express.Router()
router.use(verifyToken)

    // Ensure required columns exist
    ; (async () => {
        const db = await connectToDatabase()
        for (const sql of [
            `ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100) NULL`,
            `ALTER TABLE orders ADD COLUMN customer_address VARCHAR(500) NULL`,
            `ALTER TABLE orders ADD COLUMN full_address VARCHAR(500) NULL`,
            `ALTER TABLE orders ADD COLUMN hidden_at DATETIME NULL`,
            `ALTER TABLE order_returns ADD COLUMN processed_by INT NULL`,
        ]) { try { await db.query(sql) } catch { /* already exists */ } }
    })()

// DELETE /orders/history — clear all history orders for the station (must be before /:id)
router.delete('/history', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id
    if (!station_id) return res.status(400).json({ message: 'No station assigned' })
    try {
        const db = await connectToDatabase()
        const [result]: any = await db.query(
            `UPDATE orders SET hidden_at = NOW()
             WHERE station_id = ? AND hidden_at IS NULL
             AND (DATE(created_at) < CURDATE() OR (DATE(created_at) = CURDATE() AND order_status IN (?, ?, ?)))`,
            [station_id, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED, ORDER_STATUS.DELIVERED]
        )
        return res.json({ message: 'Order history cleared', deleted: result.affectedRows })
    } catch (err) {
        console.error('DELETE /orders/history error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// GET /orders — all orders for a station
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
                CASE o.order_status
                    WHEN 1 THEN 'confirmed' WHEN 2 THEN 'preparing'
                    WHEN 3 THEN 'out_for_delivery' WHEN 4 THEN 'delivered'
                    WHEN 5 THEN 'cancelled' WHEN 6 THEN 'returned' ELSE 'confirmed'
                END AS order_status,
                CASE o.payment_mode
                    WHEN 1 THEN 'gcash' WHEN 2 THEN 'cash'
                    WHEN 3 THEN 'cash_on_delivery' WHEN 4 THEN 'cash_on_pickup' ELSE 'cash'
                END AS payment_mode,
                o.created_at,
                COALESCE(o.customer_name, u.full_name) AS customer_name,
                u.email AS customer_email,
                u.phone_number AS customer_contact,
                u.profile_picture,
                COALESCE(o.customer_address, cp.address) AS customer_address,
                COALESCE(o.full_address, cp.complete_address) AS full_address,
                p.payment_type,
                CASE p.payment_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'verified' WHEN 3 THEN 'rejected' ELSE 'pending'
                END AS payment_status,
                p.proof_image_path,
                r.reason AS return_reason,
                CASE r.return_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'approved' WHEN 3 THEN 'rejected' ELSE NULL
                END AS return_status,
                r.return_id,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count
            FROM orders o
            LEFT JOIN users u            ON u.user_id  = o.user_id
            LEFT JOIN customers cp       ON cp.user_id = o.user_id
            LEFT JOIN payments p         ON p.order_id = o.order_id
            LEFT JOIN order_returns r    ON r.order_id = o.order_id
            WHERE o.station_id = ? AND o.hidden_at IS NULL
        `
        const params: any[] = [station_id]

        if (status && status !== 'all') {
            // Explicit status filter: convert string name to TINYINT for DB comparison
            const statusNum = ORDER_STATUS_MAP[status as string]
            if (statusNum == null) return res.status(400).json({ message: 'Invalid status' })
            query += ` AND o.order_status = ?`
            params.push(statusNum)
        } else if (view === 'history') {
            // History: all orders from previous days + today's done orders
            query += ` AND (
                DATE(o.created_at) < CURDATE()
                OR (DATE(o.created_at) = CURDATE() AND o.order_status IN (?, ?, ?))
            )`
            params.push(ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED, ORDER_STATUS.DELIVERED)
        } else {
            // Active: today's open orders + previous-day in-progress
            // + any delivered order with a pending return request
            query += ` AND (
                (DATE(o.created_at) = CURDATE() AND o.order_status NOT IN (?, ?, ?))
                OR (DATE(o.created_at) < CURDATE() AND o.order_status IN (?, ?, ?))
                OR (o.order_status = ? AND r.return_status = ?)
            )`
            params.push(
                ORDER_STATUS.CANCELLED,
                ORDER_STATUS.DELIVERED,
                ORDER_STATUS.RETURNED,
                ORDER_STATUS.CONFIRMED,
                ORDER_STATUS.PREPARING,
                ORDER_STATUS.OUT_FOR_DELIVERY,
                ORDER_STATUS.DELIVERED,
                RETURN_STATUS.PENDING,
            )
        }

        if (payment_mode && payment_mode !== 'all') {
            const modeNum = PAYMENT_MODE_MAP[payment_mode as string]
            if (modeNum == null) return res.status(400).json({ message: 'Invalid payment mode' })
            query += ` AND o.payment_mode = ?`
            params.push(modeNum)
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

// ── Admin Notification Routes (must be before /:id) ──

// GET /orders/notifications — admins only see inventory/stock alerts
router.get('/notifications', async (req, res) => {
    const user = (req as any).user
    try {
        const db = await connectToDatabase()
        const [rows]: any = await db.query(
            `SELECT notification_id, message, notification_type, is_read, created_at
             FROM notifications
             WHERE user_id = ? AND notification_type = ?
             ORDER BY created_at DESC LIMIT 50`,
            [user.id, NOTIFICATION_TYPE.INVENTORY_ALERT]
        )
        return res.json(rows)
    } catch (err) {
        console.error('GET /orders/notifications error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /orders/notifications/read-all
router.put('/notifications/read-all', async (req, res) => {
    const user = (req as any).user
    try {
        const db = await connectToDatabase()
        await db.query(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [user.id])
        return res.json({ message: 'All read' })
    } catch (err) {
        console.error('PUT /orders/notifications/read-all error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /orders/notifications/:nid/read
router.put('/notifications/:nid/read', async (req, res) => {
    const user = (req as any).user
    const { nid } = req.params
    try {
        const db = await connectToDatabase()
        await db.query(`UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?`, [nid, user.id])
        return res.json({ message: 'Read' })
    } catch (err) {
        console.error('PUT /orders/notifications/:nid/read error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// DELETE /orders/notifications/:nid
router.delete('/notifications/:nid', async (req, res) => {
    const user = (req as any).user
    const { nid } = req.params
    try {
        const db = await connectToDatabase()
        await db.query(`DELETE FROM notifications WHERE notification_id = ? AND user_id = ?`, [nid, user.id])
        return res.json({ message: 'Deleted' })
    } catch (err) {
        console.error('DELETE /orders/notifications/:nid error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})


// GET /orders/:id — single order with items
router.get('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const db = await connectToDatabase()

        const [orders]: any = await db.query(
            `SELECT
                o.order_id, o.order_reference, o.total_amount, o.created_at, o.updated_at,
                o.customer_name, o.customer_address, o.full_address,
                o.station_id, o.user_id,
                CASE o.order_status
                    WHEN 1 THEN 'confirmed' WHEN 2 THEN 'preparing'
                    WHEN 3 THEN 'out_for_delivery' WHEN 4 THEN 'delivered'
                    WHEN 5 THEN 'cancelled' WHEN 6 THEN 'returned' ELSE 'confirmed'
                END AS order_status,
                CASE o.payment_mode
                    WHEN 1 THEN 'gcash' WHEN 2 THEN 'cash'
                    WHEN 3 THEN 'cash_on_delivery' WHEN 4 THEN 'cash_on_pickup' ELSE 'cash'
                END AS payment_mode,
                COALESCE(o.customer_name, u.full_name) AS customer_name,
                u.email AS customer_email,
                p.payment_type, p.payment_id, p.proof_image_path,
                CASE p.payment_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'verified' WHEN 3 THEN 'rejected' ELSE 'pending'
                END AS payment_status,
                vbu.full_name AS verified_by_name,
                r.reason AS return_reason, r.return_id,
                r.processed_by AS return_processed_by,
                rbu.full_name AS return_processed_by_name,
                CASE r.return_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'approved' WHEN 3 THEN 'rejected' ELSE NULL
                END AS return_status,
                CASE WHEN o.order_reference LIKE 'ORD-%' THEN u.full_name ELSE NULL END AS pos_by_name
             FROM orders o
             LEFT JOIN users u ON u.user_id = o.user_id
             LEFT JOIN payments p ON p.order_id = o.order_id
             LEFT JOIN users vbu ON vbu.user_id = p.verified_by
             LEFT JOIN order_returns r ON r.order_id = o.order_id
             LEFT JOIN users rbu ON rbu.user_id = r.processed_by
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

// Notification messages per status (keyed by numeric TINYINT values)
const STATUS_MESSAGES: Record<number, string> = {
    [ORDER_STATUS.CONFIRMED]: 'Your order has been confirmed and is being processed.',
    [ORDER_STATUS.PREPARING]: 'Your order is now being prepared at the station.',
    [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Your order is out for delivery and on its way to you.',
    [ORDER_STATUS.DELIVERED]: 'Your order has been delivered. Thank you for your purchase.',
    [ORDER_STATUS.CANCELLED]: 'Your order has been cancelled. Please contact us for assistance.',
    [ORDER_STATUS.RETURNED]: 'Your return request has been processed.',
}

// PUT /orders/:id/status — update order status (accepts string name or numeric TINYINT)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params
    let { order_status } = req.body

    // Accept string name (e.g. 'confirmed') or numeric TINYINT
    if (typeof order_status === 'string') {
        const mapped = ORDER_STATUS_MAP[order_status]
        if (mapped == null) return res.status(400).json({ message: 'Invalid status' })
        order_status = mapped
    }
    if (!VALID_ORDER_STATUSES.includes(order_status))
        return res.status(400).json({ message: 'Invalid status' })

    try {
        const db = await connectToDatabase()

        // Update order status
        await db.query(
            `UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?`,
            [order_status, id]
        )

        // When delivered: auto-mark all non-gcash payments as verified
        if (order_status === ORDER_STATUS.DELIVERED) {
            await db.query(
                `UPDATE payments
                 SET payment_status = ?
                 WHERE order_id = ? AND payment_status = ?
                   AND payment_type != ?`,
                [PAYMENT_STATUS.VERIFIED, id, PAYMENT_STATUS.PENDING, 1] // 1 = GCASH
            )
        }

        // When cancelled: restore stock to inventory
        if (order_status === ORDER_STATUS.CANCELLED) {
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

        // Get the order's user_id, station_id, payment mode, and total for notification
        const [orderRows]: any = await db.query(
            `SELECT o.user_id, o.station_id, o.total_amount, o.payment_mode
             FROM orders o WHERE o.order_id = ?`,
            [id]
        )

        // Only notify if the order belongs to a registered user (not walk-in)
        if (orderRows.length > 0 && orderRows[0].user_id) {
            const { user_id, station_id, total_amount, payment_mode } = orderRows[0]

            let message = STATUS_MESSAGES[order_status]

            // For out-for-delivery: build a detailed message with items + COD payment info
            if (order_status === ORDER_STATUS.OUT_FOR_DELIVERY) {
                const [items]: any = await db.query(
                    `SELECT p.product_name, oi.quantity
                     FROM order_items oi
                     JOIN products p ON p.product_id = oi.product_id
                     WHERE oi.order_id = ?`,
                    [id]
                )
                const itemList = items.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ')
                const isCOD = payment_mode === PAYMENT_MODE.CASH_ON_DELIVERY
                message = `Your order is out for delivery! Items: ${itemList}.`
                if (isCOD) {
                    message += ` Please prepare ₱${Number(total_amount).toFixed(2)} for payment upon delivery.`
                }
            }

            if (message) {
                await db.query(
                    `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read)
                     VALUES (?, ?, ?, ?, 0)`,
                    [user_id, station_id, message, NOTIFICATION_TYPE.ORDER_UPDATE]
                )
            }
        }

        return res.json({ message: 'Status updated' })
    } catch (err) {
        console.error('PUT /orders/:id/status error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /orders/:id/payment — verify or reject gcash payment (accepts string name or numeric TINYINT)
router.put('/:id/payment', async (req, res) => {
    const { id } = req.params
    let { payment_status } = req.body
    const user = (req as any).user

    if (typeof payment_status === 'string') {
        const mapped = PAYMENT_STATUS_MAP[payment_status]
        if (mapped == null) return res.status(400).json({ message: 'Invalid payment status' })
        payment_status = mapped
    }
    if (!VALID_PAYMENT_STATUSES.includes(payment_status))
        return res.status(400).json({ message: 'Invalid payment status' })

    try {
        const db = await connectToDatabase()
        await db.query(
            `UPDATE payments SET payment_status = ?, verified_by = ?, verified_at = NOW()
             WHERE order_id = ?`,
            [payment_status, user.id, id]
        )

        // Notify the customer about their payment status
        const [orderRows]: any = await db.query(
            `SELECT o.user_id, o.station_id FROM orders o WHERE o.order_id = ?`, [id]
        )
        if (orderRows.length) {
            const { user_id, station_id } = orderRows[0]
            const message = payment_status === PAYMENT_STATUS.VERIFIED
                ? 'Your GCash payment has been verified. Thank you!'
                : 'Your GCash payment was rejected. Please contact the station for assistance.'
            await db.query(
                `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read, created_at)
                 VALUES (?, ?, ?, ?, 0, NOW())`,
                [user_id, station_id, message, NOTIFICATION_TYPE.PAYMENT_UPDATE]
            )
        }

        return res.json({ message: 'Payment updated' })
    } catch (err) {
        console.error('PUT /orders/:id/payment error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /orders/:id/return — customer requests return
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
             VALUES (?, ?, ?, NOW())`,
            [id, reason.trim(), RETURN_STATUS.PENDING]
        )

        await db.query(
            `UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?`,
            [ORDER_STATUS.RETURNED, id]
        )

        return res.status(201).json({ message: 'Return request submitted' })
    } catch (err) {
        console.error('POST /orders/:id/return error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

const RETURN_STATUS_MAP: Record<string, number> = {
    pending: RETURN_STATUS.PENDING,
    approved: RETURN_STATUS.APPROVED,
    rejected: RETURN_STATUS.REJECTED,
}

// PUT /orders/:id/return — admin approves or rejects return (accepts string name or numeric TINYINT)
router.put('/:id/return', async (req, res) => {
    const { id } = req.params
    let { return_status } = req.body
    const user = (req as any).user

    if (typeof return_status === 'string') {
        const mapped = RETURN_STATUS_MAP[return_status]
        if (mapped == null) return res.status(400).json({ message: 'Invalid return status' })
        return_status = mapped
    }
    if (!VALID_RETURN_STATUSES.includes(return_status))
        return res.status(400).json({ message: 'Invalid return status' })

    try {
        const db = await connectToDatabase()
        await db.query(
            `UPDATE order_returns SET return_status = ?, processed_by = ?, updated_at = NOW() WHERE order_id = ?`,
            [return_status, user.id, id]
        )

        // If approved: restore stock to inventory (items are being returned)
        if (return_status === RETURN_STATUS.APPROVED) {
            const [returnItems]: any = await db.query(
                `SELECT oi.product_id, oi.quantity, p.station_id
                 FROM order_items oi
                 JOIN products p ON p.product_id = oi.product_id
                 WHERE oi.order_id = ?`,
                [id]
            )
            for (const item of returnItems) {
                await db.query(
                    `UPDATE inventory SET quantity = quantity + ?, updated_at = NOW()
                     WHERE product_id = ? AND station_id = ?`,
                    [item.quantity, item.product_id, item.station_id]
                )
            }
        }

        // If rejected: move order back to out_for_delivery (no stock change)
        if (return_status === RETURN_STATUS.REJECTED) {
            await db.query(
                `UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?`,
                [ORDER_STATUS.OUT_FOR_DELIVERY, id]
            )
        }

        // Notify the customer about return resolution
        const [orderRows]: any = await db.query(
            `SELECT user_id, station_id FROM orders WHERE order_id = ?`,
            [id]
        )
        if (orderRows.length > 0 && orderRows[0].user_id) {
            const { user_id, station_id } = orderRows[0]
            const message = return_status === RETURN_STATUS.APPROVED
                ? 'Your return request has been approved. We will process your refund shortly.'
                : 'Your return request was rejected. Your order has been restored to Out for Delivery.'
            await db.query(
                `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read)
                 VALUES (?, ?, ?, ?, 0)`,
                [user_id, station_id, message, NOTIFICATION_TYPE.ORDER_UPDATE]
            )
        }

        return res.json({ message: 'Return updated' })
    } catch (err) {
        console.error('PUT /orders/:id/return error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// DELETE /orders/:id — delete a single completed order
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    const user = (req as any).user
    try {
        const db = await connectToDatabase()
        const [rows]: any = await db.query(
            `SELECT order_id, order_status, station_id FROM orders WHERE order_id = ?`, [id]
        )
        if (!rows.length) return res.status(404).json({ message: 'Order not found' })
        const order = rows[0]
        const finalStatuses = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED]
        if (!finalStatuses.includes(order.order_status))
            return res.status(400).json({ message: 'Only completed orders can be deleted' })
        if (order.station_id !== user.station_id)
            return res.status(403).json({ message: 'Access denied' })
        await db.query(`UPDATE orders SET hidden_at = NOW() WHERE order_id = ?`, [id])
        return res.json({ message: 'Order deleted' })
    } catch (err) {
        console.error('DELETE /orders/:id error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

export default router