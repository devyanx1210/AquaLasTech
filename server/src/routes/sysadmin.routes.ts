// sysadmin.routes - /sysadmin/* endpoints (system admin only)
import express from 'express'
import bcrypt from 'bcrypt'
import { connectToDatabase } from '../config/db.js'
import { verifyToken } from '../middleware/verifyToken.middleware.js'

const router = express.Router()

const requireSysAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'sys_admin') {
        return res.status(403).json({ message: 'System admin access required' })
    }
    next()
}

router.use(verifyToken, requireSysAdmin)

// ── PUT /sysadmin/maintenance — toggle system-wide maintenance mode ──────────
router.put('/maintenance', async (req: any, res) => {
    const { maintenance, password } = req.body
    if (!password) return res.status(400).json({ message: 'Password is required' })
    try {
        const db = await connectToDatabase()

        const [rows]: any = await db.query(
            `SELECT password_hash FROM users WHERE user_id = ?`, [req.user.id]
        )
        if (!rows.length) return res.status(401).json({ message: 'Unauthorized' })
        const match = await bcrypt.compare(password, rows[0].password_hash)
        if (!match) return res.status(401).json({ message: 'Incorrect password' })

        try { await db.query(`ALTER TABLE stations ADD COLUMN status TINYINT DEFAULT 1 COMMENT '1=open,2=closed,3=maintenance'`) } catch { }
        const status = maintenance ? 3 : 1
        await db.query('UPDATE stations SET status = ?, updated_at = NOW()', [status])
        await db.query(
            `INSERT INTO system_logs (event_type, description, user_id) VALUES (?, ?, ?)`,
            [
                maintenance ? 'maintenance_on' : 'maintenance_off',
                maintenance ? 'System-wide maintenance mode enabled' : 'System-wide maintenance mode disabled',
                req.user?.id,
            ]
        )
        return res.json({ message: maintenance ? 'System set to maintenance' : 'System back online', status })
    } catch (err) {
        console.error('[SysAdmin] PUT /maintenance error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── GET /sysadmin/stations 
// Subquery ensures one row per station even if multiple super_admins exist
router.get('/stations', async (_req, res) => {
    try {
        const db = await connectToDatabase()
        const [rows]: any = await db.query(
            `SELECT s.station_id, s.station_name, s.address, s.contact_number,
                    s.latitude, s.longitude, s.status, s.created_at,
                    u.user_id AS admin_id, u.full_name AS admin_name, u.email AS admin_email
             FROM stations s
             LEFT JOIN users u ON u.user_id = (
                 SELECT sp.user_id FROM admins sp
                 INNER JOIN users su ON su.user_id = sp.user_id AND su.role = 3
                 WHERE sp.station_id = s.station_id
                 LIMIT 1
             )
             ORDER BY s.created_at DESC`
        )
        return res.json(rows)
    } catch (err) {
        console.error('[SysAdmin] GET /stations error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── POST /sysadmin/stations 
router.post('/stations', async (req: any, res) => {
    const {
        station_name, address, contact_number, latitude, longitude,
        admin_name, admin_email, admin_password,
        admin_address, admin_complete_address,
    } = req.body

    if (!station_name?.trim() || !address?.trim() || !contact_number?.trim()) {
        return res.status(400).json({ message: 'Station name, address, and contact are required' })
    }
    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'GPS coordinates are required' })
    }
    if (!admin_name?.trim() || !admin_email?.trim() || !admin_password?.trim()) {
        return res.status(400).json({ message: 'Super admin name, email, and password are required' })
    }
    if (!admin_address?.trim()) {
        return res.status(400).json({ message: 'Super admin address is required' })
    }

    try {
        const db = await connectToDatabase()
        const conn = await db.getConnection()
        try {
            await conn.beginTransaction()

            const [existing]: any = await conn.query(
                `SELECT user_id FROM users WHERE email = ?`, [admin_email.trim()]
            )
            if (existing.length > 0) {
                await conn.rollback()
                conn.release()
                return res.status(409).json({ message: 'That email is already in use' })
            }

            const [stationResult]: any = await conn.query(
                `INSERT INTO stations (station_name, address, contact_number, latitude, longitude, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
                [
                    station_name.trim(), address.trim(), contact_number.trim(),
                    latitude ? parseFloat(latitude) : null,
                    longitude ? parseFloat(longitude) : null,
                ]
            )
            const station_id = stationResult.insertId

            const hash = await bcrypt.hash(admin_password.trim(), 10)
            const [adminResult]: any = await conn.query(
                `INSERT INTO users (full_name, email, password_hash, role, created_at, updated_at)
                 VALUES (?, ?, ?, 3, NOW(), NOW())`,
                [admin_name.trim(), admin_email.trim(), hash]
            )
            const admin_user_id = adminResult.insertId
            await conn.query(
                `INSERT INTO admins (user_id, station_id) VALUES (?, ?)`,
                [admin_user_id, station_id]
            )
            await conn.query(
                `INSERT INTO customers (user_id, address, complete_address) VALUES (?, ?, ?)`,
                [admin_user_id, admin_address.trim(), admin_complete_address?.trim() || null]
            )

            await conn.query(
                `INSERT INTO system_logs (event_type, description, user_id) VALUES (?, ?, ?)`,
                [
                    'station_created',
                    `Station "${station_name.trim()}" created. Super admin: ${admin_email.trim()}`,
                    req.user?.id,
                ]
            )

            await conn.commit()
            return res.status(201).json({ message: 'Station and super admin created successfully' })
        } catch (err) {
            await conn.rollback()
            throw err
        } finally {
            conn.release()
        }
    } catch (err) {
        console.error('[SysAdmin] POST /stations error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── DELETE /sysadmin/stations/:id ───────────────────────────────────────────
router.delete('/stations/:id', async (req: any, res) => {
    const { password } = req.body
    const station_id = parseInt(req.params.id)

    if (!password) return res.status(400).json({ message: 'Password is required' })

    try {
        const db = await connectToDatabase()

        // Verify sys_admin password
        const [rows]: any = await db.query(
            `SELECT password_hash, full_name FROM users WHERE user_id = ?`, [req.user.id]
        )
        if (!rows.length) return res.status(401).json({ message: 'Unauthorized' })
        const match = await bcrypt.compare(password, rows[0].password_hash)
        if (!match) return res.status(401).json({ message: 'Incorrect password' })

        // Get station name for the log
        const [stations]: any = await db.query(
            `SELECT station_name FROM stations WHERE station_id = ?`, [station_id]
        )
        if (!stations.length) return res.status(404).json({ message: 'Station not found' })
        const stationName = stations[0].station_name

        const conn = await db.getConnection()
        try {
            await conn.beginTransaction()

            // Unassign all staff from this station (CASCADE on FK handles deletion via stations delete)
            await conn.query(`UPDATE admins SET station_id = NULL WHERE station_id = ?`, [station_id])

            // Delete inventory chain
            await conn.query(
                `DELETE it FROM inventory_transactions it
                 JOIN inventory i ON i.inventory_id = it.inventory_id
                 WHERE i.station_id = ?`, [station_id]
            )
            await conn.query(`DELETE FROM inventory WHERE station_id = ?`, [station_id])
            await conn.query(`DELETE FROM products WHERE station_id = ?`, [station_id])
            await conn.query(`DELETE FROM stations WHERE station_id = ?`, [station_id])

            // Log it
            await conn.query(
                `INSERT INTO system_logs (event_type, description, user_id) VALUES (?, ?, ?)`,
                ['station_deleted', `Station "${stationName}" was deleted`, req.user.id]
            )

            await conn.commit()
            return res.json({ message: 'Station deleted successfully' })
        } catch (err) {
            await conn.rollback()
            throw err
        } finally {
            conn.release()
        }
    } catch (err) {
        console.error('[SysAdmin] DELETE /stations error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── GET /sysadmin/logs ─────
router.get('/logs', async (_req, res) => {
    try {
        const db = await connectToDatabase()
        const [rows]: any = await db.query(
            `SELECT sl.log_id, sl.event_type, sl.description, sl.ip_address, sl.created_at,
                    u.full_name, u.email, u.role
             FROM system_logs sl
             LEFT JOIN users u ON u.user_id = sl.user_id
             ORDER BY sl.created_at DESC
             LIMIT 200`
        )
        return res.json(rows)
    } catch (err) {
        console.error('[SysAdmin] GET /logs error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ── DELETE /sysadmin/logs ──
router.delete('/logs', async (req: any, res) => {
    const { password } = req.body
    if (!password) return res.status(400).json({ message: 'Password is required' })

    try {
        const db = await connectToDatabase()

        const [rows]: any = await db.query(
            `SELECT password_hash FROM users WHERE user_id = ?`, [req.user.id]
        )
        if (!rows.length) return res.status(401).json({ message: 'Unauthorized' })
        const match = await bcrypt.compare(password, rows[0].password_hash)
        if (!match) return res.status(401).json({ message: 'Incorrect password' })

        await db.query(`DELETE FROM system_logs`)

        // Insert a fresh log that records the clear action
        await db.query(
            `INSERT INTO system_logs (event_type, description, user_id) VALUES (?, ?, ?)`,
            ['logs_cleared', 'All system logs were cleared by system admin', req.user.id]
        )

        return res.json({ message: 'Logs cleared' })
    } catch (err) {
        console.error('[SysAdmin] DELETE /logs error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

export default router
