// inventory.routes - /inventory/* endpoints for stock management
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'
import { TRANSACTION_TYPE, NOTIFICATION_TYPE } from '../constants/dbEnums.js'

const router = express.Router()
router.use(verifyToken)

// Multer setup — saves to /uploads/products/
const uploadDir = path.join(process.cwd(), 'uploads', 'products')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        const name = `product_${Date.now()}${ext}`
        cb(null, name)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (allowed.includes(file.mimetype)) cb(null, true)
        else cb(new Error('Only image files are allowed'))
    },
})

// POST /inventory/upload-image — Upload product image
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' })
    // Return the public URL path the frontend can use
    const imageUrl = `/uploads/products/${req.file.filename}`
    return res.json({ image_url: imageUrl })
})

// GET /inventory — Get all products + stock for a station
router.get('/', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id
    if (!station_id) return res.status(400).json({ message: 'No station assigned' })

    try {
        const db = await connectToDatabase()
        const [rows]: any = await db.query(
            `SELECT 
                p.product_id, p.product_name, p.description, p.price, p.unit,
                p.image_url, p.is_active,
                COALESCE(i.quantity, 0) AS quantity,
                COALESCE(i.min_stock_level, 5) AS min_stock_level,
                i.inventory_id
             FROM products p
             LEFT JOIN inventory i ON i.product_id = p.product_id AND i.station_id = ?
             WHERE p.station_id = ?
             ORDER BY p.created_at DESC`,
            [station_id, station_id]
        )
        return res.json(rows)
    } catch (err) {
        console.error('GET /inventory error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /inventory/products — Add new product
router.post('/products', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id
    const { product_name, description, price, unit, image_url, min_stock_level } = req.body

    if (!product_name || !price || !unit) {
        return res.status(400).json({ message: 'Product name, price and unit are required' })
    }

    try {
        const db = await connectToDatabase()

        const [productResult]: any = await db.query(
            `INSERT INTO products (station_id, product_name, description, price, unit, image_url, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [station_id, product_name, description ?? null, price, unit, image_url ?? null]
        )
        const product_id = productResult.insertId

        await db.query(
            `INSERT INTO inventory (station_id, product_id, quantity, min_stock_level, last_updated)
             VALUES (?, ?, 0, ?, NOW())`,
            [station_id, product_id, min_stock_level ?? 5]
        )

        return res.status(201).json({ message: 'Product added', product_id })
    } catch (err: any) {
        console.error('POST /inventory/products error:', err)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A product with this name already exists in your station' })
        }
        return res.status(500).json({ message: 'Server error' })
    }
})

// DELETE /inventory/products/:id — Delete product
router.delete('/products/:id', async (req, res) => {
    const { id } = req.params
    try {
        const db = await connectToDatabase()
        await db.query('DELETE FROM inventory WHERE product_id = ?', [id])
        await db.query('DELETE FROM products WHERE product_id = ?', [id])
        return res.json({ message: 'Product deleted' })
    } catch (err) {
        console.error('DELETE /inventory/products error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /inventory/products/:id — Edit product details
router.put('/products/:id', async (req, res) => {
    const { id } = req.params
    const user = (req as any).user
    const station_id = user.station_id
    const { product_name, description, price, unit, image_url, is_active, min_stock_level } = req.body

    try {
        const db = await connectToDatabase()

        await db.query(
            `UPDATE products SET product_name=?, description=?, price=?, unit=?, image_url=?, is_active=?, updated_at=NOW()
             WHERE product_id=?`,
            [product_name, description ?? null, price, unit, image_url ?? null, is_active ?? 1, id]
        )

        if (min_stock_level !== undefined) {
            // Upsert so it works even if no inventory row exists yet for this product
            await db.query(
                `INSERT INTO inventory (station_id, product_id, quantity, min_stock_level, last_updated)
                 VALUES (?, ?, 0, ?, NOW())
                 ON DUPLICATE KEY UPDATE min_stock_level = VALUES(min_stock_level), last_updated = NOW()`,
                [station_id, id, min_stock_level]
            )
        }

        return res.json({ message: 'Product updated' })
    } catch (err) {
        console.error('PUT /inventory/products error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /inventory/restock — Restock a product
router.post('/restock', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id
    const { inventory_id, product_id, quantity, notes } = req.body

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0' })
    }

    try {
        const db = await connectToDatabase()

        await db.query(
            `UPDATE inventory SET quantity = quantity + ?, last_updated = NOW() WHERE inventory_id = ?`,
            [quantity, inventory_id]
        )

        await db.query(
            `INSERT INTO inventory_transactions (inventory_id, station_id, product_id, transaction_type, quantity, notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [inventory_id, station_id, product_id, TRANSACTION_TYPE.RESTOCK, quantity, notes ?? null]
        )

        const [inv]: any = await db.query(
            `SELECT quantity, min_stock_level FROM inventory WHERE inventory_id = ?`,
            [inventory_id]
        )

        return res.json({ message: 'Restocked successfully', new_quantity: inv[0]?.quantity })
    } catch (err) {
        console.error('POST /inventory/restock error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /inventory/check-low-stock — scan inventory and notify admins of low stock items
router.post('/check-low-stock', async (req, res) => {
    const user = (req as any).user
    const station_id = user.station_id
    if (!station_id) return res.json({ low_stock_count: 0 })

    try {
        const db = await connectToDatabase()

        // Get all low/out-of-stock items for this station
        const [lowItems]: any = await db.query(
            `SELECT i.inventory_id, i.quantity, i.min_stock_level, p.product_name
             FROM inventory i
             JOIN products p ON p.product_id = i.product_id
             WHERE i.station_id = ? AND i.quantity <= i.min_stock_level AND p.is_active = 1`,
            [station_id]
        )

        if (lowItems.length === 0) return res.json({ low_stock_count: 0 })

        // Get all admins for this station
        const [stationAdmins]: any = await db.query(
            `SELECT u.user_id FROM admins sp
             JOIN users u ON u.user_id = sp.user_id AND u.role IN (2, 3)
             WHERE sp.station_id = ?`,
            [station_id]
        )

        for (const item of lowItems) {
            const msg = item.quantity === 0
                ? `${item.product_name} is out of stock.`
                : `${item.product_name} is running low — only ${item.quantity} left.`

            for (const admin of stationAdmins) {
                // Only insert if no unread notification for this item exists today
                const [existing]: any = await db.query(
                    `SELECT notification_id FROM notifications
                     WHERE user_id = ? AND message = ? AND is_read = 0
                       AND created_at >= CURDATE()
                     LIMIT 1`,
                    [admin.user_id, msg]
                )
                if (existing.length === 0) {
                    await db.query(
                        `INSERT INTO notifications (user_id, station_id, message, notification_type, is_read, created_at)
                         VALUES (?, ?, ?, ?, 0, NOW())`,
                        [admin.user_id, station_id, msg, NOTIFICATION_TYPE.INVENTORY_ALERT]
                    )
                }
            }
        }

        return res.json({ low_stock_count: lowItems.length })
    } catch (err) {
        console.error('POST /inventory/check-low-stock error:', err)
        return res.json({ low_stock_count: 0 })
    }
})

export default router