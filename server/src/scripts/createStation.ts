import { connectToDatabase } from '../config/db.js'
import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const ask = (question: string): Promise<string> =>
    new Promise(resolve => rl.question(question, resolve))

async function createStation() {
    console.log('\n🚰 AquLasTech — Create Water Refilling Station\n')
    console.log('─'.repeat(45))

    const pool = await connectToDatabase()

    try {
        // ── Step 1: Collect station details ──────────────────
        const station_name = await ask('Station Name       : ')
        const address = await ask('Address            : ')
        const latitude = await ask('Latitude  (optional, press Enter to skip): ')
        const longitude = await ask('Longitude (optional, press Enter to skip): ')
        const contact_number = await ask('Contact Number     : ')

        if (!station_name || !address || !contact_number) {
            console.error('\n❌ Station name, address, and contact number are required.')
            process.exit(1)
        }

        // ── Step 2: Show available admin users ────────────────
        console.log('\n📋 Available admin users:\n')
        const [adminRows]: any = await pool.query(
            `SELECT user_id, full_name, email, station_id 
             FROM users 
             WHERE role = 'admin' 
             ORDER BY user_id ASC`
        )

        if (adminRows.length === 0) {
            console.error('❌ No admin users found. Run createAdmin.ts first.')
            process.exit(1)
        }

        adminRows.forEach((u: any) => {
            const assigned = u.station_id ? ` (already assigned to Station #${u.station_id})` : ' (unassigned)'
            console.log(`  [${u.user_id}] ${u.full_name} — ${u.email}${assigned}`)
        })

        const adminIdInput = await ask('\nEnter the user_id of the admin to assign: ')
        const admin_user_id = parseInt(adminIdInput)

        const selectedAdmin = adminRows.find((u: any) => u.user_id === admin_user_id)
        if (!selectedAdmin) {
            console.error('\n❌ Invalid user_id. Must match one of the listed admins.')
            process.exit(1)
        }

        // ── Step 3: Insert the station ────────────────────────
        console.log('\n⏳ Creating station...')

        const [stationResult]: any = await pool.query(
            `INSERT INTO stations 
                (station_name, address, latitude, longitude, contact_number, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
            [
                station_name,
                address,
                latitude ? parseFloat(latitude) : null,
                longitude ? parseFloat(longitude) : null,
                contact_number,
            ]
        )

        const new_station_id = stationResult.insertId
        console.log(`✅ Station created with ID: ${new_station_id}`)

        // ── Step 4: Assign station to the selected admin ──────
        await pool.query(
            `UPDATE users SET station_id = ?, updated_at = NOW() WHERE user_id = ?`,
            [new_station_id, admin_user_id]
        )
        console.log(`✅ Station assigned to admin: ${selectedAdmin.full_name} (user_id: ${admin_user_id})`)

        // ── Step 5: Summary ───────────────────────────────────
        console.log('\n' + '─'.repeat(45))
        console.log('🎉 Station setup complete!\n')
        console.log(`  Station ID   : ${new_station_id}`)
        console.log(`  Station Name : ${station_name}`)
        console.log(`  Address      : ${address}`)
        console.log(`  Contact      : ${contact_number}`)
        console.log(`  Assigned To  : ${selectedAdmin.full_name} (user_id: ${admin_user_id})`)
        console.log('─'.repeat(45) + '\n')

    } catch (err: any) {
        console.error('\n❌ Error:', err.message)
        process.exit(1)
    } finally {
        rl.close()
        process.exit(0)
    }
}

createStation()