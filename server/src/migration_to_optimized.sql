-- =====================================================
-- MIGRATION SCRIPT: OLD SCHEMA TO OPTIMIZED SCHEMA
-- =====================================================
-- This script safely migrates data from the old schema to the optimized version
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS!
-- Run this step by step, not all at once

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- STEP 1: CREATE ARCHIVE TABLES (Backup original data)
-- =====================================================
CREATE TABLE `users_archive` LIKE `users`;
INSERT INTO `users_archive` SELECT * FROM `users`;

CREATE TABLE `stations_archive` LIKE `stations`;
INSERT INTO `stations_archive` SELECT * FROM `stations`;

CREATE TABLE `products_archive` LIKE `products`;
INSERT INTO `products_archive` SELECT * FROM `products`;

CREATE TABLE `inventory_archive` LIKE `inventory`;
INSERT INTO `inventory_archive` SELECT * FROM `inventory`;

CREATE TABLE `inventory_transactions_archive` LIKE `inventory_transactions`;
INSERT INTO `inventory_transactions_archive` SELECT * FROM `inventory_transactions`;

CREATE TABLE `orders_archive` LIKE `orders`;
INSERT INTO `orders_archive` SELECT * FROM `orders`;

CREATE TABLE `order_items_archive` LIKE `order_items`;
INSERT INTO `order_items_archive` SELECT * FROM `order_items`;

CREATE TABLE `payments_archive` LIKE `payments`;
INSERT INTO `payments_archive` SELECT * FROM `payments`;

CREATE TABLE `order_returns_archive` LIKE `order_returns`;
INSERT INTO `order_returns_archive` SELECT * FROM `order_returns`;

CREATE TABLE `pos_transactions_archive` LIKE `pos_transactions`;
INSERT INTO `pos_transactions_archive` SELECT * FROM `pos_transactions`;

CREATE TABLE `notifications_archive` LIKE `notifications`;
INSERT INTO `notifications_archive` SELECT * FROM `notifications`;

CREATE TABLE `reports_archive` LIKE `reports`;
INSERT INTO `reports_archive` SELECT * FROM `reports`;

CREATE TABLE `system_logs_archive` LIKE `system_logs`;
INSERT INTO `system_logs_archive` SELECT * FROM `system_logs`;

-- =====================================================
-- STEP 2: ALTER USERS TABLE
-- =====================================================
ALTER TABLE `users`
  MODIFY `full_name` varchar(100) NOT NULL,
  MODIFY `phone_number` varchar(20) DEFAULT NULL,
  MODIFY `address` varchar(255) DEFAULT NULL,
  ADD COLUMN `complete_address` varchar(500) DEFAULT NULL AFTER `address`,
  ADD COLUMN `account_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=active, 2=suspended, 3=deleted' AFTER `is_active`,
  ADD COLUMN `last_login` datetime DEFAULT NULL AFTER `profile_picture`,
  ADD COLUMN `deleted_at` datetime DEFAULT NULL AFTER `updated_at`,
  CHANGE COLUMN `role` `role` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=customer, 2=admin, 3=super_admin, 4=sys_admin';

-- Update role enum to tinyint
UPDATE `users` SET `role` = 1 WHERE `role` = 'customer';
UPDATE `users` SET `role` = 2 WHERE `role` = 'admin';
UPDATE `users` SET `role` = 3 WHERE `role` = 'super_admin';
UPDATE `users` SET `role` = 4 WHERE `role` = 'sys_admin';

-- Add indexes
ALTER TABLE `users` ADD KEY `role` (`role`), ADD KEY `account_status` (`account_status`);

-- =====================================================
-- STEP 3: ALTER STATIONS TABLE
-- =====================================================
ALTER TABLE `stations`
  MODIFY `address` varchar(255) NOT NULL,
  ADD COLUMN `deleted_at` datetime DEFAULT NULL AFTER `updated_at`,
  CHANGE COLUMN `status` `status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=open, 2=closed, 3=maintenance';

-- Update status enum to tinyint
UPDATE `stations` SET `status` = 1 WHERE `status` = 'open' OR `status` = '';
UPDATE `stations` SET `status` = 2 WHERE `status` = 'closed';
UPDATE `stations` SET `status` = 3 WHERE `status` = 'maintenance';

-- Add indexes
ALTER TABLE `stations` ADD KEY `status` (`status`);

