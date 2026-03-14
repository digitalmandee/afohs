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
-- Table structure for table `room_booking_requests`
--

DROP TABLE IF EXISTS `room_booking_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_booking_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `booking_date` date NOT NULL,
  `check_in_date` date DEFAULT NULL,
  `check_out_date` date DEFAULT NULL,
  `booking_type` varchar(255) NOT NULL,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `customer_id` bigint(20) unsigned DEFAULT NULL,
  `corporate_member_id` int(11) DEFAULT NULL,
  `family_member_id` bigint(20) unsigned DEFAULT NULL,
  `room_id` bigint(20) unsigned DEFAULT NULL,
  `booking_category` bigint(20) unsigned DEFAULT NULL,
  `persons` int(11) DEFAULT NULL,
  `per_day_charge` decimal(10,2) DEFAULT NULL,
  `security_deposit` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `room_type_id` bigint(20) unsigned DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `room_booking_requests_customer_id_foreign` (`customer_id`),
  KEY `room_booking_requests_family_member_id_foreign` (`family_member_id`),
  KEY `room_booking_requests_room_id_foreign` (`room_id`),
  KEY `room_booking_requests_booking_category_foreign` (`booking_category`),
  KEY `room_booking_requests_member_id_foreign` (`member_id`),
  KEY `room_booking_requests_room_type_id_foreign` (`room_type_id`),
  CONSTRAINT `room_booking_requests_booking_category_foreign` FOREIGN KEY (`booking_category`) REFERENCES `room_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `room_booking_requests_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `room_booking_requests_family_member_id_foreign` FOREIGN KEY (`family_member_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `room_booking_requests_member_id_foreign` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `room_booking_requests_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `room_booking_requests_room_type_id_foreign` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_booking_requests`
--

LOCK TABLES `room_booking_requests` WRITE;
/*!40000 ALTER TABLE `room_booking_requests` DISABLE KEYS */;
INSERT INTO `room_booking_requests` VALUES (5,'2026-01-08','2026-01-08','2026-01-14','0',665,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-01-09 01:06:37','2026-02-10 04:32:57',1,1,NULL,6,NULL),(6,'2026-01-27','2026-01-29','2026-01-30','0',3057,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'approved','2026-01-28 05:38:16','2026-02-10 18:48:05',1,1,NULL,2,NULL),(7,'2026-02-10','2026-02-15','2026-02-16','guest-1',NULL,2542,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-11 02:07:44','2026-02-11 02:07:44',1,NULL,NULL,2,NULL),(8,'2026-02-12','2026-02-15','2026-02-17','0',5046,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-12 22:20:51','2026-02-12 22:20:51',1,NULL,NULL,2,NULL),(9,'2026-02-12','2026-02-17','2026-02-18','0',6463,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-12 22:21:38','2026-02-12 22:21:38',1,NULL,NULL,2,NULL),(10,'2026-02-12','2026-02-13','2026-02-14','0',6041,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-12 23:21:23','2026-02-12 23:21:23',1,NULL,NULL,3,'2xRooms'),(11,'2026-02-12','2026-02-13','2026-02-15','0',6039,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-12 23:21:54','2026-02-12 23:21:54',1,NULL,NULL,2,NULL),(12,'2026-02-12','2026-02-12','2026-02-13','0',7044,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-12 23:23:34','2026-02-12 23:23:34',1,NULL,NULL,2,NULL),(13,'2026-02-12','2026-03-24','2026-03-27','0',7309,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-13 05:19:42','2026-02-13 05:19:42',1,NULL,NULL,2,NULL),(14,'2026-02-13','2026-03-26','2026-03-29','0',2688,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-13 23:22:35','2026-02-13 23:22:35',1,NULL,NULL,2,'3xRooms'),(15,'2026-02-13','2026-02-14','2026-02-15','0',3472,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending','2026-02-14 03:41:32','2026-02-14 03:41:32',1,NULL,NULL,2,NULL);
/*!40000 ALTER TABLE `room_booking_requests` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:42
