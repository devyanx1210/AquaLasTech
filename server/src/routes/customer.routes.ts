// customer.routes - /customers/* endpoints for customer-facing data
import express from 'express'
import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'
import {
    ORDER_STATUS, PAYMENT_STATUS, PAYMENT_MODE, NOTIFICATION_TYPE, RETURN_STATUS,
} from '../constants/dbEnums.js'

const ROLE_NAMES: Record<number, string> = {
    1: 'customer', 2: 'admin', 3: 'super_admin', 4: 'sys_admin',
}

const PAYMENT_MODE_MAP: Record<string, number> = {
    gcash: PAYMENT_MODE.GCASH,
    cash: PAYMENT_MODE.CASH,
    cash_on_delivery: PAYMENT_MODE.CASH_ON_DELIVERY,
    cash_on_pickup: PAYMENT_MODE.CASH_ON_PICKUP,
}

const router = express.Router()
router.use(verifyToken)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Multer for profile avatars
const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'avatars')
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `avatar_${Date.now()}${ext}`)
    },
})
const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true)
        else cb(new Error('Images only'))
    },
})

    // Auto-add profile_picture column if not yet present
    ; (async () => {
        try {
            const db = await connectToDatabase()
            await db.query('ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500) NULL')
        } catch { /* already exists */ }
    })()

