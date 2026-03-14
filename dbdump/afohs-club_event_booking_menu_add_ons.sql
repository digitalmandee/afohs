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
-- Table structure for table `event_booking_menu_add_ons`
--

DROP TABLE IF EXISTS `event_booking_menu_add_ons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_booking_menu_add_ons` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_booking_id` bigint(20) unsigned NOT NULL,
  `type` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_complementary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_booking_menu_add_ons_event_booking_id_foreign` (`event_booking_id`),
  CONSTRAINT `event_booking_menu_add_ons_event_booking_id_foreign` FOREIGN KEY (`event_booking_id`) REFERENCES `event_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_booking_menu_add_ons`
--

LOCK TABLES `event_booking_menu_add_ons` WRITE;
/*!40000 ALTER TABLE `event_booking_menu_add_ons` DISABLE KEYS */;
INSERT INTO `event_booking_menu_add_ons` VALUES (1,1,'Kashmiri Tea','',60.00,0,'2025-10-27 20:25:34','2025-10-27 20:25:34'),(2,2,'Benazir Kulfia','',150.00,0,'2025-10-27 20:32:39','2025-10-27 20:32:39'),(8,4,'Nestle Juice','',100.00,0,'2025-10-28 19:46:17','2025-10-28 19:46:17'),(9,4,'Kashmiri Tea','',60.00,0,'2025-10-28 19:46:17','2025-10-28 19:46:17'),(20,3,'Fresh Juice','',180.00,0,'2025-12-19 01:50:13','2025-12-19 01:50:13'),(23,6,'Nestle Juice','',100.00,1,'2025-12-22 03:45:23','2025-12-22 03:45:23'),(24,6,'Gajar Halwa','',50.00,0,'2025-12-22 03:45:23','2025-12-22 03:45:23'),(25,5,'Nestle Juice','add on demo',100.00,1,'2025-12-22 03:58:14','2025-12-22 03:58:14'),(26,5,'Benazir Kulfia','add on charged',150.00,0,'2025-12-22 03:58:14','2025-12-22 03:58:14'),(29,10,'Beef Seekh Kabab','',200.00,0,'2026-01-10 02:43:02','2026-01-10 02:43:02'),(30,9,'Gajar Halwa','',150.00,1,'2026-01-10 03:29:36','2026-01-10 03:29:36'),(31,9,'Petha Halwa','',150.00,1,'2026-01-10 03:29:36','2026-01-10 03:29:36'),(32,11,'Green Tea','',30.00,0,'2026-01-11 02:47:20','2026-01-11 02:47:20'),(34,12,'Benazir Kulfia','',150.00,0,'2026-01-23 01:42:36','2026-01-23 01:42:36'),(35,12,'Aloo Bukhara Chatni','',50.00,0,'2026-01-23 01:42:36','2026-01-23 01:42:36'),(37,13,'Batter Fry Prawn','',600.00,0,'2026-01-25 00:34:31','2026-01-25 00:34:31'),(40,14,'Kashmiri Tea','',300.00,0,'2026-03-04 23:04:11','2026-03-04 23:04:11'),(41,14,'Gajar Halwa','',150.00,0,'2026-03-04 23:04:11','2026-03-04 23:04:11'),(42,14,'Petha Halwa','',150.00,0,'2026-03-04 23:04:11','2026-03-04 23:04:11'),(43,14,'Nestle Juice','',100.00,0,'2026-03-04 23:04:11','2026-03-04 23:04:11'),(44,15,'Gajar Halwa','',150.00,0,'2026-03-09 19:59:53','2026-03-09 19:59:53'),(45,15,'Chicken Cream Soup','',200.00,0,'2026-03-09 19:59:53','2026-03-09 19:59:53'),(46,15,'Fresh Juice','',180.00,0,'2026-03-09 19:59:53','2026-03-09 19:59:53'),(47,15,'Nestle Juice','',100.00,1,'2026-03-09 19:59:53','2026-03-09 19:59:53'),(53,17,'Kashmiri Tea','',300.00,0,'2026-03-12 21:19:29','2026-03-12 21:19:29'),(54,17,'Gajar Halwa','',150.00,0,'2026-03-12 21:19:29','2026-03-12 21:19:29'),(55,17,'Chicken Boti','',175.00,0,'2026-03-12 21:19:29','2026-03-12 21:19:29');
/*!40000 ALTER TABLE `event_booking_menu_add_ons` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:34
