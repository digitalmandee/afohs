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
-- Table structure for table `payslip_deductions`
--

DROP TABLE IF EXISTS `payslip_deductions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslip_deductions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `payslip_id` bigint(20) unsigned NOT NULL,
  `order_id` bigint(20) unsigned DEFAULT NULL,
  `deduction_type_id` bigint(20) unsigned NOT NULL,
  `deduction_name` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `employee_loan_id` bigint(20) unsigned DEFAULT NULL,
  `employee_advance_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payslip_deductions_order_id_unique` (`order_id`),
  KEY `payslip_deductions_payslip_id_index` (`payslip_id`),
  KEY `payslip_deductions_deduction_type_id_index` (`deduction_type_id`),
  KEY `payslip_deductions_order_id_index` (`order_id`),
  KEY `payslip_deductions_employee_loan_id_foreign` (`employee_loan_id`),
  KEY `payslip_deductions_employee_advance_id_foreign` (`employee_advance_id`),
  CONSTRAINT `payslip_deductions_deduction_type_id_foreign` FOREIGN KEY (`deduction_type_id`) REFERENCES `deduction_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payslip_deductions_employee_advance_id_foreign` FOREIGN KEY (`employee_advance_id`) REFERENCES `employee_advances` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payslip_deductions_employee_loan_id_foreign` FOREIGN KEY (`employee_loan_id`) REFERENCES `employee_loans` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payslip_deductions_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payslip_deductions_payslip_id_foreign` FOREIGN KEY (`payslip_id`) REFERENCES `payslips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payslip_deductions`
--

LOCK TABLES `payslip_deductions` WRITE;
/*!40000 ALTER TABLE `payslip_deductions` DISABLE KEYS */;
INSERT INTO `payslip_deductions` VALUES (123,297,NULL,1,'Income Tax',400.00,'2026-02-20 01:45:17','2026-02-20 01:45:17',NULL,NULL),(124,297,NULL,12,'Food Bill / CTS',648.00,'2026-02-20 01:45:17','2026-02-20 01:45:17',NULL,NULL),(130,309,NULL,11,'Advance Repayment',10000.00,'2026-03-09 21:04:26','2026-03-09 21:04:26',NULL,1),(131,310,NULL,1,'Income Tax',5500.00,'2026-03-09 21:04:26','2026-03-09 21:04:26',NULL,NULL);
/*!40000 ALTER TABLE `payslip_deductions` ENABLE KEYS */;
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
