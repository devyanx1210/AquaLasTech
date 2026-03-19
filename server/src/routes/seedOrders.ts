import { connectToDatabase } from '../config/db.js'

/**
 * 🌱 AquaLasTech — Seed Sample Orders
 * Run: npm run seed:orders
 *
 * Creates sample orders + order_items + payments + pos_transactions
 * for a given station so the Order List page has data to show.
 */

async function seedOrders() {
    console.log('\n🌱 Seeding sample orders...\n')
    const db = await connectToDatabase()

    // Config — change these to match your DB
    const STATION_ID = 1      // ← your station_id
    const USER_ID = 1      // ← admin user_id (processed_by)

    // Fetch real products from this station
    const [products]: any = await db.query(
        `SELECT p.product_id, p.product_name, p.price, i.inventory_id, i.quantity
         FROM products p
         JOIN inventory i ON i.product_id = p.product_id AND i.station_id = ?
         WHERE p.is_active = 1 AND i.quantity > 0
         LIMIT 4`,
        [STATION_ID]
    )

    if (products.length === 0) {
        console.error('❌ No active products with stock found for station', STATION_ID)
        process.exit(1)
    }

    console.log(`✅ Found ${products.length} products to use`)

    // Sample order data
    const sampleOrders = [
        {
            customer: 'Jane Doe',
            address: 'Brgy. Tabi, Boac',
            payment_mode: 'cash' as const,
            order_status: 'confirmed' as const,
            payment_type: 'cash' as const,
            payment_status: 'verified' as const,
            items: [{ idx: 0, qty: 1 }],
        },
        {
            customer: 'John Doe',
            address: 'Brgy. Isok, Boac',
            payment_mode: 'delivery' as const,
            order_status: 'delivering' as const,
            payment_type: 'cash' as const,
            payment_status: 'pending' as const,
            items: [{ idx: 0, qty: 2 }, { idx: 1, qty: 1 }],
        },
        {
            customer: 'Maria Santos',
            address: 'Brgy. Caganhao, Boac',
            payment_mode: 'gcash' as const,
            order_status: 'preparing' as const,
            payment_type: 'gcash' as const,
            payment_status: 'verified' as const,
            items: [{ idx: 1, qty: 1 }],
        },
        {
            customer: 'Pedro Cruz',
            address: 'Brgy. Mapanique, Boac',
            payment_mode: 'pickup' as const,
            order_status: 'cancelled' as const,
            payment_type: 'cash' as const,
            payment_status: 'pending' as const,
            items: [{ idx: 2 % products.length, qty: 3 }],
        },
        {
            customer: 'Ana Reyes',
            address: 'Brgy. Tumagabok, Boac',
            payment_mode: 'gcash' as const,
            order_status: 'confirmed' as const,
            payment_type: 'gcash' as const,
            payment_status: 'pending' as const,
            items: [{ idx: 0, qty: 1 }, { idx: 1 % products.length, qty: 2 }],
        },
    ]

    let created = 0

    for (const order of sampleOrders) {
        // Calculate total
        const total = order.items.reduce((sum, i) => {
            const p = products[i.idx]
            return sum + (p.price * i.qty)
        }, 0)

        const ref = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        // Insert order
        const [orderResult]: any = await db.query(
            `INSERT INTO orders (station_id, order_reference, total_amount, payment_mode, order_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [STATION_ID, ref, total, order.payment_mode, order.order_status]
        )
        const order_id = orderResult.insertId

        // Insert order items
        for (const item of order.items) {
            const product = products[item.idx]
            await db.query(
                `INSERT INTO order_items (order_id, station_id, product_id, quantity, price_snapshot, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [order_id, STATION_ID, product.product_id, item.qty, product.price]
            )
        }

        // Insert payment
        await db.query(
            `INSERT INTO payments (order_id, payment_type, payment_status, created_at)
             VALUES (?, ?, ?, NOW())`,
            [order_id, order.payment_type, order.payment_status]
        )

        // Insert POS transaction
        await db.query(
            `INSERT INTO pos_transactions (station_id, order_id, processed_by, c_name, c_address, total_amount, payment_method, transaction_status, transaction_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
            [STATION_ID, order_id, USER_ID, order.customer, order.address, total, order.payment_type]
        )

        console.log(`  ✅ Order ${ref} — ${order.customer} — ₱${total.toFixed(2)} [${order.order_status}]`)
        created++

        // Small delay to avoid same-ms timestamps
        await new Promise(r => setTimeout(r, 50))
    }

    console.log(`\n🎉 Done! Created ${created} sample orders for Station #${STATION_ID}\n`)
    process.exit(0)
}

seedOrders().catch(err => {
    console.error('❌ Seed error:', err.message)
    process.exit(1)
})