# AquaLasTech — System Core Logic

This document represents the centralized source logic of the AquaLasTech
Water Ordering and Inventory Management System. Written in TypeScript.

```typescript
// =============================================================================
// AQUALASTECH SYSTEM CORE LOGIC
// Water Ordering and Inventory Management System
// =============================================================================


// CONSTANTS


const ROLE = { CUSTOMER: 1, ADMIN: 2, SUPER_ADMIN: 3, SYS_ADMIN: 4 } as const

const STATION_STATUS = { OPEN: 1, CLOSED: 2, MAINTENANCE: 3 } as const

const ORDER_STATUS = {
    CONFIRMED:        'confirmed',
    PREPARING:        'preparing',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED:        'delivered',
    CANCELLED:        'cancelled',
    RETURNED:         'returned',
} as const

const PAYMENT_MODE = {
    GCASH:            'gcash',
    CASH:             'cash',
    CASH_ON_DELIVERY: 'cash_on_delivery',
    CASH_ON_PICKUP:   'cash_on_pickup',
} as const

const PAYMENT_STATUS = {
    PENDING:  'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
} as const

const RETURN_STATUS = {
    PENDING:  'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const


// TYPES


interface User {
    user_id:         number
    full_name:       string
    email:           string
    password_hash:   string
    role:            number
    station_id:      number | null
    profile_picture: string | null
    contact_number:  string | null
    address:         string | null
    is_deleted:      boolean
    created_at:      Date
}

interface Station {
    station_id:     number
    station_name:   string
    address:        string
    contact_number: string
    status:         number       // references STATION_STATUS
    image_path:     string | null
    qr_code_path:   string | null
    latitude:       number | null
    longitude:      number | null
}

interface Product {
    product_id:      number
    station_id:      number
    product_name:    string
    price:           number
    unit:            string
    quantity:        number
    min_stock_level: number
    image_url:       string | null
    is_active:       boolean
}

interface Order {
    order_id:         number
    order_reference:  string    // format: AQT-YYYYMMDD-NNNN
    customer_id:      number
    station_id:       number
    total_amount:     number
    payment_mode:     string    // references PAYMENT_MODE
    payment_status:   string    // references PAYMENT_STATUS
    order_status:     string    // references ORDER_STATUS
    proof_image_path: string | null
    return_id:        number | null
    return_reason:    string | null
    return_status:    string | null
    pos_by:           number | null
    verified_by:      number | null
    created_at:       Date
}

interface OrderItem {
    order_item_id:  number
    order_id:       number
    product_id:     number
    quantity:       number
    price_snapshot: number     // price is locked at time of order, never changes
}

interface Notification {
    notification_id: number
    user_id:         number
    type:            string
    title:           string
    message:         string
    order_id:        number | null
    is_read:         boolean
    created_at:      Date
}


// AUTHENTICATION


async function signup(name: string, email: string, password: string): Promise<void> {
    const existing = await db.query(
        'SELECT user_id FROM users WHERE email = ?', [email]
    )
    if (existing.length > 0) throw new Error('Email already registered')

    const hash = await bcrypt.hash(password, 10)
    await db.query(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, ROLE.CUSTOMER]
    )
}

async function login(email: string, password: string, res: Response): Promise<User> {
    const [user] = await db.query(
        'SELECT * FROM users WHERE email = ? AND is_deleted = 0', [email]
    )
    if (!user) throw new Error('Invalid credentials')

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) throw new Error('Invalid credentials')

    if (user.station_id && user.role !== ROLE.SYS_ADMIN) {
        const [station] = await db.query(
            'SELECT status FROM stations WHERE station_id = ?', [user.station_id]
        )
        if (station?.status === STATION_STATUS.MAINTENANCE)
            throw new Error('System is currently under maintenance')
    }

    const token = jwt.sign(
        { user_id: user.user_id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )
    res.cookie('token', token, {
        httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 86400000
    })

    await db.query(
        'INSERT INTO system_logs (user_id, log_type) VALUES (?, ?)',
        [user.user_id, 'login']
    )
    return user
}

function logout(res: Response): void {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' })
}

async function forgotPassword(email: string): Promise<void> {
    const [user] = await db.query(
        'SELECT user_id FROM users WHERE email = ? AND is_deleted = 0', [email]
    )
    if (!user) return // do not reveal whether email exists

    const token   = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // expires in 1 hour

    await db.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.user_id, token, expires]
    )
    await sendEmail(email, 'Reset your AquaLasTech password', buildResetEmail(token))
}

async function resetPassword(token: string, newPassword: string): Promise<void> {
    const [reset] = await db.query(
        'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = 0',
        [token]
    )
    if (!reset) throw new Error('Reset link is invalid or has expired')

    const hash = await bcrypt.hash(newPassword, 10)
    await db.query(
        'UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, reset.user_id]
    )
    await db.query(
        'UPDATE password_resets SET used = 1 WHERE token = ?', [token]
    )
}


// CUSTOMER PROFILE


async function updateProfile(
    userId:  number,
    name:    string,
    contact: string,
    address: string
): Promise<void> {
    await db.query(
        'UPDATE users SET full_name = ?, contact_number = ?, address = ? WHERE user_id = ?',
        [name, contact, address, userId]
    )
}

async function changePassword(
    userId:      number,
    currentPass: string,
    newPass:     string
): Promise<void> {
    const [user] = await db.query(
        'SELECT password_hash FROM users WHERE user_id = ?', [userId]
    )
    const valid = await bcrypt.compare(currentPass, user.password_hash)
    if (!valid) throw new Error('Current password is incorrect')

    const hash = await bcrypt.hash(newPass, 10)
    await db.query(
        'UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, userId]
    )
}

async function uploadProfilePicture(userId: number, filePath: string): Promise<void> {
    const [existing] = await db.query(
        'SELECT profile_picture FROM users WHERE user_id = ?', [userId]
    )
    if (existing.profile_picture) {
        await deleteFile(existing.profile_picture) // remove old file from storage
    }
    await db.query(
        'UPDATE users SET profile_picture = ? WHERE user_id = ?', [filePath, userId]
    )
}


// CUSTOMER STATION SELECTION (WRS)
// Flow: Customer opens the app -> browses open stations -> selects one ->
//       views its products -> builds a cart -> proceeds to checkout


async function getOpenStations(): Promise<Station[]> {
    // Returns all stations with OPEN status for the customer to choose from.
    // Closed and maintenance stations are hidden from customers.
    return db.query(
        `SELECT station_id, station_name, address, contact_number,
                status, image_path, qr_code_path, latitude, longitude
         FROM stations
         WHERE status = ?
         ORDER BY station_name ASC`,
        [STATION_STATUS.OPEN]
    )
}

async function getStationDetail(stationId: number): Promise<Station> {
    // Returns full station info including QR code for GCash payment display.
    const [station] = await db.query(
        `SELECT station_id, station_name, address, complete_address,
                contact_number, status, image_path, qr_code_path,
                latitude, longitude
         FROM stations WHERE station_id = ?`,
        [stationId]
    )
    if (!station) throw new Error('Station not found')
    if (station.status === STATION_STATUS.MAINTENANCE)
        throw new Error('This station is currently under maintenance')
    return station
}

async function getStationProducts(stationId: number): Promise<Product[]> {
    // Returns only active products for the selected station.
    // Out-of-stock items are still shown but quantity is visible so
    // the customer knows availability before placing an order.
    return db.query(
        `SELECT product_id, product_name, price, unit, quantity, image_url
         FROM products
         WHERE station_id = ? AND is_active = 1
         ORDER BY product_name ASC`,
        [stationId]
    )
}

async function getStationMaintenanceStatus(): Promise<{ isMaintenance: boolean }> {
    // Lightweight check used by MaintenanceGuard on the client to block
    // the entire app when all stations are set to maintenance mode.
    const [row] = await db.query(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS in_maintenance
         FROM stations`,
        [STATION_STATUS.MAINTENANCE]
    )
    return { isMaintenance: row.total > 0 && row.total === row.in_maintenance }
}


