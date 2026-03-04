import { connectToDatabase } from '../config/db.js'
import bcrypt from 'bcrypt'
import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const ask = (question: string): Promise<string> =>
    new Promise(resolve => rl.question(question, resolve))

const divider = () => console.log('─'.repeat(50))

// ── List all admins ────────────────────────────────────────────────────────
async function listAdmins(pool: any) {
    const [rows]: any = await pool.query(
        `SELECT u.user_id, u.full_name, u.email, u.role, u.station_id, s.station_name
         FROM users u
         LEFT JOIN stations s ON s.station_id = u.station_id
         WHERE u.role IN ('admin', 'super_admin')
         ORDER BY u.role DESC, u.user_id ASC`
    )

    if (rows.length === 0) {
        console.log('\n⚠️  No admin users found.\n')
        return rows
    }

    console.log('\n📋 Admin Users:\n')
    rows.forEach((u: any) => {
        const roleTag = u.role === 'super_admin' ? '🔑 SUPER ADMIN' : '👤 ADMIN     '
        const station = u.station_name
            ? `Station #${u.station_id} — ${u.station_name}`
            : 'No station assigned'
        console.log(`  [${u.user_id}] ${roleTag}  ${u.full_name}`)
        console.log(`        Email   : ${u.email}`)
        console.log(`        Station : ${station}`)
        console.log()
    })
    return rows
}

// ── Create admin ───────────────────────────────────────────────────────────
async function createAdmin(pool: any) {
    console.log('\n👤 Create New Admin\n')
    divider()

    const full_name = await ask('Full Name : ')
    const email = await ask('Email     : ')
    const password = await ask('Password  : ')

    if (!full_name || !email || !password) {
        console.log('❌ All fields are required.')
        return
    }

    const [existing]: any = await pool.query(
        `SELECT user_id FROM users WHERE email = ?`, [email]
    )
    if (existing.length > 0) {
        console.log('❌ That email is already in use.')
        return
    }

    const roleInput = await ask('Role (1 = admin, 2 = super_admin): ')
    const role = roleInput.trim() === '2' ? 'super_admin' : 'admin'

    // Ask for station assignment
    const [stations]: any = await pool.query(
        `SELECT station_id, station_name FROM stations ORDER BY station_id ASC`
    )
    let station_id: number | null = null

    if (stations.length > 0) {
        console.log('\n🏪 Available Stations:\n')
        stations.forEach((s: any) => console.log(`  [${s.station_id}] ${s.station_name}`))
        const stInput = await ask('\nAssign to station_id (press Enter to skip): ')
        if (stInput.trim()) {
            const found = stations.find((s: any) => s.station_id === parseInt(stInput))
            if (found) station_id = found.station_id
            else console.log('⚠️  Station not found — skipping assignment.')
        }
    }

    const hash = await bcrypt.hash(password, 10)
    const [result]: any = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, station_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [full_name, email, hash, role, station_id]
    )

    console.log(`\n✅ ${role === 'super_admin' ? 'Super admin' : 'Admin'} "${full_name}" created (user_id: ${result.insertId})`)
    if (station_id) console.log(`   Assigned to Station #${station_id}`)
}

// ── Change role ────────────────────────────────────────────────────────────
async function changeRole(pool: any) {
    console.log('\n🔄 Change Admin Role\n')
    const admins = await listAdmins(pool)
    if (admins.length === 0) return

    const idInput = await ask('Enter user_id to change role: ')
    const user_id = parseInt(idInput)
    const user = admins.find((u: any) => u.user_id === user_id)

    if (!user) { console.log('❌ User not found.'); return }

    const newRole = user.role === 'super_admin' ? 'admin' : 'super_admin'
    const confirm = await ask(
        `Change ${user.full_name} from "${user.role}" → "${newRole}"? (y/n): `
    )

    if (confirm.trim().toLowerCase() !== 'y') {
        console.log('⚠️  Cancelled.')
        return
    }

    await pool.query(
        `UPDATE users SET role = ?, updated_at = NOW() WHERE user_id = ?`,
        [newRole, user_id]
    )
    console.log(`✅ Role updated: ${user.full_name} is now "${newRole}"`)
}