-- =====================================================
-- STEP 4: ALTER PRODUCTS TABLE
-- =====================================================
ALTER TABLE `products`
  MODIFY `description` varchar(500) DEFAULT NULL,
  ADD COLUMN `cost_price` decimal(10,2) DEFAULT NULL AFTER `price`,
  ADD COLUMN `deleted_at` datetime DEFAULT NULL AFTER `updated_at`,
  CHANGE COLUMN `unit_type` `unit_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=liter, 2=gallon, 3=piece';

-- Update unit_type enum to tinyint
UPDATE `products` SET `unit_type` = 1 WHERE `unit_type` = 'liter';
UPDATE `products` SET `unit_type` = 2 WHERE `unit_type` = 'gallon';
UPDATE `products` SET `unit_type` = 3 WHERE `unit_type` = 'piece';

-- Add indexes
ALTER TABLE `products` ADD KEY `is_active` (`is_active`);

-- =====================================================
-- STEP 5: ALTER INVENTORY TABLE
-- =====================================================
ALTER TABLE `inventory`
  ADD COLUMN `reorder_point` int(10) UNSIGNED DEFAULT 10 AFTER `min_stock_level`,
  ADD COLUMN `last_stock_check` datetime DEFAULT NULL AFTER `reorder_point`;

-- Add indexes
ALTER TABLE `inventory` ADD KEY `quantity` (`quantity`);

-- =====================================================
-- STEP 6: ALTER INVENTORY_TRANSACTIONS TABLE
-- =====================================================
ALTER TABLE `inventory_transactions`
  MODIFY `notes` varchar(500) DEFAULT NULL,
  CHANGE COLUMN `transaction_type` `transaction_type` tinyint(1) UNSIGNED NOT NULL COMMENT '1=restock, 2=deduction, 3=adjustment';

-- Update transaction_type enum to tinyint
UPDATE `inventory_transactions` SET `transaction_type` = 1 WHERE `transaction_type` = 'restock';
UPDATE `inventory_transactions` SET `transaction_type` = 2 WHERE `transaction_type` = 'deduction';
UPDATE `inventory_transactions` SET `transaction_type` = 3 WHERE `transaction_type` = 'adjustment';

-- Add indexes
ALTER TABLE `inventory_transactions`
  ADD KEY `transaction_type` (`transaction_type`),
  ADD KEY `created_at` (`created_at`);

-- =====================================================
-- STEP 7: ALTER ORDERS TABLE
-- =====================================================
ALTER TABLE `orders`
  ADD COLUMN `subtotal` decimal(10,2) DEFAULT NULL AFTER `total_amount`,
  ADD COLUMN `discount_amount` decimal(10,2) DEFAULT 0.00 AFTER `subtotal`,
  ADD COLUMN `tax_amount` decimal(10,2) DEFAULT 0.00 AFTER `discount_amount`,
  ADD COLUMN `delivery_fee` decimal(10,2) DEFAULT 0.00 AFTER `tax_amount`,
  MODIFY `customer_name` varchar(150) DEFAULT NULL,
  MODIFY `customer_address` varchar(255) DEFAULT NULL,
  ADD COLUMN `notes` varchar(500) DEFAULT NULL AFTER `customer_complete_address`,
  ADD COLUMN `shipped_date` datetime DEFAULT NULL AFTER `notes`,
  ADD COLUMN `delivered_date` datetime DEFAULT NULL AFTER `shipped_date`,
  CHANGE COLUMN `payment_mode` `payment_mode` tinyint(1) UNSIGNED NOT NULL COMMENT '1=gcash, 2=cash, 3=cash_on_delivery, 4=cash_on_pickup',
  CHANGE COLUMN `order_status` `order_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=confirmed, 2=preparing, 3=out_for_delivery, 4=delivered, 5=cancelled, 6=returned';

-- Update payment_mode enum to tinyint
UPDATE `orders` SET `payment_mode` = 1 WHERE `payment_mode` = 'gcash';
UPDATE `orders` SET `payment_mode` = 2 WHERE `payment_mode` = 'cash';
UPDATE `orders` SET `payment_mode` = 3 WHERE `payment_mode` = 'cash_on_delivery';
UPDATE `orders` SET `payment_mode` = 4 WHERE `payment_mode` = 'cash_on_pickup';
UPDATE `orders` SET `payment_mode` = 2 WHERE `payment_mode` = ''; -- Default unknown to cash

-- Update order_status enum to tinyint
UPDATE `orders` SET `order_status` = 1 WHERE `order_status` = 'confirmed';
UPDATE `orders` SET `order_status` = 2 WHERE `order_status` = 'preparing';
UPDATE `orders` SET `order_status` = 3 WHERE `order_status` = 'out_for_delivery';
UPDATE `orders` SET `order_status` = 4 WHERE `order_status` = 'delivered';
UPDATE `orders` SET `order_status` = 5 WHERE `order_status` = 'cancelled';
UPDATE `orders` SET `order_status` = 6 WHERE `order_status` = 'returned';