// ADMIN STATION MANAGEMENT (WRS SETTINGS)
// Each admin manages only their own assigned station.
// Super admin can view all stations but settings are per-station.


async function getMyStation(adminId: number): Promise<Station> {
    // Admin fetches their own station profile to display and edit in Settings.
    const [admin] = await db.query(
        'SELECT station_id FROM users WHERE user_id = ?', [adminId]
    )
    if (!admin.station_id) throw new Error('Admin is not assigned to any station')

    const [station] = await db.query(
        `SELECT station_id, station_name, address, complete_address,
                contact_number, status, image_path, qr_code_path,
                latitude, longitude
         FROM stations WHERE station_id = ?`,
        [admin.station_id]
    )
    return station
}

async function updateStationInfo(
    stationId:       number,
    name:            string,
    address:         string,
    completeAddress: string,
    contact:         string,
    latitude:        number | null,
    longitude:       number | null
): Promise<void> {
    // Admin updates the station's public-facing information.
    // Latitude and longitude are set via the map picker in the Settings page.
    await db.query(
        `UPDATE stations
         SET station_name     = ?,
             address          = ?,
             complete_address = ?,
             contact_number   = ?,
             latitude         = ?,
             longitude        = ?,
             updated_at       = NOW()
         WHERE station_id = ?`,
        [name, address, completeAddress, contact, latitude, longitude, stationId]
    )
}

