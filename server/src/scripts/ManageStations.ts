// ManageStations - interactive CLI to manage water station records
import { connectToDatabase } from '../config/db.js'
import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const ask = (question: string): Promise<string> =>
    new Promise(resolve => rl.question(question, resolve))

const divider = () => console.log('─'.repeat(50))

// List all stations
async function listStations(pool: any) {
    const [rows]: any = await pool.query(
        `SELECT s.station_id, s.station_name, s.address, s.contact_number,
                s.status, s.latitude, s.longitude,
                u.full_name AS admin_name, u.email AS admin_email, u.role AS admin_role
         FROM stations s
         LEFT JOIN users u ON u.station_id = s.station_id AND u.role IN ('admin', 'super_admin')
         ORDER BY s.station_id ASC`
    )

    if (rows.length === 0) {
        console.log('\n⚠️  No stations found.\n')
        return rows
    }

    console.log('\n🏪 Stations:\n')
    rows.forEach((s: any) => {
        const statusIcon = s.status === 'active' ? '🟢' : '🔴'
        const admin = s.admin_name
            ? `${s.admin_name} (${s.admin_email}) [${s.admin_role}]`
            : 'No admin assigned'
        const coords = s.latitude && s.longitude
            ? `${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}`
            : 'Not set'

        console.log(`  [${s.station_id}] ${statusIcon} ${s.station_name}`)
        console.log(`        Address : ${s.address}`)
        console.log(`        Contact : ${s.contact_number}`)
        console.log(`        Coords  : ${coords}`)
        console.log(`        Admin   : ${admin}`)
        console.log()
    })
    return rows
}

// Create station
async function createStation(pool: any) {
    console.log('\n➕ Create New Station\n')
    divider()

    const station_name = await ask('Station Name   : ')
    const address = await ask('Address        : ')
    const contact = await ask('Contact Number : ')

    if (!station_name || !address || !contact) {
        console.log('❌ Station name, address, and contact are required.')
        return
    }

    const lat = await ask('Latitude  (press Enter to skip): ')
    const lng = await ask('Longitude (press Enter to skip): ')

    const [result]: any = await pool.query(
        `INSERT INTO stations (station_name, address, contact_number, latitude, longitude, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [
            station_name, address, contact,
            lat.trim() ? parseFloat(lat) : null,
            lng.trim() ? parseFloat(lng) : null,
        ]
    )

    const new_id = result.insertId
    console.log(`\n✅ Station "${station_name}" created (station_id: ${new_id})`)

    // Optionally assign an admin
    const [admins]: any = await pool.query(
        `SELECT user_id, full_name, email, role, station_id FROM users
         WHERE role IN ('admin', 'super_admin') ORDER BY user_id ASC`
    )

    if (admins.length > 0) {
        console.log('\n📋 Available admins:\n')
        admins.forEach((u: any) => {
            const tag = u.station_id ? ` (assigned to Station #${u.station_id})` : ' (unassigned)'
            console.log(`  [${u.user_id}] ${u.full_name} — ${u.email}${tag}`)
        })
        const idInput = await ask('\nAssign an admin by user_id (press Enter to skip): ')
        if (idInput.trim()) {
            const user = admins.find((u: any) => u.user_id === parseInt(idInput))
            if (user) {
                await pool.query(
                    `UPDATE users SET station_id = ?, updated_at = NOW() WHERE user_id = ?`,
                    [new_id, user.user_id]
                )
                console.log(`✅ ${user.full_name} assigned to Station #${new_id}`)
            } else {
                console.log('⚠️  Admin not found — skipping assignment.')
            }
        }
    }
}

// Edit station
async function editStation(pool: any) {
    console.log('\n✏️  Edit Station\n')
    const stations = await listStations(pool)
    if (stations.length === 0) return

    const idInput = await ask('Enter station_id to edit: ')
    const station_id = parseInt(idInput)
    const station = stations.find((s: any) => s.station_id === station_id)
    if (!station) { console.log('❌ Station not found.'); return }

    console.log('\nLeave blank to keep current value.\n')

    const name = await ask(`Station Name   [${station.station_name}]: `)
    const address = await ask(`Address        [${station.address}]: `)
    const contact = await ask(`Contact Number [${station.contact_number}]: `)
    const lat = await ask(`Latitude       [${station.latitude ?? 'not set'}]: `)
    const lng = await ask(`Longitude      [${station.longitude ?? 'not set'}]: `)

    await pool.query(
        `UPDATE stations SET
            station_name   = ?,
            address        = ?,
            contact_number = ?,
            latitude       = ?,
            longitude      = ?,
            updated_at     = NOW()
         WHERE station_id = ?`,
        [
            name.trim() || station.station_name,
            address.trim() || station.address,
            contact.trim() || station.contact_number,
            lat.trim() ? parseFloat(lat) : station.latitude,
            lng.trim() ? parseFloat(lng) : station.longitude,
            station_id,
        ]
    )
    console.log(`\n✅ Station #${station_id} updated.`)
}

