import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { connectToDatabase } from "../config/db.js";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";

dotenv.config();
const router = express.Router();


router.post("/signup", async (req, res) => {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const db = await connectToDatabase();

        const [existingRows]: any = await db.query(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        );

        if (existingRows.length > 0) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hash = await bcrypt.hash(password.toString(), 10);

        await db.query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [name, email, hash, "customer"]
        );

        return res.status(201).json({ Status: "Success" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});



router.post("/login", async (req, res) => {
    try {

        const { email, password } = req.body;
        const db = await connectToDatabase();

        const [rows]: any = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (!rows || rows.length === 0) {
            return res.status(401).json({ message: "No email exists" });
        }

        const user = rows[0];

        const match = await bcrypt.compare(
            password.toString(),
            user.password_hash
        );

        if (!match) {
            return res.status(401).json({ message: "Password not matched" });
        }
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_KEY || "",
            { expiresIn: "3h" }
        );

        res.cookie("token", token, {
            httpOnly: true,     // JS cannot read it (XSS safe)
            secure: process.env.NODE_ENV === "production", // HTTPS only in prod
            sameSite: "strict", // CSRF protection
            maxAge: 3 * 60 * 60 * 1000 // 3 hours in milliseconds
        })

        return res.json({
            Status: "Success",
            user: {
                id: user.user_id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});


router.get("/me", async (req, res) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_KEY || "");
        const db = await connectToDatabase();

        const [rows]: any = await db.query(
            "SELECT user_id, full_name, email, role FROM users WHERE user_id = ?",
            [decoded.id]
        );

        if (!rows || rows.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        return res.json({ user: rows[0] });
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
});

router.get("/me", async (req, res) => {
    const token = (req as any).cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_KEY || "");
        const db = await connectToDatabase();

        const [rows]: any = await db.query(
            "SELECT user_id, full_name, email, role FROM users WHERE user_id = ?",
            [decoded.id]
        );

        if (!rows || rows.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        return res.json({ user: rows[0] });

    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
});

router.post("/logout", (_req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });
    return res.json({ Status: "Logged out" });
});

export default router;