async function uploadStationLogo(stationId: number, filePath: string): Promise<void> {
    // Replaces the station's logo image shown on the customer station card.
    const [station] = await db.query(
        'SELECT image_path FROM stations WHERE station_id = ?', [stationId]
    )
    if (station.image_path) {
        await deleteFile(station.image_path) // remove old logo from storage
    }
    await db.query(
        'UPDATE stations SET image_path = ? WHERE station_id = ?',
        [filePath, stationId]
    )
}

async function uploadStationQRCode(stationId: number, filePath: string): Promise<void> {
    // Replaces the GCash QR code shown to customers during GCash checkout.
    // Customers scan this QR code to pay before uploading their receipt.
    const [station] = await db.query(
        'SELECT qr_code_path FROM stations WHERE station_id = ?', [stationId]
    )
    if (station.qr_code_path) {
        await deleteFile(station.qr_code_path) // remove old QR from storage
    }
    await db.query(
        'UPDATE stations SET qr_code_path = ? WHERE station_id = ?',
        [filePath, stationId]
    )
}


// CUSTOMER ORDER PLACEMENT


async function placeOrder(
    customerId:     number,
    stationId:      number,
    items:          { product_id: number; quantity: number }[],
    paymentMode:    string,
    proofImagePath: string | null
): Promise<Order> {
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
        // Step 1: Lock each product row and validate stock
        let total = 0
        const snapshots: { product: Product; quantity: number }[] = []

        for (const item of items) {
            const [product] = await connection.query(
                `SELECT * FROM products
                 WHERE product_id = ? AND station_id = ? AND is_active = 1
                 FOR UPDATE`,
                [item.product_id, stationId]
            )
            if (!product)
                throw new Error(`Product ${item.product_id} not found`)
            if (product.quantity < item.quantity)
                throw new Error(`Insufficient stock for: ${product.product_name}`)

            total += product.price * item.quantity
            snapshots.push({ product, quantity: item.quantity })
        }

        // Step 2: GCash orders start as pending until the admin verifies the receipt
        const paymentStatus = paymentMode === PAYMENT_MODE.GCASH
            ? PAYMENT_STATUS.PENDING
            : PAYMENT_STATUS.VERIFIED

        // Step 3: Generate a unique daily reference number scoped per station
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const [[{ count }]] = await connection.query(
            `SELECT COUNT(*) as count FROM orders
             WHERE DATE(created_at) = CURDATE() AND station_id = ?`,
            [stationId]
        )
        const ref = `AQT-${today}-${String(Number(count) + 1).padStart(4, '0')}`

        // Step 4: Insert the order record
        const [result] = await connection.query(
            `INSERT INTO orders
             (order_reference, customer_id, station_id, total_amount,
              payment_mode, payment_status, order_status, proof_image_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [ref, customerId, stationId, total,
             paymentMode, paymentStatus, ORDER_STATUS.CONFIRMED, proofImagePath]
        )
        const orderId = result.insertId

        // Step 5: Insert each line item and deduct stock
        for (const { product, quantity } of snapshots) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_snapshot)
                 VALUES (?, ?, ?, ?)`,
                [orderId, product.product_id, quantity, product.price]
            )
            await connection.query(
                'UPDATE products SET quantity = quantity - ? WHERE product_id = ?',
                [quantity, product.product_id]
            )
            await connection.query(
                `INSERT INTO inventory_transactions
                 (product_id, transaction_type, quantity, notes)
                 VALUES (?, 'deduction', ?, ?)`,
                [product.product_id, quantity, `Order ${ref}`]
            )
        }

        // Step 6: Send a confirmation notification to the customer
        await connection.query(
            `INSERT INTO notifications (user_id, type, title, message, order_id)
             VALUES (?, 'order_update', 'Order Placed', ?, ?)`,
            [customerId, `Your order ${ref} has been confirmed.`, orderId]
        )

        await connection.commit()
        return { order_id: orderId, order_reference: ref } as Order

    } catch (err) {
        await connection.rollback()
        throw err
    } finally {
        connection.release()
    }
}