-- Populate subtotal from existing data (before discount/tax logic)
UPDATE `orders` SET `subtotal` = `total_amount` WHERE `subtotal` IS NULL;

-- Add indexes
ALTER TABLE `orders`
  ADD KEY `order_status` (`order_status`),
  ADD KEY `created_at` (`created_at`);

-- =====================================================
-- STEP 8: ALTER ORDER_ITEMS TABLE
-- =====================================================
ALTER TABLE `order_items`
  ADD COLUMN `unit_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=liter, 2=gallon, 3=piece' AFTER `quantity`;

-- Populate unit_type from products table
UPDATE `order_items` oi
SET `oi`.`unit_type` = COALESCE((SELECT `unit_type` FROM `products` WHERE `product_id` = `oi`.`product_id`), 1);

-- =====================================================
-- STEP 9: ALTER PAYMENTS TABLE
-- =====================================================
ALTER TABLE `payments`
  ADD COLUMN `amount` decimal(10,2) DEFAULT 0.00 AFTER `payment_status`,
  MODIFY `proof_image_path` varchar(500) DEFAULT NULL,
  ADD COLUMN `transaction_id` varchar(100) DEFAULT NULL AFTER `proof_image_path`,
  CHANGE COLUMN `payment_type` `payment_type` tinyint(1) UNSIGNED NOT NULL COMMENT '1=gcash, 2=cash, 3=cash_on_delivery, 4=cash_on_pickup',
  CHANGE COLUMN `payment_status` `payment_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=pending, 2=verified, 3=rejected';

-- Update payment_type enum to tinyint
UPDATE `payments` SET `payment_type` = 1 WHERE `payment_type` = 'gcash';
UPDATE `payments` SET `payment_type` = 2 WHERE `payment_type` = 'cash';
UPDATE `payments` SET `payment_type` = 3 WHERE `payment_type` = 'cash_on_delivery';
UPDATE `payments` SET `payment_type` = 4 WHERE `payment_type` = 'cash_on_pickup';

-- Update payment_status enum to tinyint
UPDATE `payments` SET `payment_status` = 1 WHERE `payment_status` = 'pending';
UPDATE `payments` SET `payment_status` = 2 WHERE `payment_status` = 'verified';
UPDATE `payments` SET `payment_status` = 3 WHERE `payment_status` = 'rejected';

-- Populate amount from orders
UPDATE `payments` p
SET `p`.`amount` = (SELECT `total_amount` FROM `orders` WHERE `order_id` = `p`.`order_id`)
WHERE `p`.`amount` = 0 OR `p`.`amount` IS NULL;

-- Add indexes
ALTER TABLE `payments`
  ADD KEY `payment_status` (`payment_status`);

-- =====================================================
-- STEP 10: ALTER ORDER_RETURNS TABLE
-- =====================================================
ALTER TABLE `order_returns`
  MODIFY `reason` varchar(500) NOT NULL,
  ADD COLUMN `refund_amount` decimal(10,2) DEFAULT NULL AFTER `reason`,
  ADD COLUMN `approved_date` datetime DEFAULT NULL AFTER `return_status`,
  ADD COLUMN `refund_date` datetime DEFAULT NULL AFTER `approved_date`,
  CHANGE COLUMN `return_status` `return_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=pending, 2=approved, 3=rejected';

-- Update return_status enum to tinyint
UPDATE `order_returns` SET `return_status` = 1 WHERE `return_status` = 'pending';
UPDATE `order_returns` SET `return_status` = 2 WHERE `return_status` = 'approved';
UPDATE `order_returns` SET `return_status` = 3 WHERE `return_status` = 'rejected';

-- Populate refund_amount from order total
UPDATE `order_returns` orr
SET `refund_amount` = (SELECT `total_amount` FROM `orders` WHERE `order_id` = `orr`.`order_id`)
WHERE `refund_amount` IS NULL AND `return_status` = 2;

-- Add indexes
ALTER TABLE `order_returns`
  ADD KEY `return_status` (`return_status`);

-- =====================================================
-- STEP 11: ALTER POS_TRANSACTIONS TABLE
-- =====================================================
ALTER TABLE `pos_transactions`
  ADD COLUMN `receipt_number` varchar(50) DEFAULT NULL AFTER `pos_id`,
  MODIFY `full_name` varchar(150) DEFAULT NULL,
  MODIFY `full_address` varchar(255) DEFAULT NULL,
  ADD COLUMN `discount_amount` decimal(10,2) DEFAULT 0.00 AFTER `total_amount`,
  ADD COLUMN `notes` varchar(500) DEFAULT NULL AFTER `transaction_status`,
  CHANGE COLUMN `payment_method` `payment_method` tinyint(1) UNSIGNED NOT NULL COMMENT '1=cash, 2=gcash',
  CHANGE COLUMN `transaction_status` `transaction_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=completed, 2=cancelled';

