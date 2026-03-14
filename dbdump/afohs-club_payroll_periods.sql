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
-- Table structure for table `payroll_periods`
--

DROP TABLE IF EXISTS `payroll_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_periods` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `period_name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `pay_date` date DEFAULT NULL,
  `status` enum('draft','active','processing','completed','paid') DEFAULT 'draft',
  `description` text DEFAULT NULL,
  `total_employees` int(11) NOT NULL DEFAULT 0,
  `total_gross_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_deductions` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_net_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `processed_by` bigint(20) unsigned DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payroll_periods_created_by_foreign` (`created_by`),
  KEY `payroll_periods_processed_by_foreign` (`processed_by`),
  KEY `payroll_periods_start_date_end_date_index` (`start_date`,`end_date`),
  KEY `payroll_periods_status_index` (`status`),
  CONSTRAINT `payroll_periods_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payroll_periods_processed_by_foreign` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_periods`
--

LOCK TABLES `payroll_periods` WRITE;
/*!40000 ALTER TABLE `payroll_periods` DISABLE KEYS */;
INSERT INTO `payroll_periods` VALUES (2,'November 2025','2025-11-14','2025-11-29','2025-11-29','completed',NULL,10,807222.00,134957.24,672264.76,1,1,'2025-12-19 05:33:20','2025-11-20 23:20:18','2025-12-19 05:33:20'),(3,'January 2026 Payroll','2026-01-01','2026-01-31',NULL,'draft',NULL,0,0.00,0.00,0.00,1,NULL,NULL,'2026-01-20 19:27:32','2026-01-20 19:27:32'),(10,'January 2025 Payroll','2025-01-01','2025-01-31',NULL,'draft',NULL,0,0.00,0.00,0.00,1,NULL,NULL,'2026-02-04 00:54:03','2026-02-04 00:54:03'),(11,'feb','2026-02-01','2026-02-28','2026-02-28','completed',NULL,1,90000.00,2448.00,87552.00,1,1,'2026-02-20 01:45:17','2026-02-20 01:41:51','2026-02-20 01:45:17'),(12,'March 2026 Payroll','2026-03-01','2026-03-31',NULL,'draft',NULL,0,0.00,0.00,0.00,1,NULL,NULL,'2026-03-09 20:38:47','2026-03-09 20:38:47'),(13,'april','2026-04-01','2026-04-30','2026-05-01','completed',NULL,1,50000.00,0.00,50000.00,1,1,'2026-03-09 22:04:21','2026-03-09 21:03:49','2026-03-09 22:04:21');
/*!40000 ALTER TABLE `payroll_periods` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:41