// CUSTOMER ORDER MANAGEMENT


async function getMyOrders(
    customerId: number,
    status:     string | null
): Promise<Order[]> {
    const base = `
        SELECT o.*, s.station_name
        FROM orders o
        JOIN stations s ON o.station_id = s.station_id
        WHERE o.customer_id = ? AND o.is_deleted = 0`

    if (status) {
        return db.query(base + ' AND o.order_status = ? ORDER BY o.created_at DESC',
            [customerId, status])
    }
    return db.query(base + ' ORDER BY o.created_at DESC', [customerId])
}

async function getOrderDetail(orderId: number, customerId: number): Promise<Order & { items: OrderItem[] }> {
    const [order] = await db.query(
        `SELECT o.*, s.station_name, s.contact_number AS station_contact
         FROM orders o
         JOIN stations s ON o.station_id = s.station_id
         WHERE o.order_id = ? AND o.customer_id = ?`,
        [orderId, customerId]
    )
    if (!order) throw new Error('Order not found')

    const items = await db.query(
        `SELECT oi.*, p.product_name, p.unit, p.image_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = ?`,
        [orderId]
    )
    return { ...order, items }
}

async function cancelOrder(orderId: number, customerId: number): Promise<void> {
    const [order] = await db.query(
        'SELECT * FROM orders WHERE order_id = ? AND customer_id = ?',
        [orderId, customerId]
    )
    if (!order) throw new Error('Order not found')

    const cancellable = [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING]
    if (!cancellable.includes(order.order_status))
        throw new Error('Order can only be cancelled before it is out for delivery')

    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
        await connection.query(
            'UPDATE orders SET order_status = ? WHERE order_id = ?',
            [ORDER_STATUS.CANCELLED, orderId]
        )

        // Restore stock for each cancelled item
        const items = await connection.query(
            'SELECT * FROM order_items WHERE order_id = ?', [orderId]
        )
        for (const item of items) {
            await connection.query(
                'UPDATE products SET quantity = quantity + ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            )
            await connection.query(
                `INSERT INTO inventory_transactions
                 (product_id, transaction_type, quantity, notes)
                 VALUES (?, 'adjustment', ?, ?)`,
                [item.product_id, item.quantity, `Customer cancelled order ${order.order_reference}`]
            )
        }

        await connection.query(
            `INSERT INTO notifications (user_id, type, title, message, order_id)
             VALUES (?, 'order_update', 'Order Cancelled', ?, ?)`,
            [customerId, `Your order ${order.order_reference} has been cancelled.`, orderId]
        )

        await connection.commit()
    } catch (err) {
        await connection.rollback()
        throw err
    } finally {
        connection.release()
    }
}