-- Update payment_method enum to tinyint
UPDATE `pos_transactions` SET `payment_method` = 1 WHERE `payment_method` = 'cash';
UPDATE `pos_transactions` SET `payment_method` = 2 WHERE `payment_method` = 'gcash';

-- Update transaction_status enum to tinyint
UPDATE `pos_transactions` SET `transaction_status` = 1 WHERE `transaction_status` = 'completed';
UPDATE `pos_transactions` SET `transaction_status` = 2 WHERE `transaction_status` = 'cancelled';

-- Generate receipt numbers where null
UPDATE `pos_transactions`
SET `receipt_number` = CONCAT('RCP-', DATE_FORMAT(`transaction_date`, '%Y%m%d'), '-', `pos_id`)
WHERE `receipt_number` IS NULL;

-- Add indexes
ALTER TABLE `pos_transactions`
  ADD KEY `transaction_status` (`transaction_status`),
  ADD KEY `transaction_date` (`transaction_date`);

-- =====================================================
-- STEP 12: ALTER NOTIFICATIONS TABLE
-- =====================================================
ALTER TABLE `notifications`
  MODIFY `message` varchar(500) NOT NULL,
  ADD COLUMN `sent_at` datetime DEFAULT NULL AFTER `is_read`,
  CHANGE COLUMN `notification_type` `notification_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=order_update, 2=payment_update, 3=inventory_alert, 4=system_message';

-- Update notification_type enum to tinyint
UPDATE `notifications` SET `notification_type` = 1 WHERE `notification_type` = 'order_update';
UPDATE `notifications` SET `notification_type` = 2 WHERE `notification_type` = 'payment_update';
UPDATE `notifications` SET `notification_type` = 3 WHERE `notification_type` = 'inventory_alert';
UPDATE `notifications` SET `notification_type` = 4 WHERE `notification_type` = 'system_message';
UPDATE `notifications` SET `notification_type` = 1 WHERE `notification_type` = ''; -- Default to order_update

-- Add indexes
ALTER TABLE `notifications`
  ADD KEY `notification_type` (`notification_type`),
  ADD KEY `is_read` (`is_read`);

-- =====================================================
-- STEP 13: ALTER REPORTS TABLE
-- =====================================================
ALTER TABLE `reports`
  CHANGE COLUMN `report_type` `report_type` tinyint(1) UNSIGNED NOT NULL COMMENT '1=daily, 2=weekly, 3=monthly, 4=yearly';

-- Update report_type enum to tinyint
UPDATE `reports` SET `report_type` = 1 WHERE `report_type` = 'daily';
UPDATE `reports` SET `report_type` = 2 WHERE `report_type` = 'weekly';
UPDATE `reports` SET `report_type` = 3 WHERE `report_type` = 'monthly';
UPDATE `reports` SET `report_type` = 4 WHERE `report_type` = 'yearly';

-- Add indexes
ALTER TABLE `reports`
  ADD KEY `report_type` (`report_type`);

-- =====================================================
-- STEP 14: ALTER SYSTEM_LOGS TABLE
-- =====================================================
ALTER TABLE `system_logs`
  MODIFY `event_type` varchar(50) NOT NULL,
  MODIFY `description` varchar(500) NOT NULL,
  ADD KEY `event_type` (`event_type`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `created_at` (`created_at`);

COMMIT;

-- =====================================================
-- VERIFICATION & CLEANUP (Run after confirming data integrity)
-- =====================================================
-- Verify all conversions were successful
SELECT 'Users' AS table_name, COUNT(*) AS total_records FROM `users`
UNION ALL
SELECT 'Orders', COUNT(*) FROM `orders`
UNION ALL
SELECT 'Payments', COUNT(*) FROM `payments`
UNION ALL
SELECT 'POS Transactions', COUNT(*) FROM `pos_transactions`;

-- If everything looks good, drop archive tables:
-- DROP TABLE `users_archive`, `stations_archive`, `products_archive`, `inventory_archive`,
--            `inventory_transactions_archive`, `orders_archive`, `order_items_archive`,
--            `payments_archive`, `order_returns_archive`, `pos_transactions_archive`,
--            `notifications_archive`, `reports_archive`, `system_logs_archive`;