// Toggle station status
async function toggleStatus(pool: any) {
    console.log('\n🔄 Toggle Station Status\n')
    const stations = await listStations(pool)
    if (stations.length === 0) return

    const idInput = await ask('Enter station_id to toggle status: ')
    const station_id = parseInt(idInput)
    const station = stations.find((s: any) => s.station_id === station_id)
    if (!station) { console.log('❌ Station not found.'); return }

    const newStatus = station.status === 'active' ? 'inactive' : 'active'
    const confirm = await ask(
        `Change "${station.station_name}" from "${station.status}" → "${newStatus}"? (y/n): `
    )
    if (confirm.trim().toLowerCase() !== 'y') { console.log('⚠️  Cancelled.'); return }

    await pool.query(
        `UPDATE stations SET status = ?, updated_at = NOW() WHERE station_id = ?`,
        [newStatus, station_id]
    )
    console.log(`✅ Station "${station.station_name}" is now "${newStatus}"`)
}

// Reassign admin
async function reassignAdmin(pool: any) {
    console.log('\n👤 Reassign Admin to Station\n')
    const stations = await listStations(pool)
    if (stations.length === 0) return

    const stInput = await ask('Enter station_id: ')
    const station_id = parseInt(stInput)
    const station = stations.find((s: any) => s.station_id === station_id)
    if (!station) { console.log('❌ Station not found.'); return }

    const [admins]: any = await pool.query(
        `SELECT user_id, full_name, email, role, station_id FROM users
         WHERE role IN ('admin', 'super_admin') ORDER BY user_id ASC`
    )

    if (admins.length === 0) { console.log('❌ No admins found.'); return }

    console.log('\n📋 Available admins:\n')
    admins.forEach((u: any) => {
        const tag = u.station_id ? ` (Station #${u.station_id})` : ' (unassigned)'
        const role = u.role === 'super_admin' ? '[SUPER ADMIN]' : '[ADMIN]'
        console.log(`  [${u.user_id}] ${role} ${u.full_name} — ${u.email}${tag}`)
    })

    const idInput = await ask('\nEnter user_id to assign (press Enter to unassign current admin): ')

    if (!idInput.trim()) {
        // Unassign current admin from this station
        await pool.query(
            `UPDATE users SET station_id = NULL, updated_at = NOW() WHERE station_id = ?`,
            [station_id]
        )
        console.log(`✅ Unassigned admin from Station #${station_id}`)
        return
    }

    const user = admins.find((u: any) => u.user_id === parseInt(idInput))
    if (!user) { console.log('❌ Admin not found.'); return }

    await pool.query(
        `UPDATE users SET station_id = ?, updated_at = NOW() WHERE user_id = ?`,
        [station_id, user.user_id]
    )
    console.log(`✅ ${user.full_name} assigned to Station #${station_id} — ${station.station_name}`)
}

// Delete station
async function deleteStation(pool: any) {
    console.log('\n🗑️  Delete Station\n')
    const stations = await listStations(pool)
    if (stations.length === 0) return

    const idInput = await ask('Enter station_id to delete: ')
    const station_id = parseInt(idInput)
    const station = stations.find((s: any) => s.station_id === station_id)
    if (!station) { console.log('❌ Station not found.'); return }

    console.log(`\n⚠️  This will also:`)
    console.log(`   - Unassign all admins from this station`)
    console.log(`   - Delete all products and inventory for this station`)
    console.log(`   - Delete all inventory transactions for this station\n`)

    const confirm = await ask(
        `Permanently delete "${station.station_name}"? Type the station name to confirm: `
    )

    if (confirm.trim() !== station.station_name) {
        console.log('⚠️  Name did not match. Cancelled.')
        return
    }

    // Unassign admins
    await pool.query(
        `UPDATE users SET station_id = NULL WHERE station_id = ?`, [station_id]
    )

    // Delete inventory transactions → inventory → products → station
    await pool.query(
        `DELETE it FROM inventory_transactions it
         JOIN inventory i ON i.inventory_id = it.inventory_id
         WHERE i.station_id = ?`, [station_id]
    )
    await pool.query(`DELETE FROM inventory WHERE station_id = ?`, [station_id])
    await pool.query(`DELETE FROM products WHERE station_id = ?`, [station_id])
    await pool.query(`DELETE FROM stations WHERE station_id = ?`, [station_id])

    console.log(`\n✅ Station "${station.station_name}" and all its data deleted.`)
}

// Main menu
async function main() {
    console.log('\n🏪 AquaLasTech — Station Manager\n')
    divider()

    const pool = await connectToDatabase()

    let running = true
    while (running) {
        console.log('\nWhat would you like to do?\n')
        console.log('  [1] List all stations')
        console.log('  [2] Create new station')
        console.log('  [3] Edit station details')
        console.log('  [4] Toggle active / inactive')
        console.log('  [5] Reassign admin to station')
        console.log('  [6] Delete station')
        console.log('  [0] Exit\n')

        const choice = await ask('Choice: ')
        divider()

        switch (choice.trim()) {
            case '1': await listStations(pool); break
            case '2': await createStation(pool); break
            case '3': await editStation(pool); break
            case '4': await toggleStatus(pool); break
            case '5': await reassignAdmin(pool); break
            case '6': await deleteStation(pool); break
            case '0': running = false; break
            default: console.log('⚠️  Invalid choice.')
        }
    }

    console.log('\n👋 Goodbye!\n')
    rl.close()
    process.exit(0)
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message)
    process.exit(1)
})