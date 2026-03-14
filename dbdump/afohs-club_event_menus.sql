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
-- Table structure for table `event_menus`
--

DROP TABLE IF EXISTS `event_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_menus` (
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_menus`
--

LOCK TABLES `event_menus` WRITE;
/*!40000 ALTER TABLE `event_menus` DISABLE KEYS */;
INSERT INTO `event_menus` VALUES (1,'Menu 3',2299,'active',1,1,NULL,'2025-10-27 20:22:20','2026-01-24 03:22:43',NULL),(2,'Menu 2',2199,'active',1,1,NULL,'2025-10-28 00:47:28','2026-01-24 03:18:18',NULL),(3,'Menu 1',1999,'active',1,1,NULL,'2026-01-10 03:20:55','2026-01-24 02:40:13',NULL),(4,'Menu 4',2499,'active',1,NULL,NULL,'2026-01-24 04:08:27','2026-01-24 04:08:27',NULL),(5,'Menu 5',2799,'active',1,NULL,NULL,'2026-01-24 04:09:42','2026-01-24 04:09:42',NULL),(6,'Menu 6',3199,'active',1,NULL,NULL,'2026-01-24 04:10:47','2026-01-24 04:10:47',NULL),(7,'Menu 7',3299,'active',1,NULL,NULL,'2026-01-24 04:11:43','2026-01-24 04:11:43',NULL),(8,'Menu 8',3299,'active',1,NULL,NULL,'2026-01-24 04:12:48','2026-01-24 04:12:48',NULL),(9,'Menu 9',3699,'active',1,NULL,NULL,'2026-01-24 04:13:37','2026-01-24 04:13:37',NULL);
/*!40000 ALTER TABLE `event_menus` ENABLE KEYS */;
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
