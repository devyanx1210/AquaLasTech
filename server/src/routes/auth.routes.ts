// auth.routes - /auth/* endpoints for login, signup, and logout
import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { connectToDatabase } from "../config/db.js"
import dotenv from "dotenv"
import { verifyToken } from '../middleware/verifyToken.middleware.js'

dotenv.config()
const router = express.Router()

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
        await db.query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [name, email, hash, "customer"]
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
            `SELECT user_id, full_name, email, password_hash, role, station_id,
                    address, latitude, longitude
             FROM users WHERE email = ?`,
            [email]
        )
        if (!rows || rows.length === 0)
            return res.status(401).json({ message: "No email exists" })

        const user = rows[0]
        const match = await bcrypt.compare(password.toString(), user.password_hash)
        if (!match)
            return res.status(401).json({ message: "Password not matched" })

        const token = jwt.sign(
            { id: user.user_id, role: user.role, station_id: user.station_id },
            process.env.JWT_KEY || "",
            { expiresIn: "3h" }
        )

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3 * 60 * 60 * 1000,
        })

        return res.json({
            Status: "Success",
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                station_id: user.station_id,
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
            `SELECT user_id, full_name, email, role, station_id,
                    address, latitude, longitude, complete_address
             FROM users WHERE user_id = ?`,
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
                role: u.role,
                station_id: u.station_id,
                address: u.address ?? null,
                latitude: u.latitude != null ? parseFloat(u.latitude) : null,
                longitude: u.longitude != null ? parseFloat(u.longitude) : null,
                complete_address: u.complete_address ?? null,
            },
        })
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" })
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