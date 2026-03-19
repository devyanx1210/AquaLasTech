// pos.routes - /pos/* endpoints for point-of-sale transactions
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'

const router = express.Router()
router.use(verifyToken)

// Multer for GCash receipts
const uploadDir = path.join(process.cwd(), 'uploads', 'receipts')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `receipt_${Date.now()}${ext}`)
    },
})
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp']
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Images only'))
    },
})

// POST /pos/upload-receipt - Upload GCash receipt image
router.post('/upload-receipt', upload.single('receipt'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    return res.json({ image_url: `/uploads/receipts/${req.file.filename}` })
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

        // Map payment_method to payment_mode enum
        const payment_mode = payment_method === 'gcash' ? 'gcash' :
            delivery_type === 'delivery' ? 'delivery' : 'cash'

        // 1. Create order — customer_name/address stored from POS form, user_id is the processing admin
        const [orderResult]: any = await conn.query(
            `INSERT INTO orders (station_id, order_reference, user_id, customer_name, customer_address, total_amount, payment_mode, order_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW(), NOW())`,
            [station_id, ref, user.id, c_name?.trim() || 'Walk-in', c_address?.trim() || null, total_amount, payment_mode]
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
        }

        // 3. Create payment record
        await conn.query(
            `INSERT INTO payments (order_id, payment_type, payment_status, proof_image_path, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [
                order_id,
                payment_method,
                payment_method === 'gcash' ? 'pending' : 'verified',
                gcash_receipt_url ?? null,
            ]
        )

        // 4. Create POS transaction record
        await conn.query(
            `INSERT INTO pos_transactions (station_id, processed_by, full_name, full_address, total_amount, payment_method, transaction_status, transaction_date)
             VALUES (?, ?, ?, ?, ?, ?, 'completed', NOW())`,
            [station_id, user.id, c_name, c_address ?? null, total_amount, payment_method]
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
            `SELECT pt.*, o.order_reference, o.order_status,
                    p.payment_status, p.proof_image_path
             FROM pos_transactions pt
             JOIN orders o ON o.order_id = pt.order_id
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