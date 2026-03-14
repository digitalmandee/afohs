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
-- Table structure for table `partners_affiliates`
--

DROP TABLE IF EXISTS `partners_affiliates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partners_affiliates` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL COMMENT 'Partner or Affiliate',
  `organization_name` varchar(255) NOT NULL,
  `facilitation_details` text DEFAULT NULL,
  `address` text NOT NULL,
  `telephone` varchar(255) NOT NULL,
  `mobile_a` varchar(255) NOT NULL,
  `mobile_b` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `focal_person_name` varchar(255) NOT NULL,
  `focal_mobile_a` varchar(255) NOT NULL,
  `focal_mobile_b` varchar(255) DEFAULT NULL,
  `focal_telephone` varchar(255) DEFAULT NULL,
  `focal_email` varchar(255) NOT NULL,
  `agreement_date` date NOT NULL,
  `agreement_end_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Active',
  `comments` text DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partners_affiliates_created_by_foreign` (`created_by`),
  KEY `partners_affiliates_updated_by_foreign` (`updated_by`),
  KEY `partners_affiliates_deleted_by_foreign` (`deleted_by`),
  CONSTRAINT `partners_affiliates_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `partners_affiliates_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `partners_affiliates_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners_affiliates`
--

LOCK TABLES `partners_affiliates` WRITE;
/*!40000 ALTER TABLE `partners_affiliates` DISABLE KEYS */;
INSERT INTO `partners_affiliates` VALUES (1,'Club','Mike Wheeler',NULL,'Hawkins','+971  22 333 4434','+971  22 333 4434',NULL,'mike@example.com',NULL,'Steve Harrington','03356787912',NULL,NULL,'Steve@example.com','2025-12-26',NULL,'Inactive',NULL,1,1,NULL,'2025-12-13 00:49:13','2026-03-03 21:17:44',NULL),(2,'Company','Will Bayes',NULL,'Hawkins','+971 44 333 6789','+971 44 333 6789',NULL,'will@example.com',NULL,'Steve Harrington','+971 44 333 6789',NULL,NULL,'steve@example.com','2025-12-16',NULL,'Active',NULL,1,1,NULL,'2025-12-13 00:51:44','2025-12-13 01:00:05','2025-12-13 01:00:05'),(3,'Other','Eleven',NULL,'Hawkins','+971 55 674 3478','+971 55 674 3478',NULL,'eleven@example.com',NULL,'Gym Hoppers','+971 55 674 3478',NULL,NULL,'hopper@example.com','2025-12-19',NULL,'Active','adwad',1,1,NULL,'2025-12-13 00:55:08','2025-12-18 04:13:57',NULL),(4,'Company','sadad','dawd','aawd','312323213','123213123','12221313123','adenqwidqn@gmail.com',NULL,'dawdwdwa','1231232131231',NULL,NULL,'awdawd@dawdlkwa.com','2025-12-20',NULL,'Active','dwadwad',1,1,NULL,'2025-12-18 04:16:57','2025-12-30 21:09:31',NULL),(5,'Company','Edward','wadwad','wadawdw','34234234','234234234234',NULL,'adefn@gmailiis.com',NULL,'aden pervaiz','123123213123',NULL,NULL,'aenper@gmal.com','2025-12-02','2025-12-28','Active','dwqdq',1,1,NULL,'2025-12-28 01:17:08','2026-03-03 21:17:23',NULL);
/*!40000 ALTER TABLE `partners_affiliates` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:34
