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
-- Table structure for table `event_menu_categories`
--

DROP TABLE IF EXISTS `event_menu_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_menu_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_menu_categories`
--

LOCK TABLES `event_menu_categories` WRITE;
/*!40000 ALTER TABLE `event_menu_categories` DISABLE KEYS */;
INSERT INTO `event_menu_categories` VALUES (1,'Assorted Naan','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(2,'Chicken Qorma','active',NULL,1,NULL,'2025-08-07 18:16:24','2026-01-24 02:25:45',NULL),(3,'Chicken Biryani','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(4,'Salad 3 Types','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(5,'Mutton Biryani (Chilman)','active',NULL,1,NULL,'2025-08-07 18:16:24','2026-01-24 02:33:30',NULL),(6,'Desert One Type','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(7,'Mineral Water','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(8,'Soft Drinks','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(9,'Mutton Qorma','active',NULL,1,NULL,'2025-08-07 18:16:24','2026-01-24 02:33:55',NULL),(10,'Chicken Kabab or Chicken Boti','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(11,'Chicken Achari Karahi or Murgh Chana','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(12,'Puri or Pathore','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(13,'Aloo Bhujia','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(14,'Halwa','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(15,'Hot & Sour or Chicken Corn Soup','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(16,'Fried Fish','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(17,'Chicken Seekh Kebab','active',NULL,1,NULL,'2025-08-07 18:16:24','2026-01-24 02:33:06',NULL),(18,'Chicken Boti','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(19,'Chicken Manchurian or Sweet & Sour','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(20,'Chicken Fried or Egg Fried Rice','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(21,'Chicken Karahi','active',NULL,NULL,NULL,'2025-08-07 18:16:24','2025-08-07 18:16:24',NULL),(22,'narutos','active',1,1,NULL,'2025-12-19 01:23:50','2026-01-24 02:22:28','2026-01-24 02:22:28'),(23,'Chinese','active',1,NULL,NULL,'2026-01-03 00:04:21','2026-01-03 00:04:39','2026-01-03 00:04:39'),(24,'a new cat','active',1,NULL,NULL,'2026-01-11 03:08:53','2026-01-24 02:22:25','2026-01-24 02:22:25'),(25,'Chicken Pulao','active',1,NULL,NULL,'2026-01-24 02:28:11','2026-01-24 02:28:11',NULL),(26,'Mint Raita & Pickles','active',1,1,NULL,'2026-01-24 02:28:38','2026-01-24 02:34:52',NULL),(27,'Chicken Sindhi Biryani','active',1,1,NULL,'2026-01-24 02:28:55','2026-01-24 02:36:21',NULL),(28,'Seekh Kebab Biryani','active',1,NULL,NULL,'2026-01-24 02:30:46','2026-01-24 02:30:46',NULL),(29,'Chicken Qorma Badami','active',1,NULL,NULL,'2026-01-24 02:31:00','2026-01-24 02:31:00',NULL),(30,'Mutton Qorma Badami','active',1,1,NULL,'2026-01-24 02:31:36','2026-01-24 02:35:58',NULL),(31,'Chicken Shahi Qorma','active',1,NULL,NULL,'2026-01-24 02:31:52','2026-01-24 02:31:52',NULL),(32,'Steam Roast Chicken Biryani','active',1,NULL,NULL,'2026-01-24 02:32:13','2026-01-24 02:32:13',NULL),(33,'Mutton Kunna','active',1,NULL,NULL,'2026-01-24 02:36:57','2026-01-24 02:36:57',NULL),(34,'Mutton Biryani / Pulao','active',1,NULL,NULL,'2026-01-24 03:21:19','2026-01-24 03:21:19',NULL);
/*!40000 ALTER TABLE `event_menu_categories` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:49
