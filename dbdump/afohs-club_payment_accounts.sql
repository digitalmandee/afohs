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
-- Table structure for table `payment_accounts`
--

DROP TABLE IF EXISTS `payment_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_accounts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_accounts_tenant_id_foreign` (`tenant_id`),
  KEY `payment_accounts_created_by_foreign` (`created_by`),
  KEY `payment_accounts_updated_by_foreign` (`updated_by`),
  KEY `payment_accounts_deleted_by_foreign` (`deleted_by`),
  CONSTRAINT `payment_accounts_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payment_accounts_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payment_accounts_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payment_accounts_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_accounts`
--

LOCK TABLES `payment_accounts` WRITE;
/*!40000 ALTER TABLE `payment_accounts` DISABLE KEYS */;
INSERT INTO `payment_accounts` VALUES (1,NULL,'Cash in hand','cash','active',1,1,NULL,NULL,'2026-02-20 00:05:11','2026-03-03 19:40:30'),(2,NULL,'UBL','debit_card','active',1,1,NULL,NULL,'2026-03-03 19:36:03','2026-03-03 19:36:22'),(3,NULL,'Bank Alfalah','debit_card','active',1,NULL,NULL,NULL,'2026-03-03 19:37:08','2026-03-03 19:37:08'),(4,NULL,'Meezan Bank','credit_card','active',1,NULL,NULL,NULL,'2026-03-03 19:37:23','2026-03-03 19:37:23'),(5,NULL,'MCB islamic','credit_card','active',1,NULL,NULL,NULL,'2026-03-03 19:40:20','2026-03-03 19:40:20'),(6,NULL,'HBL','credit_card','active',1,NULL,NULL,NULL,'2026-03-03 19:41:43','2026-03-03 19:41:43');
/*!40000 ALTER TABLE `payment_accounts` ENABLE KEYS */;
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