// POST /customer/profile-picture — works for any authenticated user (customer, admin, super_admin)
router.post('/profile-picture', uploadAvatar.single('avatar'), async (req: any, res: any) => {
    console.log('[profile-picture] req.file:', req.file)
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const userId = req.user.id
    const profile_picture = `/uploads/avatars/${req.file.filename}`
    try {
        const pool = await connectToDatabase()
        await pool.query('UPDATE users SET profile_picture = ? WHERE user_id = ?', [profile_picture, userId])
        console.log('[profile-picture] updated user', userId, '->', profile_picture)
        return res.json({ profile_picture })
    } catch (err) {
        console.error('POST /customer/profile-picture db error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// DELETE /customer/profile-picture — remove profile picture (revert to initials)
router.delete('/profile-picture', async (req: any, res) => {
    const userId = req.user.id
    try {
        const pool = await connectToDatabase()
        await pool.query('UPDATE users SET profile_picture = NULL WHERE user_id = ?', [userId])
        return res.json({ profile_picture: null })
    } catch (err) {
        console.error('DELETE /customer/profile-picture error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// Multer for GCash receipt uploads
const receiptStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'receipts')
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `receipt_${Date.now()}${ext}`)
    },
})
const uploadReceipt = multer({
    storage: receiptStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (/image\/(jpeg|jpg|png|webp)/.test(file.mimetype)) cb(null, true)
        else cb(new Error('Only image files allowed'))
    },
})

// PUT /customer/profile
router.put('/profile', async (req, res) => {
    const userId = (req as any).user.id
    const { full_name, phone_number, address, latitude, longitude, complete_address } = req.body
    if (!full_name?.trim())
        return res.status(400).json({ message: 'Name is required' })
    try {
        const pool = await connectToDatabase()
        await pool.query(
            `UPDATE users SET full_name=?, phone_number=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?`,
            [full_name.trim(), phone_number ?? null, userId]
        )
        await pool.query(
            `INSERT INTO customers (user_id, address, latitude, longitude, complete_address)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               address=VALUES(address), latitude=VALUES(latitude),
               longitude=VALUES(longitude), complete_address=VALUES(complete_address)`,
            [userId, address?.trim() || null, latitude ?? null, longitude ?? null, complete_address?.trim() || null]
        )
        const [rows]: any = await pool.query(
            `SELECT u.user_id, u.full_name, u.email, u.role, u.phone_number, u.profile_picture,
                    sp.station_id,
                    cp.address, cp.latitude, cp.longitude, cp.complete_address
             FROM users u
             LEFT JOIN admins sp ON sp.user_id = u.user_id
             LEFT JOIN customers cp ON cp.user_id = u.user_id
             WHERE u.user_id = ?`,
            [userId]
        )
        const u = rows[0]
        return res.json({
            message: 'Profile updated',
            user: {
                user_id: u.user_id, full_name: u.full_name, email: u.email,
                role: ROLE_NAMES[u.role] ?? 'customer',
                station_id: u.station_id ?? null,
                phone_number: u.phone_number ?? null,
                profile_picture: u.profile_picture ?? null,
                address: u.address ?? null,
                latitude: u.latitude != null ? parseFloat(u.latitude) : null,
                longitude: u.longitude != null ? parseFloat(u.longitude) : null,
                complete_address: u.complete_address ?? null,
            },
        })
    } catch (err) {
        console.error('PUT /customer/profile error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /customer/password
router.put('/password', async (req, res) => {
    const userId = (req as any).user.id
    const { current_password, new_password } = req.body
    if (!current_password || !new_password)
        return res.status(400).json({ message: 'Both passwords required' })
    if (new_password.length < 6)
        return res.status(400).json({ message: 'New password must be at least 6 characters' })
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query('SELECT password_hash FROM users WHERE user_id=?', [userId])
        if (!rows.length) return res.status(404).json({ message: 'User not found' })
        const valid = await bcrypt.compare(current_password, rows[0].password_hash)
        if (!valid) return res.status(401).json({ message: 'Current password is incorrect' })
        const hash = await bcrypt.hash(new_password, 10)
        await pool.query('UPDATE users SET password_hash=?, updated_at=CURRENT_TIMESTAMP WHERE user_id=?', [hash, userId])
        return res.json({ message: 'Password changed successfully' })
    } catch (err) {
        console.error('PUT /customer/password error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// GET /customer/products/:station_id
// Returns all active products with current stock for a given station
router.get('/products/:station_id', async (req, res) => {
    const { station_id } = req.params
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(`
            SELECT
                p.product_id,
                p.product_name,
                p.description,
                p.price,
                p.unit,
                p.image_url,
                COALESCE(i.quantity, 0) AS quantity
            FROM products p
            LEFT JOIN inventory i ON i.product_id = p.product_id AND i.station_id = ?
            WHERE p.station_id = ? AND p.is_active = 1
            ORDER BY p.product_name ASC
        `, [station_id, station_id])
        return res.json(rows)
    } catch (err) {
        console.error('GET /customer/products/:station_id error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /customer/orders
// Creates an order, order_items, payment record, and notifies the station admin
router.post('/orders', uploadReceipt.single('receipt'), async (req, res) => {
    const userId = (req as any).user.id
    const { station_id, payment_mode, total_amount, items: itemsJson } = req.body

    if (!station_id || !payment_mode || !total_amount || !itemsJson)
        return res.status(400).json({ message: 'Missing required fields' })

    let items: { product_id: number; quantity: number; unit_price: number }[]
    try { items = JSON.parse(itemsJson) }
    catch { return res.status(400).json({ message: 'Invalid items format' }) }

    if (!items.length)
        return res.status(400).json({ message: 'Cart is empty' })

    if (payment_mode === 'gcash' && !req.file)
        return res.status(400).json({ message: 'GCash receipt is required' })

    const paymentModeNum = PAYMENT_MODE_MAP[payment_mode as string]
    if (paymentModeNum == null)
        return res.status(400).json({ message: 'Invalid payment mode' })

    const pool = await connectToDatabase()
    const conn = await (pool as any).getConnection()

    try {
        await conn.beginTransaction()

        // Generate order reference: AQL-YYYYMMDD-XXXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
        const order_reference = `AQL-${dateStr}-${rand}`

        // Fetch customer name and address to snapshot on the order
        const [userRows]: any = await conn.query(
            `SELECT u.full_name, cp.address, cp.complete_address
             FROM users u
             LEFT JOIN customers cp ON cp.user_id = u.user_id
             WHERE u.user_id = ?`, [userId]
        )
        const snapName = userRows[0]?.full_name ?? null
        const snapAddress = userRows[0]?.address ?? null
        const snapCompleteAddress = userRows[0]?.complete_address ?? null

        // Insert order — snapshot customer fields so they never change if profile updates
        const [orderResult]: any = await conn.query(
            `INSERT INTO orders (user_id, station_id, order_reference, customer_name, customer_address, full_address, total_amount, payment_mode, order_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [userId, station_id, order_reference, snapName, snapAddress, snapCompleteAddress, total_amount, paymentModeNum, ORDER_STATUS.CONFIRMED]
        )
        const order_id = orderResult.insertId

        // Validate stock + deduct inventory atomically before inserting items
        for (const item of items) {
            // Check current stock with a row lock to prevent race conditions
            const [stockRows]: any = await conn.query(
                `SELECT quantity FROM inventory
                 WHERE product_id = ? AND station_id = ?
                 FOR UPDATE`,
                [item.product_id, station_id]
            )
            if (!stockRows.length || stockRows[0].quantity < item.quantity) {
                await conn.rollback()
                conn.release()
                return res.status(409).json({
                    message: `Insufficient stock for one or more items. Please refresh and try again.`
                })
            }
            // Deduct stock immediately on order placement
            await conn.query(
                `UPDATE inventory
                 SET quantity = quantity - ?, updated_at = NOW()
                 WHERE product_id = ? AND station_id = ?`,
                [item.quantity, item.product_id, station_id]
            )

            // Check if now low stock — notify station admins
            const [afterStock]: any = await conn.query(
                `SELECT i.quantity, i.min_stock_level, p.product_name,
                        u.user_id AS admin_id
                 FROM inventory i
                 JOIN products p ON p.product_id = i.product_id
                 JOIN admins sp ON sp.station_id = i.station_id
                 JOIN users u ON u.user_id = sp.user_id AND u.role IN (2, 3)
                 WHERE i.product_id = ? AND i.station_id = ?`,
                [item.product_id, station_id]
            )
            for (const row of afterStock) {
                if (row.quantity <= row.min_stock_level) {
                    const stockMsg = row.quantity === 0
                        ? `${row.product_name} is now out of stock.`
                        : `${row.product_name} is running low, only ${row.quantity} left.`
                    await conn.query(
                        `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read, created_at)
                         VALUES (?, ?, ?, ?, 0, NOW())`,
                        [row.admin_id, station_id, stockMsg, NOTIFICATION_TYPE.INVENTORY_ALERT]
                    ).catch(() => { }) // non-fatal
                }
            }
        }

        // Insert order items (price_snapshot matches the POS/admin schema)
        for (const item of items) {
            await conn.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_snapshot, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [order_id, item.product_id, item.quantity, item.unit_price]
            )
        }

        // Insert payment record
        const proof_image_path = req.file ? `/uploads/receipts/${req.file.filename}` : null
        await conn.query(
            `INSERT INTO payments (order_id, payment_type, payment_status, proof_image_path, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [order_id, paymentModeNum, PAYMENT_STATUS.PENDING, proof_image_path]
        )

        // Notify the customer that their order was received
        await conn.query(
            `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read, created_at)
             VALUES (?, ?, ?, ?, 0, NOW())`,
            [userId, station_id, `Your order ${order_reference} has been received and is pending confirmation.`, NOTIFICATION_TYPE.ORDER_UPDATE]
        )

        await conn.commit()
        conn.release()

        return res.status(201).json({
            message: 'Order placed successfully',
            order_id,
            order_reference,
        })
    } catch (err) {
        await conn.rollback()
        conn.release()
        console.error('POST /customer/orders error:', err)
        return res.status(500).json({ message: 'Failed to place order' })
    }
})

// GET /customer/orders
// Returns all orders for the logged-in customer
router.get('/orders', async (req, res) => {
    const userId = (req as any).user.id
    try {
        const pool = await connectToDatabase()
        const [orders]: any = await pool.query(`
            SELECT
                o.order_id, o.order_reference, o.total_amount, o.created_at,
                CASE o.order_status
                    WHEN 1 THEN 'confirmed' WHEN 2 THEN 'preparing'
                    WHEN 3 THEN 'out_for_delivery' WHEN 4 THEN 'delivered'
                    WHEN 5 THEN 'cancelled' WHEN 6 THEN 'returned' ELSE 'confirmed'
                END AS order_status,
                CASE o.payment_mode
                    WHEN 1 THEN 'gcash' WHEN 2 THEN 'cash'
                    WHEN 3 THEN 'cash_on_delivery' WHEN 4 THEN 'cash_on_pickup' ELSE 'cash'
                END AS payment_mode,
                s.station_name, s.address AS station_address,
                p.payment_type,
                CASE p.payment_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'verified' WHEN 3 THEN 'rejected' ELSE 'pending'
                END AS payment_status,
                p.proof_image_path,
                CASE r.return_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'approved' WHEN 3 THEN 'rejected' ELSE NULL
                END AS return_status,
                r.reason AS return_reason,
                (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count
            FROM orders o
            LEFT JOIN stations s  ON s.station_id = o.station_id
            LEFT JOIN payments p  ON p.order_id   = o.order_id
            LEFT JOIN order_returns r ON r.order_id = o.order_id
            WHERE o.user_id = ? AND o.hidden_at IS NULL
            ORDER BY o.created_at DESC
        `, [userId])
        return res.json(orders)
    } catch (err) {
        console.error('GET /customer/orders error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// GET /customer/orders/:id
router.get('/orders/:id', async (req, res) => {
    const userId = (req as any).user.id
    const { id } = req.params
    try {
        const pool = await connectToDatabase()
        const [orders]: any = await pool.query(`
            SELECT
                o.order_id, o.order_reference, o.total_amount,
                o.customer_name, o.customer_address, o.full_address,
                o.created_at, o.updated_at,
                CASE o.order_status
                    WHEN 1 THEN 'confirmed' WHEN 2 THEN 'preparing'
                    WHEN 3 THEN 'out_for_delivery' WHEN 4 THEN 'delivered'
                    WHEN 5 THEN 'cancelled' WHEN 6 THEN 'returned' ELSE 'confirmed'
                END AS order_status,
                CASE o.payment_mode
                    WHEN 1 THEN 'gcash' WHEN 2 THEN 'cash'
                    WHEN 3 THEN 'cash_on_delivery' WHEN 4 THEN 'cash_on_pickup' ELSE 'cash'
                END AS payment_mode,
                s.station_name, s.address AS station_address,
                p.payment_type,
                CASE p.payment_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'verified' WHEN 3 THEN 'rejected' ELSE 'pending'
                END AS payment_status,
                p.proof_image_path,
                vbu.full_name AS verified_by_name,
                r.reason AS return_reason,
                CASE r.return_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'approved' WHEN 3 THEN 'rejected' ELSE NULL
                END AS return_status,
                r.processed_by AS return_processed_by,
                rbu.full_name AS return_processed_by_name
            FROM orders o
            LEFT JOIN stations s   ON s.station_id  = o.station_id
            LEFT JOIN payments p   ON p.order_id    = o.order_id
            LEFT JOIN users vbu    ON vbu.user_id   = p.verified_by
            LEFT JOIN order_returns r  ON r.order_id = o.order_id
            LEFT JOIN users rbu    ON rbu.user_id   = r.processed_by
            WHERE o.order_id = ? AND o.user_id = ?
        `, [id, userId])
        if (!orders.length) return res.status(404).json({ message: 'Order not found' })

        const [items]: any = await pool.query(`
            SELECT oi.*, p.product_name, p.image_url, p.unit
            FROM order_items oi
            LEFT JOIN products p ON p.product_id = oi.product_id
            WHERE oi.order_id = ?
        `, [id])

        return res.json({ ...orders[0], items })
    } catch (err) {
        console.error('GET /customer/orders/:id error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// GET /customer/notifications — customers only see order and payment updates
router.get('/notifications', async (req, res) => {
    const userId = (req as any).user.id
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(`
            SELECT notification_id, message, notification_type, is_read, created_at
            FROM notifications
            WHERE user_id = ? AND notification_type IN (?, ?)
            ORDER BY created_at DESC
            LIMIT 50
        `, [userId, NOTIFICATION_TYPE.ORDER_UPDATE, NOTIFICATION_TYPE.PAYMENT_UPDATE])
        return res.json(rows)
    } catch (err) {
        console.error('GET /customer/notifications error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /customer/notifications/read-all
router.put('/notifications/read-all', async (req, res) => {
    const userId = (req as any).user.id
    try {
        const pool = await connectToDatabase()
        await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId])
        return res.json({ message: 'All marked as read' })
    } catch (err) {
        console.error('PUT /customer/notifications/read-all error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /customer/notifications/:id/read
router.put('/notifications/:id/read', async (req, res) => {
    const userId = (req as any).user.id
    const { id } = req.params
    try {
        const pool = await connectToDatabase()
        await pool.query('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?', [id, userId])
        return res.json({ message: 'Marked as read' })
    } catch (err) {
        console.error('PUT /customer/notifications/:id/read error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// DELETE /customer/notifications/:id
router.delete('/notifications/:id', async (req, res) => {
    const userId = (req as any).user.id
    const { id } = req.params
    try {
        const pool = await connectToDatabase()
        await pool.query('DELETE FROM notifications WHERE notification_id = ? AND user_id = ?', [id, userId])
        return res.json({ message: 'Deleted' })
    } catch (err) {
        console.error('DELETE /customer/notifications/:id error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /customer/orders/:id/cancel
// Customer can only cancel when status is 'confirmed'
router.put('/orders/:id/cancel', async (req, res) => {
    const userId = (req as any).user.id
    const { id } = req.params
    const { reason } = req.body
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(
            `SELECT order_id, order_status, station_id FROM orders WHERE order_id = ? AND user_id = ?`,
            [id, userId]
        )
        if (!rows.length) return res.status(404).json({ message: 'Order not found' })
        if (rows[0].order_status !== ORDER_STATUS.CONFIRMED)
            return res.status(400).json({ message: 'Order can no longer be cancelled' })

        await pool.query(
            `UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?`,
            [ORDER_STATUS.CANCELLED, id]
        )

        // Restore stock for each item back to inventory
        const [items]: any = await pool.query(
            `SELECT oi.product_id, oi.quantity, p.station_id
             FROM order_items oi
             JOIN products p ON p.product_id = oi.product_id
             WHERE oi.order_id = ?`,
            [id]
        )
        for (const item of items) {
            await pool.query(
                `UPDATE inventory SET quantity = quantity + ? WHERE product_id = ? AND station_id = ?`,
                [item.quantity, item.product_id, item.station_id]
            )
        }
        const cancelMsg = reason?.trim()
            ? `Your order has been cancelled. Reason: ${reason.trim()}`
            : 'Your order has been cancelled successfully.'
        await pool.query(
            `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read, created_at)
             VALUES (?, ?, ?, ?, 0, NOW())`,
            [userId, rows[0].station_id, cancelMsg, NOTIFICATION_TYPE.ORDER_UPDATE]
        )

        return res.json({ message: 'Order cancelled' })
    } catch (err) {
        console.error('PUT /customer/orders/:id/cancel error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /customer/orders/:id/return
// Customer can request return only when status is 'delivered'
router.post('/orders/:id/return', async (req, res) => {
    const userId = (req as any).user.id
    const { id } = req.params
    const { reason } = req.body
    if (!reason?.trim()) return res.status(400).json({ message: 'Reason is required' })
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(
            `SELECT order_id, order_status, station_id FROM orders WHERE order_id = ? AND user_id = ?`,
            [id, userId]
        )
        if (!rows.length) return res.status(404).json({ message: 'Order not found' })
        if (rows[0].order_status !== ORDER_STATUS.DELIVERED)
            return res.status(400).json({ message: 'Return can only be requested for delivered orders' })

        const [existing]: any = await pool.query(
            `SELECT return_id FROM order_returns WHERE order_id = ?`, [id]
        )
        if (existing.length) return res.status(409).json({ message: 'Return already requested' })

        await pool.query(
            `INSERT INTO order_returns (order_id, reason, return_status, created_at) VALUES (?, ?, ?, NOW())`,
            [id, reason.trim(), RETURN_STATUS.PENDING]
        )
        await pool.query(
            `UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?`,
            [ORDER_STATUS.RETURNED, id]
        )
        await pool.query(
            `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read, created_at)
             VALUES (?, ?, 'Your return request has been submitted and is under review.', ?, 0, NOW())`,
            [userId, rows[0].station_id, NOTIFICATION_TYPE.ORDER_UPDATE]
        )

        return res.status(201).json({ message: 'Return request submitted' })
    } catch (err) {
        console.error('POST /customer/orders/:id/return error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// DELETE /customer/orders/:id
// Customer can delete from history (delivered, cancelled, returned only)
router.delete('/orders/:id', async (req, res) => {
    const userId = (req as any).user.id
    const { id } = req.params
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(
            `SELECT order_id, order_status FROM orders WHERE order_id = ? AND user_id = ?`,
            [id, userId]
        )
        if (!rows.length) return res.status(404).json({ message: 'Order not found' })
        const { order_status } = rows[0]
        const deletableStatuses = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED]
        if (!deletableStatuses.includes(order_status))
            return res.status(400).json({ message: 'Only completed orders can be deleted' })

        await pool.query(`UPDATE orders SET hidden_at = NOW() WHERE order_id = ? AND user_id = ?`, [id, userId])
        return res.json({ message: 'Order deleted' })
    } catch (err) {
        console.error('DELETE /customer/orders/:id error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// DELETE /customer/account — soft-delete the customer's own account after password verify
router.delete('/account', async (req: any, res) => {
    const userId = req.user.id
    const { password } = req.body
    if (!password) return res.status(400).json({ message: 'Password is required' })
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(
            'SELECT password_hash FROM users WHERE user_id = ? AND deleted_at IS NULL', [userId]
        )
        if (!rows.length) return res.status(404).json({ message: 'Account not found' })
        const valid = await bcrypt.compare(password, rows[0].password_hash)
        if (!valid) return res.status(401).json({ message: 'Incorrect password' })
        // Wipe all customer data in dependency order
        const [orders]: any = await pool.query('SELECT order_id FROM orders WHERE user_id = ?', [userId])
        if (orders.length > 0) {
            const orderIds = orders.map((o: any) => o.order_id)
            await pool.query('DELETE FROM order_returns WHERE order_id IN (?)', [orderIds])
            await pool.query('DELETE FROM order_items WHERE order_id IN (?)', [orderIds])
            await pool.query('DELETE FROM payments WHERE order_id IN (?)', [orderIds])
            await pool.query('DELETE FROM orders WHERE order_id IN (?)', [orderIds])
        }
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId])
        await pool.query('UPDATE customers SET address = NULL, complete_address = NULL, latitude = NULL, longitude = NULL WHERE user_id = ?', [userId])
        await pool.query('UPDATE users SET deleted_at = NOW() WHERE user_id = ?', [userId])
        const isProd = process.env.NODE_ENV === 'production'
        res.clearCookie('token', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'strict' })
        return res.json({ message: 'Account deleted' })
    } catch (err) {
        console.error('DELETE /customer/account error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// Catch multer & other middleware errors — returns JSON instead of HTML
router.use((err: any, _req: any, res: any, _next: any) => {
    console.error('[customer router error]', err)
    res.status(400).json({ message: err.message ?? 'Request error' })
})

export default router