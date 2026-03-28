/**
 * Database ENUM to TINYINT Type-Safe Constants
 * Use these throughout the application instead of hardcoded string enums
 *
 * After migration, all enum values in the database are TINYINT:
 * - This saves 90% storage (ENUM = 10 bytes, TINYINT = 1 byte)
 * - All string comparisons must be updated to numeric comparisons
 *
 * Example Migration:
 *   OLD: WHERE order_status = 'delivered'
 *   NEW: WHERE order_status = ORDER_STATUS.DELIVERED
 */

// ====================================================
// USER ROLES (users.role) - TINYINT(1)
// ====================================================
export const ROLE = {
  CUSTOMER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
  SYS_ADMIN: 4,
} as const;

export const ROLE_NAMES: Record<number, string> = {
  1: 'customer',
  2: 'admin',
  3: 'super_admin',
  4: 'sys_admin',
};

// ====================================================
// USER ACCOUNT STATUS (users.account_status) - TINYINT(1)
// ====================================================
export const ACCOUNT_STATUS = {
  ACTIVE: 1,
  SUSPENDED: 2,
  DELETED: 3,
} as const;

export const ACCOUNT_STATUS_NAMES: Record<number, string> = {
  1: 'active',
  2: 'suspended',
  3: 'deleted',
};

// ====================================================
// STATION STATUS (stations.status) - TINYINT(1)
// ====================================================
export const STATION_STATUS = {
  OPEN: 1,
  CLOSED: 2,
  MAINTENANCE: 3,
} as const;

export const STATION_STATUS_NAMES: Record<number, string> = {
  1: 'open',
  2: 'closed',
  3: 'maintenance',
};

// ====================================================
// PRODUCT UNIT TYPE (products.unit_type) - TINYINT(1)
// ====================================================
export const UNIT_TYPE = {
  LITER: 1,
  GALLON: 2,
  PIECE: 3,
} as const;

export const UNIT_TYPE_NAMES: Record<number, string> = {
  1: 'liter',
  2: 'gallon',
  3: 'piece',
};

// ====================================================
// PAYMENT MODE (orders.payment_mode) - TINYINT(1)
// ====================================================
export const PAYMENT_MODE = {
  GCASH: 1,
  CASH: 2,
  CASH_ON_DELIVERY: 3,
  CASH_ON_PICKUP: 4,
} as const;

export const PAYMENT_MODE_NAMES: Record<number, string> = {
  1: 'gcash',
  2: 'cash',
  3: 'cash_on_delivery',
  4: 'cash_on_pickup',
};

// ====================================================
// ORDER STATUS (orders.order_status) - TINYINT(1)
// ====================================================
export const ORDER_STATUS = {
  CONFIRMED: 1,
  PREPARING: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  CANCELLED: 5,
  RETURNED: 6,
} as const;

export const ORDER_STATUS_NAMES: Record<number, string> = {
  1: 'confirmed',
  2: 'preparing',
  3: 'out_for_delivery',
  4: 'delivered',
  5: 'cancelled',
  6: 'returned',
};

// ====================================================
// PAYMENT STATUS (payments.payment_status) - TINYINT(1)
// ====================================================
export const PAYMENT_STATUS = {
  PENDING: 1,
  VERIFIED: 2,
  REJECTED: 3,
} as const;

export const PAYMENT_STATUS_NAMES: Record<number, string> = {
  1: 'pending',
  2: 'verified',
  3: 'rejected',
};

// ====================================================
// RETURN STATUS (order_returns.return_status) - TINYINT(1)
// ====================================================
export const RETURN_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;

export const RETURN_STATUS_NAMES: Record<number, string> = {
  1: 'pending',
  2: 'approved',
  3: 'rejected',
};

// ====================================================
// INVENTORY TRANSACTION TYPE (inventory_transactions.transaction_type) - TINYINT(1)
// ====================================================
export const TRANSACTION_TYPE = {
  RESTOCK: 1,
  DEDUCTION: 2,
  ADJUSTMENT: 3,
} as const;

export const TRANSACTION_TYPE_NAMES: Record<number, string> = {
  1: 'restock',
  2: 'deduction',
  3: 'adjustment',
};

