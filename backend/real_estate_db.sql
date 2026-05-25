-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 23, 2026 at 11:22 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `real_estate_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `role` enum('admin','super_admin') NOT NULL DEFAULT 'admin',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password_hash`, `phone`, `role`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@admin.com', '$2b$12$Hot39yxgNw1X8zjasb20Aum0rTkophUq8PlkuyIJkhdBlubF3Vlgy', '+2347065785430', 'admin', 1, '2026-05-23 21:07:20', '2026-05-23 20:21:20', '2026-05-23 21:07:20');

-- --------------------------------------------------------

--
-- Table structure for table `agents`
--

CREATE TABLE `agents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `market` varchar(120) DEFAULT NULL,
  `title` varchar(120) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) DEFAULT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `source` varchar(80) DEFAULT NULL,
  `status` enum('new','contacted','qualified','closed','lost') NOT NULL DEFAULT 'new',
  `property_id` bigint(20) UNSIGNED DEFAULT NULL,
  `assigned_admin_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(180) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `listing_code` varchar(60) DEFAULT NULL,
  `status` enum('draft','active','pending','sold','leased','archived') NOT NULL DEFAULT 'draft',
  `property_type` enum('apartment','house','townhome','condo','land','commercial','other') NOT NULL DEFAULT 'house',
  `address_line_1` varchar(180) NOT NULL,
  `address_line_2` varchar(180) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(80) NOT NULL,
  `postal_code` varchar(30) DEFAULT NULL,
  `country` varchar(80) NOT NULL DEFAULT 'United States',
  `price` decimal(14,2) NOT NULL DEFAULT 0.00,
  `bedrooms` decimal(4,1) DEFAULT NULL,
  `bathrooms` decimal(4,1) DEFAULT NULL,
  `square_feet` int(10) UNSIGNED DEFAULT NULL,
  `lot_square_feet` int(10) UNSIGNED DEFAULT NULL,
  `year_built` smallint(5) UNSIGNED DEFAULT NULL,
  `description` text DEFAULT NULL,
  `cover_image_url` varchar(500) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `property_images`
--

CREATE TABLE `property_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `alt_text` varchar(180) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `property_features`
--

CREATE TABLE `property_features` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `feature_name` varchar(120) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_admins_email` (`email`),
  ADD KEY `idx_admins_active` (`is_active`);

--
-- Indexes for table `agents`
--
ALTER TABLE `agents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_agents_email` (`email`),
  ADD KEY `idx_agents_active` (`is_active`),
  ADD KEY `idx_agents_market` (`market`),
  ADD KEY `fk_agents_created_by` (`created_by`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_leads_status` (`status`),
  ADD KEY `idx_leads_email` (`email`),
  ADD KEY `idx_leads_property` (`property_id`),
  ADD KEY `fk_leads_assigned_admin` (`assigned_admin_id`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_properties_slug` (`slug`),
  ADD UNIQUE KEY `uq_properties_listing_code` (`listing_code`),
  ADD KEY `idx_properties_status` (`status`),
  ADD KEY `idx_properties_location` (`city`,`state`),
  ADD KEY `idx_properties_price` (`price`),
  ADD KEY `fk_properties_created_by` (`created_by`);

--
-- Indexes for table `property_images`
--
ALTER TABLE `property_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property_images_property` (`property_id`);

--
-- Indexes for table `property_features`
--
ALTER TABLE `property_features`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_property_features_property` (`property_id`),
  ADD KEY `idx_property_features_name` (`feature_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `agents`
--
ALTER TABLE `agents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `property_images`
--
ALTER TABLE `property_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `property_features`
--
ALTER TABLE `property_features`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `agents`
--
ALTER TABLE `agents`
  ADD CONSTRAINT `fk_agents_created_by` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `fk_leads_assigned_admin` FOREIGN KEY (`assigned_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_leads_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `fk_properties_created_by` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `property_images`
--
ALTER TABLE `property_images`
  ADD CONSTRAINT `fk_property_images_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_features`
--
ALTER TABLE `property_features`
  ADD CONSTRAINT `fk_property_features_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