async function requestReturn(
    orderId:    number,
    customerId: number,
    reason:     string
): Promise<void> {
    const [order] = await db.query(
        'SELECT * FROM orders WHERE order_id = ? AND customer_id = ?',
        [orderId, customerId]
    )
    if (!order) throw new Error('Order not found')
    if (order.order_status !== ORDER_STATUS.DELIVERED)
        throw new Error('Only delivered orders can be returned')
    if (order.return_id)
        throw new Error('A return request already exists for this order')

    const [returnResult] = await db.query(
        'INSERT INTO returns (order_id, reason, status) VALUES (?, ?, ?)',
        [orderId, reason, RETURN_STATUS.PENDING]
    )
    await db.query(
        `UPDATE orders SET return_id = ?, return_reason = ?, return_status = ?
         WHERE order_id = ?`,
        [returnResult.insertId, reason, RETURN_STATUS.PENDING, orderId]
    )
}


// CUSTOMER NOTIFICATIONS


async function getNotifications(userId: number): Promise<Notification[]> {
    return db.query(
        `SELECT * FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
    )
}

async function markNotificationRead(notificationId: number, userId: number): Promise<void> {
    await db.query(
        'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
        [notificationId, userId]
    )
}

async function markAllNotificationsRead(userId: number): Promise<void> {
    await db.query(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]
    )
}

async function deleteNotification(notificationId: number, userId: number): Promise<void> {
    await db.query(
        'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
        [notificationId, userId]
    )
}


// ADMIN ORDER STATUS MANAGEMENT


async function updateOrderStatus(
    orderId:   number,
    newStatus: string,
    adminId:   number
): Promise<void> {
    const [order] = await db.query(
        'SELECT * FROM orders WHERE order_id = ?', [orderId]
    )
    if (!order) throw new Error('Order not found')

    const allowed: Record<string, string[]> = {
        confirmed:        ['out_for_delivery', 'cancelled'],
        preparing:        ['out_for_delivery', 'cancelled'],
        out_for_delivery: ['delivered',        'cancelled'],
        delivered:        [],
        cancelled:        [],
        returned:         [],
    }
    if (!allowed[order.order_status]?.includes(newStatus))
        throw new Error(`Cannot move order from ${order.order_status} to ${newStatus}`)

    if (newStatus === ORDER_STATUS.CANCELLED) {
        const items = await db.query(
            'SELECT * FROM order_items WHERE order_id = ?', [orderId]
        )
        for (const item of items) {
            await db.query(
                'UPDATE products SET quantity = quantity + ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            )
        }
    }

    await db.query(
        'UPDATE orders SET order_status = ?, updated_by = ? WHERE order_id = ?',
        [newStatus, adminId, orderId]
    )

    await db.query(
        `INSERT INTO notifications (user_id, type, title, message, order_id)
         SELECT customer_id, 'order_update', 'Order Updated', ?, ?
         FROM orders WHERE order_id = ?`,
        [`Your order status has been updated to: ${newStatus}`, orderId, orderId]
    )
}

async function verifyGCashPayment(
    orderId:       number,
    paymentStatus: 'verified' | 'rejected',
    adminId:       number
): Promise<void> {
    const [order] = await db.query(
        'SELECT * FROM orders WHERE order_id = ?', [orderId]
    )
    if (!order) throw new Error('Order not found')
    if (order.payment_mode !== PAYMENT_MODE.GCASH)
        throw new Error('Order is not a GCash order')

    await db.query(
        'UPDATE orders SET payment_status = ?, verified_by = ? WHERE order_id = ?',
        [paymentStatus, adminId, orderId]
    )

    const message = paymentStatus === PAYMENT_STATUS.VERIFIED
        ? `Your GCash payment for order ${order.order_reference} has been verified.`
        : `Your GCash payment for order ${order.order_reference} was rejected. Please re-upload your receipt.`

    await db.query(
        `INSERT INTO notifications (user_id, type, title, message, order_id)
         VALUES (?, 'payment_update', 'Payment Update', ?, ?)`,
        [order.customer_id, message, orderId]
    )
}

async function resolveReturn(
    orderId:      number,
    returnStatus: 'approved' | 'rejected',
    adminId:      number
): Promise<void> {
    const [order] = await db.query(
        'SELECT * FROM orders WHERE order_id = ?', [orderId]
    )
    if (!order || !order.return_id) throw new Error('No return request found')

    await db.query(
        `UPDATE orders
         SET return_status = ?, return_processed_by = ?, order_status = ?
         WHERE order_id = ?`,
        [returnStatus, adminId,
         returnStatus === RETURN_STATUS.APPROVED
             ? ORDER_STATUS.RETURNED
             : ORDER_STATUS.OUT_FOR_DELIVERY,
         orderId]
    )
    await db.query(
        'UPDATE returns SET status = ? WHERE return_id = ?',
        [returnStatus, order.return_id]
    )

    const message = returnStatus === RETURN_STATUS.APPROVED
        ? `Your return for order ${order.order_reference} has been approved.`
        : `Your return for order ${order.order_reference} was not approved. Order restored to active.`

    await db.query(
        `INSERT INTO notifications (user_id, type, title, message, order_id)
         VALUES (?, 'order_update', 'Return Update', ?, ?)`,
        [order.customer_id, message, orderId]
    )
}


// POS TRANSACTION (WALK-IN COUNTER)


async function posTransaction(
    adminId:     number,
    stationId:   number,
    items:       { product_id: number; quantity: number }[],
    paymentMode: string
): Promise<void> {
    // Walk-in sales use the same stock-locking flow as online orders.
    // Payment is always considered verified immediately at the counter.
    const order = await placeOrder(adminId, stationId, items, paymentMode, null)

    await db.query(
        'UPDATE orders SET pos_by = ?, payment_status = ? WHERE order_id = ?',
        [adminId, PAYMENT_STATUS.VERIFIED, order.order_id]
    )
}


// INVENTORY MANAGEMENT


async function restockProduct(
    productId: number,
    quantity:  number,
    notes:     string,
    adminId:   number
): Promise<void> {
    if (quantity <= 0) throw new Error('Restock quantity must be greater than zero')

    await db.query(
        'UPDATE products SET quantity = quantity + ? WHERE product_id = ?',
        [quantity, productId]
    )
    await db.query(
        `INSERT INTO inventory_transactions
         (product_id, transaction_type, quantity, notes, created_by)
         VALUES (?, 'restock', ?, ?, ?)`,
        [productId, quantity, notes, adminId]
    )

    const [product] = await db.query(
        'SELECT product_name, quantity, min_stock_level, station_id FROM products WHERE product_id = ?',
        [productId]
    )
    if (product.quantity >= product.min_stock_level) {
        await db.query(
            `INSERT INTO notifications (user_id, type, title, message)
             SELECT user_id, 'inventory_alert', 'Stock Restored', ?
             FROM users WHERE station_id = ? AND role = ? AND is_deleted = 0`,
            [`${product.product_name} stock is now at a healthy level.`,
             product.station_id, ROLE.ADMIN]
        )
    }
}

async function checkLowStock(stationId: number): Promise<Product[]> {
    return db.query(
        `SELECT * FROM products
         WHERE station_id = ? AND quantity <= min_stock_level AND is_active = 1`,
        [stationId]
    )
}


// ADMIN MANAGEMENT (SUPER ADMIN)


async function createAdmin(
    name:      string,
    email:     string,
    password:  string,
    stationId: number
): Promise<void> {
    const [existing] = await db.query(
        'SELECT user_id FROM users WHERE email = ?', [email]
    )
    if (existing) throw new Error('Email already registered')

    const hash = await bcrypt.hash(password, 10)
    await db.query(
        `INSERT INTO users (full_name, email, password_hash, role, station_id)
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, hash, ROLE.ADMIN, stationId]
    )
}

