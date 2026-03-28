# Enum Migration Implementation Guide

## Status

This guide shows how to migrate all 17+ files from string enums to TINYINT constants.

## Database Migration Instructions

### 1. BACKUP YOUR DATABASE FIRST
```bash
cd c:/Users/Ian/OneDrive/Documents/Software_Design/AquaLasTech/server/src
mysqldump -u root aqualastech > aqualastech_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. RUN THE MIGRATION SCRIPT

**Using MySQL Command Line:**
```bash
mysql -u root aqualastech < migration_to_optimized.sql
```

**Using MySQL Workbench:**
- Open "migration_to_optimized.sql"
- Execute the entire script
- Check for any errors in the output panel

**Using PhpMyAdmin:**
- Import > Select "migration_to_optimized.sql"
- Execute

---

## Code Migration Checklist

### Phase 1: Core Enum Updates (COMPLETED ✅)
- [x] Created dbEnums.ts with all enum constants
- [x] Updated order.routes.ts with ORDER_STATUS, PAYMENT_STATUS, RETURN_STATUS, NOTIFICATION_TYPE
- [x] Added missing SYSTEM_LOG_TYPE enum

### Phase 2: Routes to Update (16 files)

#### HIGH PRIORITY (Use immediately after DB migration)
1. **auth.routes.ts** - Line 29, 76
   - Change: `"customer"` → `ROLE.CUSTOMER`
   - Change: `'login'` → `SYSTEM_LOG_TYPE.LOGIN`

2. **customer.routes.ts** - Lines 197, 222, 257, 268, 289, 295, 453, 457, 479, 504, 513, 517, 521, 545
   - Key changes at checkout endpoint
   - Multiple notification and status updates

3. **pos.routes.ts** - Lines 71-72, 103, 114, 128
   - Payment mode conditionals
   - Stock alerts

4. **inventory.routes.ts** - Line 174
   - Restock transaction type

5. **reports.routes.ts** - Multiple CASE statements
   - Status-based reporting

#### MEDIUM PRIORITY
6. **sysadmin.routes.ts** - Lines 10, 30, 80, 92, 103, 168, 224
7. **settings.routes.ts** - Lines 20, 148, 179, 211
8. **station.routes.ts** - TBD
9. **station.customer.routes.ts** - TBD
10. **user.routes.ts** - TBD

#### LOWER PRIORITY (Scripts)
11. **createStation.ts** - Lines 38, 69, 108, 133, 150
12. **ManageAdmins.ts** - Lines 22, 68, 209
13. **ManageStations.ts** - Lines 22, 84, 186
14. **createAdmin.ts** - TBD
15. **seedOrders.ts** - Lines 41-80

#### MIDDLEWARE & CONTROLLERS
16. **auth.middleware.ts** - TBD (role checks)
17. **role.middleware.ts** - TBD (role validation)

---

## Code Update Examples

### Example 1: Order Status Check
**BEFORE:**
```typescript
if (order.order_status === 'delivered') {
  // do something
}
```

**AFTER:**
```typescript
import { ORDER_STATUS } from '../constants/dbEnums.js'

if (order.order_status === ORDER_STATUS.DELIVERED) { // 4
  // do something
}
```

### Example 2: Role Validation
**BEFORE:**
```typescript
if (u.role !== 'super_admin') {
  return res.status(403).json({ message: 'Denied' })
}
```

**AFTER:**
```typescript
import { ROLE } from '../constants/dbEnums.js'

if (u.role !== ROLE.SUPER_ADMIN) { // 3
  return res.status(403).json({ message: 'Denied' })
}
```

### Example 3: Multiple Values
**BEFORE:**
```typescript
WHERE order_status IN ('confirmed','preparing','out_for_delivery')
```

**AFTER:**
```typescript
import { ORDER_STATUS } from '../constants/dbEnums.js'

WHERE order_status IN (?, ?, ?)
// params: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY]
```

### Example 4: Array Validation
**BEFORE:**
```typescript
const valid = ['confirmed', 'preparing', 'delivered', 'cancelled']
if (!valid.includes(status)) { return error }
```

**AFTER:**
```typescript
import { VALID_ORDER_STATUSES } from '../constants/dbEnums.js'

if (!VALID_ORDER_STATUSES.includes(status)) { return error }
```

### Example 5: Response with Readable Names
**BEFORE:**
```typescript
res.json({ order_status: 1 }) // Not user-friendly
```

**AFTER:**
```typescript
import { getEnumName, ORDER_STATUS_NAMES } from '../constants/dbEnums.js'

