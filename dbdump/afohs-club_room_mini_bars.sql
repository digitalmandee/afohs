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
-- Table structure for table `room_mini_bars`
--

DROP TABLE IF EXISTS `room_mini_bars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_mini_bars` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_mini_bars`
--

LOCK TABLES `room_mini_bars` WRITE;
/*!40000 ALTER TABLE `room_mini_bars` DISABLE KEYS */;
INSERT INTO `room_mini_bars` VALUES (1,'Large Water',119,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:22:27',NULL),(2,'Small Water',69,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-11-09 01:55:14',NULL),(3,'Large Juice',520,'active',NULL,1,NULL,'2025-08-07 18:16:24','2026-02-15 02:03:14',NULL),(4,'Small Juice',79,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-11-09 01:55:22',NULL),(5,'Dairy Milk',150,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(6,'Lays',80,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-11-09 01:55:29',NULL),(7,'Nimko',70,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-11-09 01:55:33',NULL),(8,'Biscuit',60,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-11-09 01:55:38',NULL),(9,'Can',119,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-11-09 01:55:48',NULL),(10,'chips',0,'active',NULL,NULL,NULL,'2025-11-24 23:55:25','2025-11-24 23:55:38','2025-11-24 23:55:38'),(11,'comb',50,'active',NULL,NULL,NULL,'2025-12-19 02:09:11','2025-12-22 03:32:11','2025-12-22 03:32:11'),(12,'mattress',500,'active',NULL,NULL,NULL,'2026-01-09 01:12:46','2026-01-16 06:22:20','2026-01-16 06:22:20');
/*!40000 ALTER TABLE `room_mini_bars` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:37
