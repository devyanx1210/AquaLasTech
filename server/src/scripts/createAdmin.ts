// createAdmin - CLI script to create a new admin user
import bcrypt from "bcrypt";
import { connectToDatabase } from "../config/db.js";

const createAdmin = async () => {
    const name = "Super Admin";
    const email = "admin@gmail.com";
    const password = "admin";

    const hash = await bcrypt.hash(password, 10);
    const db = await connectToDatabase();

    await db.query(
        "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [name, email, hash, "admin"]
    );

    console.log("Admin created successfully");
    process.exit(0);
};

createAdmin();