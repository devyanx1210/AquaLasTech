// pos.routes - /pos/* endpoints for point-of-sale transactions
import express from 'express'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'
import {
    ORDER_STATUS, PAYMENT_STATUS, PAYMENT_MODE,
    NOTIFICATION_TYPE, POS_PAYMENT_METHOD, POS_TRANSACTION_STATUS,
} from '../constants/dbEnums.js'
import { createUpload } from '../config/cloudinary.js'

const router = express.Router()
router.use(verifyToken)

const upload = createUpload('receipts')

// POST /pos/upload-receipt - Upload GCash receipt image
router.post('/upload-receipt', upload.single('receipt'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    return res.json({ image_url: req.file.path })
})

// POST /pos/transaction - Create POS transaction
router.post('/transaction', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id
    const {
        c_name, c_address,
        payment_method, // 'cash' | 'gcash'
        items,          // [{ product_id, quantity, price_snapshot }]
        total_amount,
        gcash_receipt_url,
        delivery_type,  // 'pickup' | 'delivery'
    } = req.body

    if (!items?.length || !total_amount || !payment_method) {
        return res.status(400).json({ message: 'Missing required fields' })
    }
    if (delivery_type === 'delivery' && !c_name?.trim()) {
        return res.status(400).json({ message: 'Customer name is required for delivery' })
    }
    if (delivery_type === 'delivery' && !c_address?.trim()) {
        return res.status(400).json({ message: 'Delivery address is required for delivery' })
    }

    const db = await connectToDatabase()
    const conn = await db.getConnection()

    try {
        await conn.beginTransaction()

        // Generate order reference
        const ref = `ORD-${Date.now()}`

        // Map payment_method string to TINYINT for orders.payment_mode
        const payment_mode_num = payment_method === 'gcash' ? PAYMENT_MODE.GCASH :
            delivery_type === 'delivery' ? PAYMENT_MODE.CASH_ON_DELIVERY : PAYMENT_MODE.CASH

        // Map payment_method string to TINYINT for pos_transactions.payment_method
        const pos_payment_method_num = payment_method === 'gcash'
            ? POS_PAYMENT_METHOD.GCASH : POS_PAYMENT_METHOD.CASH

        // 1. Create order — customer_name/address stored from POS form, user_id is the processing admin
        const [orderResult]: any = await conn.query(
            `INSERT INTO orders (station_id, order_reference, user_id, customer_name, customer_address, total_amount, payment_mode, order_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [station_id, ref, user.id, c_name?.trim() || 'Walk-in', c_address?.trim() || null, total_amount, payment_mode_num, ORDER_STATUS.CONFIRMED]
        )
        const order_id = orderResult.insertId

        // 2. Create order items + deduct inventory
        for (const item of items) {
            await conn.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_snapshot, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [order_id, item.product_id, item.quantity, item.price_snapshot]
            )

            // Deduct from inventory
            await conn.query(
                `UPDATE inventory SET quantity = quantity - ?, last_updated = NOW()
                 WHERE product_id = ? AND station_id = ? AND quantity >= ?`,
                [item.quantity, item.product_id, station_id, item.quantity]
            )

            // Check for low stock and notify all station admins
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
                    ).catch(() => { /* non-fatal */ })
                }
            }
        }

        // 3. Create payment record
        await conn.query(
            `INSERT INTO payments (order_id, payment_type, payment_status, proof_image_path, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [
                order_id,
                payment_mode_num,
                payment_method === 'gcash' ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.VERIFIED,
                gcash_receipt_url ?? null,
            ]
        )

        // 4. Create POS transaction record (store order_id so history JOIN works)
        await conn.query(
            `INSERT INTO pos_transactions (order_id, station_id, processed_by, full_name, full_address, total_amount, payment_method, transaction_status, transaction_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [order_id, station_id, user.id, c_name, c_address ?? null, total_amount, pos_payment_method_num, POS_TRANSACTION_STATUS.COMPLETED]
        )

        await conn.commit()

        return res.status(201).json({
            message: 'Transaction completed',
            order_id,
            order_reference: ref,
        })
    } catch (err) {
        await conn.rollback()
        console.error('POST /pos/transaction error:', err)
        return res.status(500).json({ message: 'Server error' })
    } finally {
        conn.release()
    }
})

// GET /pos/transactions - Get POS history for station
router.get('/transactions', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id

    try {
        const db = await connectToDatabase()
        const [rows]: any = await db.query(
            `SELECT
                pt.transaction_id, pt.order_id, pt.station_id, pt.processed_by,
                pt.full_name, pt.full_address, pt.total_amount, pt.transaction_date,
                CASE pt.payment_method
                    WHEN 1 THEN 'cash' WHEN 2 THEN 'gcash' ELSE 'cash'
                END AS payment_method,
                CASE pt.transaction_status
                    WHEN 1 THEN 'completed' WHEN 2 THEN 'cancelled' ELSE 'completed'
                END AS transaction_status,
                o.order_reference,
                CASE o.order_status
                    WHEN 1 THEN 'confirmed' WHEN 2 THEN 'preparing'
                    WHEN 3 THEN 'out_for_delivery' WHEN 4 THEN 'delivered'
                    WHEN 5 THEN 'cancelled' WHEN 6 THEN 'returned' ELSE 'confirmed'
                END AS order_status,
                CASE p.payment_status
                    WHEN 1 THEN 'pending' WHEN 2 THEN 'verified' WHEN 3 THEN 'rejected' ELSE 'pending'
                END AS payment_status,
                p.proof_image_path
             FROM pos_transactions pt
             LEFT JOIN orders o ON o.order_id = pt.order_id
             LEFT JOIN payments p ON p.order_id = pt.order_id
             WHERE pt.station_id = ?
             ORDER BY pt.transaction_date DESC
             LIMIT 100`,
            [station_id]
        )
        return res.json(rows)
    } catch (err) {
        console.error('GET /pos/transactions error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

export default router