// verifyToken.middleware - validates the auth token from cookies or headers
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const cookieToken = (req as any).cookies?.token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) {
        return res.status(401).json({ message: "No token, access denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY || "");
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};