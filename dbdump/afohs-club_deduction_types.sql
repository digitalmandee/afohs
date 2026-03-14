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
-- Table structure for table `deduction_types`
--

DROP TABLE IF EXISTS `deduction_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deduction_types` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('fixed','percentage','conditional') NOT NULL DEFAULT 'fixed',
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `calculation_base` enum('basic_salary','gross_salary') NOT NULL DEFAULT 'basic_salary',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_global` tinyint(1) NOT NULL DEFAULT 0,
  `default_amount` decimal(10,2) DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deduction_types`
--

LOCK TABLES `deduction_types` WRITE;
/*!40000 ALTER TABLE `deduction_types` DISABLE KEYS */;
INSERT INTO `deduction_types` VALUES (1,'Income Tax','percentage',1,'gross_salary',1,0,NULL,NULL,'Government income tax deduction','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(2,'Provident Fund (PF)','percentage',1,'basic_salary',1,0,NULL,NULL,'Employee provident fund contribution','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(3,'Social Security (EOBI)','percentage',1,'basic_salary',1,0,NULL,NULL,'Employees Old-Age Benefits Institution','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(4,'Professional Tax','fixed',1,'basic_salary',1,0,NULL,NULL,'Professional tax deduction','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(5,'Health Insurance','fixed',0,'basic_salary',1,0,NULL,NULL,'Employee health insurance premium','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(6,'Loan Deduction','fixed',0,'basic_salary',1,0,NULL,NULL,'Employee loan installment deduction','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(7,'Advance Salary','fixed',0,'basic_salary',1,0,NULL,NULL,'Advance salary deduction','2025-11-13 01:39:32','2025-11-13 01:39:32',NULL),(8,'demo deduction','conditional',0,'basic_salary',1,0,NULL,NULL,NULL,'2025-12-19 05:31:12','2025-12-19 05:31:12',NULL),(11,'Advance Repayment','fixed',0,'basic_salary',1,0,NULL,NULL,'Automatic deduction for advance repayment','2026-02-04 00:10:18','2026-02-04 00:10:18',NULL),(12,'Food Bill / CTS','fixed',1,'gross_salary',1,0,NULL,NULL,'Auto-calculated Food Bill (Excess over Allowance)','2026-02-20 01:45:17','2026-02-20 01:45:17',NULL);
/*!40000 ALTER TABLE `deduction_types` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:33