async function deleteAdmin(
    targetId:    number,
    password:    string,
    requesterId: number
): Promise<void> {
    const [requester] = await db.query(
        'SELECT password_hash FROM users WHERE user_id = ?', [requesterId]
    )
    const valid = await bcrypt.compare(password, requester.password_hash)
    if (!valid) throw new Error('Incorrect password')

    const [target] = await db.query(
        'SELECT role FROM users WHERE user_id = ?', [targetId]
    )
    if (!target || target.role !== ROLE.ADMIN)
        throw new Error('Target user is not an admin')

    await db.query(
        'UPDATE users SET is_deleted = 1 WHERE user_id = ?', [targetId]
    )
}


// REPORTS


async function getSummary(
    stationId: number,
    period:    'daily' | 'weekly' | 'monthly' | 'yearly'
) {
    const groupBy: Record<string, string> = {
        daily:   'DATE(created_at)',
        weekly:  'YEARWEEK(created_at)',
        monthly: 'DATE_FORMAT(created_at, "%Y-%m")',
        yearly:  'YEAR(created_at)',
    }
    return db.query(
        `SELECT
           ${groupBy[period]}                                                           AS period_label,
           COUNT(*)                                                                     AS total_orders,
           SUM(total_amount)                                                            AS total_revenue,
           SUM(CASE WHEN order_status = 'delivered' THEN total_amount ELSE 0 END)      AS earned_revenue,
           SUM(CASE WHEN order_status = 'confirmed'        THEN 1 ELSE 0 END)          AS confirmed,
           SUM(CASE WHEN order_status = 'out_for_delivery' THEN 1 ELSE 0 END)          AS out_for_delivery,
           SUM(CASE WHEN order_status = 'delivered'        THEN 1 ELSE 0 END)          AS delivered,
           SUM(CASE WHEN order_status = 'cancelled'        THEN 1 ELSE 0 END)          AS cancelled,
           SUM(CASE WHEN order_status = 'returned'         THEN 1 ELSE 0 END)          AS returned
         FROM orders
         WHERE station_id = ?
         GROUP BY ${groupBy[period]}
         ORDER BY ${groupBy[period]} DESC`,
        [stationId]
    )
}

