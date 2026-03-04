import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/auth.routes.js";
import stationRoutes from "./routes/station.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import ordersRoutes from "./routes/order.routes.js";
import posRoutes from "./routes/pos.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import customerRoutes from "./routes/customer.routes.js";  // ← NEW

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));

// ── Helmet — allow cross-origin images ────────────────────────────────────
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded files as static ────────────────────────────────────────
// Covers /uploads/products/, /uploads/stations/, /uploads/receipts/
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
    res.json({ message: "AquaLasTech API is running" });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/stations", stationRoutes);
app.use("/settings", settingsRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/orders", ordersRoutes);
app.use("/pos", posRoutes);
app.use("/reports", reportsRoutes);
app.use("/customer", customerRoutes);   // ← NEW: PUT /customer/profile & /customer/password

export default app;