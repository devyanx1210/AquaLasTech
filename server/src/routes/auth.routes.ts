// auth.routes - /auth/* endpoints for login, signup, and logout
import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import nodemailer from "nodemailer"
import { connectToDatabase } from "../config/db.js"
import dotenv from "dotenv"
import { verifyToken } from '../middleware/verifyToken.middleware.js'

dotenv.config({ quiet: true })
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
        const [anyExisting]: any = await db.query(
            "SELECT user_id, deleted_at FROM users WHERE email = ?", [email]
        )
        if (anyExisting.length > 0) {
            const existing = anyExisting[0]
            if (!existing.deleted_at) {
                // Active account already exists
                return res.status(409).json({ message: "User already exists" })
            }
            // Reactivate soft-deleted account with new name and password
            const hash = await bcrypt.hash(password.toString(), 10)
            await db.query(
                "UPDATE users SET full_name = ?, password_hash = ?, deleted_at = NULL, updated_at = NOW() WHERE user_id = ?",
                [name, hash, existing.user_id]
            )
            return res.status(201).json({ Status: "Success" })
        }

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
             WHERE u.email = ? AND u.deleted_at IS NULL`,
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

        const isProd = process.env.NODE_ENV === "production"
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "strict",
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
             WHERE u.user_id = ? AND u.deleted_at IS NULL`,
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

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body
    if (!email?.trim())
        return res.status(400).json({ message: "Email is required" })

    // Always return same response to prevent email enumeration
    const generic = { message: "If that email exists, a reset link has been sent." }

    try {
        const db = await connectToDatabase()
        const [rows]: any = await db.query(
            "SELECT user_id, full_name FROM users WHERE email = ? AND deleted_at IS NULL", [email.trim()]
        )
        if (!rows.length) return res.json(generic)

        const user = rows[0]

        // Invalidate any previous unused tokens for this user
        await db.query(
            "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0", [user.user_id]
        )

        // Generate secure random token, store only the hash
        const rawToken = crypto.randomBytes(32).toString("hex")
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        await db.query(
            "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
            [user.user_id, tokenHash, expiresAt]
        )

        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        })

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: email.trim(),
            subject: "AquaLasTech — Password Reset",
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
                    <h2 style="color:#2355b0;margin-bottom:8px">Password Reset</h2>
                    <p>Hi <strong>${user.full_name}</strong>,</p>
                    <p>We received a request to reset your AquaLasTech password. Click the button below to set a new password.</p>
                    <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#3b5de7;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
                        Reset Password
                    </a>
                    <p style="color:#6b7280;font-size:13px">This link expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
                    <p style="color:#9ca3af;font-size:12px">AquaLasTech — Smart Water Ordering & Inventory Management</p>
                </div>
            `,
        })

        return res.json(generic)
    } catch (err) {
        console.error("POST /auth/forgot-password error:", err)
        return res.status(500).json({ message: "Server error" })
    }
})

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
    const { token, new_password } = req.body
    if (!token || !new_password)
        return res.status(400).json({ message: "Token and new password are required" })
    if (new_password.length < 6)
        return res.status(400).json({ message: "Password must be at least 6 characters" })

    try {
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
        const db = await connectToDatabase()

        const [rows]: any = await db.query(
            `SELECT id, user_id, expires_at, used
             FROM password_reset_tokens
             WHERE token_hash = ?`,
            [tokenHash]
        )

        if (!rows.length)
            return res.status(400).json({ message: "Invalid or expired reset link" })

        const record = rows[0]

        if (record.used)
            return res.status(400).json({ message: "This reset link has already been used" })

        if (new Date() > new Date(record.expires_at))
            return res.status(400).json({ message: "Reset link has expired. Please request a new one." })

        const hash = await bcrypt.hash(new_password, 10)

        await db.query(
            "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?",
            [hash, record.user_id]
        )

        // Mark token as used (one-time use)
        await db.query(
            "UPDATE password_reset_tokens SET used = 1 WHERE id = ?",
            [record.id]
        )

        return res.json({ message: "Password reset successfully. You can now log in." })
    } catch (err) {
        console.error("POST /auth/reset-password error:", err)
        return res.status(500).json({ message: "Server error" })
    }
})

// POST /auth/logout
router.post("/logout", (_req, res) => {
    const isProd = process.env.NODE_ENV === "production"
    res.clearCookie("token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "strict",
    })
    return res.json({ Status: "Logged out" })
})

export default router