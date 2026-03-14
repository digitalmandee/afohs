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
-- Table structure for table `member_profession_infos`
--

DROP TABLE IF EXISTS `member_profession_infos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_profession_infos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `business_developer_id` bigint(20) unsigned DEFAULT NULL,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `corporate_member_id` bigint(20) unsigned DEFAULT NULL,
  `nominee_name` varchar(255) DEFAULT NULL,
  `nominee_relation` varchar(255) DEFAULT NULL,
  `nominee_contact` varchar(255) DEFAULT NULL,
  `nominee_id` bigint(20) unsigned DEFAULT NULL,
  `occupation` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `experience` varchar(255) DEFAULT NULL,
  `applied_before` tinyint(1) NOT NULL DEFAULT 0,
  `applied_date` varchar(255) DEFAULT NULL,
  `application_status` varchar(255) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `referral_member_name` varchar(255) DEFAULT NULL,
  `referral_membership_no` varchar(255) DEFAULT NULL,
  `referral_relation` varchar(255) DEFAULT NULL,
  `referral_contact` varchar(255) DEFAULT NULL,
  `referral_member_id` bigint(20) unsigned DEFAULT NULL,
  `referral_is_corporate` tinyint(1) NOT NULL DEFAULT 0,
  `foreign_affiliation` tinyint(1) NOT NULL DEFAULT 0,
  `foreign_org_name` varchar(255) DEFAULT NULL,
  `foreign_affiliation_period` varchar(255) DEFAULT NULL,
  `other_club_membership` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`other_club_membership`)),
  `club_termination_details` text DEFAULT NULL,
  `political_affiliation` text DEFAULT NULL,
  `relatives_armed_forces` text DEFAULT NULL,
  `relatives_civil_services` text DEFAULT NULL,
  `stayed_abroad` tinyint(1) NOT NULL DEFAULT 0,
  `stayed_abroad_details` text DEFAULT NULL,
  `criminal_conviction` tinyint(1) NOT NULL DEFAULT 0,
  `criminal_details` text DEFAULT NULL,
  `created_by` bigint(20) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `member_profession_infos_member_id_foreign` (`member_id`),
  KEY `member_profession_infos_business_developer_id_foreign` (`business_developer_id`),
  KEY `member_profession_infos_corporate_member_id_foreign` (`corporate_member_id`),
  CONSTRAINT `member_profession_infos_business_developer_id_foreign` FOREIGN KEY (`business_developer_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `member_profession_infos_corporate_member_id_foreign` FOREIGN KEY (`corporate_member_id`) REFERENCES `corporate_members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `member_profession_infos_member_id_foreign` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_profession_infos`
--

LOCK TABLES `member_profession_infos` WRITE;
/*!40000 ALTER TABLE `member_profession_infos` DISABLE KEYS */;
INSERT INTO `member_profession_infos` VALUES (1,NULL,51955,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2025-12-09 02:53:04','2025-12-09 02:53:04'),(2,17,51957,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'Approved',NULL,NULL,NULL,NULL,NULL,NULL,0,1,NULL,NULL,'[{\"name\":null,\"membership_no\":null},{\"name\":null,\"membership_no\":null},{\"name\":null,\"membership_no\":null}]',NULL,NULL,NULL,NULL,0,NULL,1,NULL,NULL,NULL,NULL,NULL,'2025-12-16 03:16:38','2025-12-16 03:16:38'),(3,16,51961,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'Rejected',NULL,'Haris Rehman','FR 227',NULL,'03134880008',NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2025-12-16 22:21:20','2025-12-16 22:21:20'),(4,NULL,51963,NULL,'Asad','Brother','067567675676',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2025-12-19 00:46:07','2025-12-19 00:46:07'),(5,NULL,51965,NULL,'Not Mentioned',NULL,NULL,NULL,'Doctor',NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2025-12-20 03:03:25','2025-12-20 03:03:25'),(6,NULL,51975,NULL,'Not Mentioned',NULL,NULL,NULL,'Govt Officer Retd.',NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-01-02 23:53:47','2026-01-02 23:53:47'),(7,NULL,42,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-01-03 00:34:14','2026-01-03 00:55:02'),(8,NULL,51977,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]','asd','asd',NULL,NULL,1,'asdasd',0,NULL,NULL,NULL,NULL,NULL,'2026-01-03 04:57:01','2026-01-03 04:57:01'),(9,NULL,43,NULL,'asd',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,'asd','asd','[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-01-03 04:59:07','2026-01-03 04:59:07'),(10,NULL,51979,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-01-05 18:51:11','2026-01-05 18:51:11'),(11,NULL,51980,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-01-06 19:55:45','2026-01-06 19:55:45'),(12,NULL,51985,NULL,NULL,NULL,NULL,NULL,'cewf','dawdw','dwad','wdw',0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-01-10 00:09:52','2026-01-10 00:09:52'),(13,NULL,52297,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-07 03:11:52','2026-02-07 03:11:52'),(14,NULL,52298,NULL,NULL,'Husband','03002653465',NULL,'Senior Registrar Cardiology at Mayo Hospital BPS-18','Doctor',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-25 03:12:35','2026-02-25 03:12:35'),(15,NULL,51974,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,'[]',NULL,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,'2026-02-26 22:10:02','2026-02-26 22:10:02');
/*!40000 ALTER TABLE `member_profession_infos` ENABLE KEYS */;
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
