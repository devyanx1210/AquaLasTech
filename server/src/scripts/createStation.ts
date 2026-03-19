// createStation - CLI script to create a new water station
import { connectToDatabase } from '../config/db.js'
import bcrypt from 'bcrypt'
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
        // Step 1: Collect station details
        const station_name = await ask('Station Name       : ')
        const address = await ask('Address            : ')
        const latitude = await ask('Latitude  (optional, press Enter to skip): ')
        const longitude = await ask('Longitude (optional, press Enter to skip): ')
        const contact_number = await ask('Contact Number     : ')

        if (!station_name || !address || !contact_number) {
            console.error('\n❌ Station name, address, and contact number are required.')
            process.exit(1)
        }

        // Step 2: Show available admin users
        console.log('\n📋 Checking for existing admin users...\n')
        const [adminRows]: any = await pool.query(
            `SELECT user_id, full_name, email, role, station_id 
             FROM users 
             WHERE role IN ('admin', 'super_admin') 
             ORDER BY user_id ASC`
        )

        let admin_user_id: number

        if (adminRows.length === 0) {
            // No admins exist — create one now
            console.log('⚠️  No admin users found. Let\'s create one now.\n')

            const full_name = await ask('Full Name    : ')
            const email = await ask('Email        : ')
            const password = await ask('Password     : ')

            if (!full_name || !email || !password) {
                console.error('\n❌ All fields are required to create an admin.')
                process.exit(1)
            }

            // Check email not taken
            const [existing]: any = await pool.query(
                `SELECT user_id FROM users WHERE email = ?`, [email]
            )
            if (existing.length > 0) {
                console.error('\n❌ That email is already in use.')
                process.exit(1)
            }

            const hash = await bcrypt.hash(password, 10)
            const [newUser]: any = await pool.query(
                `INSERT INTO users (full_name, email, password_hash, role, created_at, updated_at)
                 VALUES (?, ?, ?, 'super_admin', NOW(), NOW())`,
                [full_name, email, hash]
            )
            admin_user_id = newUser.insertId
            console.log(`\n✅ Super admin created: ${full_name} (user_id: ${admin_user_id})`)

        } else {
            // Existing admins found — pick one
            adminRows.forEach((u: any) => {
                const assigned = u.station_id
                    ? ` (assigned to Station #${u.station_id})`
                    : ' (unassigned)'
                const roleTag = u.role === 'super_admin' ? ' [SUPER ADMIN]' : ' [ADMIN]'
                console.log(`  [${u.user_id}] ${u.full_name} — ${u.email}${roleTag}${assigned}`)
            })

            const adminIdInput = await ask('\nEnter the user_id of the admin to assign (or type "new" to create one): ')

            if (adminIdInput.trim().toLowerCase() === 'new') {
                // Create a new admin inline
                console.log('\n👤 Creating new admin...\n')
                const full_name = await ask('Full Name    : ')
                const email = await ask('Email        : ')
                const password = await ask('Password     : ')

                if (!full_name || !email || !password) {
                    console.error('\n❌ All fields are required.')
                    process.exit(1)
                }

                const [existing]: any = await pool.query(
                    `SELECT user_id FROM users WHERE email = ?`, [email]
                )
                if (existing.length > 0) {
                    console.error('\n❌ That email is already in use.')
                    process.exit(1)
                }

                const promote = await ask('Make this user a super_admin? (y/n): ')
                const role = promote.trim().toLowerCase() === 'y' ? 'super_admin' : 'admin'

                const hash = await bcrypt.hash(password, 10)
                const [newUser]: any = await pool.query(
                    `INSERT INTO users (full_name, email, password_hash, role, created_at, updated_at)
                     VALUES (?, ?, ?, ?, NOW(), NOW())`,
                    [full_name, email, hash, role]
                )
                admin_user_id = newUser.insertId
                console.log(`\n✅ ${role === 'super_admin' ? 'Super admin' : 'Admin'} created: ${full_name} (user_id: ${admin_user_id})`)

            } else {
                admin_user_id = parseInt(adminIdInput)
                const selectedAdmin = adminRows.find((u: any) => u.user_id === admin_user_id)

                if (!selectedAdmin) {
                    console.error('\n❌ Invalid user_id.')
                    process.exit(1)
                }

                // Offer promotion if not already super_admin
                if (selectedAdmin.role !== 'super_admin') {
                    const promote = await ask(`\nMake ${selectedAdmin.full_name} a super_admin? (y/n): `)
                    if (promote.trim().toLowerCase() === 'y') {
                        await pool.query(
                            `UPDATE users SET role = 'super_admin' WHERE user_id = ?`,
                            [admin_user_id]
                        )
                        console.log(`✅ Role set to super_admin for: ${selectedAdmin.full_name}`)
                    }
                } else {
                    console.log(`ℹ️  ${selectedAdmin.full_name} is already a super_admin`)
                }
            }
        }

        // Step 3: Insert the station
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

        // Step 4: Assign station to the admin
        await pool.query(
            `UPDATE users SET station_id = ?, updated_at = NOW() WHERE user_id = ?`,
            [new_station_id, admin_user_id]
        )

        // Step 5: Summary
        const [userRow]: any = await pool.query(
            `SELECT full_name, email, role FROM users WHERE user_id = ?`,
            [admin_user_id]
        )
        const assignedUser = userRow[0]

        console.log('\n' + '─'.repeat(45))
        console.log('🎉 Station setup complete!\n')
        console.log(`  Station ID   : ${new_station_id}`)
        console.log(`  Station Name : ${station_name}`)
        console.log(`  Address      : ${address}`)
        console.log(`  Contact      : ${contact_number}`)
        console.log(`  Assigned To  : ${assignedUser.full_name} (${assignedUser.email})`)
        console.log(`  Role         : ${assignedUser.role}`)
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