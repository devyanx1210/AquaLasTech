// auth.routes - /auth/* endpoints for login, signup, and logout
import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { connectToDatabase } from "../config/db.js"
import dotenv from "dotenv"
import { verifyToken } from '../middleware/verifyToken.middleware.js'

dotenv.config()
const router = express.Router()

const ROLE_NAMES: Record<number, string> = {
    1: 'customer',
    2: 'admin',
    3: 'super_admin',
    4: 'sys_admin',
}

// POST /auth/signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password)
            return res.status(400).json({ message: "All fields required" })

        const db = await connectToDatabase()
        const [existing]: any = await db.query(
            "SELECT user_id FROM users WHERE email = ?", [email]
        )
        if (existing.length > 0)
            return res.status(409).json({ message: "User already exists" })

        const hash = await bcrypt.hash(password.toString(), 10)
        const [result]: any = await db.query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 1)",
            [name, email, hash]
        )
        await db.query(
            "INSERT INTO customers (user_id) VALUES (?)",
            [result.insertId]
        )
        return res.status(201).json({ Status: "Success" })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: "Server error" })
    }
})

// POST /auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body
        const db = await connectToDatabase()

        const [rows]: any = await db.query(
            `SELECT u.user_id, u.full_name, u.email, u.password_hash, u.role,
                    sp.station_id,
                    cp.address, cp.latitude, cp.longitude
             FROM users u
             LEFT JOIN admins sp ON sp.user_id = u.user_id
             LEFT JOIN customers cp ON cp.user_id = u.user_id
             WHERE u.email = ?`,
            [email]
        )
        if (!rows || rows.length === 0)
            return res.status(401).json({ message: "No email exists" })

        const user = rows[0]
        const match = await bcrypt.compare(password.toString(), user.password_hash)
        if (!match)
            return res.status(401).json({ message: "Password not matched" })

        const roleStr = ROLE_NAMES[user.role] ?? 'customer'
        const token = jwt.sign(
            { id: user.user_id, role: roleStr, station_id: user.station_id ?? null },
            process.env.JWT_KEY || "",
            { expiresIn: "3h" }
        )

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 60 * 60 * 1000,
        })

        // Log login event (non-critical — never fails the login)
        try {
            await db.query(
                `INSERT INTO system_logs (event_type, description, user_id, ip_address) VALUES (?, ?, ?, ?)`,
                [
                    'login',
                    `${user.role} "${user.full_name}" (${user.email}) logged in`,
                    user.user_id,
                    req.ip || null,
                ]
            )
        } catch { /* ignore logging errors */ }

        return res.json({
            Status: "Success",
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: roleStr,
                station_id: user.station_id ?? null,
                address: user.address ?? null,
                latitude: user.latitude != null ? parseFloat(user.latitude) : null,
                longitude: user.longitude != null ? parseFloat(user.longitude) : null,
            },
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Server error" })
    }
})

// GET /auth/me
router.get("/me", async (req, res) => {
    const token = (req as any).cookies?.token
    if (!token)
        return res.status(401).json({ message: "Not authenticated" })

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_KEY || "")
        const db = await connectToDatabase()

        const [rows]: any = await db.query(
            `SELECT u.user_id, u.full_name, u.email, u.role, u.profile_picture,
                    sp.station_id,
                    cp.address, cp.latitude, cp.longitude, cp.complete_address
             FROM users u
             LEFT JOIN admins sp ON sp.user_id = u.user_id
             LEFT JOIN customers cp ON cp.user_id = u.user_id
             WHERE u.user_id = ?`,
            [decoded.id]
        )
        if (!rows || rows.length === 0)
            return res.status(401).json({ message: "User not found" })

        const u = rows[0]
        return res.json({
            user: {
                user_id: u.user_id,
                full_name: u.full_name,
                email: u.email,
                role: ROLE_NAMES[u.role] ?? 'customer',
                station_id: u.station_id ?? null,
                address: u.address ?? null,
                latitude: u.latitude != null ? parseFloat(u.latitude) : null,
                longitude: u.longitude != null ? parseFloat(u.longitude) : null,
                complete_address: u.complete_address ?? null,
                profile_picture: u.profile_picture ?? null,
            },
        })
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" })
    }
})

// PUT /auth/profile — update own name and email (any authenticated user)
router.put('/profile', verifyToken, async (req, res) => {
    const user = (req as any).user
    const { full_name, email } = req.body
    if (!full_name?.trim()) return res.status(400).json({ message: 'Name is required' })
    if (!email?.trim()) return res.status(400).json({ message: 'Email is required' })
    try {
        const db = await connectToDatabase()
        const [existing]: any = await db.query(
            'SELECT user_id FROM users WHERE email = ? AND user_id != ?', [email.trim(), user.id]
        )
        if (existing.length) return res.status(409).json({ message: 'Email already in use' })
        await db.query(
            'UPDATE users SET full_name = ?, email = ?, updated_at = NOW() WHERE user_id = ?',
            [full_name.trim(), email.trim(), user.id]
        )
        return res.json({ message: 'Profile updated', full_name: full_name.trim(), email: email.trim() })
    } catch (err) {
        console.error('PUT /auth/profile error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// PUT /auth/change-password — change own password (any authenticated user)
router.put('/change-password', verifyToken, async (req, res) => {
    const user = (req as any).user
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) return res.status(400).json({ message: 'Both passwords required' })
    if (new_password.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' })
    try {
        const db = await connectToDatabase()
        const [rows]: any = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [user.id])
        if (!rows.length) return res.status(404).json({ message: 'User not found' })
        const valid = await bcrypt.compare(current_password, rows[0].password_hash)
        if (!valid) return res.status(401).json({ message: 'Current password is incorrect' })
        const hash = await bcrypt.hash(new_password, 10)
        await db.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?', [hash, user.id])
        return res.json({ message: 'Password changed successfully' })
    } catch (err) {
        console.error('PUT /auth/change-password error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// POST /auth/logout
router.post("/logout", (_req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    })
    return res.json({ Status: "Logged out" })
})

export default router