-- ============================================================
-- AquaLasTech — Clean Database Schema
-- Tables: 14 (only what the system actually uses)
-- Updated: 2026-03-28 (synced with aqualastech (4).sql)
-- Changes: FK constraints added, unused tables removed,
--          columns match production exactly, all data current.
-- ============================================================

USE aqualastech;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- Drop in reverse dependency order (safe re-run)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `system_logs`;
DROP TABLE IF EXISTS `pos_transactions`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_returns`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `inventory_transactions`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `stations`;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. STATIONS
-- ============================================================
CREATE TABLE `stations` (
  `station_id`       INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `station_name`     VARCHAR(150)        NOT NULL,
  `address`          VARCHAR(255)        NOT NULL,
  `image_path`       VARCHAR(300)        DEFAULT NULL,
  `qr_code_path`     VARCHAR(300)        DEFAULT NULL,
  `latitude`         DECIMAL(10,7)       DEFAULT NULL,
  `longitude`        DECIMAL(10,7)       DEFAULT NULL,
  `contact_number`   VARCHAR(20)         DEFAULT NULL,
  `email`            VARCHAR(100)        DEFAULT NULL,
  `created_at`       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`       TIMESTAMP           NULL DEFAULT NULL,
  `complete_address` VARCHAR(300)        DEFAULT NULL,
  `status`           TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `stations` (`station_id`,`station_name`,`address`,`image_path`,`qr_code_path`,`latitude`,`longitude`,`contact_number`,`email`,`created_at`,`updated_at`,`deleted_at`,`complete_address`,`status`) VALUES
(1, 'Tanza WRS',                                                          'Sawi, Boac, Marinduque, Philippines',                                                                                               '/uploads/stations/logo_1774671783458.jpg',  '/uploads/qrcodes/qr_1774671795000.png',  13.4472511, 121.8694902, '09672534801', NULL, '2026-03-04 03:12:24', '2026-03-28 04:23:15', NULL, 'Barangay 1', 1),
(3, 'MarSU Employee Credit Cooperative Water Refilling Station',           'Tanza, Boac, Marinduque, Philippines',                                                                                              '/uploads/stations/logo_1773102061860.png', '/uploads/qrcodes/qr_1773102118113.jpg',  13.4549351, 121.8423453, '09165434570', NULL, '2026-03-10 00:05:40', '2026-03-11 03:17:34', NULL, NULL,        1),
(4, 'San Juan Water Refilling Station',                                   'Mataas na Bayan, Boac, Marinduque',                                                                                                 '/uploads/stations/logo_1773102691873.png', '/uploads/qrcodes/qr_1773102697933.jpg',  13.4478187, 121.8437884, '09453045499', NULL, '2026-03-10 00:07:40', '2026-03-10 00:31:37', NULL, NULL,        1),
(5, 'Water Avenue',                                                       'Murallon, Boac, Marinduque',                                                                                                        '/uploads/stations/logo_1773102871062.png', '/uploads/qrcodes/qr_1773102878805.jpg',  13.4495572, 121.8333155, '09165429279', NULL, '2026-03-10 00:09:55', '2026-03-10 00:34:38', NULL, NULL,        1),
(6, 'Miyamoto Water Refilling Station',                                   'Tanza, Boac, Marinduque, Philippines',                                                                                              '/uploads/stations/logo_1773103042385.png', '/uploads/qrcodes/qr_1773103049875.jpg',  13.4467607, 121.8433788, '09150186364', NULL, '2026-03-10 00:12:22', '2026-03-10 00:37:29', NULL, NULL,        1),
(7, 'Rianne\'s Water Refilling Station',                                  'Tabi, Boac, Marinduque, Philippines',                                                                                               '/uploads/stations/logo_1773103163802.png', '/uploads/qrcodes/qr_1773103171945.jpg',  13.4560891, 121.8382939, '09190955926', NULL, '2026-03-10 00:15:05', '2026-03-10 00:39:31', NULL, NULL,        1),
(8, 'Sample Station',                                                     'Marinduque State University, Marinduque Circumferential Road, Tanza, Boac, 1st District, Marinduque, Mimaropa, 4900, Philippines', NULL,                                       NULL,                                     13.4543980, 121.8447220, '09672534800', NULL, '2026-03-19 06:24:11', '2026-03-19 06:24:11', NULL, NULL,        1);