// ====================================================
// POS PAYMENT METHOD (pos_transactions.payment_method) - TINYINT(1)
// ====================================================
export const POS_PAYMENT_METHOD = {
  CASH: 1,
  GCASH: 2,
} as const;

export const POS_PAYMENT_METHOD_NAMES: Record<number, string> = {
  1: 'cash',
  2: 'gcash',
};

// ====================================================
// POS TRANSACTION STATUS (pos_transactions.transaction_status) - TINYINT(1)
// ====================================================
export const POS_TRANSACTION_STATUS = {
  COMPLETED: 1,
  CANCELLED: 2,
} as const;

export const POS_TRANSACTION_STATUS_NAMES: Record<number, string> = {
  1: 'completed',
  2: 'cancelled',
};

// ====================================================
// NOTIFICATION TYPE (notifications.notification_type) - TINYINT(1)
// ====================================================
export const NOTIFICATION_TYPE = {
  ORDER_UPDATE: 1,
  PAYMENT_UPDATE: 2,
  INVENTORY_ALERT: 3,
  SYSTEM_MESSAGE: 4,
} as const;

export const NOTIFICATION_TYPE_NAMES: Record<number, string> = {
  1: 'order_update',
  2: 'payment_update',
  3: 'inventory_alert',
  4: 'system_message',
};

// ====================================================
// REPORT TYPE (reports.report_type) - TINYINT(1)
// ====================================================
export const REPORT_TYPE = {
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3,
  YEARLY: 4,
} as const;

export const REPORT_TYPE_NAMES: Record<number, string> = {
  1: 'daily',
  2: 'weekly',
  3: 'monthly',
  4: 'yearly',
};

// ====================================================
// SYSTEM LOG EVENT TYPE (system_logs.event_type) - VARCHAR(50)
// Keep as strings since event_type is VARCHAR, not TINYINT
// ====================================================
export const SYSTEM_LOG_TYPE = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  STATION_CREATED: 'station_created',
  STATION_UPDATED: 'station_updated',
  STATION_DELETED: 'station_deleted',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  LOGS_CLEARED: 'logs_cleared',
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
} as const;

// ====================================================
// VALID ARRAYS (for validation)
// ====================================================
export const VALID_ORDER_STATUSES = Object.values(ORDER_STATUS);
export const VALID_PAYMENT_MODES = Object.values(PAYMENT_MODE);
export const VALID_PAYMENT_STATUSES = Object.values(PAYMENT_STATUS);
export const VALID_RETURN_STATUSES = Object.values(RETURN_STATUS);
export const VALID_ROLES = Object.values(ROLE);
export const VALID_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPE);

// ====================================================
// HELPER FUNCTIONS
// ====================================================

/**
 * Convert numeric enum value to readable string name
 * @param value - The numeric TINYINT value
 * @param namesMap - The mapping object (e.g., ORDER_STATUS_NAMES)
 * @returns The readable name
 */
export const getEnumName = (value: number, namesMap: Record<number, string>): string | null => {
  return namesMap[value] || null;
};

/**
 * Check if an order status is a "final" status (won't change)
 */
export const isFinalOrderStatus = (status: number): boolean => {
  return [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED].includes(status);
};

/**
 * Check if an order status is "in progress"
 */
export const isActiveOrderStatus = (status: number): boolean => {
  return [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY].includes(status);
};

/**
 * Convert old string enum to new TINYINT (for one-time data conversion if needed)
 */
export const convertOldEnumToNew = (oldValue: string, enumMap: Record<string, number>): number | null => {
  for (const [key, value] of Object.entries(enumMap)) {
    if (key.toLowerCase() === oldValue.toLowerCase()) {
      return value;
    }
  }
  return null;
};

/**
 * Check if user has a specific role or higher
 */
export const hasRole = (userRole: number, requiredRole: number): boolean => {
  // Super admin has access to everything
  if (userRole === ROLE.SYS_ADMIN) return true;
  if (userRole === ROLE.SUPER_ADMIN && requiredRole !== ROLE.SYS_ADMIN) return true;
  return userRole === requiredRole;
};
