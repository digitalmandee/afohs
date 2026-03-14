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
-- Table structure for table `employee_advances`
--

DROP TABLE IF EXISTS `employee_advances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_advances` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `advance_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','paid','deducted') NOT NULL DEFAULT 'pending',
  `deduction_start_date` date DEFAULT NULL,
  `deduction_months` int(11) NOT NULL DEFAULT 1 COMMENT 'Number of months to deduct',
  `monthly_deduction` decimal(12,2) DEFAULT NULL,
  `remaining_amount` decimal(12,2) DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_advances_employee_id_foreign` (`employee_id`),
  KEY `employee_advances_approved_by_foreign` (`approved_by`),
  CONSTRAINT `employee_advances_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_advances_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_advances`
--

LOCK TABLES `employee_advances` WRITE;
/*!40000 ALTER TABLE `employee_advances` DISABLE KEYS */;
INSERT INTO `employee_advances` VALUES (1,701,10000.00,'2026-01-28','bkblin','paid','2026-01-01',1,10000.00,10000.00,1,'2026-01-30 00:59:43',NULL,'2026-01-30 00:58:30','2026-01-30 00:59:58'),(2,760,50000.00,'2026-02-02','electricity bill','approved','2026-03-01',4,12500.00,50000.00,1,'2026-02-03 05:01:51',NULL,'2026-02-03 05:01:27','2026-02-03 05:01:51');
/*!40000 ALTER TABLE `employee_advances` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:35
