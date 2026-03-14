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
-- Table structure for table `event_booking_other_charges`
--

DROP TABLE IF EXISTS `event_booking_other_charges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_booking_other_charges` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_booking_id` bigint(20) unsigned NOT NULL,
  `type` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_complementary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_booking_other_charges_event_booking_id_foreign` (`event_booking_id`),
  CONSTRAINT `event_booking_other_charges_event_booking_id_foreign` FOREIGN KEY (`event_booking_id`) REFERENCES `event_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_booking_other_charges`
--

LOCK TABLES `event_booking_other_charges` WRITE;
/*!40000 ALTER TABLE `event_booking_other_charges` DISABLE KEYS */;
INSERT INTO `event_booking_other_charges` VALUES (1,1,'Decoration','',20000.00,0,'2025-10-27 20:25:34','2025-10-27 20:25:34'),(2,2,'Decoration','',20000.00,0,'2025-10-27 20:32:39','2025-10-27 20:32:39'),(7,4,'Decoration','',20000.00,0,'2025-10-28 19:46:17','2025-10-28 19:46:17'),(8,4,'Fireworks','',30000.00,0,'2025-10-28 19:46:17','2025-10-28 19:46:17'),(15,3,'Decoration','',20000.00,0,'2025-12-19 01:50:13','2025-12-19 01:50:13'),(16,5,'abc demo','firewrk etc',5000.00,0,'2025-12-22 03:58:14','2025-12-22 03:58:14'),(17,5,'Decoration','dem',20000.00,1,'2025-12-22 03:58:14','2025-12-22 03:58:14'),(18,5,'Decoration','',20000.00,0,'2025-12-22 03:58:14','2025-12-22 03:58:14'),(19,8,'Decoration','',20000.00,0,'2025-12-22 04:08:27','2025-12-22 04:08:27'),(20,8,'Fireworks','',30000.00,0,'2025-12-22 04:08:27','2025-12-22 04:08:27'),(23,10,'Decoration','',20000.00,1,'2026-01-10 02:43:02','2026-01-10 02:43:02'),(24,9,'Fireworks','',30000.00,1,'2026-01-10 03:29:36','2026-01-10 03:29:36'),(25,9,'Decoration','',10000.00,1,'2026-01-10 03:29:36','2026-01-10 03:29:36'),(26,11,'Fireworks','',30000.00,1,'2026-01-11 02:47:20','2026-01-11 02:47:20'),(28,12,'Fireworks','',30000.00,0,'2026-01-23 01:42:36','2026-01-23 01:42:36'),(29,12,'Decoration','',20000.00,0,'2026-01-23 01:42:36','2026-01-23 01:42:36'),(31,13,'Fireworks','',30000.00,0,'2026-01-25 00:34:31','2026-01-25 00:34:31'),(33,14,'Flower Work','',10000.00,0,'2026-03-04 23:04:11','2026-03-04 23:04:11'),(34,15,'Decoration','',15000.00,0,'2026-03-09 19:59:53','2026-03-09 19:59:53'),(36,16,'Lights','',10000.00,0,'2026-03-09 20:58:08','2026-03-09 20:58:08'),(37,16,'DJ / Sound System','',5000.00,0,'2026-03-09 20:58:08','2026-03-09 20:58:08'),(44,17,'Decoration','',10000.00,1,'2026-03-12 21:19:29','2026-03-12 21:19:29'),(45,17,'DJ / Sound System','',10000.00,0,'2026-03-12 21:19:29','2026-03-12 21:19:29');
/*!40000 ALTER TABLE `event_booking_other_charges` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:44