ALTER TABLE `stations` AUTO_INCREMENT = 9;

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE `users` (
  `user_id`               INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `full_name`             VARCHAR(100)        NOT NULL,
  `email`                 VARCHAR(100)        NOT NULL,
  `password_hash`         VARCHAR(255)        NOT NULL,
  `phone_number`          VARCHAR(20)         DEFAULT NULL,
  `is_active`             TINYINT(1)          DEFAULT 1,
  `created_at`            TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at`         TIMESTAMP           NULL DEFAULT NULL,
  `failed_login`          TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
  `locked_until`          TIMESTAMP           NULL DEFAULT NULL,
  `email_verified_at`     TIMESTAMP           NULL DEFAULT NULL,
  `deleted_at`            TIMESTAMP           NULL DEFAULT NULL,
  `profile_picture`       VARCHAR(300)        DEFAULT NULL,
  `role`                  TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`user_id`,`full_name`,`email`,`password_hash`,`phone_number`,`is_active`,`created_at`,`updated_at`,`last_login_at`,`failed_login`,`locked_until`,`email_verified_at`,`deleted_at`,`profile_picture`,`role`) VALUES
(1,  'jane doe',              'jane@gmail.com',                '$2b$10$uPKokXiXvpQ3THKadEtShe/p6fbh3gSm3MTJIWPkFA6.SmU4.IrTa', '09153890567', 1, '2026-03-02 12:07:13', '2026-03-05 00:42:29', NULL, 0, NULL, NULL, NULL, NULL,                                         1),
(2,  'ady',                   'ady@gmail.com',                 '$2b$10$qVREYX1SspB2./wPExAio.srJVNZzTxW3Rr9knmAVMX6LxxMOjzlG', NULL,          1, '2026-03-02 23:52:53', '2026-03-02 23:52:53', NULL, 0, NULL, NULL, NULL, NULL,                                         1),
(3,  'alexa',                 'alexa@gmail.com',               '$2b$10$emRlwf0wFVCcGSFaAE4sYOF/GsXpEBD.zFT1HcGNvUbpNbUnjeD42', NULL,          1, '2026-03-03 13:41:17', '2026-03-03 13:41:17', NULL, 0, NULL, NULL, NULL, NULL,                                         1),
(4,  'jonathan',              'jonathan@gmail.com',            '$2b$10$mRYZuUp1DOOowcTm55PH5OJf8LRDXTPiRoUs5M48gKQX299tbe7Du', NULL,          1, '2026-03-03 14:23:12', '2026-03-03 14:23:12', NULL, 0, NULL, NULL, NULL, NULL,                                         1),
(5,  'jon',                   'jon@gmail.com',                 '$2b$10$Ks7m8tLwGMMQk28BDiEUOOavxh/W43/J9mKAy4MMimdPsxUjx2Gse', NULL,          1, '2026-03-03 14:26:19', '2026-03-03 14:26:19', NULL, 0, NULL, NULL, NULL, NULL,                                         1),
(6,  'Super Admin',           'admin@gmail.com',               '$2b$10$RFLY4hOf0FHnRVQ.gCaaV..XtAlI4Xp2l8x7Z2cc5N5AyA/dAJjhS', NULL,          1, '2026-03-03 14:35:07', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, '/uploads/avatars/avatar_1773993655874.png', 3),
(7,  'fam',                   'fam@gmail.com',                 '$2b$10$G2OS7TW6nx2EPLOc6Loba.2MAq1xyAtWWBJnutH9cYPvQTRkXPAuK', NULL,          1, '2026-03-04 00:07:32', '2026-03-04 00:07:32', NULL, 0, NULL, NULL, NULL, NULL,                                         1),
(8,  'Santos',                'santos@gmail.com',              '$2b$10$pxotqrudWxiGMc2ob1ACq.ILMIWbHgWnGpwr.iw6hqUG8Lj/6y9P.', NULL,          1, '2026-03-04 03:52:55', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         2),
(9,  'Jason',                 'jason@gmail.com',               '$2b$10$A0kQx7ZZBB87l5b34ithm.ml9Y6JyxGGpgRQqUdM8BA7UVbOce9Ma', NULL,          1, '2026-03-04 03:55:47', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         2),
(10, 'Rick Mortez',           'rick@gmail.com',                '$2b$10$bZFEC8Ie5AfxwDg4ucL6xuXjt4MQZa76ro/gHBD8Q19FgkrcQc3QS', NULL,          1, '2026-03-04 07:08:37', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         3),
(11, 'Justin',                'justin@gmail.com',              '$2b$10$yQJgn41NHHCuhw/H2HmvGeGtTr.WC8wGZBKfo5/G1R8KS2cxXkyE.', NULL,          1, '2026-03-04 07:11:46', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         2),
(12, 'Dale',                  'dale@gmail.com',                '$2b$10$QD0E.9KeRcQq0lhnQK/N8.ovzcAG5LAlo6aY3WTywzbGIVMVQ6JBq', NULL,          1, '2026-03-05 00:30:49', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         2),
(13, 'ian',                   'ian@gmail.com',                 '$2b$10$HUe.Tm0ddAbtcVQQDg/gVOv9qlaxvnVemevQ3m/giR01xfSYxYLRa', NULL,          1, '2026-03-05 00:43:59', '2026-03-19 07:57:08', NULL, 0, NULL, NULL, NULL, '/uploads/avatars/avatar_1773907028390.jpg', 1),
(14, 'Michael Capiena',       'michael.capiena@gmail.com',     '$2b$10$OC6F66S.LxgExJwIwl79ku0Ue3JyrqaH9LrhuIOpCONEb6JZOKlYm', NULL,          1, '2026-03-10 00:05:40', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         3),
(15, 'San Juan, Ralph John Son','ralph.john@gmail.com',        '$2b$10$OFwg5Sgif9C/Pome9f4LbelNRyt4LJTHOMUadbtUIUjNh0xAtbPmW', NULL,          1, '2026-03-10 00:07:40', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         3),
(16, 'Jann Paolo Montalan',   'jann.paolo.montalan@gmail.com', '$2b$10$prpeBsYUYi4U1Ik3k1cWFe5bbU6ZcdL.L.qqXIsUD/gwU0yO/xWbu', NULL,          1, '2026-03-10 00:09:55', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         3),
(17, 'Yolanda Narsoles',      'yolanda.narsoles@gmail.com',    '$2b$10$ufD1ZYa9uA7F0YbXtoKSz.lUCK0ft7QehEUyWKjfSwbtrV445Zl42', NULL,          1, '2026-03-10 00:12:22', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         3),
(18, 'Rowel Garcia',          'rowel.garcia@gmail.com',        '$2b$10$X43.lIkWCHLcxfUQSePeNe5w.7bX1KC0JoVbrF.PuL2/xKTm6uJZe', NULL,          1, '2026-03-10 00:15:05', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         3),
(19, 'Denize Dayne Beltron',  'denize@gmail.com',              '$2b$10$llYar4LIjJIclPS0toSGQeWFQxZd6lCh9P6hL8mNEeI3krwLo.VHO', NULL,          1, '2026-03-10 00:22:51', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         2),
(20, 'Jayson San Jose',       'jayson@gmail.com',              '$2b$10$GzF3GNu2s7y1.Q6qkgVfN.vKO1vKaxcV0ZCZyTeMHaC.4GqIRjTka', NULL,          1, '2026-03-10 00:23:24', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         2),
(21, 'System Admin',          'sysadmin@gmail.com',            '$2b$10$boWKuQyUEkDG9HaOPxCo6erSj2adEeg45FNftI7UfBEbSOVxmRrri', NULL,          1, '2026-03-19 05:45:16', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         4),
(22, 'sample',                'sample@gmail.com',              '$2b$10$W2ZmIL4KlNX7wN2ZDELoOO/f72k8KXTwi2/d/4ur3eiwnXdvrwNDe', NULL,          1, '2026-03-19 06:24:12', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, '/uploads/avatars/avatar_1773903449622.png', 3),
(23, 'Rue',                   'rue@gmail.com',                 '$2b$10$43wY4Ki8bh0c8wBK3C9b9.m.9V5iovJYuYkednCmH.hWHjrSZxboW', NULL,          1, '2026-03-19 06:29:33', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL,                                         2),
(24, 'Chika',                 'chika@gmail.com',               '$2b$10$vyogSt7P4g/wPRYcxGiaDet1vLN15uQK2naPwc4ytpkIRbZLbCZk.', NULL,          1, '2026-03-28 04:23:34', '2026-03-28 04:23:34', NULL, 0, NULL, NULL, NULL, NULL,                                         2),
(25, 'customer1',             'customer1@gmail.com',           '$2b$10$Tpf4uHRl938H5dmbYUWCP.wkgp0Od6UK7EZnE4nuijRYArmCs7K0W', NULL,          1, '2026-03-28 08:00:16', '2026-03-28 08:07:33', NULL, 0, NULL, NULL, NULL, NULL,                                         1);

ALTER TABLE `users` AUTO_INCREMENT = 26;

-- ============================================================
-- 3. ADMINS
-- ============================================================
CREATE TABLE `admins` (
  `user_id`    INT(10) UNSIGNED NOT NULL,
  `station_id` INT(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_sp_station_id` (`station_id`),
  CONSTRAINT `fk_admins_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admins_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `admins` (`user_id`, `station_id`) VALUES
(10), (11), (21),
(6,  1), (8,  1), (9,  1), (12, 1), (24, 1),
(14, 3), (19, 3), (20, 3),
(15, 4),
(16, 5),
(17, 6),
(18, 7),
(22, 8), (23, 8);

-- ============================================================
-- 4. CUSTOMERS
-- ============================================================
CREATE TABLE `customers` (
  `user_id`          INT(10) UNSIGNED NOT NULL,
  `address`          VARCHAR(255)  DEFAULT NULL,
  `complete_address` VARCHAR(300)  DEFAULT NULL,
  `latitude`         DECIMAL(10,7) DEFAULT NULL,
  `longitude`        DECIMAL(10,7) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `customers` (`user_id`, `address`, `complete_address`, `latitude`, `longitude`) VALUES
(1,  'Tanza, Boac, Marinduque, Philippines',    NULL, 13.4541311, 121.8444908),
(2,  NULL, NULL, NULL, NULL),
(3,  NULL, NULL, NULL, NULL),
(4,  NULL, NULL, NULL, NULL),
(5,  NULL, NULL, NULL, NULL),
(7,  NULL, NULL, NULL, NULL),
(13, 'Tanza, Boac, Marinduque, Philippines',    NULL, 13.4541524, 121.8444911),
(25, 'Bognuyan, Gasan, Marinduque, Philippines',NULL, 13.2971503, 121.8610251);

-- ============================================================
-- 5. PRODUCTS
-- ============================================================
CREATE TABLE `products` (
  `product_id`   INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `station_id`   INT(10) UNSIGNED    NOT NULL,
  `product_name` VARCHAR(150)        NOT NULL,
  `description`  VARCHAR(500)        DEFAULT NULL,
  `price`        DECIMAL(10,2)       NOT NULL,
  `cost_price`   DECIMAL(10,2)       DEFAULT NULL,
  `is_active`    TINYINT(1)          DEFAULT 1,
  `created_at`   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`   TIMESTAMP           NULL DEFAULT NULL,
  `image_url`    VARCHAR(300)        DEFAULT NULL,
  `unit`         VARCHAR(50)         NOT NULL DEFAULT 'gallon',
  `unit_type`    TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `unique_station_product` (`station_id`, `product_name`),
  KEY `idx_station_id` (`station_id`),
  CONSTRAINT `fk_products_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `products` (`product_id`,`station_id`,`product_name`,`description`,`price`,`cost_price`,`is_active`,`created_at`,`updated_at`,`deleted_at`,`image_url`,`unit`,`unit_type`) VALUES
(3,  1, 'Water Bottle',                       'Water Bottle', 12.00, NULL, 1, '2026-03-04 06:14:01', '2026-03-28 03:19:04', NULL, '/uploads/products/product_1772604840037.jpg', 'bottle',    1),
(6,  1, 'Water Gallon 1',                     'asdasd',       12.00, NULL, 1, '2026-03-04 06:19:35', '2026-03-04 06:30:56', NULL, NULL,                                          'gallon',    1),
(7,  1, 'Gallon',                              NULL,           12.00, NULL, 1, '2026-03-04 06:21:29', '2026-03-27 17:41:35', NULL, NULL,                                          'container', 1),
(12, 3, 'Round Bottle Style (20L)',            NULL,           25.00, NULL, 1, '2026-03-10 00:24:13', '2026-03-10 00:24:13', NULL, NULL,                                          'bottle',    1),
(13, 3, 'Rectangular Jerry-can Style (20L)',  NULL,           25.00, NULL, 1, '2026-03-10 00:24:41', '2026-03-10 00:24:41', NULL, NULL,                                          'container', 1),
(14, 4, 'Round Bottle Style (20L)',            NULL,           25.00, NULL, 1, '2026-03-10 00:32:31', '2026-03-10 00:32:31', NULL, NULL,                                          'bottle',    1),
(15, 4, 'Rectangular Jerry-can Style (20L)',  NULL,           25.00, NULL, 1, '2026-03-10 00:32:52', '2026-03-10 00:32:52', NULL, NULL,                                          'gallon',    1),
(16, 5, 'Round Bottle Style (20L)',            NULL,           25.00, NULL, 1, '2026-03-10 00:35:09', '2026-03-10 00:35:09', NULL, NULL,                                          'bottle',    1),
(17, 5, 'Wilkins Container (7L)',              NULL,           35.00, NULL, 1, '2026-03-10 00:35:24', '2026-03-10 00:35:24', NULL, NULL,                                          'container', 1),
(18, 5, 'Rectangular Jerry-can Style (20L)',  NULL,           25.00, NULL, 1, '2026-03-10 00:35:46', '2026-03-10 00:35:46', NULL, NULL,                                          'gallon',    1),
(19, 6, '1.	Round Bottle Style (20L)',        NULL,           25.00, NULL, 1, '2026-03-10 00:37:48', '2026-03-10 00:37:48', NULL, NULL,                                          'bottle',    1),
(20, 6, 'Rectangular Jerry-can Style (20L)',  NULL,           25.00, NULL, 1, '2026-03-10 00:38:13', '2026-03-10 00:38:13', NULL, NULL,                                          'gallon',    1),
(21, 7, 'Round Bottle Style (20L)',            NULL,           25.00, NULL, 1, '2026-03-10 00:40:01', '2026-03-10 00:40:01', NULL, NULL,                                          'bottle',    1),
(22, 7, '2.	Rectangular Jerry-can Style (20L)',NULL,          25.00, NULL, 1, '2026-03-10 00:40:19', '2026-03-10 00:40:19', NULL, NULL,                                          'gallon',    1),
(23, 3, 'Bottled Water',                       NULL,           15.00, NULL, 1, '2026-03-10 03:38:44', '2026-03-10 03:38:44', NULL, '/uploads/products/product_1773113922226.png', 'bottle',    1),
(24, 8, 'Gallon 5',                            NULL,           20.00, NULL, 1, '2026-03-19 06:33:17', '2026-03-19 06:33:17', NULL, NULL,                                          'gallon',    1),
(25, 8, 'Gallon 6',                            NULL,           50.00, NULL, 1, '2026-03-19 07:07:32', '2026-03-19 07:07:32', NULL, NULL,                                          'gallon',    1),
(27, 1, 'Gallon 2',                            NULL,           12.00, NULL, 0, '2026-03-19 08:10:35', '2026-03-27 17:39:20', NULL, NULL,                                          'gallon',    1);

ALTER TABLE `products` AUTO_INCREMENT = 28;

-- ============================================================
-- 6. INVENTORY
-- ============================================================
CREATE TABLE `inventory` (
  `inventory_id`    INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `station_id`      INT(10) UNSIGNED NOT NULL,
  `product_id`      INT(10) UNSIGNED NOT NULL,
  `quantity`        INT(10) UNSIGNED NOT NULL DEFAULT 0,
  `min_stock_level` INT(10) UNSIGNED DEFAULT 5,
  `last_updated`    TIMESTAMP        NULL DEFAULT NULL,
  `created_at`      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `unique_station_product` (`station_id`, `product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `fk_inventory_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inventory_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `inventory` (`inventory_id`,`station_id`,`product_id`,`quantity`,`min_stock_level`,`last_updated`,`created_at`,`updated_at`) VALUES
(3,  1, 3,  4,  5,  '2026-03-28 03:47:56', '2026-03-04 06:14:01', '2026-03-28 06:40:39'),
(4,  1, 6,  3,  5,  '2026-03-28 03:47:39', '2026-03-04 06:19:35', '2026-03-28 04:25:39'),
(5,  1, 7,  80, 5,  '2026-03-28 03:43:06', '2026-03-04 06:21:29', '2026-03-28 03:43:06'),
(9,  3, 12, 7,  5,  '2026-03-19 05:30:52', '2026-03-10 00:24:13', '2026-03-19 05:30:52'),
(10, 3, 13, 10, 5,  '2026-03-10 00:24:54', '2026-03-10 00:24:41', '2026-03-10 00:24:54'),
(11, 4, 14, 10, 5,  '2026-03-10 00:33:01', '2026-03-10 00:32:31', '2026-03-10 00:33:01'),
(12, 4, 15, 10, 5,  '2026-03-10 00:32:57', '2026-03-10 00:32:52', '2026-03-10 00:32:57'),
(13, 5, 16, 10, 5,  '2026-03-10 00:36:00', '2026-03-10 00:35:09', '2026-03-10 00:36:00'),
(14, 5, 17, 10, 5,  '2026-03-10 00:35:56', '2026-03-10 00:35:24', '2026-03-10 00:35:56'),
(15, 5, 18, 10, 5,  '2026-03-10 00:35:51', '2026-03-10 00:35:46', '2026-03-10 00:35:51'),
(16, 6, 19, 10, 5,  '2026-03-10 00:38:22', '2026-03-10 00:37:48', '2026-03-10 00:38:22'),
(17, 6, 20, 10, 5,  '2026-03-10 00:38:18', '2026-03-10 00:38:13', '2026-03-10 00:38:18'),
(18, 7, 21, 25, 5,  '2026-03-10 00:40:34', '2026-03-10 00:40:01', '2026-03-10 00:40:34'),
(19, 7, 22, 25, 5,  '2026-03-10 00:40:28', '2026-03-10 00:40:19', '2026-03-10 00:40:28'),
(20, 3, 23, 10, 5,  '2026-03-19 05:32:16', '2026-03-10 03:38:44', '2026-03-19 05:32:16'),
(21, 8, 24, 53, 5,  '2026-03-19 06:37:26', '2026-03-19 06:33:17', '2026-03-19 06:37:38'),
(22, 8, 25, 0,  10, '2026-03-19 07:07:32', '2026-03-19 07:07:32', '2026-03-19 07:07:32'),
(23, 1, 27, 24, 10, '2026-03-27 17:39:20', '2026-03-19 08:10:35', '2026-03-28 02:55:29');

ALTER TABLE `inventory` AUTO_INCREMENT = 34;

-- ============================================================
-- 7. INVENTORY_TRANSACTIONS
-- ============================================================
CREATE TABLE `inventory_transactions` (
  `transaction_id`   INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `inventory_id`     INT(10) UNSIGNED    NOT NULL,
  `station_id`       INT(10) UNSIGNED    NOT NULL,
  `product_id`       INT(10) UNSIGNED    NOT NULL,
  `quantity`         INT(10) UNSIGNED    NOT NULL,
  `unit_cost`        DECIMAL(10,2)       DEFAULT NULL,
  `reference_id`     INT(10) UNSIGNED    DEFAULT NULL,
  `notes`            VARCHAR(300)        DEFAULT NULL,
  `created_by`       INT(10) UNSIGNED    DEFAULT NULL,
  `created_at`       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `transaction_type` TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`transaction_id`),
  KEY `inventory_id` (`inventory_id`),
  KEY `station_id`   (`station_id`),
  KEY `product_id`   (`product_id`),
  KEY `created_by`   (`created_by`),
  CONSTRAINT `fk_invtx_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`inventory_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invtx_station`   FOREIGN KEY (`station_id`)   REFERENCES `stations`  (`station_id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_invtx_product`   FOREIGN KEY (`product_id`)   REFERENCES `products`  (`product_id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_invtx_user`      FOREIGN KEY (`created_by`)   REFERENCES `users`     (`user_id`)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- transaction_type: 1=restock, 2=deduction, 3=adjustment
-- Note: transactions 7-10,13,14,16,18,32 omitted (referenced deleted products 2 & 8)
INSERT INTO `inventory_transactions` (`transaction_id`,`inventory_id`,`station_id`,`product_id`,`quantity`,`unit_cost`,`reference_id`,`notes`,`created_by`,`created_at`,`transaction_type`) VALUES
(11, 4,  1, 6,  12, NULL, NULL, NULL, NULL, '2026-03-04 06:19:52', 1),
(12, 4,  1, 6,  2,  NULL, NULL, NULL, NULL, '2026-03-04 06:21:10', 1),
(15, 4,  1, 6,  15, NULL, NULL, NULL, NULL, '2026-03-04 06:39:47', 1),
(17, 3,  1, 3,  5,  NULL, NULL, NULL, NULL, '2026-03-04 12:06:35', 1),
(19, 5,  1, 7,  100,NULL, NULL, NULL, NULL, '2026-03-05 00:47:01', 1),
(20, 10, 3, 13, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:24:54', 1),
(21, 9,  3, 12, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:24:59', 1),
(22, 12, 4, 15, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:32:57', 1),
(23, 11, 4, 14, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:33:01', 1),
(24, 15, 5, 18, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:35:51', 1),
(25, 14, 5, 17, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:35:56', 1),
(26, 13, 5, 16, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:36:00', 1),
(27, 17, 6, 20, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:38:18', 1),
(28, 16, 6, 19, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:38:22', 1),
(29, 19, 7, 22, 25, NULL, NULL, NULL, NULL, '2026-03-10 00:40:28', 1),
(30, 18, 7, 21, 25, NULL, NULL, NULL, NULL, '2026-03-10 00:40:34', 1),
(31, 20, 3, 23, 20, NULL, NULL, NULL, NULL, '2026-03-10 03:39:04', 1),
(33, 5,  1, 7,  1,  NULL, NULL, NULL, NULL, '2026-03-18 21:32:59', 1),
(34, 21, 8, 24, 25, NULL, NULL, NULL, NULL, '2026-03-19 06:33:29', 1),
(35, 21, 8, 24, 28, NULL, NULL, NULL, NULL, '2026-03-19 06:33:39', 1),
(36, 3,  1, 3,  50, NULL, NULL, NULL, NULL, '2026-03-19 07:11:50', 1),
(37, 23, 1, 27, 11, NULL, NULL, NULL, NULL, '2026-03-19 08:11:05', 1),
(38, 4,  1, 6,  2,  NULL, NULL, NULL, NULL, '2026-03-20 01:31:07', 1),
(39, 23, 1, 27, 8,  NULL, NULL, NULL, NULL, '2026-03-20 01:49:59', 1),
(40, 23, 1, 27, 5,  NULL, NULL, NULL, NULL, '2026-03-20 01:50:11', 1),
(41, 4,  1, 6,  1,  NULL, NULL, NULL, NULL, '2026-03-28 03:45:24', 1),
(42, 4,  1, 6,  4,  NULL, NULL, NULL, NULL, '2026-03-28 03:47:39', 1),
(43, 3,  1, 3,  5,  NULL, NULL, NULL, NULL, '2026-03-28 03:47:43', 1);

ALTER TABLE `inventory_transactions` AUTO_INCREMENT = 44;

-- ============================================================
-- 8. ORDERS
-- ============================================================
-- payment_mode: 1=gcash, 2=cash, 3=cash_on_delivery, 4=cash_on_pickup
-- order_status: 1=confirmed, 2=preparing, 3=out_for_delivery, 4=delivered, 5=cancelled, 6=returned
CREATE TABLE `orders` (
  `order_id`                  INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_reference`           VARCHAR(50)         NOT NULL,
  `user_id`                   INT(10) UNSIGNED    NOT NULL,
  `station_id`                INT(10) UNSIGNED    NOT NULL,
  `total_amount`              DECIMAL(10,2)       NOT NULL DEFAULT 0.00,
  `created_at`                TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `customer_name`             VARCHAR(100)        DEFAULT NULL,
  `customer_address`          VARCHAR(255)        DEFAULT NULL,
  `full_address` VARCHAR(300)        DEFAULT NULL,
  `hidden_at`                 DATETIME            DEFAULT NULL,
  `notes`                     VARCHAR(300)        DEFAULT NULL,
  `delivered_at`              TIMESTAMP           NULL DEFAULT NULL,
  `cancelled_at`              TIMESTAMP           NULL DEFAULT NULL,
  `cancelled_by`              INT(10) UNSIGNED    DEFAULT NULL,
  `deleted_at`                TIMESTAMP           NULL DEFAULT NULL,
  `payment_mode`              TINYINT(3) UNSIGNED NOT NULL DEFAULT 2,
  `order_status`              TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_reference` (`order_reference`),
  KEY `user_id`                (`user_id`),
  KEY `station_id`             (`station_id`),
  KEY `idx_order_status`       (`order_status`),
  KEY `idx_payment_mode`       (`payment_mode`),
  KEY `idx_orders_deleted_at`  (`deleted_at`),
  KEY `fk_orders_cancelled_by` (`cancelled_by`),
  CONSTRAINT `fk_orders_user`         FOREIGN KEY (`user_id`)      REFERENCES `users`    (`user_id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_orders_station`      FOREIGN KEY (`station_id`)   REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users`    (`user_id`)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `orders` (`order_id`,`order_reference`,`user_id`,`station_id`,`total_amount`,`created_at`,`updated_at`,`customer_name`,`customer_address`,`full_address`,`hidden_at`,`notes`,`delivered_at`,`cancelled_at`,`cancelled_by`,`deleted_at`,`payment_mode`,`order_status`) VALUES
(45, 'ORD-1773113987101',  14, 3,  75.00,  '2026-03-10 03:39:47', '2026-03-28 01:53:19', NULL,      NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 4),
(46, 'AQL-20260310-HHGO0', 13, 3,  60.00,  '2026-03-10 03:45:24', '2026-03-28 01:53:19', NULL,      NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 3, 4),
(48, 'ORD-1773797563547',  6,  1,  12.00,  '2026-03-18 01:32:43', '2026-03-28 01:53:19', NULL,      NULL,                                          NULL,          '2026-03-19 05:26:37', NULL, NULL, NULL, NULL, NULL, 2, 4),
(49, 'ORD-1773798589682',  6,  1,  24.00,  '2026-03-18 01:49:49', '2026-03-28 01:53:19', NULL,      NULL,                                          NULL,          '2026-03-19 05:26:37', NULL, NULL, NULL, NULL, NULL, 2, 4),
(52, 'ORD-1773869160506',  6,  1,  12.00,  '2026-03-18 21:26:00', '2026-03-28 03:24:05', 'RIsa',    'Bognuyan',                                    NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 4),
(53, 'ORD-1773870832996',  6,  1,  12.00,  '2026-03-18 21:53:53', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 5),
(54, 'AQL-20260319-KO8PN', 13, 1,  24.00,  '2026-03-19 01:01:29', '2026-03-28 03:24:05', 'ian',     'Bangbangalon, Boac, Marinduque, Philippines', 'Purok Lawaan','2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 3, 4),
(55, 'ORD-1773884881687',  6,  1,  12.00,  '2026-03-19 01:48:01', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 4),
(56, 'ORD-1773884966566',  6,  1,  12.00,  '2026-03-19 01:49:26', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 4),
(57, 'ORD-1773886081161',  6,  1,  12.00,  '2026-03-19 02:08:01', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 4),
(58, 'ORD-1773886819773',  6,  1,  48.00,  '2026-03-19 02:20:19', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 4),
(59, 'ORD-1773898252496',  14, 3,  75.00,  '2026-03-19 05:30:52', '2026-03-28 01:53:19', 'Walk-in', NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 4),
(60, 'ORD-1773898336713',  14, 3,  15.00,  '2026-03-19 05:32:16', '2026-03-28 01:53:19', 'asdas',   'asdad',                                       NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 4),
(61, 'ORD-1773902246287',  22, 8,  60.00,  '2026-03-19 06:37:26', '2026-03-28 01:53:19', 'Walk-in', NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 5),
(62, 'ORD-1773904710343',  6,  1,  48.00,  '2026-03-19 07:18:30', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 5),
(63, 'ORD-1773970298410',  6,  1,  48.00,  '2026-03-20 01:31:38', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 5),
(64, 'ORD-1773970795152',  6,  1,  132.00, '2026-03-20 01:39:55', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 5),
(65, 'ORD-1773971423803',  6,  1,  72.00,  '2026-03-20 01:50:23', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 5),
(66, 'AQL-20260324-WFUMX', 13, 1,  60.00,  '2026-03-24 03:19:38', '2026-03-28 03:24:05', 'ian',     'Tanza, Boac, Marinduque, Philippines',        NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 3, 4),
(67, 'ORD-1774666238904',  6,  1,  119.80, '2026-03-28 02:50:38', '2026-03-28 02:54:39', 'Walk-in', NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 3),
(68, 'ORD-1774667451065',  6,  1,  60.00,  '2026-03-28 03:10:51', '2026-03-28 03:10:51', 'Walk-in', NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 1),
(69, 'ORD-1774667921525',  6,  1,  36.00,  '2026-03-28 03:18:41', '2026-03-28 03:24:05', 'Walk-in', NULL,                                          NULL,          '2026-03-28 11:24:05', NULL, NULL, NULL, NULL, NULL, 2, 5),
(70, 'ORD-1774668852151',  6,  1,  12.00,  '2026-03-28 03:34:12', '2026-03-28 03:34:12', 'Walk-in', NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 1),
(71, 'ORD-1774669386667',  6,  1,  648.00, '2026-03-28 03:43:06', '2026-03-28 03:43:06', 'Walk-in', NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 1),
(72, 'ORD-1774669533311',  6,  1,  24.00,  '2026-03-28 03:45:33', '2026-03-28 03:45:33', 'Walk-in', NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 1),
(73, 'ORD-1774669676662',  6,  1,  48.00,  '2026-03-28 03:47:56', '2026-03-28 03:47:56', 'Walk-in', NULL,                                          NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 2, 1),
(74, 'AQL-20260328-UWI7U', 13, 1,  60.00,  '2026-03-28 04:25:39', '2026-03-28 06:26:33', 'ian',     'Tanza, Boac, Marinduque, Philippines',        NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 1, 2),
(76, 'AQL-20260328-NUACC', 13, 1,  48.00,  '2026-03-28 04:27:36', '2026-03-28 06:29:47', 'ian',     'Tanza, Boac, Marinduque, Philippines',        NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 3, 6),
(77, 'AQL-20260328-2UXAA', 13, 1,  12.00,  '2026-03-28 06:29:40', '2026-03-28 06:29:40', 'ian',     'Tanza, Boac, Marinduque, Philippines',        NULL,          NULL,                  NULL, NULL, NULL, NULL, NULL, 1, 1);

ALTER TABLE `orders` AUTO_INCREMENT = 79;

-- ============================================================
-- 9. ORDER_ITEMS
-- ============================================================
CREATE TABLE `order_items` (
  `order_item_id`  INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`       INT(10) UNSIGNED NOT NULL,
  `product_id`     INT(10) UNSIGNED NOT NULL,
  `quantity`       INT(10) UNSIGNED NOT NULL,
  `price_snapshot` DECIMAL(10,2)    NOT NULL,
  `created_at`     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_item_id`),
  KEY `order_id`   (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `fk_oi_order`   FOREIGN KEY (`order_id`)   REFERENCES `orders`   (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Note: items 56,60 omitted (referenced deleted product 8)
INSERT INTO `order_items` (`order_item_id`,`order_id`,`product_id`,`quantity`,`price_snapshot`,`created_at`) VALUES
(48, 45, 23, 5,  15.00, '2026-03-10 03:39:47'),
(49, 46, 23, 4,  15.00, '2026-03-10 03:45:24'),
(51, 48, 7,  1,  12.00, '2026-03-18 01:32:43'),
(52, 49, 7,  2,  12.00, '2026-03-18 01:49:49'),
(57, 53, 3,  1,  12.00, '2026-03-18 21:53:53'),
(58, 54, 3,  2,  12.00, '2026-03-19 01:01:29'),
(59, 55, 3,  1,  12.00, '2026-03-19 01:48:01'),
(61, 57, 3,  1,  12.00, '2026-03-19 02:08:01'),
(62, 58, 6,  4,  12.00, '2026-03-19 02:20:19'),
(63, 59, 12, 3,  25.00, '2026-03-19 05:30:52'),
(64, 60, 23, 1,  15.00, '2026-03-19 05:32:16'),
(65, 61, 24, 3,  20.00, '2026-03-19 06:37:26'),
(66, 62, 7,  4,  12.00, '2026-03-19 07:18:30'),
(67, 63, 6,  4,  12.00, '2026-03-20 01:31:38'),
(68, 64, 27, 11, 12.00, '2026-03-20 01:39:55'),
(69, 65, 27, 6,  12.00, '2026-03-20 01:50:23'),
(70, 66, 7,  5,  12.00, '2026-03-24 03:19:38'),
(72, 68, 3,  5,  12.00, '2026-03-28 03:10:51'),
(73, 69, 6,  3,  12.00, '2026-03-28 03:18:41'),
(74, 70, 6,  1,  12.00, '2026-03-28 03:34:12'),
(75, 71, 7,  13, 12.00, '2026-03-28 03:43:06'),
(76, 71, 3,  41, 12.00, '2026-03-28 03:43:06'),
(77, 72, 6,  2,  12.00, '2026-03-28 03:45:33'),
(78, 73, 3,  4,  12.00, '2026-03-28 03:47:56'),
(79, 74, 6,  5,  12.00, '2026-03-28 04:25:39'),
(80, 76, 3,  4,  12.00, '2026-03-28 04:27:36'),
(81, 77, 3,  1,  12.00, '2026-03-28 06:29:40');

ALTER TABLE `order_items` AUTO_INCREMENT = 82;

-- ============================================================
-- 10. ORDER_RETURNS
-- ============================================================
-- return_status: 1=pending, 2=approved, 3=rejected
CREATE TABLE `order_returns` (
  `return_id`     INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_id`      INT(10) UNSIGNED    NOT NULL,
  `reason`        VARCHAR(300)        NOT NULL,
  `created_at`    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP           NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `processed_by`  INT(10) UNSIGNED    DEFAULT NULL,
  `refund_amount` DECIMAL(10,2)       DEFAULT NULL,
  `admin_notes`   VARCHAR(300)        DEFAULT NULL,
  `resolved_at`   TIMESTAMP           NULL DEFAULT NULL,
  `return_status` TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`return_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `fk_returns_order` FOREIGN KEY (`order_id`)     REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_returns_user`  FOREIGN KEY (`processed_by`) REFERENCES `users`  (`user_id`)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `order_returns` (`return_id`,`order_id`,`reason`,`created_at`,`updated_at`,`processed_by`,`refund_amount`,`admin_notes`,`resolved_at`,`return_status`) VALUES
(4, 76, 'asdasd', '2026-03-28 06:29:47', '2026-03-28 06:40:39', 6, NULL, NULL, NULL, 2);

ALTER TABLE `order_returns` AUTO_INCREMENT = 5;

-- ============================================================
-- 11. PAYMENTS
-- ============================================================
-- payment_type:   1=gcash, 2=cash, 3=cash_on_delivery, 4=cash_on_pickup
-- payment_status: 1=pending, 2=verified, 3=rejected
CREATE TABLE `payments` (
  `payment_id`       INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_id`         INT(10) UNSIGNED    DEFAULT NULL,
  `proof_image_path` VARCHAR(255)        DEFAULT NULL,
  `gcash_reference`  VARCHAR(50)         DEFAULT NULL,
  `amount_paid`      DECIMAL(10,2)       DEFAULT NULL,
  `notes`            VARCHAR(300)        DEFAULT NULL,
  `verified_by`      INT(10) UNSIGNED    DEFAULT NULL,
  `verified_at`      TIMESTAMP           NULL DEFAULT NULL,
  `created_at`       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_type`     TINYINT(3) UNSIGNED NOT NULL DEFAULT 2,
  `payment_status`   TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`)    REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payments_user`  FOREIGN KEY (`verified_by`) REFERENCES `users`  (`user_id`)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `payments` (`payment_id`,`order_id`,`proof_image_path`,`gcash_reference`,`amount_paid`,`notes`,`verified_by`,`verified_at`,`created_at`,`payment_type`,`payment_status`) VALUES
(42, 45, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-10 03:39:47', 2, 2),
(43, 46, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-10 03:45:24', 3, 2),
(45, 48, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-18 01:32:43', 2, 2),
(46, 49, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-18 01:49:49', 2, 2),
(49, 52, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-18 21:26:00', 2, 2),
(50, 53, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-18 21:53:53', 2, 2),
(51, 54, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 01:01:29', 3, 2),
(52, 55, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 01:48:01', 2, 2),
(53, 56, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 01:49:26', 2, 2),
(54, 57, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 02:08:01', 2, 2),
(55, 58, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 02:20:19', 2, 2),
(56, 59, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 05:30:52', 2, 2),
(57, 60, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 05:32:16', 2, 2),
(58, 61, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 06:37:26', 2, 2),
(59, 62, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-19 07:18:30', 2, 2),
(60, 63, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-20 01:31:38', 2, 2),
(61, 64, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-20 01:39:55', 2, 2),
(62, 65, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-20 01:50:23', 2, 2),
(63, 66, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 03:19:38', 3, 2),
(64, 67, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 02:50:38', 2, 2),
(65, 68, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 03:10:51', 2, 2),
(66, 69, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 03:18:41', 2, 2),
(67, 70, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 03:34:12', 2, 2),
(68, 71, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 03:43:06', 2, 2),
(69, 72, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 03:45:33', 2, 2),
(70, 73, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 03:47:56', 2, 2),
(71, 74, '/uploads/receipts/receipt_1774671939168.png', NULL, NULL, NULL, 6, '2026-03-28 06:26:33', '2026-03-28 04:25:39', 1, 2),
(72, 76, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 04:27:36', 3, 2),
(73, 77, '/uploads/receipts/receipt_1774679380036.jpg', NULL, NULL, NULL, 6, '2026-03-28 07:01:49', '2026-03-28 06:29:40', 1, 2);

ALTER TABLE `payments` AUTO_INCREMENT = 74;

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
-- notification_type: 1=order_update, 2=payment_update, 3=inventory_alert, 4=system_message
CREATE TABLE `notifications` (
  `notification_id`   INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `user_id`           INT(10) UNSIGNED    NOT NULL,
  `station_id`        INT(10) UNSIGNED    DEFAULT NULL,
  `message`           VARCHAR(300)        NOT NULL,
  `is_read`           TINYINT(1)          DEFAULT 0,
  `related_id`        INT(10) UNSIGNED    DEFAULT NULL,
  `related_type`      VARCHAR(30)         DEFAULT NULL,
  `created_at`        TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notification_type` TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`notification_id`),
  KEY `user_id`    (`user_id`),
  KEY `station_id` (`station_id`),
  KEY `idx_notification_type` (`notification_type`),
  CONSTRAINT `fk_notif_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`    (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Notification history omitted — regenerated naturally by the system.
ALTER TABLE `notifications` AUTO_INCREMENT = 231;

-- ============================================================
-- 13. POS_TRANSACTIONS
-- ============================================================
-- payment_method:     1=cash, 2=gcash
-- transaction_status: 1=completed, 2=cancelled
CREATE TABLE `pos_transactions` (
  `pos_id`             INT(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `order_id`           INT(10) UNSIGNED    DEFAULT NULL,
  `station_id`         INT(10) UNSIGNED    NOT NULL,
  `processed_by`       INT(10) UNSIGNED    DEFAULT NULL,
  `full_name`          VARCHAR(100)        DEFAULT NULL,
  `full_address`       VARCHAR(300)        DEFAULT NULL,
  `total_amount`       DECIMAL(12,2)       NOT NULL DEFAULT 0.00,
  `transaction_date`   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method`     TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  `transaction_status` TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`pos_id`),
  KEY `station_id`       (`station_id`),
  KEY `processed_by`     (`processed_by`),
  KEY `idx_pos_order_id` (`order_id`),
  CONSTRAINT `fk_pos_station` FOREIGN KEY (`station_id`)   REFERENCES `stations` (`station_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pos_user`    FOREIGN KEY (`processed_by`) REFERENCES `users`    (`user_id`)    ON DELETE SET NULL,
  CONSTRAINT `fk_pos_order`   FOREIGN KEY (`order_id`)     REFERENCES `orders`   (`order_id`)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `pos_transactions` (`pos_id`,`order_id`,`station_id`,`processed_by`,`full_name`,`full_address`,`total_amount`,`transaction_date`,`payment_method`,`transaction_status`) VALUES
(1,  NULL, 1, 6,  'Ramon',   NULL,            24.00,  '2026-03-04 07:44:59', 1, 1),
(2,  NULL, 1, 6,  'Jose',    'San Marines',   75.00,  '2026-03-04 07:53:27', 1, 1),
(3,  NULL, 1, 6,  'Lilibeth','Sampaloc',      25.00,  '2026-03-04 08:05:00', 1, 1),
(4,  NULL, 1, 6,  'Rose',    'Sampaloc',      24.00,  '2026-03-04 08:10:49', 1, 1),
(5,  NULL, 1, 6,  'Jane',    'Tanza',         12.00,  '2026-03-04 08:11:25', 1, 1),
(6,  NULL, 1, 6,  'Shane',   'Sampaloc',      12.00,  '2026-03-04 08:43:28', 1, 1),
(8,  NULL, 1, 6,  'Joseph',  'Santol',        85.00,  '2026-03-04 12:03:14', 1, 1),
(9,  NULL, 1, 6,  'Sally',   'Santol',        50.00,  '2026-03-04 12:09:19', 2, 1),
(10, NULL, 1, 6,  'Shiela',  'Tanza',         12.00,  '2026-03-04 12:51:46', 1, 1),
(11, NULL, 1, 6,  'Selva',   'Lusak',         62.00,  '2026-03-04 13:01:06', 1, 1),
(12, NULL, 1, 6,  'Lilia',   'Santol',        50.00,  '2026-03-04 13:30:36', 1, 1),
(16, NULL, 1, 6,  'Walk-in', NULL,            12.00,  '2026-03-04 17:35:37', 1, 1),
(17, NULL, 1, 6,  'Ady',     'Santol',        84.00,  '2026-03-05 00:27:45', 1, 1),
(18, NULL, 1, 6,  'yuan',    'santol',        24.00,  '2026-03-05 00:50:38', 1, 1),
(19, NULL, 1, 6,  'Brylle',  'Murallon',      24.00,  '2026-03-05 00:51:36', 1, 1),
(20, NULL, 1, 6,  'Risa',    'San Mateo',     120.00, '2026-03-09 23:51:15', 1, 1),
(21, 45,   3, 14, 'Rose',    'Tanza',         75.00,  '2026-03-10 03:39:47', 1, 1),
(22, 48,   1, 6,  'Risa',    'Butansapa',     12.00,  '2026-03-18 01:32:43', 1, 1),
(23, 49,   1, 6,  'Risa',    'Bognuyan',      24.00,  '2026-03-18 01:49:49', 1, 1),
(24, NULL, 1, 6,  'Rika',    'Baranggay Dos', 12.00,  '2026-03-18 06:44:16', 1, 1),
(25, NULL, 1, 6,  'Walk-in', NULL,            36.00,  '2026-03-18 07:00:29', 1, 1),
(26, 52,   1, 6,  'RIsa',    'Bognuyan',      12.00,  '2026-03-18 21:26:00', 1, 1),
(27, 53,   1, 6,  'Walk-in', NULL,            12.00,  '2026-03-18 21:53:53', 1, 1),
(28, 55,   1, 6,  'Walk-in', NULL,            12.00,  '2026-03-19 01:48:01', 1, 1),
(29, 56,   1, 6,  'Walk-in', NULL,            12.00,  '2026-03-19 01:49:26', 1, 1),
(30, 57,   1, 6,  'Walk-in', NULL,            12.00,  '2026-03-19 02:08:01', 1, 1),
(31, 58,   1, 6,  'Walk-in', NULL,            48.00,  '2026-03-19 02:20:19', 1, 1),
(32, 59,   3, 14, 'Walk-in', NULL,            75.00,  '2026-03-19 05:30:52', 1, 1),
(33, 60,   3, 14, 'asdas',   'asdad',         15.00,  '2026-03-19 05:32:16', 1, 1),
(34, 61,   8, 22, 'Walk-in', NULL,            60.00,  '2026-03-19 06:37:26', 1, 1),
(35, 62,   1, 6,  'Walk-in', NULL,            48.00,  '2026-03-19 07:18:30', 1, 1),
(36, 63,   1, 6,  'Walk-in', NULL,            48.00,  '2026-03-20 01:31:38', 1, 1),
(37, 64,   1, 6,  'Walk-in', NULL,            132.00, '2026-03-20 01:39:55', 1, 1),
(38, 65,   1, 6,  'Walk-in', NULL,            72.00,  '2026-03-20 01:50:23', 1, 1),
(39, 67,   1, 6,  'Walk-in', NULL,            119.80, '2026-03-28 02:50:38', 1, 1),
(40, 68,   1, 6,  'Walk-in', NULL,            60.00,  '2026-03-28 03:10:51', 1, 1),
(41, 69,   1, 6,  'Walk-in', NULL,            36.00,  '2026-03-28 03:18:41', 1, 1),
(42, 70,   1, 6,  'Walk-in', NULL,            12.00,  '2026-03-28 03:34:12', 1, 1),
(43, 71,   1, 6,  'Walk-in', NULL,            648.00, '2026-03-28 03:43:06', 1, 1),
(44, 72,   1, 6,  'Walk-in', NULL,            24.00,  '2026-03-28 03:45:33', 1, 1),
(45, 73,   1, 6,  'Walk-in', NULL,            48.00,  '2026-03-28 03:47:56', 1, 1);

ALTER TABLE `pos_transactions` AUTO_INCREMENT = 46;

-- ============================================================
-- 14. SYSTEM_LOGS
-- ============================================================
CREATE TABLE `system_logs` (
  `log_id`      INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_type`  VARCHAR(50)      NOT NULL,
  `description` VARCHAR(1000)    NOT NULL,
  `user_id`     INT(10) UNSIGNED DEFAULT NULL,
  `ip_address`  VARCHAR(45)      DEFAULT NULL,
  `created_at`  DATETIME         DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id`    (`user_id`),
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `system_logs` (`log_id`,`event_type`,`description`,`user_id`,`ip_address`,`created_at`) VALUES
(1,  'station_created', 'Station "Sample Station" created. Super admin: sample@gmail.com',  21, NULL,  '2026-03-19 14:24:12'),
(2,  'station_deleted', 'Station "Ricks Water Refilling Station" was deleted',              21, NULL,  '2026-03-19 14:24:28'),
(3,  'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-19 14:24:40'),
(4,  'login', 'super_admin "sample" (sample@gmail.com) logged in',                         22, '::1', '2026-03-19 14:24:54'),
(5,  'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-19 15:11:11'),
(6,  'login', 'customer "ian" (ian@gmail.com) logged in',                                   13, '::1', '2026-03-19 15:57:00'),
(7,  'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-19 15:58:38'),
(8,  'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-19 16:04:23'),
(9,  'login', 'customer "ian" (ian@gmail.com) logged in',                                   13, '::1', '2026-03-20 09:11:16'),
(10, 'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-20 09:30:30'),
(11, 'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-20 15:59:55'),
(12, 'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-24 10:39:52'),
(13, 'login', 'customer "ian" (ian@gmail.com) logged in',                                   13, '::1', '2026-03-24 11:18:51'),
(14, 'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-28 00:49:50'),
(15, 'login', 'customer "ian" (ian@gmail.com) logged in',                                   13, '::1', '2026-03-28 01:42:21'),
(16, 'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-28 01:43:13'),
(17, 'login', 'customer "ian" (ian@gmail.com) logged in',                                   13, '::1', '2026-03-28 01:59:27'),
(18, 'login', 'super_admin "Super Admin" (admin@gmail.com) logged in',                       6, '::1', '2026-03-28 09:34:43'),
(19, 'login', '1 "ian" (ian@gmail.com) logged in',                                          13, '::1', '2026-03-28 10:28:20'),
(20, 'login', '3 "Super Admin" (admin@gmail.com) logged in',                                 6, '::1', '2026-03-28 10:28:36'),
(21, 'login', '1 "ian" (ian@gmail.com) logged in',                                          13, '::1', '2026-03-28 12:24:12'),
(22, 'login', '3 "Super Admin" (admin@gmail.com) logged in',                                 6, '::1', '2026-03-28 14:26:12'),
(23, 'login', '1 "ian" (ian@gmail.com) logged in',                                          13, '::1', '2026-03-28 14:28:09'),
(24, 'login', '3 "Super Admin" (admin@gmail.com) logged in',                                 6, '::1', '2026-03-28 14:35:07'),
(25, 'login', '1 "ian" (ian@gmail.com) logged in',                                          13, '::1', '2026-03-28 15:32:04'),
(26, 'login', '1 "customer1" (customer1@gmail.com) logged in',                              25, '::1', '2026-03-28 16:00:16');

ALTER TABLE `system_logs` AUTO_INCREMENT = 27;

-- ============================================================
-- 15. PASSWORD_RESET_TOKENS
-- ============================================================
CREATE TABLE `password_reset_tokens` (
  `id`         INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT(10) UNSIGNED NOT NULL,
  `token_hash` VARCHAR(64)      NOT NULL,
  `expires_at` DATETIME         NOT NULL,
  `used`       TINYINT(1)       NOT NULL DEFAULT 0,
  `created_at` DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_token` (`token_hash`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
