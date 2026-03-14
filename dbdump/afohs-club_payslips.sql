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
-- Table structure for table `payslips`
--

DROP TABLE IF EXISTS `payslips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslips` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `payroll_period_id` bigint(20) unsigned NOT NULL,
  `employee_id` bigint(20) unsigned NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `employee_id_number` varchar(50) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `department` varchar(255) NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL,
  `total_allowances` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_deductions` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gross_salary` decimal(12,2) NOT NULL,
  `net_salary` decimal(12,2) NOT NULL,
  `total_working_days` int(11) NOT NULL,
  `days_present` int(11) NOT NULL,
  `days_absent` int(11) NOT NULL,
  `days_late` int(11) NOT NULL,
  `overtime_hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `absent_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `late_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `overtime_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','approved','paid') NOT NULL DEFAULT 'draft',
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payslips_payroll_period_id_employee_id_unique` (`payroll_period_id`,`employee_id`),
  KEY `payslips_employee_id_foreign` (`employee_id`),
  KEY `payslips_approved_by_foreign` (`approved_by`),
  KEY `payslips_payroll_period_id_employee_id_index` (`payroll_period_id`,`employee_id`),
  KEY `payslips_status_index` (`status`),
  CONSTRAINT `payslips_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payslips_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payslips_payroll_period_id_foreign` FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=312 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payslips`
--

LOCK TABLES `payslips` WRITE;
/*!40000 ALTER TABLE `payslips` DISABLE KEYS */;
INSERT INTO `payslips` VALUES (17,2,13,'Fahad','1223213213','Manager','Catering',50000.00,0.00,0.00,50000.00,50000.00,14,0,1,0,0.00,0.00,0.00,0.00,'draft',1,'2025-11-20 23:22:12',NULL,'2025-11-20 23:21:31','2026-02-26 22:50:01'),(18,2,14,'Ayesha','1','host tv','Finance',100000.00,0.00,15384.62,100000.00,84615.38,14,0,6,0,0.00,15384.62,0.00,0.00,'approved',1,'2025-12-22 05:22:12',NULL,'2025-12-19 05:33:20','2025-12-22 05:22:12'),(297,11,760,'Test Entry (B)','500024735154038','Anchor','PRODUCTION / PRODUCER\'S',90000.00,0.00,2448.00,90000.00,87552.00,24,0,16,0,0.00,1400.00,0.00,0.00,'approved',1,'2026-02-26 22:48:45',NULL,'2026-02-20 01:45:17','2026-02-26 22:48:45'),(309,13,701,'Abdul Kabeer','685','AC Technician','MAINTENANCE / GENERAL STAFF',20000.00,0.00,10200.00,20000.00,9800.00,26,0,4,0,0.00,200.00,0.00,0.00,'draft',NULL,NULL,NULL,'2026-03-09 21:04:26','2026-03-09 21:04:26'),(310,13,759,'Test Entry (A)','500024735154037','Senior Software Developer','Social Media / Software Development',150000.00,0.00,5500.00,150000.00,144500.00,26,4,0,0,0.00,0.00,0.00,0.00,'draft',NULL,NULL,NULL,'2026-03-09 21:04:26','2026-03-09 21:04:26'),(311,13,762,'TEST ENTRY (D)','500024735154040','Administrator','GENERAL MANAGEMENT',50000.00,0.00,0.00,50000.00,50000.00,26,0,0,0,0.00,0.00,0.00,0.00,'draft',NULL,NULL,NULL,'2026-03-09 22:04:21','2026-03-09 22:04:21');
/*!40000 ALTER TABLE `payslips` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:50
