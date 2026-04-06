// db - MySQL connection pool and database initialization
import mysql from "mysql2/promise"; //promise because we use await and async
import dotenv from "dotenv";

dotenv.config({ quiet: true });

let connection: mysql.Pool | null = null;

export const connectToDatabase = async () => {
    if (!connection) {
        connection = await mysql.createPool({
            host: process.env.DB_HOST as string,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
            user: process.env.DB_USER as string,
            password: process.env.DB_PASSWORD as string,
            database: process.env.DB_NAME as string,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        })
    }
    return connection
}
