
// USER ROLES (users.role)
const ROLE = {
  CUSTOMER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
  SYS_ADMIN: 4,
};

const ROLE_NAMES = {
  1: 'customer',
  2: 'admin',
  3: 'super_admin',
  4: 'sys_admin',
};

// USER ACCOUNT STATUS (users.account_status)
const ACCOUNT_STATUS = {
  ACTIVE: 1,
  SUSPENDED: 2,
  DELETED: 3,
};

const ACCOUNT_STATUS_NAMES = {
  1: 'active',
  2: 'suspended',
  3: 'deleted',
};

// STATION STATUS (stations.status)
const STATION_STATUS = {
  OPEN: 1,
  CLOSED: 2,
  MAINTENANCE: 3,
};

const STATION_STATUS_NAMES = {
  1: 'open',
  2: 'closed',
  3: 'maintenance',
};

// PRODUCT UNIT TYPE (products.unit_type, order_items.unit_type)
const UNIT_TYPE = {
  LITER: 1,
  GALLON: 2,
  PIECE: 3,
};

const UNIT_TYPE_NAMES = {
  1: 'liter',
  2: 'gallon',
  3: 'piece',
};

// PAYMENT MODE (orders.payment_mode, payments.payment_type)
const PAYMENT_MODE = {
  GCASH: 1,
  CASH: 2,
  CASH_ON_DELIVERY: 3,
  CASH_ON_PICKUP: 4,
};

const PAYMENT_MODE_NAMES = {
  1: 'gcash',
  2: 'cash',
  3: 'cash_on_delivery',
  4: 'cash_on_pickup',
};

// ORDER STATUS (orders.order_status)
const ORDER_STATUS = {
  CONFIRMED: 1,
  PREPARING: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  CANCELLED: 5,
  RETURNED: 6,
};

const ORDER_STATUS_NAMES = {
  1: 'confirmed',
  2: 'preparing',
  3: 'out_for_delivery',
  4: 'delivered',
  5: 'cancelled',
  6: 'returned',
};

// PAYMENT STATUS (payments.payment_status)
const PAYMENT_STATUS = {
  PENDING: 1,
  VERIFIED: 2,
  REJECTED: 3,
};

const PAYMENT_STATUS_NAMES = {
  1: 'pending',
  2: 'verified',
  3: 'rejected',
};

// RETURN STATUS (order_returns.return_status)
const RETURN_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
};

const RETURN_STATUS_NAMES = {
  1: 'pending',
  2: 'approved',
  3: 'rejected',
};

// INVENTORY TRANSACTION TYPE (inventory_transactions.transaction_type)
const TRANSACTION_TYPE = {
  RESTOCK: 1,
  DEDUCTION: 2,
  ADJUSTMENT: 3,
};

const TRANSACTION_TYPE_NAMES = {
  1: 'restock',
  2: 'deduction',
  3: 'adjustment',
};

// POS PAYMENT METHOD (pos_transactions.payment_method)
const POS_PAYMENT_METHOD = {
  CASH: 1,
  GCASH: 2,
};

const POS_PAYMENT_METHOD_NAMES = {
  1: 'cash',
  2: 'gcash',
};

// POS TRANSACTION STATUS (pos_transactions.transaction_status)
const POS_TRANSACTION_STATUS = {
  COMPLETED: 1,
  CANCELLED: 2,
};

const POS_TRANSACTION_STATUS_NAMES = {
  1: 'completed',
  2: 'cancelled',
};

// NOTIFICATION TYPE (notifications.notification_type)
const NOTIFICATION_TYPE = {
  ORDER_UPDATE: 1,
  PAYMENT_UPDATE: 2,
  INVENTORY_ALERT: 3,
  SYSTEM_MESSAGE: 4,
};

const NOTIFICATION_TYPE_NAMES = {
  1: 'order_update',
  2: 'payment_update',
  3: 'inventory_alert',
  4: 'system_message',
};

// REPORT TYPE (reports.report_type)
const REPORT_TYPE = {
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3,
  YEARLY: 4,
};

const REPORT_TYPE_NAMES = {
  1: 'daily',
  2: 'weekly',
  3: 'monthly',
  4: 'yearly',
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Convert number to enum name
 * @param {number} value - The TINYINT value
 * @param {Object} namesMap - The mapping object (e.g., ROLE_NAMES)
 * @returns {string} The enum name
 */
const getEnumName = (value, namesMap) => namesMap[value] || null;

/**
 * Get integer value from enum name
 * @param {string} name - The enum name
 * @param {Object} enumMap - The mapping object (e.g., ROLE)
 * @returns {number} The TINYINT value
 */
const getEnumValue = (name, enumMap) => {
  for (const [key, value] of Object.entries(enumMap)) {
    if (key === name.toUpperCase() || value === name) {
      return value;
    }
  }
  return null;
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Enums
  ROLE,
  ACCOUNT_STATUS,
  STATION_STATUS,
  UNIT_TYPE,
  PAYMENT_MODE,
  ORDER_STATUS,
  PAYMENT_STATUS,
  RETURN_STATUS,
  TRANSACTION_TYPE,
  POS_PAYMENT_METHOD,
  POS_TRANSACTION_STATUS,
  NOTIFICATION_TYPE,
  REPORT_TYPE,

  // Name mappings
  ROLE_NAMES,
  ACCOUNT_STATUS_NAMES,
  STATION_STATUS_NAMES,
  UNIT_TYPE_NAMES,
  PAYMENT_MODE_NAMES,
  ORDER_STATUS_NAMES,
  PAYMENT_STATUS_NAMES,
  RETURN_STATUS_NAMES,
  TRANSACTION_TYPE_NAMES,
  POS_PAYMENT_METHOD_NAMES,
  POS_TRANSACTION_STATUS_NAMES,
  NOTIFICATION_TYPE_NAMES,
  REPORT_TYPE_NAMES,

  // Helpers
  getEnumName,
  getEnumValue,
};
