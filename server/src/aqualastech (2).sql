-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 28, 2026 at 03:15 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `aqualastech`
--

-- --------------------------------------------------------

--
-- Table structure for table `delivery_zones`
--

CREATE TABLE `delivery_zones` (
  `zone_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `area_name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `inventory_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `min_stock_level` int(10) UNSIGNED DEFAULT 5,
  `last_updated` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`inventory_id`, `station_id`, `product_id`, `quantity`, `min_stock_level`, `last_updated`, `created_at`, `updated_at`) VALUES
(2, 1, 2, 12, 5, '2026-03-18 06:59:43', '2026-03-04 06:05:44', '2026-03-18 06:59:43'),
(3, 1, 3, 50, 5, '2026-03-19 07:11:50', '2026-03-04 06:14:01', '2026-03-19 07:11:50'),
(4, 1, 6, 2, 5, '2026-03-20 01:31:38', '2026-03-04 06:19:35', '2026-03-20 01:31:38'),
(5, 1, 7, 93, 5, '2026-03-27 17:41:35', '2026-03-04 06:21:29', '2026-03-27 17:41:35'),
(6, 1, 8, 40, 5, '2026-03-27 17:39:11', '2026-03-04 06:28:02', '2026-03-27 17:39:11'),
(9, 3, 12, 7, 5, '2026-03-19 05:30:52', '2026-03-10 00:24:13', '2026-03-19 05:30:52'),
(10, 3, 13, 10, 5, '2026-03-10 00:24:54', '2026-03-10 00:24:41', '2026-03-10 00:24:54'),
(11, 4, 14, 10, 5, '2026-03-10 00:33:01', '2026-03-10 00:32:31', '2026-03-10 00:33:01'),
(12, 4, 15, 10, 5, '2026-03-10 00:32:57', '2026-03-10 00:32:52', '2026-03-10 00:32:57'),
(13, 5, 16, 10, 5, '2026-03-10 00:36:00', '2026-03-10 00:35:09', '2026-03-10 00:36:00'),
(14, 5, 17, 10, 5, '2026-03-10 00:35:56', '2026-03-10 00:35:24', '2026-03-10 00:35:56'),
(15, 5, 18, 10, 5, '2026-03-10 00:35:51', '2026-03-10 00:35:46', '2026-03-10 00:35:51'),
(16, 6, 19, 10, 5, '2026-03-10 00:38:22', '2026-03-10 00:37:48', '2026-03-10 00:38:22'),
(17, 6, 20, 10, 5, '2026-03-10 00:38:18', '2026-03-10 00:38:13', '2026-03-10 00:38:18'),
(18, 7, 21, 25, 5, '2026-03-10 00:40:34', '2026-03-10 00:40:01', '2026-03-10 00:40:34'),
(19, 7, 22, 25, 5, '2026-03-10 00:40:28', '2026-03-10 00:40:19', '2026-03-10 00:40:28'),
(20, 3, 23, 10, 5, '2026-03-19 05:32:16', '2026-03-10 03:38:44', '2026-03-19 05:32:16'),
(21, 8, 24, 53, 5, '2026-03-19 06:37:26', '2026-03-19 06:33:17', '2026-03-19 06:37:38'),
(22, 8, 25, 0, 10, '2026-03-19 07:07:32', '2026-03-19 07:07:32', '2026-03-19 07:07:32'),
(23, 1, 27, 13, 10, '2026-03-27 17:39:20', '2026-03-19 08:10:35', '2026-03-27 17:39:20');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `transaction_id` int(10) UNSIGNED NOT NULL,
  `inventory_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `reference_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `transaction_type` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`transaction_id`, `inventory_id`, `station_id`, `product_id`, `quantity`, `unit_cost`, `reference_id`, `notes`, `created_by`, `created_at`, `transaction_type`) VALUES
(7, 2, 1, 2, 1, NULL, NULL, NULL, NULL, '2026-03-04 06:06:00', 1),
(8, 2, 1, 2, 2, NULL, NULL, NULL, NULL, '2026-03-04 06:06:07', 1),
(9, 2, 1, 2, 1, NULL, NULL, NULL, NULL, '2026-03-04 06:06:12', 1),
(10, 2, 1, 2, 5, NULL, NULL, NULL, NULL, '2026-03-04 06:06:16', 1),
(11, 4, 1, 6, 12, NULL, NULL, NULL, NULL, '2026-03-04 06:19:52', 1),
(12, 4, 1, 6, 2, NULL, NULL, NULL, NULL, '2026-03-04 06:21:10', 1),
(13, 2, 1, 2, 2, NULL, NULL, NULL, NULL, '2026-03-04 06:28:42', 1),
(14, 6, 1, 8, 2, NULL, NULL, NULL, NULL, '2026-03-04 06:28:47', 1),
(15, 4, 1, 6, 15, NULL, NULL, NULL, NULL, '2026-03-04 06:39:47', 1),
(17, 3, 1, 3, 5, NULL, NULL, NULL, NULL, '2026-03-04 12:06:35', 1),
(18, 6, 1, 8, 50, NULL, NULL, NULL, NULL, '2026-03-05 00:25:04', 1),
(19, 5, 1, 7, 100, NULL, NULL, NULL, NULL, '2026-03-05 00:47:01', 1),
(20, 10, 3, 13, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:24:54', 1),
(21, 9, 3, 12, 10, NULL, NULL, NULL, NULL, '2026-03-10 00:24:59', 1),
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
(32, 2, 1, 2, 12, NULL, NULL, NULL, NULL, '2026-03-18 06:59:43', 1),
(33, 5, 1, 7, 1, NULL, NULL, NULL, NULL, '2026-03-18 21:32:59', 1),
(34, 21, 8, 24, 25, NULL, NULL, NULL, NULL, '2026-03-19 06:33:29', 1),
(35, 21, 8, 24, 28, NULL, NULL, NULL, NULL, '2026-03-19 06:33:39', 1),
(36, 3, 1, 3, 50, NULL, NULL, NULL, NULL, '2026-03-19 07:11:50', 1),
(37, 23, 1, 27, 11, NULL, NULL, NULL, NULL, '2026-03-19 08:11:05', 1),
(38, 4, 1, 6, 2, NULL, NULL, NULL, NULL, '2026-03-20 01:31:07', 1),
(39, 23, 1, 27, 8, NULL, NULL, NULL, NULL, '2026-03-20 01:49:59', 1),
(40, 23, 1, 27, 5, NULL, NULL, NULL, NULL, '2026-03-20 01:50:11', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED DEFAULT NULL,
  `message` varchar(500) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `related_id` int(10) UNSIGNED DEFAULT NULL,
  `related_type` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notification_type` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `station_id`, `message`, `is_read`, `related_id`, `related_type`, `created_at`, `notification_type`) VALUES
