import express from 'express'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'

const router = express.Router()

// GET /stations/:id — get station details by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const pool = await connectToDatabase()
        const [rows]: any = await pool.query(
            `SELECT station_id, station_name, address, contact_number, status, latitude, longitude
             FROM stations 
             WHERE station_id = ?`,
            [req.params.id]
        )

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Station not found' })
        }

        return res.json(rows[0])
    } catch (err) {
        console.error('GET /stations/:id error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

export default router