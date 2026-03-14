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
-- Table structure for table `employee_salary_structures`
--

DROP TABLE IF EXISTS `employee_salary_structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_salary_structures` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_salary_structures_created_by_foreign` (`created_by`),
  KEY `employee_salary_structures_updated_by_foreign` (`updated_by`),
  KEY `employee_salary_structures_employee_id_is_active_index` (`employee_id`,`is_active`),
  KEY `employee_salary_structures_effective_from_effective_to_index` (`effective_from`,`effective_to`),
  CONSTRAINT `employee_salary_structures_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_salary_structures_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_salary_structures_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_salary_structures`
--

LOCK TABLES `employee_salary_structures` WRITE;
/*!40000 ALTER TABLE `employee_salary_structures` DISABLE KEYS */;
INSERT INTO `employee_salary_structures` VALUES (9,13,50000.00,'2026-02-27',NULL,1,1,1,'2025-11-20 23:08:45','2026-02-03 02:21:41',NULL),(10,14,100000.00,'2025-11-24',NULL,1,1,NULL,'2025-11-25 05:57:07','2025-11-25 05:57:07',NULL),(11,15,40000.00,'2025-12-02',NULL,1,1,NULL,'2025-12-03 02:46:12','2025-12-03 02:46:12',NULL),(12,16,60000.00,'2025-12-05',NULL,1,1,NULL,'2025-12-05 21:07:58','2025-12-05 21:07:58',NULL),(13,17,70000.00,'2025-12-05',NULL,1,1,NULL,'2025-12-05 21:08:53','2025-12-05 21:08:53',NULL),(14,18,10000.00,'2025-12-18',NULL,1,1,NULL,'2025-12-19 02:46:31','2025-12-19 02:46:31',NULL),(15,19,300000.00,'2025-12-18',NULL,1,1,NULL,'2025-12-19 04:54:09','2025-12-19 04:54:09',NULL),(16,20,50000.00,'2025-12-18',NULL,1,1,NULL,'2025-12-19 05:21:42','2025-12-19 05:21:42',NULL),(17,21,987797.00,'2025-12-18',NULL,1,1,NULL,'2025-12-19 05:28:44','2025-12-19 05:28:44',NULL),(18,22,100000.00,'2025-10-29',NULL,1,1,1,'2025-12-20 01:18:49','2026-02-03 02:13:28',NULL),(19,757,60000.00,'2026-01-14',NULL,1,1,NULL,'2026-01-15 00:25:44','2026-01-15 00:25:44',NULL),(20,758,50000.00,'2026-01-29',NULL,1,1,NULL,'2026-01-30 00:26:44','2026-01-30 00:26:44',NULL),(21,701,20000.00,'2026-01-29',NULL,1,1,NULL,'2026-01-30 00:58:04','2026-01-30 00:58:04',NULL),(22,759,150000.00,'2026-02-02',NULL,1,1,NULL,'2026-02-03 04:31:04','2026-02-03 04:31:04',NULL),(23,760,90000.00,'2026-02-02',NULL,1,1,NULL,'2026-02-03 04:45:43','2026-02-03 04:45:43',NULL),(24,761,200000.00,'2026-02-02',NULL,1,1,NULL,'2026-02-03 04:51:47','2026-02-03 04:51:47',NULL),(25,762,50000.00,'2026-03-09',NULL,1,1,NULL,'2026-03-09 21:55:20','2026-03-09 21:55:20',NULL);
/*!40000 ALTER TABLE `employee_salary_structures` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:42
