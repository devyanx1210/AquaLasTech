import express from 'express'
import bcrypt from 'bcrypt'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'

const router = express.Router()

// All settings routes require authentication
router.use(verifyToken)

// ── PUT /settings/station/:id — Update station details ────────────────────
router.put('/station/:id', async (req, res) => {
    const { station_name, address, contact_number, latitude, longitude } = req.body
    const { id } = req.params

    if (!station_name || !address || !contact_number) {
        return res.status(400).json({ message: 'Station name, address and contact number are required' })
    }

    try {
        const db = await connectToDatabase()

        const [result]: any = await db.query(
            `UPDATE stations
             SET station_name = ?, address = ?, contact_number = ?,
                 latitude = ?, longitude = ?, updated_at = NOW()
             WHERE station_id = ?`,
            [
                station_name,
                address,
                contact_number,
                latitude ?? null,
                longitude ?? null,
                id,
            ]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Station not found' })
        }

        return res.json({ message: 'Station updated successfully' })

    } catch (err) {
        console.error('PUT /settings/station error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── POST /settings/create-admin — Create new admin under same station ─────
router.post('/create-admin', async (req, res) => {
    const { full_name, email, password, station_id } = req.body

    if (!full_name || !email || !password || !station_id) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    try {
        const db = await connectToDatabase()

        // Check if email already exists
        const [existing]: any = await db.query(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        )

        if (existing.length > 0) {
            return res.status(409).json({ message: 'An account with this email already exists' })
        }

        // Verify the station exists
        const [stationRows]: any = await db.query(
            'SELECT station_id FROM stations WHERE station_id = ?',
            [station_id]
        )

        if (stationRows.length === 0) {
            return res.status(404).json({ message: 'Station not found' })
        }

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