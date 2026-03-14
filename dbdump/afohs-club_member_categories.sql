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
-- Table structure for table `member_categories`
--

DROP TABLE IF EXISTS `member_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `fee` bigint(20) NOT NULL DEFAULT 0,
  `subscription_fee` bigint(20) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `category_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`category_types`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `discount_type` enum('percentage','amount') NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_categories`
--

LOCK TABLES `member_categories` WRITE;
/*!40000 ALTER TABLE `member_categories` DISABLE KEYS */;
INSERT INTO `member_categories` VALUES (1,'SO','Armed Forces (Serving)',20000,500,'active','[\"primary\"]','2025-08-07 18:16:36','2025-12-22 04:31:59','percentage',0.00,NULL),(2,'CS','Civil Services',300000,2500,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(3,'FR','Falcon Resident',200000,2000,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(4,'AE/D','Associate D',350000,3500,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(5,'OP','Overseas Pakistani',300000,3000,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(6,'AS','Askari-V',200000,2000,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(7,'AE','Associate',400000,3500,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(8,'FR/D','Falcon Resident D',150000,2000,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(9,'AS/D','Askari-V D',150000,2000,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(10,'SC','Special Category',10000,5000,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(11,'HY','Honorary Member',0,0,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(12,'AF','Armed Forces (Retd.)',10000,500,'active','[\"primary\"]','2025-08-07 18:16:36','2025-08-07 18:16:36','percentage',0.00,NULL),(13,'CE','Corporate Executive',0,0,'active','[\"primary\",\"corporate\"]','2025-08-07 18:16:36','2025-12-31 21:03:27','percentage',0.00,NULL),(15,'FE','Free_Eaters',200000,10000,'active','[\"primary\"]','2025-12-30 23:08:43','2025-12-30 23:12:35','percentage',0.00,'2025-12-30 23:12:35');
/*!40000 ALTER TABLE `member_categories` ENABLE KEYS */;
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
