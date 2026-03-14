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
-- Table structure for table `mem_classifications`
--

DROP TABLE IF EXISTS `mem_classifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mem_classifications` (
  `id` int(11) DEFAULT NULL,
  `code` int(11) DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_at` text DEFAULT NULL,
  `updated_at` text DEFAULT NULL,
  `deleted_at` text DEFAULT NULL,
  `created_by` text DEFAULT NULL,
  `updated_by` text DEFAULT NULL,
  `deleted_by` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mem_classifications`
--

LOCK TABLES `mem_classifications` WRITE;
/*!40000 ALTER TABLE `mem_classifications` DISABLE KEYS */;
INSERT INTO `mem_classifications` VALUES (1,1,'Regular',1,'2019-11-26 15:52:48','2020-04-08 21:26:58','2020-04-08 21:26:58',NULL,NULL,NULL),(2,2,'Provisional',1,'2019-11-26 15:52:48','2020-04-08 21:24:49',NULL,NULL,NULL,NULL),(3,3,'Temporary',0,'2019-11-26 15:52:48','2025-03-14 19:40:59',NULL,NULL,'15',NULL),(4,4,'Honourary',1,'2019-11-26 15:52:48','2020-04-08 21:27:18','2020-04-08 21:27:18',NULL,NULL,NULL),(5,5,'Sports Based',0,'2019-11-26 15:52:48','2025-03-14 19:41:02',NULL,NULL,'15',NULL),(6,6,'Discounted',1,'2019-11-26 15:52:48','2020-04-08 21:27:23','2020-04-08 21:27:23',NULL,NULL,NULL),(7,7,'Family Discount',1,'2019-11-26 15:52:48','2020-04-08 21:27:28','2020-04-08 21:27:28',NULL,NULL,NULL),(8,8,'Shaheed Discount',1,'2019-11-26 15:52:48','2020-04-08 21:26:41','2020-04-08 21:26:41',NULL,NULL,NULL),(9,9,'Permanent',0,'2019-11-26 15:52:48','2025-03-14 19:41:05',NULL,NULL,'15',NULL),(10,10,'Dining Based',0,'2019-11-26 15:52:48','2025-03-14 19:41:20',NULL,NULL,'15',NULL),(11,11,'On Hold',1,'2019-11-26 15:52:48','2019-11-26 15:52:48',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `mem_classifications` ENABLE KEYS */;
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
