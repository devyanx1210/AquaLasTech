/**
 * EXAMPLE: How to Use the New ENUM Constants
 * Update your code to use these patterns after migration
 */

const {
  ROLE,
  ORDER_STATUS,
  PAYMENT_MODE,
  PAYMENT_STATUS,
  ACCOUNT_STATUS,
  TRANSACTION_TYPE,
  NOTIFICATION_TYPE,
  ROLE_NAMES,
  ORDER_STATUS_NAMES,
  PAYMENT_MODE_NAMES,
} = require('../constants/dbEnums');

// =====================================================
// EXAMPLE 1: INSERT with ENUM Values
// =====================================================

// OLD WAY (Do NOT use anymore):
// db.query('INSERT INTO users (full_name, email, role) VALUES (?, ?, ?)',
//   ['John Doe', 'john@example.com', 'admin']);

// NEW WAY (Use this):
async function createAdmin(name, email) {
  const query = 'INSERT INTO users (full_name, email, role) VALUES (?, ?, ?)';
  const values = [name, email, ROLE.ADMIN]; // Use constant instead of string

  const result = await db.query(query, values);
  return result;
}

// =====================================================
// EXAMPLE 2: SELECT with ENUM Filtering
// =====================================================

// OLD WAY:
// db.query('SELECT * FROM users WHERE role = "admin"');

// NEW WAY:
async function getAllAdmins() {
  const query = 'SELECT * FROM users WHERE role = ?';
  const admins = await db.query(query, [ROLE.ADMIN]);
  return admins;
}

// =====================================================
// EXAMPLE 3: UPDATE Order Status
// =====================================================

// OLD WAY:
// db.query('UPDATE orders SET order_status = "delivered" WHERE order_id = ?', [123]);

// NEW WAY:
async function markOrderDelivered(orderId) {
  const query = 'UPDATE orders SET order_status = ? WHERE order_id = ?';
  const result = await db.query(query, [ORDER_STATUS.DELIVERED, orderId]);
  return result;
}

// =====================================================
// EXAMPLE 4: Complex Query with Multiple Enums
// =====================================================

async function getConfirmedOrders() {
  const query = `
    SELECT
      o.order_id,
      o.order_reference,
      u.full_name,
      u.role,
      o.order_status,
      p.payment_status
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE
      o.order_status = ?
      AND u.role IN (?, ?)
      AND p.payment_status = ?
  `;

  const values = [
    ORDER_STATUS.CONFIRMED,     // orders with 'confirmed' status
    ROLE.CUSTOMER,              // 'customer' role
    ROLE.ADMIN,                 // OR 'admin' role
    PAYMENT_STATUS.VERIFIED,    // payments 'verified'
  ];

  const orders = await db.query(query, values);
  return orders;
}

// =====================================================
// EXAMPLE 5: Converting Output to Readable Names
// =====================================================

async function getOrdersWithReadableStatus() {
  const query = 'SELECT * FROM orders LIMIT 10';
  const orders = await db.query(query);

  // Convert numeric enum values to readable names
  return orders.map(order => ({
    ...order,
    order_status_name: ORDER_STATUS_NAMES[order.order_status],
    payment_mode_name: PAYMENT_MODE_NAMES[order.payment_mode],
  }));
}

// Usage:
// Orders will look like:
// {
//   order_id: 1,
//   order_status: 1,
//   order_status_name: 'confirmed',
//   payment_mode: 2,
//   payment_mode_name: 'cash',
//   ...
// }

// =====================================================
// EXAMPLE 6: API Response with Enum Names (Best for Frontend)
// =====================================================

async function getOrderDetailsAPI(orderId) {
  const query = `
    SELECT
      order_id,
      order_reference,
      total_amount,
      order_status,
      payment_mode,
      created_at
    FROM orders
    WHERE order_id = ?
  `;

  const order = await db.query(query, [orderId]);

  if (!order) return null;

  // Transform for API response
  return {
    id: order.order_id,
    reference: order.order_reference,
    amount: order.total_amount,
    status: ORDER_STATUS_NAMES[order.order_status],  // Send readable name to frontend
    paymentMode: PAYMENT_MODE_NAMES[order.payment_mode],
    createdAt: order.created_at,
  };
}

// Frontend receives:
// {
//   id: 1,
//   reference: 'AQL-20260324-WFUMX',
//   amount: 60.00,
//   status: 'confirmed',  // <-- Readable name
//   paymentMode: 'cash_on_delivery',
//   createdAt: '2026-03-24T03:19:38.000Z'
// }

// =====================================================
// EXAMPLE 7: WHERE IN with Multiple Values
// =====================================================

async function getActiveOrCompletedOrders() {
  // Get orders that are either 'confirmed' or 'delivered'
  const query = `
    SELECT * FROM orders
    WHERE order_status IN (?, ?)
    ORDER BY created_at DESC
  `;

  const orders = await db.query(query, [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.DELIVERED,
  ]);

  return orders;
}

// =====================================================
// EXAMPLE 8: Transaction Operations
// =====================================================

async function createInventoryTransaction(inventoryId, quantity, type) {
  const query = `
    INSERT INTO inventory_transactions
    (inventory_id, transaction_type, quantity, created_by, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  // type should be one of: TRANSACTION_TYPE.RESTOCK, TRANSACTION_TYPE.DEDUCTION, etc.
  const values = [inventoryId, type, quantity, userId];

  const result = await db.query(query, values);
  return result;
}

// Usage:
// await createInventoryTransaction(5, 50, TRANSACTION_TYPE.RESTOCK);
// await createInventoryTransaction(5, 10, TRANSACTION_TYPE.DEDUCTION);

// =====================================================
// EXAMPLE 9: Notifications
// =====================================================

async function createNotification(userId, message, type) {
  const query = `
    INSERT INTO notifications (user_id, message, notification_type, created_at)
    VALUES (?, ?, ?, NOW())
  `;

  const values = [
    userId,
    message,
    type, // Pass NOTIFICATION_TYPE.ORDER_UPDATE, etc.
  ];

  const result = await db.query(query, values);
  return result;
}

// Usage:
// await createNotification(13, 'Your order has been confirmed!', NOTIFICATION_TYPE.ORDER_UPDATE);
// await createNotification(6, 'Water Bottle is now in stock!', NOTIFICATION_TYPE.INVENTORY_ALERT);

// =====================================================
// EXAMPLE 10: Admin Role Check
// =====================================================

function isAdmin(userRole) {
  return [ROLE.ADMIN, ROLE.SUPER_ADMIN].includes(userRole);
}

function isSuperAdmin(userRole) {
  return userRole === ROLE.SUPER_ADMIN;
}

function isSysAdmin(userRole) {
  return userRole === ROLE.SYS_ADMIN;
}

// Usage:
// if (isAdmin(user.role)) { ... }
// if (isSuperAdmin(user.role)) { ... }

module.exports = {
  createAdmin,
  getAllAdmins,
  markOrderDelivered,
  getConfirmedOrders,
  getOrdersWithReadableStatus,
  getOrderDetailsAPI,
  getActiveOrCompletedOrders,
  createInventoryTransaction,
  createNotification,
  isAdmin,
  isSuperAdmin,
  isSysAdmin,
};
