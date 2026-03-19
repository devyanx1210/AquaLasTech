// station.routes - /stations/* endpoints for admin station management
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Multer setup for station images
const stationImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'stations')
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `station_${req.params.id}_${Date.now()}${ext}`)
    },
})

const uploadStationImage = multer({
    storage: stationImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
        if (/image\/(jpeg|jpg|png|webp)/.test(file.mimetype)) cb(null, true)
        else cb(new Error('Only image files are allowed'))
    },
})

// GET /stations/customer/list
// IMPORTANT: Must be BEFORE /:id so Express doesn't treat "customer" as an ID
router.get('/customer/list', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(`
            SELECT
                s.station_id,
                s.station_name,
                s.address,
                s.complete_address,
                s.latitude,
                s.longitude,
                s.image_path,
                s.contact_number,
                s.qr_code_path,
                COALESCE(SUM(i.quantity), 0) AS total_stock
            FROM stations s
            LEFT JOIN inventory i ON i.station_id = s.station_id
            WHERE s.status != 'closed'
            GROUP BY s.station_id
            ORDER BY s.station_name ASC
        `)
        return res.json(rows)
    } catch (err) {
        console.error('GET /stations/customer/list error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// GET /stations/:id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(
            `SELECT station_id, station_name, address, complete_address, contact_number, status,
                    latitude, longitude, image_path, qr_code_path
             FROM stations
             WHERE station_id = ?`,
            [req.params.id]
        )
        if (!rows || rows.length === 0)
            return res.status(404).json({ message: 'Station not found' })
        return res.json(rows[0])
    } catch (err) {
        console.error('GET /stations/:id error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /stations/:id/upload-image
router.post('/:id/upload-image', verifyToken, uploadStationImage.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const image_path = `/uploads/stations/${req.file.filename}`
    try {
        const pool = await connectToDatabase()
        await pool.query(
            'UPDATE stations SET image_path = ? WHERE station_id = ?',
            [image_path, req.params.id]
        )
        return res.json({ image_path })
    } catch (err) {
        console.error('POST /stations/:id/upload-image error:', err)
        return res.status(500).json({ message: 'Failed to save image' })
    }
})

export default router