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
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `customer_id` bigint(20) unsigned DEFAULT NULL,
  `employee_id` bigint(20) unsigned DEFAULT NULL,
  `table_id` bigint(20) unsigned DEFAULT NULL,
  `nature_of_function` varchar(255) DEFAULT NULL,
  `theme_of_function` varchar(255) DEFAULT NULL,
  `special_request` text DEFAULT NULL,
  `person_count` int(11) NOT NULL DEFAULT 0,
  `down_payment` decimal(10,2) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `location_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reservations_table_id_foreign` (`table_id`),
  KEY `reservations_customer_id_foreign` (`customer_id`),
  KEY `reservations_member_id_foreign` (`member_id`),
  KEY `reservations_employee_id_foreign` (`employee_id`),
  KEY `reservations_tenant_id_index` (`tenant_id`),
  KEY `reservations_location_id_index` (`location_id`),
  CONSTRAINT `reservations_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservations_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservations_member_id_foreign` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reservations_table_id_foreign` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,222,NULL,NULL,19,'get together','rosey','flowers rose',1,5000.00,'2026-02-12','11:30:00','12:00:00','completed',NULL,'2026-02-12 01:14:25','2026-02-12 04:03:52',6,NULL,NULL,NULL,NULL),(2,NULL,1244,NULL,22,'vkjbl','jvkj','jvfkj b',6,10000.00,'2026-02-11','11:30:00','12:00:00','pending',NULL,'2026-02-12 04:16:32','2026-02-12 04:16:32',6,NULL,NULL,NULL,NULL),(3,NULL,1132,NULL,17,NULL,NULL,NULL,4,2000.00,'2026-02-14','10:00:00','10:30:00','cancelled',NULL,'2026-02-12 04:18:12','2026-02-12 04:25:56',6,6,NULL,NULL,NULL);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:44
