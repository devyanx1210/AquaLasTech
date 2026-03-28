-- phpMyAdmin SQL Dump - OPTIMIZED FOR STORAGE
-- Enums converted to TINYINT, VARCHAR limits applied, missing fields added

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- =====================================================
-- ENUM MAPPINGS (Using TINYINT)
-- =====================================================
-- user.role: customer(1), admin(2), super_admin(3), sys_admin(4)
-- user.account_status: active(1), suspended(2), deleted(3)
--
-- stations.status: open(1), closed(2), maintenance(3)
--
-- products.unit_type: liter(1), gallon(2), piece(3)
-- products.is_active: inactive(0), active(1)
--
-- inventory_transactions.transaction_type: restock(1), deduction(2), adjustment(3)
--
-- orders.payment_mode: gcash(1), cash(2), cash_on_delivery(3), cash_on_pickup(4)
-- orders.order_status: confirmed(1), preparing(2), out_for_delivery(3), delivered(4), cancelled(5), returned(6)
--
-- payments.payment_type: gcash(1), cash(2), cash_on_delivery(3), cash_on_pickup(4)
-- payments.payment_status: pending(1), verified(2), rejected(3)
--
-- order_returns.return_status: pending(1), approved(2), rejected(3)
--
-- pos_transactions.payment_method: cash(1), gcash(2)
-- pos_transactions.transaction_status: completed(1), cancelled(2)
--
-- notifications.notification_type: order_update(1), payment_update(2), inventory_alert(3), system_message(4)
--
-- reports.report_type: daily(1), weekly(2), monthly(3), yearly(4)

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `complete_address` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `role` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=customer, 2=admin, 3=super_admin, 4=sys_admin',
  `station_id` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `account_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=active, 2=suspended, 3=deleted',
  `profile_picture` varchar(500) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  UNIQUE KEY `email` (`email`),
  KEY `station_id` (`station_id`),
  KEY `role` (`role`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STATIONS TABLE
-- =====================================================
CREATE TABLE `stations` (
  `station_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `station_name` varchar(150) NOT NULL,
  `address` varchar(255) NOT NULL,
  `complete_address` varchar(500) DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `qr_code_path` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=open, 2=closed, 3=maintenance',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE `products` (
  `product_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `station_id` int(10) UNSIGNED NOT NULL,
  `product_name` varchar(150) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `unit_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=liter, 2=gallon, 3=piece',
  `unit` varchar(50) NOT NULL DEFAULT 'gallon',
  `sku` varchar(100) DEFAULT NULL UNIQUE,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  UNIQUE KEY `unique_station_product` (`station_id`, `product_name`),
  KEY `is_active` (`is_active`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- INVENTORY TABLE
-- =====================================================
CREATE TABLE `inventory` (
  `inventory_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `station_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `min_stock_level` int(10) UNSIGNED DEFAULT 5,
  `reorder_point` int(10) UNSIGNED DEFAULT 10,
  `last_stock_check` datetime DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  UNIQUE KEY `unique_station_product` (`station_id`, `product_id`),
  KEY `product_id` (`product_id`),
  KEY `quantity` (`quantity`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- INVENTORY_TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE `inventory_transactions` (
  `transaction_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `inventory_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `transaction_type` tinyint(1) UNSIGNED NOT NULL COMMENT '1=restock, 2=deduction, 3=adjustment',
  `quantity` int(10) UNSIGNED NOT NULL,
  `reference_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  KEY `inventory_id` (`inventory_id`),
  KEY `station_id` (`station_id`),
  KEY `product_id` (`product_id`),
  KEY `created_by` (`created_by`),
  KEY `transaction_type` (`transaction_type`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`inventory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE `orders` (
  `order_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_reference` varchar(50) NOT NULL UNIQUE,
  `user_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `delivery_fee` decimal(10,2) DEFAULT 0.00,
  `payment_mode` tinyint(1) UNSIGNED NOT NULL COMMENT '1=gcash, 2=cash, 3=cash_on_delivery, 4=cash_on_pickup',
  `order_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=confirmed, 2=preparing, 3=out_for_delivery, 4=delivered, 5=cancelled, 6=returned',
  `customer_name` varchar(150) DEFAULT NULL,
  `customer_address` varchar(255) DEFAULT NULL,
  `customer_complete_address` varchar(500) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `shipped_date` datetime DEFAULT NULL,
  `delivered_date` datetime DEFAULT NULL,
  `hidden_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  UNIQUE KEY `order_reference` (`order_reference`),
  KEY `user_id` (`user_id`),
  KEY `station_id` (`station_id`),
  KEY `order_status` (`order_status`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- ORDER_ITEMS TABLE
-- =====================================================
CREATE TABLE `order_items` (
  `order_item_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `unit_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=liter, 2=gallon, 3=piece',
  `price_snapshot` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE `payments` (
  `payment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` int(10) UNSIGNED DEFAULT NULL,
  `payment_type` tinyint(1) UNSIGNED NOT NULL COMMENT '1=gcash, 2=cash, 3=cash_on_delivery, 4=cash_on_pickup',
  `payment_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=pending, 2=verified, 3=rejected',
  `amount` decimal(10,2) DEFAULT 0.00,
  `proof_image_path` varchar(500) DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `verified_by` int(10) UNSIGNED DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `verified_by` (`verified_by`),
  KEY `payment_status` (`payment_status`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- ORDER_RETURNS TABLE
-- =====================================================
CREATE TABLE `order_returns` (
  `return_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_id` int(10) UNSIGNED NOT NULL,
  `reason` varchar(500) NOT NULL,
  `refund_amount` decimal(10,2) DEFAULT NULL,
  `return_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=pending, 2=approved, 3=rejected',
  `approved_date` datetime DEFAULT NULL,
  `refund_date` datetime DEFAULT NULL,
  `processed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  KEY `order_id` (`order_id`),
  KEY `return_status` (`return_status`),
  CONSTRAINT `order_returns_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- POS_TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE `pos_transactions` (
  `pos_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `station_id` int(10) UNSIGNED NOT NULL,
  `processed_by` int(10) UNSIGNED DEFAULT NULL,
  `receipt_number` varchar(50) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `full_address` varchar(255) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `payment_method` tinyint(1) UNSIGNED NOT NULL COMMENT '1=cash, 2=gcash',
  `transaction_status` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=completed, 2=cancelled',
  `notes` varchar(500) DEFAULT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  KEY `station_id` (`station_id`),
  KEY `processed_by` (`processed_by`),
  KEY `transaction_status` (`transaction_status`),
  KEY `transaction_date` (`transaction_date`),
  CONSTRAINT `pos_transactions_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pos_transactions_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE `notifications` (
  `notification_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED DEFAULT NULL,
  `message` varchar(500) NOT NULL,
  `notification_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=order_update, 2=payment_update, 3=inventory_alert, 4=system_message',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  KEY `user_id` (`user_id`),
  KEY `station_id` (`station_id`),
  KEY `notification_type` (`notification_type`),
  KEY `is_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- REPORTS TABLE
-- =====================================================
CREATE TABLE `reports` (
  `report_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `station_id` int(10) UNSIGNED NOT NULL,
  `report_type` tinyint(1) UNSIGNED NOT NULL COMMENT '1=daily, 2=weekly, 3=monthly, 4=yearly',
  `report_date` date NOT NULL,
  `total_sales` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_orders` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_revenue` decimal(12,2) NOT NULL DEFAULT 0.00,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  UNIQUE KEY `unique_station_report` (`station_id`, `report_type`, `report_date`),
  KEY `report_type` (`report_type`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- SYSTEM_LOGS TABLE
-- =====================================================
CREATE TABLE `system_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `event_type` varchar(50) NOT NULL,
  `description` varchar(500) NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  KEY `event_type` (`event_type`),
  KEY `user_id` (`user_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
