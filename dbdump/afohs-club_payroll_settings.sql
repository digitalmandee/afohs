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
-- Table structure for table `payroll_settings`
--

DROP TABLE IF EXISTS `payroll_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL DEFAULT 'Afohs Club',
  `pay_frequency` enum('monthly','bi-weekly','weekly') NOT NULL DEFAULT 'monthly',
  `currency` varchar(10) NOT NULL DEFAULT 'PKR',
  `working_days_per_month` int(11) NOT NULL DEFAULT 26,
  `working_hours_per_day` decimal(4,2) NOT NULL DEFAULT 8.00,
  `overtime_rate_multiplier` decimal(4,2) NOT NULL DEFAULT 1.50,
  `late_deduction_per_minute` decimal(8,2) NOT NULL DEFAULT 0.00,
  `absent_deduction_type` enum('full_day','hourly','fixed_amount') NOT NULL DEFAULT 'full_day',
  `absent_deduction_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_allowed_absents` int(11) NOT NULL DEFAULT 3,
  `grace_period_minutes` int(11) NOT NULL DEFAULT 15,
  `tax_slabs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tax_slabs`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_settings`
--

LOCK TABLES `payroll_settings` WRITE;
/*!40000 ALTER TABLE `payroll_settings` DISABLE KEYS */;
INSERT INTO `payroll_settings` VALUES (1,'Afohs Club','monthly','PKR',26,8.00,1.00,5.00,'fixed_amount',100.00,2,15,'[{\"name\":\"1\",\"frequency\":\"yearly\",\"min_salary\":0,\"max_salary\":600000,\"tax_rate\":0,\"fixed_amount\":0},{\"name\":\"2\",\"frequency\":\"yearly\",\"min_salary\":600000,\"max_salary\":1200000,\"tax_rate\":1,\"fixed_amount\":0},{\"name\":\"3\",\"frequency\":\"yearly\",\"min_salary\":1200000,\"max_salary\":1800000,\"tax_rate\":11,\"fixed_amount\":0}]','2025-11-13 01:39:32','2025-12-20 01:32:50');
/*!40000 ALTER TABLE `payroll_settings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:37
