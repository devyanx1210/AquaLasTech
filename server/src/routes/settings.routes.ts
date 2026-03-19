// settings.routes - /settings/* endpoints for station configuration
import express from 'express'
import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()
router.use(verifyToken)

// Super admin guard
router.use((req, res, next) => {
    const u = (req as any).user
    if (u?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin access required' })
    }
    next()
})

// Multer — station logos
const logoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'stations')
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `logo_${Date.now()}${ext}`)
    },
})
const uploadLogo = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true)
        else cb(new Error('Images only'))
    },
})

// Multer — GCash QR codes
const qrStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'qrcodes')
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `qr_${Date.now()}${ext}`)
    },
})
const uploadQR = multer({
    storage: qrStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true)
        else cb(new Error('Images only'))
    },
})

// Auto-add complete_address column if not yet present
;(async () => {
    try {
        const db = await connectToDatabase()
        await db.query('ALTER TABLE stations ADD COLUMN complete_address VARCHAR(500) NULL')
    } catch { /* column already exists — ignore */ }
})()

// PUT /settings/station/:id — Update station details
router.put('/station/:id', async (req, res) => {
    const { station_name, address, complete_address, contact_number, latitude, longitude } = req.body
    const { id } = req.params

    if (!station_name || !address || !contact_number) {
        return res.status(400).json({ message: 'Station name, address and contact number are required' })
    }

    try {
        const db = await connectToDatabase()
        const [result]: any = await db.query(
            `UPDATE stations
             SET station_name = ?, address = ?, complete_address = ?, contact_number = ?,
                 latitude = ?, longitude = ?, updated_at = NOW()
             WHERE station_id = ?`,
            [station_name, address, complete_address ?? null, contact_number, latitude ?? null, longitude ?? null, id]
        )
        if (result.affectedRows === 0)
            return res.status(404).json({ message: 'Station not found' })
        return res.json({ message: 'Station updated successfully' })
    } catch (err) {
        console.error('PUT /settings/station error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /settings/station/:id/upload-logo
router.post('/station/:id/upload-logo', uploadLogo.single('logo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const image_path = `/uploads/stations/${req.file.filename}`
    try {
        const db = await connectToDatabase()
        await db.query(
            'UPDATE stations SET image_path = ?, updated_at = NOW() WHERE station_id = ?',
            [image_path, req.params.id]
        )
        return res.json({ image_path })
    } catch (err: any) {
        console.error('POST /settings/upload-logo error:', err?.message ?? err)
        return res.status(500).json({ message: err?.message ?? 'Server error' })
    }
})

// POST /settings/station/:id/upload-qr
router.post('/station/:id/upload-qr', uploadQR.single('qr'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const qr_code_path = `/uploads/qrcodes/${req.file.filename}`
    try {
        const db = await connectToDatabase()
        // Auto-add column if migration hasn't been run yet
        try {
            await db.query('ALTER TABLE stations ADD COLUMN qr_code_path VARCHAR(500) NULL')
        } catch { /* column already exists — ignore */ }
        await db.query(
            'UPDATE stations SET qr_code_path = ?, updated_at = NOW() WHERE station_id = ?',
            [qr_code_path, req.params.id]
        )
        return res.json({ qr_code_path })
    } catch (err: any) {
        console.error('POST /settings/upload-qr error:', err?.message ?? err)
        return res.status(500).json({ message: err?.message ?? 'Server error' })
    }
})

// POST /settings/create-admin
router.post('/create-admin', async (req, res) => {
    const { full_name, email, password, station_id } = req.body
    if (!full_name || !email || !password || !station_id)
        return res.status(400).json({ message: 'All fields are required' })

    try {
        const db = await connectToDatabase()
        const [existing]: any = await db.query('SELECT user_id FROM users WHERE email = ?', [email])
        if (existing.length > 0)
            return res.status(409).json({ message: 'An account with this email already exists' })

        const [stationRows]: any = await db.query('SELECT station_id FROM stations WHERE station_id = ?', [station_id])
        if (stationRows.length === 0)
            return res.status(404).json({ message: 'Station not found' })

        const password_hash = await bcrypt.hash(password, 10)
        await db.query(
            `INSERT INTO users (full_name, email, password_hash, role, station_id, created_at, updated_at)
             VALUES (?, ?, ?, 'admin', ?, NOW(), NOW())`,
            [full_name, email, password_hash, station_id]
        )
        return res.status(201).json({ message: `Admin account for ${full_name} created successfully` })
    } catch (err) {
        console.error('POST /settings/create-admin error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

export default router