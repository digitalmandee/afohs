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
-- Table structure for table `event_charge_types`
--

DROP TABLE IF EXISTS `event_charge_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_charge_types` (
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_charge_types`
--

LOCK TABLES `event_charge_types` WRITE;
/*!40000 ALTER TABLE `event_charge_types` DISABLE KEYS */;
INSERT INTO `event_charge_types` VALUES (1,'Decoration',20000,'active',1,NULL,NULL,'2025-10-27 20:24:06','2025-10-27 20:24:06',NULL),(2,'Fireworks',30000,'active',1,NULL,NULL,'2025-10-28 19:37:24','2025-10-28 19:37:24',NULL),(3,'Flower Work',30000,'active',1,1,NULL,'2025-12-19 01:25:24','2026-01-24 04:16:38',NULL),(4,'bands',500,'active',1,NULL,NULL,'2025-12-22 04:16:14','2026-01-24 04:16:44','2026-01-24 04:16:44'),(5,'demoz',9000,'active',1,NULL,NULL,'2026-01-11 03:09:49','2026-01-24 04:16:46','2026-01-24 04:16:46'),(6,'sadasd',222,'active',1,NULL,NULL,'2026-01-23 01:44:41','2026-01-24 04:16:52','2026-01-24 04:16:52'),(7,'DJ / Sound System',5000,'active',1,NULL,NULL,'2026-01-24 04:17:28','2026-01-24 04:17:28',NULL),(8,'Lights',10000,'active',1,NULL,NULL,'2026-01-24 04:17:51','2026-01-24 04:17:51',NULL);
/*!40000 ALTER TABLE `event_charge_types` ENABLE KEYS */;
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
