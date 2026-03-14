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
-- Table structure for table `employee_loans`
--

DROP TABLE IF EXISTS `employee_loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_loans` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `loan_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','disbursed','completed') NOT NULL DEFAULT 'pending',
  `installments` int(11) NOT NULL DEFAULT 1 COMMENT 'Number of monthly installments',
  `monthly_deduction` decimal(12,2) DEFAULT NULL,
  `total_paid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `remaining_amount` decimal(12,2) DEFAULT NULL,
  `next_deduction_date` date DEFAULT NULL,
  `installments_paid` int(11) NOT NULL DEFAULT 0,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `disbursed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_loans_employee_id_foreign` (`employee_id`),
  KEY `employee_loans_approved_by_foreign` (`approved_by`),
  CONSTRAINT `employee_loans_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_loans_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_loans`
--

LOCK TABLES `employee_loans` WRITE;
/*!40000 ALTER TABLE `employee_loans` DISABLE KEYS */;
INSERT INTO `employee_loans` VALUES (1,758,90000.00,'2026-01-29','vvkjn','approved',12,7500.00,0.00,90000.00,NULL,0,1,'2026-01-30 00:54:51',NULL,NULL,'2026-01-30 00:54:41','2026-01-30 00:54:51'),(2,246,100000.00,'2026-01-29','yviuboi','pending',24,4166.67,0.00,100000.00,NULL,0,NULL,NULL,NULL,NULL,'2026-01-30 01:00:32','2026-01-30 01:00:32'),(3,759,300000.00,'2026-02-02','medical emergency','approved',12,25000.00,0.00,300000.00,NULL,0,1,'2026-02-03 04:59:46',NULL,NULL,'2026-02-03 04:59:39','2026-02-03 04:59:46');
/*!40000 ALTER TABLE `employee_loans` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:47
