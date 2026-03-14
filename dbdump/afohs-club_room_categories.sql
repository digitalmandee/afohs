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
-- Table structure for table `room_categories`
--

DROP TABLE IF EXISTS `room_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_categories`
--

LOCK TABLES `room_categories` WRITE;
/*!40000 ALTER TABLE `room_categories` DISABLE KEYS */;
INSERT INTO `room_categories` VALUES (1,'Armed Forces Member','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:29:53',NULL),(2,'Armed Forces Non Member','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(3,'Non Member','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(4,'Foreigners','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(5,'Armed Forces Guests','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:30:00','2026-01-16 06:30:00'),(6,'Members or Family Members','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(7,'Member\'s Guest','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(8,'Mehal Room','inactive',NULL,NULL,NULL,'2025-12-19 02:15:31','2026-01-16 06:29:41','2026-01-16 06:29:41');
/*!40000 ALTER TABLE `room_categories` ENABLE KEYS */;
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
