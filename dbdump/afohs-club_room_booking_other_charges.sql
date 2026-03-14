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
-- Table structure for table `room_booking_other_charges`
--

DROP TABLE IF EXISTS `room_booking_other_charges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_booking_other_charges` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `room_booking_id` bigint(20) unsigned NOT NULL,
  `type` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_complementary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `room_booking_other_charges_room_booking_id_foreign` (`room_booking_id`),
  CONSTRAINT `room_booking_other_charges_room_booking_id_foreign` FOREIGN KEY (`room_booking_id`) REFERENCES `room_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_booking_other_charges`
--

LOCK TABLES `room_booking_other_charges` WRITE;
/*!40000 ALTER TABLE `room_booking_other_charges` DISABLE KEYS */;
INSERT INTO `room_booking_other_charges` VALUES (44,20,'Services Charges',NULL,200.00,0,'2026-02-11 23:44:41','2026-02-11 23:44:41'),(48,6,'Services Charges',NULL,100.00,1,'2026-02-12 00:00:44','2026-02-12 00:00:44'),(49,5,'Services Charges',NULL,100.00,1,'2026-02-12 00:01:16','2026-02-12 00:01:16'),(50,5,'Dry Cleaning/Ironing',NULL,500.00,1,'2026-02-12 00:01:16','2026-02-12 00:01:16'),(51,8,'Services Charges',NULL,100.00,1,'2026-02-12 00:01:52','2026-02-12 00:01:52'),(52,10,'Dry Cleaning/Ironing',NULL,250.00,0,'2026-02-12 00:02:54','2026-02-12 00:02:54'),(53,10,'Services Charges',NULL,100.00,0,'2026-02-12 00:02:54','2026-02-12 00:02:54'),(54,11,'Services Charges',NULL,100.00,0,'2026-02-12 00:03:18','2026-02-12 00:03:18'),(55,12,'Services Charges',NULL,100.00,0,'2026-02-12 00:04:02','2026-02-12 00:04:02'),(56,16,'Food',NULL,228.00,0,'2026-02-12 00:04:31','2026-02-12 00:04:31'),(57,16,'Services Charges',NULL,200.00,0,'2026-02-12 00:04:31','2026-02-12 00:04:31'),(58,17,'Food',NULL,2215.00,0,'2026-02-12 00:04:55','2026-02-12 00:04:55'),(59,17,'Services Charges',NULL,200.00,0,'2026-02-12 00:04:55','2026-02-12 00:04:55'),(60,17,'Dry Cleaning/Ironing',NULL,1750.00,0,'2026-02-12 00:04:55','2026-02-12 00:04:55'),(61,13,'Services Charges',NULL,200.00,0,'2026-02-12 00:05:23','2026-02-12 00:05:23'),(62,13,'Dry Cleaning/Ironing',NULL,100.00,0,'2026-02-12 00:05:23','2026-02-12 00:05:23'),(63,18,'Services Charges',NULL,100.00,0,'2026-02-12 00:05:42','2026-02-12 00:05:42'),(64,18,'Services Charges',NULL,100.00,0,'2026-02-12 00:05:42','2026-02-12 00:05:42'),(65,15,'Breakage',NULL,500.00,0,'2026-02-12 00:06:08','2026-02-12 00:06:08'),(66,15,'Services Charges',NULL,100.00,0,'2026-02-12 00:06:08','2026-02-12 00:06:08'),(67,23,'Services Charges',NULL,100.00,0,'2026-02-12 00:07:12','2026-02-12 00:07:12'),(68,23,'Food',NULL,587.00,0,'2026-02-12 00:07:12','2026-02-12 00:07:12'),(69,26,'Services Charges',NULL,100.00,0,'2026-02-12 00:07:32','2026-02-12 00:07:32'),(70,26,'Dry Cleaning/Ironing',NULL,50.00,0,'2026-02-12 00:07:32','2026-02-12 00:07:32'),(71,26,'Food',NULL,132.00,0,'2026-02-12 00:07:32','2026-02-12 00:07:32'),(72,27,'Services Charges',NULL,100.00,0,'2026-02-12 22:15:52','2026-02-12 22:15:52'),(73,27,'Food',NULL,905.00,0,'2026-02-12 22:15:52','2026-02-12 22:15:52'),(74,28,'Services Charges',NULL,100.00,0,'2026-02-12 22:19:01','2026-02-12 22:19:01'),(75,28,'Dry Cleaning/Ironing',NULL,250.00,0,'2026-02-12 22:19:01','2026-02-12 22:19:01'),(76,35,'Food',NULL,5056.00,0,'2026-02-14 23:16:02','2026-02-14 23:16:02'),(77,35,'Services Charges',NULL,100.00,0,'2026-02-14 23:16:02','2026-02-14 23:16:02'),(78,35,'Mattress',NULL,1000.00,0,'2026-02-14 23:16:02','2026-02-14 23:16:02'),(79,29,'Services Charges',NULL,300.00,0,'2026-02-18 02:50:54','2026-02-18 02:50:54'),(80,29,'Dry Cleaning/Ironing',NULL,50.00,0,'2026-02-18 02:50:54','2026-02-18 02:50:54'),(81,29,'Food',NULL,386.00,0,'2026-02-18 02:50:54','2026-02-18 02:50:54'),(82,22,'Services Charges',NULL,600.00,0,'2026-02-18 02:55:22','2026-02-18 02:55:22'),(83,22,'Dry Cleaning/Ironing',NULL,1150.00,0,'2026-02-18 02:55:22','2026-02-18 02:55:22'),(84,22,'Food',NULL,1345.00,0,'2026-02-18 02:55:22','2026-02-18 02:55:22'),(85,25,'Services Charges',NULL,200.00,0,'2026-02-18 02:56:14','2026-02-18 02:56:14'),(86,24,'Services Charges',NULL,200.00,0,'2026-02-18 02:56:48','2026-02-18 02:56:48');
/*!40000 ALTER TABLE `room_booking_other_charges` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:49
