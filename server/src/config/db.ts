import mysql from "mysql2/promise"; //promise because we use await and async
import dotenv from "dotenv";

dotenv.config();

let connection;

export const connectToDatabase = async () => {
    if (!connection) {
        connection = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        })
    }
    return connection
}
