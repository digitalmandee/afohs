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
-- Table structure for table `employee_transfers`
--

DROP TABLE IF EXISTS `employee_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_transfers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint(20) unsigned NOT NULL,
  `from_department_id` bigint(20) unsigned DEFAULT NULL,
  `from_subdepartment_id` bigint(20) unsigned DEFAULT NULL,
  `from_designation_id` bigint(20) unsigned DEFAULT NULL,
  `from_branch_id` bigint(20) unsigned DEFAULT NULL,
  `from_shift_id` bigint(20) unsigned DEFAULT NULL,
  `to_department_id` bigint(20) unsigned DEFAULT NULL,
  `to_subdepartment_id` bigint(20) unsigned DEFAULT NULL,
  `to_designation_id` bigint(20) unsigned DEFAULT NULL,
  `to_branch_id` bigint(20) unsigned DEFAULT NULL,
  `to_shift_id` bigint(20) unsigned DEFAULT NULL,
  `transfer_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `transferred_by` bigint(20) unsigned DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_transfers_employee_id_foreign` (`employee_id`),
  KEY `employee_transfers_from_department_id_foreign` (`from_department_id`),
  KEY `employee_transfers_from_subdepartment_id_foreign` (`from_subdepartment_id`),
  KEY `employee_transfers_from_designation_id_foreign` (`from_designation_id`),
  KEY `employee_transfers_from_branch_id_foreign` (`from_branch_id`),
  KEY `employee_transfers_from_shift_id_foreign` (`from_shift_id`),
  KEY `employee_transfers_to_department_id_foreign` (`to_department_id`),
  KEY `employee_transfers_to_subdepartment_id_foreign` (`to_subdepartment_id`),
  KEY `employee_transfers_to_designation_id_foreign` (`to_designation_id`),
  KEY `employee_transfers_to_branch_id_foreign` (`to_branch_id`),
  KEY `employee_transfers_to_shift_id_foreign` (`to_shift_id`),
  KEY `employee_transfers_transferred_by_foreign` (`transferred_by`),
  KEY `employee_transfers_created_by_foreign` (`created_by`),
  KEY `employee_transfers_updated_by_foreign` (`updated_by`),
  KEY `employee_transfers_deleted_by_foreign` (`deleted_by`),
  CONSTRAINT `employee_transfers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_transfers_from_branch_id_foreign` FOREIGN KEY (`from_branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_from_department_id_foreign` FOREIGN KEY (`from_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_from_designation_id_foreign` FOREIGN KEY (`from_designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_from_shift_id_foreign` FOREIGN KEY (`from_shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_from_subdepartment_id_foreign` FOREIGN KEY (`from_subdepartment_id`) REFERENCES `subdepartments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_to_branch_id_foreign` FOREIGN KEY (`to_branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_to_department_id_foreign` FOREIGN KEY (`to_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_to_designation_id_foreign` FOREIGN KEY (`to_designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_to_shift_id_foreign` FOREIGN KEY (`to_shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_to_subdepartment_id_foreign` FOREIGN KEY (`to_subdepartment_id`) REFERENCES `subdepartments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_transferred_by_foreign` FOREIGN KEY (`transferred_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `employee_transfers_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_transfers`
--

LOCK TABLES `employee_transfers` WRITE;
/*!40000 ALTER TABLE `employee_transfers` DISABLE KEYS */;
INSERT INTO `employee_transfers` VALUES (1,20,2,2,5,NULL,NULL,9,44,31,2,1,'2026-01-29',NULL,1,1,NULL,NULL,NULL,'2026-01-30 00:51:15','2026-01-30 00:51:15');
/*!40000 ALTER TABLE `employee_transfers` ENABLE KEYS */;
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