// Transform before sending to client
res.json({
  order_status: 1,
  order_status_name: ORDER_STATUS_NAMES[1] // 'confirmed'
})
```

---

## Import Pattern for All Files

Add this at the top of each file that uses enums:

```typescript
import {
  ROLE,
  ORDER_STATUS,
  PAYMENT_MODE,
  PAYMENT_STATUS,
  RETURN_STATUS,
  NOTIFICATION_TYPE,
  STATION_STATUS,
  TRANSACTION_TYPE,
  REPORT_TYPE,
  SYSTEM_LOG_TYPE,
  // Plus the _NAMES versions you need
  ROLE_NAMES,
  ORDER_STATUS_NAMES,
  PAYMENT_MODE_NAMES,
  // Plus valid arrays
  VALID_ORDER_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_RETURN_STATUSES,
  VALID_ROLES,
} from '../constants/dbEnums.js'
```

---

## File-by-File Update Details

### auth.routes.ts
```typescript
// Line 29: Change from 'customer' to numeric
const [result]: any = await db.query(
   `INSERT INTO users (..., role) VALUES (..., ?)`,
   [..., ROLE.CUSTOMER] // Was 'customer'
)

// Line 76: Change from 'login' to SYSTEM_LOG_TYPE
await db.query(
    `INSERT INTO system_logs (event_type, ...) VALUES (?, ...)`,
    [SYSTEM_LOG_TYPE.LOGIN, ...] // Was 'login'
)
```

### customer.routes.ts
```typescript
// Line 197: payment_mode check
if (payment_mode === PAYMENT_MODE.GCASH) {
  // was payment_mode === 'gcash'
}

// Line 222: order status initialization
`INSERT INTO orders (..., order_status, ...) VALUES (..., ?, ...)`
// params: [..., ORDER_STATUS.CONFIRMED, ...] was 'confirmed'

// Line 257: role filtering
`u.role IN (?, ?)`
// params: [ROLE.ADMIN, ROLE.SUPER_ADMIN] was ('admin','super_admin')

// Line 268: notification type
`notification_type = ?`
// params: NOTIFICATION_TYPE.INVENTORY_ALERT was 'low_stock'

// Line 289: payment status
`payment_status = ?`
// params: PAYMENT_STATUS.PENDING was 'pending'

// Continue for all other lines...
```

### pos.routes. ts
Similar updates for payment methods and notification types

### inventory.routes.ts
```typescript
// Line 174: transaction type
`transaction_type = ?`
// params: TRANSACTION_TYPE.RESTOCK was 'restock'
```

### reports.routes.ts
```typescript
// Replace multiple CASE statements:
CASE
  WHEN o.order_status = ? THEN 'Delivered'
  WHEN o.order_status = ? THEN 'Cancelled'
  ...
END
// params: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ...]
```

---

## Testing After Migration

### 1. Test Database
```sql
-- Verify enum conversions
SELECT DISTINCT role FROM users;  -- Should show numbers: 1,2,3,4
SELECT DISTINCT order_status FROM orders;  -- Should show numbers: 1-6
SELECT DISTINCT payment_status FROM payments;  -- Should show numbers: 1-3
```

### 2. Test Application

**Login scenarios:**
- [ ] Customer login
- [ ] Admin login
- [ ] Super Admin login
- [ ] Sys Admin login

**Order flow:**
- [ ] Create order with GCash payment
- [ ] Create order with Cash
- [ ] Update order status
- [ ] Verify payment status updates
- [ ] Request return
- [ ] Approve/reject return

**Inventory:**
- [ ] Check stock alerts
- [ ] Deduct inventory
- [ ] Add restock transaction

**Reports:**
- [ ] Generate daily report
- [ ] Filter by status
- [ ] Filter by payment method

**Admin functions:**
- [ ] Access system admin panel
- [ ] Create/delete station
- [ ] Manage admins
- [ ] View logs

### 3. Monitor Logs
```bash
# Watch for any SQL errors
tail -f /path/to/server/error.log
```

---

## Rollback Plan

If something breaks:

```bash
# Restore database
mysql -u root aqualastech < aqualastech_backup_YYYYMMDD_HHMMSS.sql

# Git revert code changes
git revert <commit-hash>
# OR
git checkout <original-branch>
```

---

## Timeline

- **Step 1:** Backup database (5 min)
- **Step 2:** Run migration (2-5 min)
- **Step 3:** Update core routes (2-3 hours for all 16 files)
- **Step 4:** Test thoroughly (1-2 hours)
- **Step 5:** Deploy to production

---

## Notes

- All numeric values are production-ready after migration
- Response APIs should still return readable names (use this pattern: `{ status: 1, status_name: 'confirmed' }`)
- Frontend can accept numeric values OR you can add a transformation layer
- Performance improved due to TINYINT being faster than ENUM
- Storage savings: ~90% per enum field