async function getDayBreakdown(stationId: number, date: string) {
    const orders = await db.query(
        `SELECT o.*, u.full_name AS customer_name
         FROM orders o
         JOIN users u ON o.customer_id = u.user_id
         WHERE o.station_id = ? AND DATE(o.created_at) = ?
         ORDER BY o.created_at DESC`,
        [stationId, date]
    )
    const [summary] = await db.query(
        `SELECT
           COUNT(*)                                                                AS total_orders,
           SUM(total_amount)                                                       AS total_revenue,
           SUM(CASE WHEN order_status = 'delivered' THEN total_amount ELSE 0 END) AS earned_revenue,
           SUM(CASE WHEN order_status = 'delivered'        THEN 1 ELSE 0 END)     AS delivered,
           SUM(CASE WHEN order_status = 'cancelled'        THEN 1 ELSE 0 END)     AS cancelled,
           SUM(CASE WHEN order_status = 'returned'         THEN 1 ELSE 0 END)     AS returned,
           SUM(CASE WHEN order_status = 'confirmed'        THEN 1 ELSE 0 END)     AS confirmed,
           SUM(CASE WHEN order_status = 'preparing'        THEN 1 ELSE 0 END)     AS preparing,
           SUM(CASE WHEN order_status = 'out_for_delivery' THEN 1 ELSE 0 END)     AS out_for_delivery
         FROM orders WHERE station_id = ? AND DATE(created_at) = ?`,
        [stationId, date]
    )
    return { orders, summary }
}
```

---

> **Note:** Database calls use the project's MySQL2 connection pool.
> Auth middleware, role guards, and file upload logic are intentionally
> omitted. All routes are protected before reaching these functions.
