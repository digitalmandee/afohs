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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` char(36) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `profile_photo` longtext DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `parent_user_id` bigint(20) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `member_type_id` bigint(20) unsigned DEFAULT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_id_unique` (`user_id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_member_type_id_foreign` (`member_type_id`),
  KEY `users_tenant_id_index` (`tenant_id`),
  KEY `users_created_by_foreign` (`created_by`),
  KEY `users_updated_by_foreign` (`updated_by`),
  KEY `users_deleted_by_foreign` (`deleted_by`),
  CONSTRAINT `users_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_deleted_by_foreign` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_member_type_id_foreign` FOREIGN KEY (`member_type_id`) REFERENCES `member_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'Super Admin','admin@afohs.com',NULL,'$2y$12$rpOB7JLwwXmmt9hJo4f.W.6ks14U7SbRgfHIcNtsgz2oJ.ejZllSC',NULL,NULL,NULL,NULL,NULL,NULL,'SD76UpXee955bNOta7oSyPs9RZoiSzCIgjVL310xXLElKt294J08KZkY1ZG8','2025-10-28 22:04:59','2025-12-22 19:42:16',NULL,NULL,NULL,1,NULL,NULL),(2,NULL,'Test User','user@afohs.com',NULL,'$2y$12$r46gsHDAU8X/VNCwWaWWFeESiVd6qyv2L5Rm807KiaCL1NMkBtPk6',NULL,NULL,NULL,NULL,NULL,NULL,'YvGRwHAQNKYyJatRw2ufFSWZiVxpycUOVIga5e8phygNRXl7moNvvSEcb7DL','2025-10-28 22:04:59','2025-10-28 22:04:59',NULL,NULL,NULL,2,NULL,NULL),(3,NULL,'Muhammad Fahad','fahad@test.com',NULL,'$2y$12$/DBoB8JDHN.zZR/BkodRsuUXZn3.VecvUEnQSWwlf6OhQIL6qnGbC',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-29 18:50:55','2025-10-29 18:50:55',NULL,NULL,NULL,NULL,NULL,NULL),(4,NULL,'Tayyab','tayyab1@gmail.com',NULL,'$2y$12$MI7225i4WhNtAhfMG40XCOKDRC6b70yEekTk8ggmwsa8xFYX.e932','03117912345',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-07 01:12:05','2025-11-07 01:12:05',NULL,NULL,NULL,NULL,NULL,NULL),(5,NULL,'Fahad','fahadshd11@gmail.com',NULL,'$2y$12$evMQHk8qoAfoz5Uf5xvet.InJeOVaFeGEOzXnqecJbuCPRDvCYmt.',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-20 23:08:45','2025-11-20 23:08:45',NULL,NULL,NULL,NULL,NULL,NULL),(6,NULL,'Muhmmad Fahad','mfd84739@gmail.com',NULL,'$2y$12$ztOqsvW4KyqF10t/p8EcAOnxqr2LhRLHxQiI2X6vWmv3.YeYMO/Cy',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-15 00:26:24','2026-01-15 00:26:24',NULL,NULL,NULL,NULL,NULL,NULL),(7,NULL,'Akram','akram@afohs.com',NULL,'$2y$12$vebi4B4iL1HkrMYopzLR2.lrWVqLppWeBGIIMSMJkLxAMXHOCPiUy',NULL,NULL,NULL,NULL,NULL,NULL,'7V0Ii5wRmmJezjvQWEkyaRDwKU5IYWBJgr7HRwYGtbNk6EdA1e0YV6uQOx7k','2026-01-20 06:11:46','2026-01-20 06:11:46',NULL,NULL,NULL,NULL,NULL,NULL),(8,NULL,'Sawera','sawera@afohs.com',NULL,'$2y$12$XcVZXFXuih9sspoTarqfcOImtR19TLgNIdiI3z3HIN0MJ9afvDxU.',NULL,NULL,NULL,NULL,NULL,NULL,'aEZQ1X9sqxeWp0woe5qPZqDHMXja4Sol1o8iR8x8xAAzYmB6hkhmXVHGYkWz','2026-01-20 06:25:42','2026-01-20 06:25:42',NULL,NULL,NULL,NULL,NULL,NULL),(9,NULL,'Amir','amir@afohs.com',NULL,'$2y$12$AW2mmtZ4WK2zEHedrm3eGuJRXV/C6UY7yAiZCsi2bg1X2MeWtJ.l2',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-23 01:50:06','2026-01-23 01:50:06',NULL,NULL,NULL,NULL,NULL,NULL),(10,NULL,'Ch. Mukhter Ahmed',NULL,NULL,'$2y$12$wRqSub6wyQ7nYvvW9irUOO0gtgOdhqluW0yQMExsrpnFT1JiE7OJG',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-02-20 03:41:47','2026-02-20 03:41:47',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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