(1, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-04 13:01:15', 1),
(2, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-04 13:01:58', 1),
(11, 1, 1, 'Your order AQL-20260304-EL2EG has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 15:58:42', 1),
(12, 1, 1, 'Your order AQL-20260304-WMIT9 has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 16:03:32', 1),
(13, 1, 1, 'Your order AQL-20260304-TOL49 has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 16:04:33', 1),
(21, 1, 1, 'Your order AQL-20260304-JOD6C has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 16:16:12', 1),
(22, 1, 1, 'Your order AQL-20260304-2EK14 has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 16:16:35', 1),
(23, 1, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-04 16:17:06', 1),
(24, 1, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-04 16:17:07', 1),
(25, 1, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-04 16:19:01', 1),
(26, 1, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-04 16:28:30', 1),
(27, 1, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-04 16:28:31', 1),
(28, 1, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-04 16:28:48', 1),
(29, 1, 1, 'Your order AQL-20260304-P3ZSK has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 16:29:40', 1),
(30, 1, 1, 'Your order AQL-20260304-4UD0M has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 16:30:08', 1),
(31, 1, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-04 16:30:28', 1),
(32, 1, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-04 16:30:29', 1),
(33, 1, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-04 16:30:35', 1),
(34, 1, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-04 16:33:54', 1),
(35, 1, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-04 16:33:55', 1),
(36, 1, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-04 16:33:56', 1),
(37, 1, 1, 'Your order AQL-20260304-L1ZIW has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 16:51:53', 1),
(38, 1, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-04 16:52:34', 1),
(39, 1, 1, 'Your order AQL-20260304-0ANCX has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-04 16:54:40', 1),
(40, 1, 1, 'Your return request has been submitted and is under review.', 1, NULL, NULL, '2026-03-04 17:01:59', 1),
(41, 1, 1, 'Your return request has been approved. We will process your refund shortly.', 1, NULL, NULL, '2026-03-04 17:04:59', 1),
(42, 1, 1, 'Your order has been cancelled. Reason: Changed mind', 1, NULL, NULL, '2026-03-04 17:15:37', 1),
(43, 1, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-04 17:35:12', 1),
(44, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-04 17:35:44', 1),
(45, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-04 17:35:45', 1),
(46, 1, 1, 'Your order AQL-20260304-STRWG has been received and is pending confirmation.', 0, NULL, NULL, '2026-03-04 17:56:23', 1),
(47, 1, 1, 'Your order has been cancelled. Reason: Nada', 0, NULL, NULL, '2026-03-04 17:56:30', 1),
(48, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-05 00:26:17', 1),
(49, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-05 00:26:19', 1),
(50, 1, 1, 'Your order AQL-20260305-IEIJR has been received and is pending confirmation.', 1, NULL, NULL, '2026-03-05 00:41:45', 1),
(51, 1, 1, 'Your order is now being prepared at the station.', 0, NULL, NULL, '2026-03-05 00:43:08', 1),
(52, 1, 1, 'Your order is out for delivery and on its way to you.', 0, NULL, NULL, '2026-03-05 00:43:10', 1),
(64, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-06 01:11:36', 1),
(65, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-06 01:11:37', 1),
(66, 6, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-06 01:11:59', 1),
(67, 1, 1, 'Your order has been delivered. Thank you for your purchase.', 0, NULL, NULL, '2026-03-06 01:12:28', 1),
(68, 6, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-06 01:12:31', 1),
(69, 1, 1, 'Your order has been delivered. Thank you for your purchase.', 0, NULL, NULL, '2026-03-06 01:12:36', 1),
(70, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-06 01:40:44', 1),
(71, 6, 1, '\"Water Bottle\" is now OUT OF STOCK.', 1, NULL, NULL, '2026-03-06 01:42:00', 1),
(72, 8, 1, '\"Water Bottle\" is now OUT OF STOCK.', 0, NULL, NULL, '2026-03-06 01:42:00', 1),
(73, 9, 1, '\"Water Bottle\" is now OUT OF STOCK.', 0, NULL, NULL, '2026-03-06 01:42:00', 1),
(74, 12, 1, '\"Water Bottle\" is now OUT OF STOCK.', 0, NULL, NULL, '2026-03-06 01:42:00', 1),
(81, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-09 23:51:27', 1),
(82, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-09 23:51:29', 1),
(83, 14, 3, 'Your order is now being prepared at the station.', 0, NULL, NULL, '2026-03-10 03:41:03', 1),
(84, 14, 3, 'Your order is out for delivery and on its way to you.', 0, NULL, NULL, '2026-03-10 03:41:07', 1),
(89, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-18 01:33:20', 1),
(90, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-18 01:33:21', 1),
(91, 6, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-18 01:49:21', 1),
(93, 13, 1, 'Your return request has been submitted and is under review.', 1, NULL, NULL, '2026-03-18 05:22:38', 1),
(94, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-18 06:49:43', 1),
(95, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-18 06:49:45', 1),
(96, 6, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-18 06:49:56', 1),
(97, 13, 1, 'Your return request has been approved. We will process your refund shortly.', 1, NULL, NULL, '2026-03-18 06:51:01', 1),
(98, 6, 1, 'Your order has been cancelled. Please contact us for assistance.', 1, NULL, NULL, '2026-03-18 07:01:03', 1),
(99, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-18 07:15:14', 1),
(100, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-18 07:15:15', 1),
(101, 6, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-18 07:15:18', 1),
(102, 6, 1, 'Your order has been delivered. Thank you for your purchase.', 1, NULL, NULL, '2026-03-18 07:21:19', 1),
(103, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-18 21:26:12', 1),
(104, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-18 21:26:17', 1),
(105, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-18 21:54:00', 1),
(106, 6, 1, 'Your order has been cancelled. Please contact us for assistance.', 1, NULL, NULL, '2026-03-18 21:54:05', 1),
(107, 6, 1, '\"Water Bottle\" is running low — only 2 left.', 1, NULL, NULL, '2026-03-19 01:01:29', 1),
(108, 8, 1, '\"Water Bottle\" is running low — only 2 left.', 0, NULL, NULL, '2026-03-19 01:01:29', 1),
(109, 9, 1, '\"Water Bottle\" is running low — only 2 left.', 0, NULL, NULL, '2026-03-19 01:01:29', 1),
(110, 12, 1, '\"Water Bottle\" is running low — only 2 left.', 0, NULL, NULL, '2026-03-19 01:01:29', 1),
(112, 13, 1, 'Your order is now being prepared at the station.', 0, NULL, NULL, '2026-03-19 01:44:52', 1),
(113, 13, 1, 'Your order is out for delivery and on its way to you.', 0, NULL, NULL, '2026-03-19 01:44:55', 1),
(114, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-19 01:49:33', 1),
(115, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-19 01:49:35', 1),
(116, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-19 01:49:48', 1),
(117, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-19 01:49:54', 1),
(118, 13, 1, 'Your order has been delivered. Thank you for your purchase.', 0, NULL, NULL, '2026-03-19 01:50:06', 1),
(119, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-19 02:07:51', 1),
(120, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-19 02:07:51', 1),
(121, 6, 1, 'Your order is out for delivery and on its way to you.', 1, NULL, NULL, '2026-03-19 02:07:51', 1),
(122, 6, 1, 'Your order is now being prepared at the station.', 1, NULL, NULL, '2026-03-19 02:08:24', 1),
(130, 14, 3, 'Your order is now being prepared at the station.', 0, NULL, NULL, '2026-03-19 05:32:37', 1),
(131, 14, 3, 'Your order is now being prepared at the station.', 0, NULL, NULL, '2026-03-19 05:32:42', 1),
(132, 14, 3, 'Your order is out for delivery and on its way to you.', 0, NULL, NULL, '2026-03-19 05:32:54', 1),
(133, 14, 3, 'Your order is out for delivery and on its way to you.', 0, NULL, NULL, '2026-03-19 05:32:54', 1),
(134, 14, 3, 'Your order has been delivered. Thank you for your purchase.', 0, NULL, NULL, '2026-03-19 05:33:03', 1),
(135, 14, 3, 'Your order has been delivered. Thank you for your purchase.', 0, NULL, NULL, '2026-03-19 05:33:03', 1),
(136, 13, 3, 'Your order has been delivered. Thank you for your purchase.', 0, NULL, NULL, '2026-03-19 05:33:03', 1),
(137, 14, 3, 'Your order has been delivered. Thank you for your purchase.', 0, NULL, NULL, '2026-03-19 05:33:03', 1),
(138, 22, 8, 'Your order has been cancelled. Please contact us for assistance.', 0, NULL, NULL, '2026-03-19 06:37:38', 1),
(140, 6, 1, '\"Gallon 2\" is running low — only 7 left.', 1, NULL, NULL, '2026-03-20 01:50:23', 1),
(141, 8, 1, '\"Gallon 2\" is running low — only 7 left.', 0, NULL, NULL, '2026-03-20 01:50:23', 1),
(142, 9, 1, '\"Gallon 2\" is running low — only 7 left.', 0, NULL, NULL, '2026-03-20 01:50:23', 1),
(143, 12, 1, '\"Gallon 2\" is running low — only 7 left.', 0, NULL, NULL, '2026-03-20 01:50:23', 1),
(146, 13, 1, 'Your order AQL-20260324-WFUMX has been received and is pending confirmation.', 0, NULL, NULL, '2026-03-24 03:19:38', 1);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(10) UNSIGNED NOT NULL,
  `order_reference` varchar(50) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_address` varchar(500) DEFAULT NULL,
  `customer_complete_address` varchar(500) DEFAULT NULL,
  `hidden_at` datetime DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` int(10) UNSIGNED DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `payment_mode` tinyint(3) UNSIGNED NOT NULL DEFAULT 2,
  `order_status` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `order_reference`, `user_id`, `station_id`, `total_amount`, `created_at`, `updated_at`, `customer_name`, `customer_address`, `customer_complete_address`, `hidden_at`, `notes`, `delivered_at`, `cancelled_at`, `cancelled_by`, `deleted_at`, `payment_mode`, `order_status`) VALUES
(45, 'ORD-1773113987101', 14, 3, 75.00, '2026-03-10 03:39:47', '2026-03-28 01:53:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 4),
(46, 'AQL-20260310-HHGO0', 13, 3, 60.00, '2026-03-10 03:45:24', '2026-03-28 01:53:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, 4),
(48, 'ORD-1773797563547', 6, 1, 12.00, '2026-03-18 01:32:43', '2026-03-28 01:53:19', NULL, NULL, NULL, '2026-03-19 05:26:37', NULL, NULL, NULL, NULL, NULL, 2, 4),
(49, 'ORD-1773798589682', 6, 1, 24.00, '2026-03-18 01:49:49', '2026-03-28 01:53:19', NULL, NULL, NULL, '2026-03-19 05:26:37', NULL, NULL, NULL, NULL, NULL, 2, 4),
(52, 'ORD-1773869160506', 6, 1, 12.00, '2026-03-18 21:26:00', '2026-03-28 01:53:19', 'RIsa', 'Bognuyan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 4),
(53, 'ORD-1773870832996', 6, 1, 12.00, '2026-03-18 21:53:53', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 5),
(54, 'AQL-20260319-KO8PN', 13, 1, 24.00, '2026-03-19 01:01:29', '2026-03-28 01:53:19', 'ian', 'Bangbangalon, Boac, Marinduque, Philippines', 'Purok Lawaan', NULL, NULL, NULL, NULL, NULL, NULL, 3, 4),
(55, 'ORD-1773884881687', 6, 1, 12.00, '2026-03-19 01:48:01', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 4),
(56, 'ORD-1773884966566', 6, 1, 12.00, '2026-03-19 01:49:26', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 4),
(57, 'ORD-1773886081161', 6, 1, 12.00, '2026-03-19 02:08:01', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 4),
(58, 'ORD-1773886819773', 6, 1, 48.00, '2026-03-19 02:20:19', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 4),
(59, 'ORD-1773898252496', 14, 3, 75.00, '2026-03-19 05:30:52', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 4),
(60, 'ORD-1773898336713', 14, 3, 15.00, '2026-03-19 05:32:16', '2026-03-28 01:53:19', 'asdas', 'asdad', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 4),
(61, 'ORD-1773902246287', 22, 8, 60.00, '2026-03-19 06:37:26', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 5),
(62, 'ORD-1773904710343', 6, 1, 48.00, '2026-03-19 07:18:30', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 5),
(63, 'ORD-1773970298410', 6, 1, 48.00, '2026-03-20 01:31:38', '2026-03-20 01:31:38', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 1),
(64, 'ORD-1773970795152', 6, 1, 132.00, '2026-03-20 01:39:55', '2026-03-20 01:39:55', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 1),
(65, 'ORD-1773971423803', 6, 1, 72.00, '2026-03-20 01:50:23', '2026-03-28 01:53:19', 'Walk-in', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 5),
(66, 'AQL-20260324-WFUMX', 13, 1, 60.00, '2026-03-24 03:19:38', '2026-03-28 01:53:19', 'ian', 'Tanza, Boac, Marinduque, Philippines', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `price_snapshot` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `price_snapshot`, `created_at`) VALUES
(48, 45, 23, 5, 15.00, '2026-03-10 03:39:47'),
(49, 46, 23, 4, 15.00, '2026-03-10 03:45:24'),
(51, 48, 7, 1, 12.00, '2026-03-18 01:32:43'),
(52, 49, 7, 2, 12.00, '2026-03-18 01:49:49'),
(56, 52, 8, 1, 12.00, '2026-03-18 21:26:00'),
(57, 53, 3, 1, 12.00, '2026-03-18 21:53:53'),
(58, 54, 3, 2, 12.00, '2026-03-19 01:01:29'),
(59, 55, 3, 1, 12.00, '2026-03-19 01:48:01'),
(60, 56, 8, 1, 12.00, '2026-03-19 01:49:26'),
(61, 57, 3, 1, 12.00, '2026-03-19 02:08:01'),
(62, 58, 6, 4, 12.00, '2026-03-19 02:20:19'),
(63, 59, 12, 3, 25.00, '2026-03-19 05:30:52'),
(64, 60, 23, 1, 15.00, '2026-03-19 05:32:16'),
(65, 61, 24, 3, 20.00, '2026-03-19 06:37:26'),
(66, 62, 7, 4, 12.00, '2026-03-19 07:18:30'),
(67, 63, 6, 4, 12.00, '2026-03-20 01:31:38'),
(68, 64, 27, 11, 12.00, '2026-03-20 01:39:55'),
(69, 65, 27, 6, 12.00, '2026-03-20 01:50:23'),
(70, 66, 7, 5, 12.00, '2026-03-24 03:19:38');

-- --------------------------------------------------------

--
-- Table structure for table `order_returns`
--

CREATE TABLE `order_returns` (
  `return_id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `reason` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `processed_by` int(11) DEFAULT NULL,
  `refund_amount` decimal(10,2) DEFAULT NULL,
  `admin_notes` varchar(500) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `return_status` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `token_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED DEFAULT NULL,
  `proof_image_path` varchar(255) DEFAULT NULL,
  `gcash_reference` varchar(50) DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `verified_by` int(10) UNSIGNED DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_type` tinyint(3) UNSIGNED NOT NULL DEFAULT 2,
  `payment_status` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `order_id`, `proof_image_path`, `gcash_reference`, `amount_paid`, `notes`, `verified_by`, `verified_at`, `created_at`, `payment_type`, `payment_status`) VALUES
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
(63, 66, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-24 03:19:38', 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `pos_transactions`
--

CREATE TABLE `pos_transactions` (
  `pos_id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED DEFAULT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `processed_by` int(10) UNSIGNED DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `full_address` varchar(300) DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_method` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `transaction_status` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pos_transactions`
--

INSERT INTO `pos_transactions` (`pos_id`, `order_id`, `station_id`, `processed_by`, `full_name`, `full_address`, `total_amount`, `transaction_date`, `payment_method`, `transaction_status`) VALUES
(1, NULL, 1, 6, 'Ramon', NULL, 24.00, '2026-03-04 07:44:59', 1, 1),
(2, NULL, 1, 6, 'Jose', 'San Marines', 75.00, '2026-03-04 07:53:27', 1, 1),
(3, NULL, 1, 6, 'Lilibeth', 'Sampaloc', 25.00, '2026-03-04 08:05:00', 1, 1),
(4, NULL, 1, 6, 'Rose', 'Sampaloc', 24.00, '2026-03-04 08:10:49', 1, 1),
(5, NULL, 1, 6, 'Jane', 'Tanza', 12.00, '2026-03-04 08:11:25', 1, 1),
(6, NULL, 1, 6, 'Shane', 'Sampaloc', 12.00, '2026-03-04 08:43:28', 1, 1),
(8, NULL, 1, 6, 'Joseph', 'Santol', 85.00, '2026-03-04 12:03:14', 1, 1),
(9, NULL, 1, 6, 'Sally', 'Santol', 50.00, '2026-03-04 12:09:19', 2, 1),
(10, NULL, 1, 6, 'Shiela', 'Tanza', 12.00, '2026-03-04 12:51:46', 1, 1),
(11, NULL, 1, 6, 'Selva', 'Lusak', 62.00, '2026-03-04 13:01:06', 1, 1),
(12, NULL, 1, 6, 'Lilia', 'Santol', 50.00, '2026-03-04 13:30:36', 1, 1),
(16, NULL, 1, 6, 'Walk-in', NULL, 12.00, '2026-03-04 17:35:37', 1, 1),
(17, NULL, 1, 6, 'Ady', 'Santol', 84.00, '2026-03-05 00:27:45', 1, 1),
(18, NULL, 1, 6, 'yuan', 'santol', 24.00, '2026-03-05 00:50:38', 1, 1),
(19, NULL, 1, 6, 'Brylle', 'Murallon', 24.00, '2026-03-05 00:51:36', 1, 1),
(20, NULL, 1, 6, 'Risa', 'San Mateo', 120.00, '2026-03-09 23:51:15', 1, 1),
(21, 45, 3, 14, 'Rose', 'Tanza', 75.00, '2026-03-10 03:39:47', 1, 1),
(22, 48, 1, 6, 'Risa', 'Butansapa', 12.00, '2026-03-18 01:32:43', 1, 1),
(23, 49, 1, 6, 'Risa', 'Bognuyan', 24.00, '2026-03-18 01:49:49', 1, 1),
(24, NULL, 1, 6, 'Rika', 'Baranggay Dos', 12.00, '2026-03-18 06:44:16', 1, 1),
(25, NULL, 1, 6, 'Walk-in', NULL, 36.00, '2026-03-18 07:00:29', 1, 1),
(26, 52, 1, 6, 'RIsa', 'Bognuyan', 12.00, '2026-03-18 21:26:00', 1, 1),
(27, 53, 1, 6, 'Walk-in', NULL, 12.00, '2026-03-18 21:53:53', 1, 1),
(28, 55, 1, 6, 'Walk-in', NULL, 12.00, '2026-03-19 01:48:01', 1, 1),
(29, 56, 1, 6, 'Walk-in', NULL, 12.00, '2026-03-19 01:49:26', 1, 1),
(30, 57, 1, 6, 'Walk-in', NULL, 12.00, '2026-03-19 02:08:01', 1, 1),
(31, 58, 1, 6, 'Walk-in', NULL, 48.00, '2026-03-19 02:20:19', 1, 1),
(32, 59, 3, 14, 'Walk-in', NULL, 75.00, '2026-03-19 05:30:52', 1, 1),
(33, 60, 3, 14, 'asdas', 'asdad', 15.00, '2026-03-19 05:32:16', 1, 1),
(34, 61, 8, 22, 'Walk-in', NULL, 60.00, '2026-03-19 06:37:26', 1, 1),
(35, 62, 1, 6, 'Walk-in', NULL, 48.00, '2026-03-19 07:18:30', 1, 1),
(36, 63, 1, 6, 'Walk-in', NULL, 48.00, '2026-03-20 01:31:38', 1, 1),
(37, 64, 1, 6, 'Walk-in', NULL, 132.00, '2026-03-20 01:39:55', 1, 1),
(38, 65, 1, 6, 'Walk-in', NULL, 72.00, '2026-03-20 01:50:23', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `product_name` varchar(150) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'gallon',
  `unit_type` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `station_id`, `category_id`, `product_name`, `description`, `price`, `cost_price`, `sku`, `is_active`, `created_at`, `updated_at`, `deleted_at`, `image_url`, `unit`, `unit_type`) VALUES
(2, 1, NULL, 'Slim Water Gallon', 'Slim water gallon', 25.00, NULL, NULL, 1, '2026-03-04 06:05:44', '2026-03-04 06:05:44', NULL, '/uploads/products/product_1772604343137.jpg', 'gallon', 1),
(3, 1, NULL, 'Water Bottle', 'Water Bottle', 12.00, NULL, NULL, 1, '2026-03-04 06:14:01', '2026-03-04 06:14:01', NULL, '/uploads/products/product_1772604840037.jpg', 'bottle', 1),
(6, 1, NULL, 'Water Gallon 1', 'asdasd', 12.00, NULL, NULL, 1, '2026-03-04 06:19:35', '2026-03-04 06:30:56', NULL, NULL, 'gallon', 1),
(7, 1, NULL, 'Gallon', NULL, 12.00, NULL, NULL, 1, '2026-03-04 06:21:29', '2026-03-27 17:41:35', NULL, NULL, 'container', 1),
(8, 1, NULL, 'Water Bottle 2', 'This is a water bottle', 12.00, NULL, NULL, 0, '2026-03-04 06:28:02', '2026-03-27 17:39:11', NULL, '/uploads/products/product_1772670291867.jpg', 'gallon', 1),
(12, 3, NULL, 'Round Bottle Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:24:13', '2026-03-10 00:24:13', NULL, NULL, 'bottle', 1),
(13, 3, NULL, 'Rectangular Jerry-can Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:24:41', '2026-03-10 00:24:41', NULL, NULL, 'container', 1),
(14, 4, NULL, 'Round Bottle Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:32:31', '2026-03-10 00:32:31', NULL, NULL, 'bottle', 1),
(15, 4, NULL, 'Rectangular Jerry-can Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:32:52', '2026-03-10 00:32:52', NULL, NULL, 'gallon', 1),
(16, 5, NULL, 'Round Bottle Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:35:09', '2026-03-10 00:35:09', NULL, NULL, 'bottle', 1),
(17, 5, NULL, 'Wilkins Container (7L)', NULL, 35.00, NULL, NULL, 1, '2026-03-10 00:35:24', '2026-03-10 00:35:24', NULL, NULL, 'container', 1),
(18, 5, NULL, 'Rectangular Jerry-can Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:35:46', '2026-03-10 00:35:46', NULL, NULL, 'gallon', 1),
(19, 6, NULL, '1.	Round Bottle Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:37:48', '2026-03-10 00:37:48', NULL, NULL, 'bottle', 1),
(20, 6, NULL, 'Rectangular Jerry-can Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:38:13', '2026-03-10 00:38:13', NULL, NULL, 'gallon', 1),
(21, 7, NULL, 'Round Bottle Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:40:01', '2026-03-10 00:40:01', NULL, NULL, 'bottle', 1),
(22, 7, NULL, '2.	Rectangular Jerry-can Style (20L)', NULL, 25.00, NULL, NULL, 1, '2026-03-10 00:40:19', '2026-03-10 00:40:19', NULL, NULL, 'gallon', 1),
(23, 3, NULL, 'Bottled Water', NULL, 15.00, NULL, NULL, 1, '2026-03-10 03:38:44', '2026-03-10 03:38:44', NULL, '/uploads/products/product_1773113922226.png', 'bottle', 1),
(24, 8, NULL, 'Gallon 5', NULL, 20.00, NULL, NULL, 1, '2026-03-19 06:33:17', '2026-03-19 06:33:17', NULL, NULL, 'gallon', 1),
(25, 8, NULL, 'Gallon 6', NULL, 50.00, NULL, NULL, 1, '2026-03-19 07:07:32', '2026-03-19 07:07:32', NULL, NULL, 'gallon', 1),
(27, 1, NULL, 'Gallon 2', NULL, 12.00, NULL, NULL, 0, '2026-03-19 08:10:35', '2026-03-27 17:39:20', NULL, NULL, 'gallon', 1);

-- --------------------------------------------------------

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
  `category_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `sort_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `token_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `revoked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `report_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `report_date` date NOT NULL,
  `total_sales` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_orders` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_revenue` decimal(12,2) NOT NULL DEFAULT 0.00,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `report_type` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stations`
--

CREATE TABLE `stations` (
  `station_id` int(10) UNSIGNED NOT NULL,
  `station_name` varchar(150) NOT NULL,
  `address` varchar(500) NOT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `qr_code_path` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  `complete_address` varchar(500) DEFAULT NULL,
  `status` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stations`
--

INSERT INTO `stations` (`station_id`, `station_name`, `address`, `image_path`, `qr_code_path`, `latitude`, `longitude`, `contact_number`, `email`, `created_at`, `updated_at`, `deleted_at`, `complete_address`, `status`) VALUES
(1, 'Tanza Water Refilling Station', 'Bamban, Boac, Marinduque, Philippines', '/uploads/stations/logo_1772670620966.jpg', '/uploads/qrcodes/qr_1772646791548.jpg', 13.4424553, 121.8718131, '09672534800', NULL, '2026-03-04 03:12:24', '2026-03-27 16:50:03', NULL, '', 1),
(3, 'MarSU Employee Credit Cooperative Water Refilling Station', 'Tanza, Boac, Marinduque, Philippines', '/uploads/stations/logo_1773102061860.png', '/uploads/qrcodes/qr_1773102118113.jpg', 13.4549351, 121.8423453, '09165434570', NULL, '2026-03-10 00:05:40', '2026-03-11 03:17:34', NULL, NULL, 1),
(4, 'San Juan Water Refilling Station', 'Mataas na Bayan, Boac, Marinduque ', '/uploads/stations/logo_1773102691873.png', '/uploads/qrcodes/qr_1773102697933.jpg', 13.4478187, 121.8437884, '09453045499', NULL, '2026-03-10 00:07:40', '2026-03-10 00:31:37', NULL, NULL, 1),
(5, 'Water Avenue', 'Murallon, Boac, Marinduque', '/uploads/stations/logo_1773102871062.png', '/uploads/qrcodes/qr_1773102878805.jpg', 13.4495572, 121.8333155, '09165429279', NULL, '2026-03-10 00:09:55', '2026-03-10 00:34:38', NULL, NULL, 1),
(6, 'Miyamoto Water Refilling Station', 'Tanza, Boac, Marinduque, Philippines', '/uploads/stations/logo_1773103042385.png', '/uploads/qrcodes/qr_1773103049875.jpg', 13.4467607, 121.8433788, '09150186364', NULL, '2026-03-10 00:12:22', '2026-03-10 00:37:29', NULL, NULL, 1),
(7, 'Rianne\'s Water Refilling Station', 'Tabi, Boac, Marinduque, Philippines', '/uploads/stations/logo_1773103163802.png', '/uploads/qrcodes/qr_1773103171945.jpg', 13.4560891, 121.8382939, '09190955926', NULL, '2026-03-10 00:15:05', '2026-03-10 00:39:31', NULL, NULL, 1),
(8, 'Sample Station', 'Marinduque State University, Marinduque Circumferential Road, Tanza, Boac, 1st District, Marinduque, Mimaropa, 4900, Philippines', NULL, NULL, 13.4543980, 121.8447220, '09672534800', NULL, '2026-03-19 06:24:11', '2026-03-19 06:24:11', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `station_schedules`
--

CREATE TABLE `station_schedules` (
  `schedule_id` int(10) UNSIGNED NOT NULL,
  `station_id` int(10) UNSIGNED NOT NULL,
  `day_of_week` tinyint(3) UNSIGNED NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `station_schedules`
--

INSERT INTO `station_schedules` (`schedule_id`, `station_id`, `day_of_week`, `open_time`, `close_time`, `is_open`) VALUES
(1, 1, 0, '07:00:00', '19:00:00', 0),
(2, 3, 0, '07:00:00', '19:00:00', 0),
(3, 4, 0, '07:00:00', '19:00:00', 0),
(4, 5, 0, '07:00:00', '19:00:00', 0),
(5, 6, 0, '07:00:00', '19:00:00', 0),
(6, 7, 0, '07:00:00', '19:00:00', 0),
(7, 8, 0, '07:00:00', '19:00:00', 0),
(8, 1, 1, '07:00:00', '19:00:00', 1),
(9, 3, 1, '07:00:00', '19:00:00', 1),
(10, 4, 1, '07:00:00', '19:00:00', 1),
(11, 5, 1, '07:00:00', '19:00:00', 1),
(12, 6, 1, '07:00:00', '19:00:00', 1),
(13, 7, 1, '07:00:00', '19:00:00', 1),
(14, 8, 1, '07:00:00', '19:00:00', 1),
(15, 1, 2, '07:00:00', '19:00:00', 1),
(16, 3, 2, '07:00:00', '19:00:00', 1),
(17, 4, 2, '07:00:00', '19:00:00', 1),
(18, 5, 2, '07:00:00', '19:00:00', 1),
(19, 6, 2, '07:00:00', '19:00:00', 1),
(20, 7, 2, '07:00:00', '19:00:00', 1),
(21, 8, 2, '07:00:00', '19:00:00', 1),
(22, 1, 3, '07:00:00', '19:00:00', 1),
(23, 3, 3, '07:00:00', '19:00:00', 1),
(24, 4, 3, '07:00:00', '19:00:00', 1),
(25, 5, 3, '07:00:00', '19:00:00', 1),
(26, 6, 3, '07:00:00', '19:00:00', 1),
(27, 7, 3, '07:00:00', '19:00:00', 1),
(28, 8, 3, '07:00:00', '19:00:00', 1),
(29, 1, 4, '07:00:00', '19:00:00', 1),
(30, 3, 4, '07:00:00', '19:00:00', 1),
(31, 4, 4, '07:00:00', '19:00:00', 1),
(32, 5, 4, '07:00:00', '19:00:00', 1),
(33, 6, 4, '07:00:00', '19:00:00', 1),
(34, 7, 4, '07:00:00', '19:00:00', 1),
(35, 8, 4, '07:00:00', '19:00:00', 1),
(36, 1, 5, '07:00:00', '19:00:00', 1),
(37, 3, 5, '07:00:00', '19:00:00', 1),
(38, 4, 5, '07:00:00', '19:00:00', 1),
(39, 5, 5, '07:00:00', '19:00:00', 1),
(40, 6, 5, '07:00:00', '19:00:00', 1),
(41, 7, 5, '07:00:00', '19:00:00', 1),
(42, 8, 5, '07:00:00', '19:00:00', 1),
(43, 1, 6, '07:00:00', '19:00:00', 1),
(44, 3, 6, '07:00:00', '19:00:00', 1),
(45, 4, 6, '07:00:00', '19:00:00', 1),
(46, 5, 6, '07:00:00', '19:00:00', 1),
(47, 6, 6, '07:00:00', '19:00:00', 1),
(48, 7, 6, '07:00:00', '19:00:00', 1),
(49, 8, 6, '07:00:00', '19:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `log_id` int(10) UNSIGNED NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `description` varchar(1000) NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`log_id`, `event_type`, `description`, `user_id`, `ip_address`, `created_at`) VALUES
(1, 'station_created', 'Station \"Sample Station\" created. Super admin: sample@gmail.com', 21, NULL, '2026-03-19 14:24:12'),
(2, 'station_deleted', 'Station \"Ricks Water Refilling Station\" was deleted', 21, NULL, '2026-03-19 14:24:28'),
(3, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-19 14:24:40'),
(4, 'login', 'super_admin \"sample\" (sample@gmail.com) logged in', 22, '::1', '2026-03-19 14:24:54'),
(5, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-19 15:11:11'),
(6, 'login', 'customer \"ian\" (ian@gmail.com) logged in', 13, '::1', '2026-03-19 15:57:00'),
(7, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-19 15:58:38'),
(8, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-19 16:04:23'),
(9, 'login', 'customer \"ian\" (ian@gmail.com) logged in', 13, '::1', '2026-03-20 09:11:16'),
(10, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-20 09:30:30'),
(11, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-20 15:59:55'),
(12, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-24 10:39:52'),
(13, 'login', 'customer \"ian\" (ian@gmail.com) logged in', 13, '::1', '2026-03-24 11:18:51'),
(14, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-28 00:49:50'),
(15, 'login', 'customer \"ian\" (ian@gmail.com) logged in', 13, '::1', '2026-03-28 01:42:21'),
(16, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-28 01:43:13'),
(17, 'login', 'customer \"ian\" (ian@gmail.com) logged in', 13, '::1', '2026-03-28 01:59:27'),
(18, 'login', 'super_admin \"Super Admin\" (admin@gmail.com) logged in', 6, '::1', '2026-03-28 09:34:43');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `station_id` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login_at` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `complete_address` varchar(500) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `role` tinyint(3) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `phone_number`, `address`, `latitude`, `longitude`, `station_id`, `is_active`, `created_at`, `updated_at`, `last_login_at`, `failed_login_attempts`, `locked_until`, `email_verified_at`, `deleted_at`, `complete_address`, `profile_picture`, `role`) VALUES
(1, 'jane doe', 'jane@gmail.com', '$2b$10$uPKokXiXvpQ3THKadEtShe/p6fbh3gSm3MTJIWPkFA6.SmU4.IrTa', '09153890567', 'Tanza, Boac, Marinduque, Philippines', 13.4541311, 121.8444908, NULL, 1, '2026-03-02 12:07:13', '2026-03-05 00:42:29', NULL, 0, NULL, NULL, NULL, NULL, NULL, 1),
(2, 'ady', 'ady@gmail.com', '$2b$10$qVREYX1SspB2./wPExAio.srJVNZzTxW3Rr9knmAVMX6LxxMOjzlG', NULL, NULL, NULL, NULL, NULL, 1, '2026-03-02 23:52:53', '2026-03-02 23:52:53', NULL, 0, NULL, NULL, NULL, NULL, NULL, 1),
(3, 'alexa', 'alexa@gmail.com', '$2b$10$emRlwf0wFVCcGSFaAE4sYOF/GsXpEBD.zFT1HcGNvUbpNbUnjeD42', NULL, NULL, NULL, NULL, NULL, 1, '2026-03-03 13:41:17', '2026-03-03 13:41:17', NULL, 0, NULL, NULL, NULL, NULL, NULL, 1),
(4, 'jonathan', 'jonathan@gmail.com', '$2b$10$mRYZuUp1DOOowcTm55PH5OJf8LRDXTPiRoUs5M48gKQX299tbe7Du', NULL, NULL, NULL, NULL, NULL, 1, '2026-03-03 14:23:12', '2026-03-03 14:23:12', NULL, 0, NULL, NULL, NULL, NULL, NULL, 1),
(5, 'jon', 'jon@gmail.com', '$2b$10$Ks7m8tLwGMMQk28BDiEUOOavxh/W43/J9mKAy4MMimdPsxUjx2Gse', NULL, NULL, NULL, NULL, NULL, 1, '2026-03-03 14:26:19', '2026-03-03 14:26:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 1),
(6, 'Super Admin', 'admin@gmail.com', '$2b$10$RFLY4hOf0FHnRVQ.gCaaV..XtAlI4Xp2l8x7Z2cc5N5AyA/dAJjhS', NULL, NULL, NULL, NULL, 1, 1, '2026-03-03 14:35:07', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, '/uploads/avatars/avatar_1773993655874.png', 3),
(7, 'fam', 'fam@gmail.com', '$2b$10$G2OS7TW6nx2EPLOc6Loba.2MAq1xyAtWWBJnutH9cYPvQTRkXPAuK', NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 00:07:32', '2026-03-04 00:07:32', NULL, 0, NULL, NULL, NULL, NULL, NULL, 1),
(8, 'Santos', 'santos@gmail.com', '$2b$10$pxotqrudWxiGMc2ob1ACq.ILMIWbHgWnGpwr.iw6hqUG8Lj/6y9P.', NULL, NULL, NULL, NULL, 1, 1, '2026-03-04 03:52:55', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 2),
(9, 'Jason', 'jason@gmail.com', '$2b$10$A0kQx7ZZBB87l5b34ithm.ml9Y6JyxGGpgRQqUdM8BA7UVbOce9Ma', NULL, NULL, NULL, NULL, 1, 1, '2026-03-04 03:55:47', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 2),
(10, 'Rick Mortez', 'rick@gmail.com', '$2b$10$bZFEC8Ie5AfxwDg4ucL6xuXjt4MQZa76ro/gHBD8Q19FgkrcQc3QS', NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 07:08:37', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 3),
(11, 'Justin', 'justin@gmail.com', '$2b$10$yQJgn41NHHCuhw/H2HmvGeGtTr.WC8wGZBKfo5/G1R8KS2cxXkyE.', NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 07:11:46', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 2),
(12, 'Dale', 'dale@gmail.com', '$2b$10$QD0E.9KeRcQq0lhnQK/N8.ovzcAG5LAlo6aY3WTywzbGIVMVQ6JBq', NULL, NULL, NULL, NULL, 1, 1, '2026-03-05 00:30:49', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 2),
(13, 'ian', 'ian@gmail.com', '$2b$10$HUe.Tm0ddAbtcVQQDg/gVOv9qlaxvnVemevQ3m/giR01xfSYxYLRa', NULL, 'Tanza, Boac, Marinduque, Philippines', 13.4541524, 121.8444911, NULL, 1, '2026-03-05 00:43:59', '2026-03-19 07:57:08', NULL, 0, NULL, NULL, NULL, NULL, '/uploads/avatars/avatar_1773907028390.jpg', 1),
(14, 'Michael Capiena', 'michael.capiena@gmail.com', '$2b$10$OC6F66S.LxgExJwIwl79ku0Ue3JyrqaH9LrhuIOpCONEb6JZOKlYm', NULL, NULL, NULL, NULL, 3, 1, '2026-03-10 00:05:40', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 3),
(15, 'San Juan, Ralph John Son', 'ralph.john@gmail.com', '$2b$10$OFwg5Sgif9C/Pome9f4LbelNRyt4LJTHOMUadbtUIUjNh0xAtbPmW', NULL, NULL, NULL, NULL, 4, 1, '2026-03-10 00:07:40', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 3),
(16, 'Jann Paolo Montalan', 'jann.paolo.montalan@gmail.com', '$2b$10$prpeBsYUYi4U1Ik3k1cWFe5bbU6ZcdL.L.qqXIsUD/gwU0yO/xWbu', NULL, NULL, NULL, NULL, 5, 1, '2026-03-10 00:09:55', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 3),
(17, 'Yolanda Narsoles', 'yolanda.narsoles@gmail.com', '$2b$10$ufD1ZYa9uA7F0YbXtoKSz.lUCK0ft7QehEUyWKjfSwbtrV445Zl42', NULL, NULL, NULL, NULL, 6, 1, '2026-03-10 00:12:22', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 3),
(18, 'Rowel Garcia', 'rowel.garcia@gmail.com', '$2b$10$X43.lIkWCHLcxfUQSePeNe5w.7bX1KC0JoVbrF.PuL2/xKTm6uJZe', NULL, NULL, NULL, NULL, 7, 1, '2026-03-10 00:15:05', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 3),
(19, 'Denize Dayne Beltron', 'denize@gmail.com', '$2b$10$llYar4LIjJIclPS0toSGQeWFQxZd6lCh9P6hL8mNEeI3krwLo.VHO', NULL, NULL, NULL, NULL, 3, 1, '2026-03-10 00:22:51', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 2),
(20, 'Jayson San Jose', 'jayson@gmail.com', '$2b$10$GzF3GNu2s7y1.Q6qkgVfN.vKO1vKaxcV0ZCZyTeMHaC.4GqIRjTka', NULL, NULL, NULL, NULL, 3, 1, '2026-03-10 00:23:24', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 2),
(21, 'System Admin', 'sysadmin@gmail.com', '$2b$10$boWKuQyUEkDG9HaOPxCo6erSj2adEeg45FNftI7UfBEbSOVxmRrri', NULL, NULL, NULL, NULL, NULL, 1, '2026-03-19 05:45:16', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 4),
(22, 'sample', 'sample@gmail.com', '$2b$10$W2ZmIL4KlNX7wN2ZDELoOO/f72k8KXTwi2/d/4ur3eiwnXdvrwNDe', NULL, 'Main Road', NULL, NULL, 8, 1, '2026-03-19 06:24:12', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, '/uploads/avatars/avatar_1773903449622.png', 3),
(23, 'Rue', 'rue@gmail.com', '$2b$10$43wY4Ki8bh0c8wBK3C9b9.m.9V5iovJYuYkednCmH.hWHjrSZxboW', NULL, NULL, NULL, NULL, 8, 1, '2026-03-19 06:29:33', '2026-03-28 01:53:19', NULL, 0, NULL, NULL, NULL, NULL, NULL, 2);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `delivery_zones`
--
ALTER TABLE `delivery_zones`
  ADD PRIMARY KEY (`zone_id`),
  ADD UNIQUE KEY `uq_station_area` (`station_id`,`area_name`),
  ADD KEY `idx_dz_station_id` (`station_id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `unique_station_product` (`station_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `inventory_id` (`inventory_id`),
  ADD KEY `station_id` (`station_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `station_id` (`station_id`),
  ADD KEY `idx_notification_type` (`notification_type`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `order_reference` (`order_reference`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `station_id` (`station_id`),
  ADD KEY `idx_order_status` (`order_status`),
  ADD KEY `idx_payment_mode` (`payment_mode`),
  ADD KEY `idx_orders_deleted_at` (`deleted_at`),
  ADD KEY `fk_orders_cancelled_by` (`cancelled_by`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `order_returns`
--
ALTER TABLE `order_returns`
  ADD PRIMARY KEY (`return_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `uq_prt_token_hash` (`token_hash`),
  ADD KEY `idx_prt_user_id` (`user_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `verified_by` (`verified_by`);

--
-- Indexes for table `pos_transactions`
--
ALTER TABLE `pos_transactions`
  ADD PRIMARY KEY (`pos_id`),
  ADD KEY `station_id` (`station_id`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `idx_pos_order_id` (`order_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `unique_station_product` (`station_id`,`product_name`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_products_deleted_at` (`deleted_at`),
  ADD KEY `fk_products_category` (`category_id`);

--
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD KEY `idx_pc_station_id` (`station_id`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`token_id`),
  ADD UNIQUE KEY `uq_token_hash` (`token_hash`),
  ADD KEY `idx_rt_user_id` (`user_id`),
  ADD KEY `idx_rt_expires_at` (`expires_at`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`report_id`),
  ADD UNIQUE KEY `unique_station_report` (`station_id`,`report_type`,`report_date`);

--
-- Indexes for table `stations`
--
ALTER TABLE `stations`
  ADD PRIMARY KEY (`station_id`),
  ADD KEY `idx_stations_deleted_at` (`deleted_at`);

--
-- Indexes for table `station_schedules`
--
ALTER TABLE `station_schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD UNIQUE KEY `uq_station_day` (`station_id`,`day_of_week`),
  ADD KEY `idx_ss_station_id` (`station_id`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `station_id` (`station_id`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_users_deleted_at` (`deleted_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `delivery_zones`
--
ALTER TABLE `delivery_zones`
  MODIFY `zone_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `inventory_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `transaction_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `order_returns`
--
ALTER TABLE `order_returns`
  MODIFY `return_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `token_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `pos_transactions`
--
ALTER TABLE `pos_transactions`
  MODIFY `pos_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
  MODIFY `category_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `token_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `report_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stations`
--
ALTER TABLE `stations`
  MODIFY `station_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `station_schedules`
--
ALTER TABLE `station_schedules`
  MODIFY `schedule_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `log_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `delivery_zones`
--
ALTER TABLE `delivery_zones`
  ADD CONSTRAINT `fk_dz_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`inventory_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_returns`
--
ALTER TABLE `order_returns`
  ADD CONSTRAINT `order_returns_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `pos_transactions`
--
ALTER TABLE `pos_transactions`
  ADD CONSTRAINT `fk_pos_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `pos_transactions_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `pos_transactions_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`category_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD CONSTRAINT `fk_pc_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE;

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `fk_rt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `station_schedules`
--
ALTER TABLE `station_schedules`
  ADD CONSTRAINT `fk_ss_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `stations` (`station_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
