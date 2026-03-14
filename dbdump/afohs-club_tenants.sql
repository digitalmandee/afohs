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
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `branch_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `printer_ip` varchar(255) DEFAULT NULL,
  `printer_port` int(11) NOT NULL DEFAULT 9100,
  `expeditor_printer_ip` varchar(255) DEFAULT NULL,
  `expeditor_printer_port` int(11) NOT NULL DEFAULT 9100,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_by` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tenants_branch_id_foreign` (`branch_id`),
  KEY `tenants_created_by_foreign` (`created_by`),
  KEY `tenants_updated_by_foreign` (`updated_by`),
  KEY `tenants_deleted_by_foreign` (`deleted_by`),
  CONSTRAINT `tenants_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tenants_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tenants_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tenants_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'Coffee Shop','active',NULL,9100,NULL,9100,'2020-04-18 03:00:43','2020-11-19 20:08:40',NULL,1,NULL,NULL,NULL,NULL),(1,'Rooms','active',NULL,9100,NULL,9100,'2020-04-18 03:00:53','2020-11-19 20:08:46',NULL,2,NULL,NULL,NULL,NULL),(1,'Chinese Restaurant','active',NULL,9100,NULL,9100,'2020-04-18 03:01:14','2020-11-19 20:08:58',NULL,3,NULL,NULL,NULL,NULL),(1,'Green Lounge','active',NULL,9100,NULL,9100,'2020-04-18 03:01:27','2020-11-19 20:09:03',NULL,4,NULL,NULL,NULL,NULL),(1,'Out Side Lawn','active',NULL,9100,NULL,9100,'2020-09-19 20:05:27','2020-11-19 20:09:09',NULL,5,NULL,NULL,NULL,NULL),(1,'Delivery / Take Away','active',NULL,9100,NULL,9100,'2020-09-19 22:45:27','2020-11-19 20:09:14',NULL,6,NULL,NULL,NULL,NULL),(1,'BBQ Lawn','active',NULL,9100,NULL,9100,'2020-10-03 06:42:07','2020-11-19 20:09:19',NULL,7,NULL,NULL,NULL,NULL),(1,'Lobby','active',NULL,9100,NULL,9100,'2020-10-03 06:42:15','2020-11-19 20:09:24',NULL,8,NULL,NULL,NULL,NULL),(1,'SOFRA','active',NULL,9100,NULL,9100,'2020-10-04 02:43:27','2020-11-19 20:09:28',NULL,9,NULL,NULL,NULL,NULL),(1,'CHAYE DHABA','active',NULL,9100,NULL,9100,'2020-10-26 01:00:21','2020-11-19 20:09:34',NULL,10,NULL,NULL,NULL,NULL),(1,'MAIN STORE','active',NULL,9100,NULL,9100,'2020-11-19 20:29:37','2020-11-19 20:29:37',NULL,11,NULL,NULL,NULL,NULL),(1,'BBQ ROOF TOP','active',NULL,9100,NULL,9100,'2020-12-13 05:28:55','2020-12-15 01:05:19',NULL,12,NULL,NULL,NULL,NULL),(1,'SALOON','active',NULL,9100,NULL,9100,'2021-03-13 02:52:06','2021-03-13 02:52:06',NULL,13,NULL,NULL,NULL,NULL),(1,'Masala Restaurant','active',NULL,9100,NULL,9100,'2022-07-09 07:43:23','2022-07-09 07:43:23',NULL,14,NULL,NULL,NULL,NULL),(1,'DISCOVER LOUNGE CAFE','active',NULL,9100,NULL,9100,'2025-09-26 02:20:07','2025-09-26 02:47:37',NULL,15,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
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
