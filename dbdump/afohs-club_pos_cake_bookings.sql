-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: afohs-club
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `pos_cake_bookings`
--

DROP TABLE IF EXISTS `pos_cake_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pos_cake_bookings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `booking_number` int(11) DEFAULT NULL,
  `branch_id` varchar(255) DEFAULT NULL,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `corporate_id` bigint(20) unsigned DEFAULT NULL,
  `customer_id` bigint(20) unsigned DEFAULT NULL,
  `employee_id` bigint(20) unsigned DEFAULT NULL,
  `customer_type` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(255) DEFAULT NULL,
  `family_member_id` bigint(20) unsigned DEFAULT NULL,
  `booking_date` date NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `pickup_time` varchar(255) DEFAULT NULL,
  `cake_type_id` bigint(20) unsigned DEFAULT NULL,
  `weight` decimal(8,2) DEFAULT NULL,
  `flavor` varchar(255) DEFAULT NULL,
  `topping` varchar(255) DEFAULT NULL,
  `filling` varchar(255) DEFAULT NULL,
  `icing` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `special_instructions` text DEFAULT NULL,
  `special_display` text DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `has_attachment` tinyint(1) NOT NULL DEFAULT 0,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `advance_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `balance_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_mode` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `receiver_name` varchar(255) DEFAULT NULL,
  `receiver_address` varchar(255) DEFAULT NULL,
  `delivery_note` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `order_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pos_cake_bookings_booking_number_unique` (`booking_number`),
  KEY `pos_cake_bookings_cake_type_id_foreign` (`cake_type_id`),
  KEY `pos_cake_bookings_created_by_foreign` (`created_by`),
  KEY `pos_cake_bookings_tenant_id_index` (`tenant_id`),
  CONSTRAINT `pos_cake_bookings_cake_type_id_foreign` FOREIGN KEY (`cake_type_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pos_cake_bookings_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_cake_bookings`
--

LOCK TABLES `pos_cake_bookings` WRITE;
/*!40000 ALTER TABLE `pos_cake_bookings` DISABLE KEYS */;
INSERT INTO `pos_cake_bookings` VALUES (1,1,NULL,3802,NULL,NULL,NULL,'0','Rana Muhammad Nouman','03335647799',NULL,'2026-02-23','2026-02-14',NULL,2809,2.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,6000.00,0.00,0.00,3000.00,3000.00,'cash','pending',NULL,NULL,NULL,6,NULL,'2026-02-24 23:59:41','2026-02-24 23:59:41',NULL,6),(2,2,NULL,6531,NULL,NULL,NULL,'0','Rear Admiral Azhar Hayat','03323666780',NULL,'2026-02-24','2026-03-10',NULL,2809,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,3000.00,0.00,0.00,1000.00,2000.00,'cash','pending',NULL,NULL,NULL,6,NULL,'2026-02-25 00:00:43','2026-02-25 00:00:43',NULL,6);
/*!40000 ALTER TABLE `pos_cake_bookings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:47
