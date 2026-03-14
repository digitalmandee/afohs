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
-- Table structure for table `member_classifications`
--

DROP TABLE IF EXISTS `member_classifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_classifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` bigint(20) DEFAULT NULL,
  `desc` varchar(255) NOT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_by` bigint(20) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_classifications`
--

LOCK TABLES `member_classifications` WRITE;
/*!40000 ALTER TABLE `member_classifications` DISABLE KEYS */;
INSERT INTO `member_classifications` VALUES (1,1,'Regular','Active',NULL,NULL,NULL,NULL,'2019-11-26 18:52:48','2020-04-08 23:26:58'),(2,2,'Provisional','Active',NULL,NULL,NULL,NULL,'2019-11-26 18:52:48','2020-04-08 23:24:49'),(3,3,'Temporary','Inactive',NULL,NULL,15,NULL,'2019-11-26 18:52:48','2025-03-14 21:40:59'),(4,4,'Honourary','Active',NULL,NULL,NULL,'2020-04-08 23:27:18','2019-11-26 18:52:48','2020-04-08 23:27:18'),(5,5,'Sports Based','Inactive',NULL,NULL,15,NULL,'2019-11-26 18:52:48','2025-03-14 21:41:02'),(6,6,'Discounted','Active',NULL,NULL,NULL,'2020-04-08 23:27:23','2019-11-26 18:52:48','2020-04-08 23:27:23'),(7,7,'Family Discount','Active',NULL,NULL,NULL,'2020-04-08 23:27:28','2019-11-26 18:52:48','2020-04-08 23:27:28'),(8,8,'Shaheed Discount','Active',NULL,NULL,NULL,'2020-04-08 23:26:41','2019-11-26 18:52:48','2020-04-08 23:26:41'),(9,9,'Permanent','Inactive',NULL,NULL,15,NULL,'2019-11-26 18:52:48','2025-03-14 21:41:05'),(10,10,'Dining Based','Inactive',NULL,NULL,15,NULL,'2019-11-26 18:52:48','2025-03-14 21:41:20'),(11,11,'On Hold','Active',NULL,NULL,NULL,NULL,'2019-11-26 18:52:48','2019-11-26 18:52:48');
/*!40000 ALTER TABLE `member_classifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:40
