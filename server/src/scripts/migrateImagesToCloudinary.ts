// migrateImagesToCloudinary - uploads existing local images to Cloudinary and updates DB paths
import { v2 as cloudinary } from 'cloudinary'
import { connectToDatabase } from '../config/db.js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads')

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
})

async function uploadFile(localPath: string, folder: string): Promise<string> {
    const result = await cloudinary.uploader.upload(localPath, {
        folder: `aqualastech/${folder}`,
        resource_type: 'image',
    })
    return result.secure_url
}

async function migrate() {
    const db = await connectToDatabase()

    // --- Products ---
    console.log('\n=== Products ===')
    const [products]: any = await db.query(
        `SELECT product_id, image_url FROM products WHERE image_url IS NOT NULL AND image_url NOT LIKE 'http%'`
    )
    for (const row of products) {
        const filename = path.basename(row.image_url)
        const localFile = path.join(uploadsRoot, 'products', filename)
        if (!fs.existsSync(localFile)) { console.log(`  SKIP (missing): ${filename}`); continue }
        try {
            const url = await uploadFile(localFile, 'products')
            await db.query('UPDATE products SET image_url = ? WHERE product_id = ?', [url, row.product_id])
            console.log(`  OK product ${row.product_id}: ${url}`)
        } catch (e: any) { console.error(`  FAIL product ${row.product_id}:`, e.message) }
    }

    // --- Stations (image_path) ---
    console.log('\n=== Stations (image) ===')
    const [stations]: any = await db.query(
        `SELECT station_id, image_path FROM stations WHERE image_path IS NOT NULL AND image_path NOT LIKE 'http%'`
    )
    for (const row of stations) {
        const filename = path.basename(row.image_path)
        const localFile = path.join(uploadsRoot, 'stations', filename)
        if (!fs.existsSync(localFile)) { console.log(`  SKIP (missing): ${filename}`); continue }
        try {
            const url = await uploadFile(localFile, 'stations')
            await db.query('UPDATE stations SET image_path = ? WHERE station_id = ?', [url, row.station_id])
            console.log(`  OK station ${row.station_id}: ${url}`)
        } catch (e: any) { console.error(`  FAIL station ${row.station_id}:`, e.message) }
    }

    // --- Stations (qr_code_path) ---
    console.log('\n=== Stations (QR) ===')
    const [stationsQR]: any = await db.query(
        `SELECT station_id, qr_code_path FROM stations WHERE qr_code_path IS NOT NULL AND qr_code_path NOT LIKE 'http%'`
    ).catch(() => [[]])
    for (const row of stationsQR) {
        const filename = path.basename(row.qr_code_path)
        const localFile = path.join(uploadsRoot, 'qrcodes', filename)
        if (!fs.existsSync(localFile)) { console.log(`  SKIP (missing): ${filename}`); continue }
        try {
            const url = await uploadFile(localFile, 'qrcodes')
            await db.query('UPDATE stations SET qr_code_path = ? WHERE station_id = ?', [url, row.station_id])
            console.log(`  OK station QR ${row.station_id}: ${url}`)
        } catch (e: any) { console.error(`  FAIL station QR ${row.station_id}:`, e.message) }
    }

    // --- Users (profile_picture) ---
    console.log('\n=== Users (avatars) ===')
    const [users]: any = await db.query(
        `SELECT user_id, profile_picture FROM users WHERE profile_picture IS NOT NULL AND profile_picture NOT LIKE 'http%'`
    )
    for (const row of users) {
        const filename = path.basename(row.profile_picture)
        const localFile = path.join(uploadsRoot, 'avatars', filename)
        if (!fs.existsSync(localFile)) { console.log(`  SKIP (missing): ${filename}`); continue }
        try {
            const url = await uploadFile(localFile, 'avatars')
            await db.query('UPDATE users SET profile_picture = ? WHERE user_id = ?', [url, row.user_id])
            console.log(`  OK user ${row.user_id}: ${url}`)
        } catch (e: any) { console.error(`  FAIL user ${row.user_id}:`, e.message) }
    }

    // --- Payments (proof_image_path) ---
    console.log('\n=== Payments (receipts) ===')
    const [payments]: any = await db.query(
        `SELECT payment_id, proof_image_path FROM payments WHERE proof_image_path IS NOT NULL AND proof_image_path NOT LIKE 'http%'`
    )
    for (const row of payments) {
        const filename = path.basename(row.proof_image_path)
        const localFile = path.join(uploadsRoot, 'receipts', filename)
        if (!fs.existsSync(localFile)) { console.log(`  SKIP (missing): ${filename}`); continue }
        try {
            const url = await uploadFile(localFile, 'receipts')
            await db.query('UPDATE payments SET proof_image_path = ? WHERE payment_id = ?', [url, row.payment_id])
            console.log(`  OK payment ${row.payment_id}: ${url}`)
        } catch (e: any) { console.error(`  FAIL payment ${row.payment_id}:`, e.message) }
    }

    console.log('\nDone.')
    process.exit(0)
}

migrate().catch(err => { console.error(err); process.exit(1) })