// ── Reset password ─────────────────────────────────────────────────────────
async function resetPassword(pool: any) {
    console.log('\n🔐 Reset Admin Password\n')
    const admins = await listAdmins(pool)
    if (admins.length === 0) return

    const idInput = await ask('Enter user_id to reset password: ')
    const user_id = parseInt(idInput)
    const user = admins.find((u: any) => u.user_id === user_id)

    if (!user) { console.log('❌ User not found.'); return }

    const newPw = await ask(`New password for ${user.full_name}: `)
    if (!newPw || newPw.length < 6) {
        console.log('❌ Password must be at least 6 characters.')
        return
    }

    const hash = await bcrypt.hash(newPw, 10)
    await pool.query(
        `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?`,
        [hash, user_id]
    )
    console.log(`✅ Password reset for: ${user.full_name}`)
}

// ── Reassign station ───────────────────────────────────────────────────────
async function reassignStation(pool: any) {
    console.log('\n🏪 Reassign Admin to Station\n')
    const admins = await listAdmins(pool)
    if (admins.length === 0) return

    const idInput = await ask('Enter user_id to reassign: ')
    const user_id = parseInt(idInput)
    const user = admins.find((u: any) => u.user_id === user_id)
    if (!user) { console.log('❌ User not found.'); return }

    const [stations]: any = await pool.query(
        `SELECT station_id, station_name FROM stations ORDER BY station_id ASC`
    )

    if (stations.length === 0) {
        console.log('❌ No stations found.')
        return
    }

    console.log('\n🏪 Available Stations:\n')
    stations.forEach((s: any) => console.log(`  [${s.station_id}] ${s.station_name}`))

    const stInput = await ask('\nEnter station_id (press Enter to unassign): ')
    const station_id = stInput.trim() ? parseInt(stInput) : null

    if (station_id && !stations.find((s: any) => s.station_id === station_id)) {
        console.log('❌ Station not found.')
        return
    }

    await pool.query(
        `UPDATE users SET station_id = ?, updated_at = NOW() WHERE user_id = ?`,
        [station_id, user_id]
    )

    console.log(station_id
        ? `✅ ${user.full_name} reassigned to Station #${station_id}`
        : `✅ ${user.full_name} unassigned from station`
    )
}

// ── Delete admin ───────────────────────────────────────────────────────────
async function deleteAdmin(pool: any) {
    console.log('\n🗑️  Delete Admin User\n')
    const admins = await listAdmins(pool)
    if (admins.length === 0) return

    const idInput = await ask('Enter user_id to delete: ')
    const user_id = parseInt(idInput)
    const user = admins.find((u: any) => u.user_id === user_id)
    if (!user) { console.log('❌ User not found.'); return }

    // Safety check — don't allow deleting the last super_admin
    if (user.role === 'super_admin') {
        const [superAdmins]: any = await pool.query(
            `SELECT COUNT(*) as count FROM users WHERE role = 'super_admin'`
        )
        if (superAdmins[0].count <= 1) {
            console.log('❌ Cannot delete the last super_admin. Promote another admin first.')
            return
        }
    }

    const confirm = await ask(
        `⚠️  Permanently delete "${user.full_name}" (${user.email})? This cannot be undone. (y/n): `
    )
    if (confirm.trim().toLowerCase() !== 'y') {
        console.log('⚠️  Cancelled.')
        return
    }

    await pool.query(`DELETE FROM users WHERE user_id = ?`, [user_id])
    console.log(`✅ Deleted: ${user.full_name}`)
}

// ── Main menu ──────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🔧 AquaLasTech — Admin Manager\n')
    divider()

    const pool = await connectToDatabase()

    let running = true
    while (running) {
        console.log('\nWhat would you like to do?\n')
        console.log('  [1] List all admins')
        console.log('  [2] Create new admin')
        console.log('  [3] Change role (admin ↔ super_admin)')
        console.log('  [4] Reset password')
        console.log('  [5] Reassign station')
        console.log('  [6] Delete admin')
        console.log('  [0] Exit\n')

        const choice = await ask('Choice: ')

        divider()

        switch (choice.trim()) {
            case '1': await listAdmins(pool); break
            case '2': await createAdmin(pool); break
            case '3': await changeRole(pool); break
            case '4': await resetPassword(pool); break
            case '5': await reassignStation(pool); break
            case '6': await deleteAdmin(pool); break
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