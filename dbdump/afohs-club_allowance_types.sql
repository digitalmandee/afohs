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
-- Table structure for table `allowance_types`
--

DROP TABLE IF EXISTS `allowance_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allowance_types` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('fixed','percentage','conditional') NOT NULL DEFAULT 'fixed',
  `is_taxable` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_global` tinyint(1) NOT NULL DEFAULT 0,
  `default_amount` decimal(10,2) DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allowance_types`
--

LOCK TABLES `allowance_types` WRITE;
/*!40000 ALTER TABLE `allowance_types` DISABLE KEYS */;
INSERT INTO `allowance_types` VALUES (1,'House Rent Allowance (HRA)','percentage',1,1,0,NULL,NULL,'Housing allowance for employees','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(2,'Transport Allowance','fixed',1,1,0,NULL,NULL,'Transportation allowance for daily commute','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(3,'Medical Allowance','fixed',0,1,0,NULL,NULL,'Medical and healthcare allowance','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(4,'Food Allowance','fixed',1,1,0,NULL,NULL,'Daily meal allowance','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(5,'Performance Bonus','fixed',1,1,0,NULL,NULL,'Monthly performance-based bonus','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(6,'Communication Allowance','fixed',1,1,0,NULL,NULL,'Mobile and internet allowance','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(7,'demo additions','conditional',0,1,0,NULL,NULL,NULL,'2025-12-19 05:30:49','2025-12-19 05:30:49',NULL),(8,'Nouman','fixed',1,1,0,NULL,NULL,NULL,'2025-12-20 02:14:15','2025-12-20 02:14:15',NULL);
/*!40000 ALTER TABLE `allowance_types` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:36
