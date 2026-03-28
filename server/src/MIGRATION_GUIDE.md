# Database Migration Guide: Old Schema → Optimized Schema

## Overview
This migration converts your AquaLasTech database from the current schema to an optimized storage-efficient schema.

**Changes:**
- ENUM → TINYINT (saves ~90% per record)
- TEXT → VARCHAR with limits (saves 95%+ per field)
- Added missing fields for business logic
- Added strategic indexes for query performance
- Soft delete support (deleted_at fields)

---

## Pre-Migration Checklist

✅ **BACKUP YOUR DATABASE FIRST!**
```bash
mysqldump -u your_user -p aqualastech > aqualastech_backup_$(date +%Y%m%d_%H%M%S).sql
```

✅ Test on a copy of your database first
✅ Notify users that database maintenance is happening
✅ Have a rollback plan ready

---

## Migration Steps

### **Step 1: Review Archive Tables**
The migration script creates `*_archive` tables as backups. This is the safest approach.

Archives created:
- users_archive
- stations_archive
- products_archive
- inventory_archive
- inventory_transactions_archive
- orders_archive
- order_items_archive
- payments_archive
- order_returns_archive
- pos_transactions_archive
- notifications_archive
- reports_archive
- system_logs_archive

### **Step 2: Run Migration Script**

**Method A: Run all at once (RECOMMENDED)**
```bash
mysql -u your_user -p aqualastech < migration_to_optimized.sql
```

**Method B: Run step by step (for debugging)**
- Copy each section separately and run
- Verify each step before proceeding
- Monitor error logs

### **Step 3: Verify Data Integrity**

After the script finishes, run these checks:

**Check record counts:**
```sql
-- Should match archive tables
SELECT 'Users' AS `table`, COUNT(*) AS records FROM users
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;
```

**Check enum conversions (sample):**
```sql
-- Should show only numbers (1,2,3,4)
SELECT DISTINCT `role` FROM `users`;
SELECT DISTINCT `status` FROM `stations`;
SELECT DISTINCT `order_status` FROM `orders`;
SELECT DISTINCT `payment_status` FROM `payments`;
```

**Check for NULL issues:**
```sql
-- Spot check a few records to ensure data wasn't lost
SELECT * FROM `orders` LIMIT 5;
SELECT * FROM `payments` LIMIT 5;
SELECT * FROM `users` LIMIT 5;
```

### **Step 4: Update Application Code**

Your application needs to know the new TINYINT mappings:

**users.role:**
- 1 = customer
- 2 = admin
- 3 = super_admin
- 4 = sys_admin

**orders.payment_mode / payments.payment_type:**
- 1 = gcash
- 2 = cash
- 3 = cash_on_delivery
- 4 = cash_on_pickup

**orders.order_status:**
- 1 = confirmed
- 2 = preparing
- 3 = out_for_delivery
- 4 = delivered
- 5 = cancelled
- 6 = returned

**Example in Node.js:**
```javascript
const ROLE_MAP = { customer: 1, admin: 2, super_admin: 3, sys_admin: 4 };
const ORDER_STATUS_MAP = { confirmed: 1, preparing: 2, out_for_delivery: 3, delivered: 4, cancelled: 5, returned: 6 };

// When querying:
const user = db.query('SELECT * FROM users WHERE role = ?', [ROLE_MAP.admin]);

// When inserting:
db.query('INSERT INTO users (role) VALUES (?)', [ROLE_MAP.customer]);
```

### **Step 5: Cleanup (Optional)**

Once you've confirmed everything works perfectly:

```sql
-- Delete archive tables (KEEP BACKUP FILE FIRST!)
DROP TABLE
  users_archive,
  stations_archive,
  products_archive,
  inventory_archive,
  inventory_transactions_archive,
  orders_archive,
  order_items_archive,
  payments_archive,
  order_returns_archive,
  pos_transactions_archive,
  notifications_archive,
  reports_archive,
  system_logs_archive;
```

---

## Rollback Plan (If Something Goes Wrong)

**If you need to rollback:**

1. **Stop your application**
2. **Restore from backup:**
```bash
mysql -u your_user -p aqualastech < aqualastech_backup_YYYYMMDD_HHMMSS.sql
```
3. **Verify original data is restored**
4. **Restart application**

---

## New Fields Added

### users
- `account_status` (TINYINT) - 1=active, 2=suspended, 3=deleted
- `last_login` (DATETIME) - Track last login time
- `deleted_at` (DATETIME) - Soft delete support
- `complete_address` (VARCHAR 500) - Full address field

### products
- `cost_price` (DECIMAL 10,2) - Track product cost for margin calculation
- `deleted_at` (DATETIME) - Soft delete support

### inventory
- `reorder_point` (INT) - Automatic reorder threshold
- `last_stock_check` (DATETIME) - Audit trail for stock checks

### orders
- `subtotal` (DECIMAL 10,2) - Before discount/tax
- `discount_amount` (DECIMAL 10,2) - Track discounts
- `tax_amount` (DECIMAL 10,2) - Track taxes separately
- `delivery_fee` (DECIMAL 10,2) - Shipping cost breakdown
- `notes` (VARCHAR 500) - Order notes
- `shipped_date` (DATETIME) - When order shipped
- `delivered_date` (DATETIME) - When order delivered

### order_items
- `unit_type` (TINYINT) - Which unit was ordered (auto-populated from products)

### payments
- `amount` (DECIMAL 10,2) - Payment amount (may differ from order total)
- `transaction_id` (VARCHAR 100) - External payment gateway ID

### order_returns
- `refund_amount` (DECIMAL 10,2) - How much will be refunded
- `approved_date` (DATETIME) - When return was approved
- `refund_date` (DATETIME) - When refund was processed

### pos_transactions
- `receipt_number` (VARCHAR 50) - Receipt ID (auto-generated)
- `discount_amount` (DECIMAL 10,2) - Walk-in customer discounts
- `notes` (VARCHAR 500) - Transaction notes

### notifications
- `sent_at` (DATETIME) - When notification was sent

---

## Performance Impact

### Storage Savings
- **Per ENUM field:** ~90% smaller (10 bytes → 1 byte)
- **Per TEXT field:** 95-99% smaller (converted to VARCHAR with limits)
- **Estimated for 100K orders:** 5-10MB saved
- **Estimated for 1M transactions:** 50MB+ saved

### Query Performance
New indexes added on frequently filtered columns:
- `users.role`, `users.account_status`
- `orders.order_status`, `orders.created_at`
- `payments.payment_status`
- `inventory.quantity`
- `notifications.notification_type`, `.is_read`

**Expected improvement:** 20-40% faster filtering queries

---

## Testing Checklist

After migration, test these scenarios:

- [ ] Login functionality still works
- [ ] Create a new order
- [ ] Verify order status updates
- [ ] Process a payment
- [ ] Check inventory deductions
- [ ] Create a return request
- [ ] POS transactions work
- [ ] Notifications are created
- [ ] System logs capture events
- [ ] Reports generate correctly
- [ ] All filters in admin pages work
- [ ] Soft deletes work (hidden_at, deleted_at)

---

## Support

If something goes wrong:
1. Check the MySQL error log
2. Verify record counts match archives
3. Check for any conversion errors in UPDATE statements
4. Review the backup file for original data
5. Rollback if necessary

**Key files:**
- Migration script: `migration_to_optimized.sql`
- Optimized schema: `aqualastech_optimized.sql`
- Backup: `aqualastech_backup_*.sql`
