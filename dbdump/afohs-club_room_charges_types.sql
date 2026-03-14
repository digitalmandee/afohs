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
-- Table structure for table `room_charges_types`
--

DROP TABLE IF EXISTS `room_charges_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_charges_types` (
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
-- Dumping data for table `room_charges_types`
--

LOCK TABLES `room_charges_types` WRITE;
/*!40000 ALTER TABLE `room_charges_types` DISABLE KEYS */;
INSERT INTO `room_charges_types` VALUES (1,'Mini Bar',2000,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:23:08','2026-01-16 06:23:08'),(2,'Sports',0,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:23:13',NULL),(3,'Breakage',0,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:23:16',NULL),(4,'Mattress',500,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:23:19',NULL),(5,'Misc Charges',0,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:23:24',NULL),(6,'Smoking',400,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-12-22 03:31:44','2025-12-22 03:31:44'),(7,'Services Charges',100,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-11-09 01:55:05',NULL),(8,'Dry Cleaning/Ironing',0,'active',NULL,NULL,NULL,'2025-08-07 18:16:24','2026-01-16 06:23:29',NULL),(9,'Food',0,'active',NULL,NULL,NULL,'2025-11-09 03:50:16','2025-11-09 03:50:16',NULL),(10,'water',2000,'active',NULL,NULL,NULL,'2025-11-25 00:01:30','2025-11-25 00:01:41','2025-11-25 00:01:41'),(11,'AirPort Pick & Drop',0,'active',NULL,NULL,NULL,'2025-12-19 02:15:05','2026-01-16 06:24:09',NULL),(12,'Smoking Charges',0,'active',1,NULL,NULL,'2026-02-10 04:29:45','2026-02-10 04:29:45',NULL);
/*!40000 ALTER TABLE `room_charges_types` ENABLE KEYS */;
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
