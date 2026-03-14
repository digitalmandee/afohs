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
-- Table structure for table `mem_statuses`
--

DROP TABLE IF EXISTS `mem_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mem_statuses` (
  `id` int(11) DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_at` text DEFAULT NULL,
  `updated_at` text DEFAULT NULL,
  `deleted_at` text DEFAULT NULL,
  `created_by` text DEFAULT NULL,
  `updated_by` text DEFAULT NULL,
  `deleted_by` text DEFAULT NULL,
  `color` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mem_statuses`
--

LOCK TABLES `mem_statuses` WRITE;
/*!40000 ALTER TABLE `mem_statuses` DISABLE KEYS */;
INSERT INTO `mem_statuses` VALUES (1,'Active',1,'2020-04-12 00:12:08','2021-01-08 17:22:20',NULL,NULL,'15',NULL,'#00ff04'),(2,'Expired',1,'2020-04-12 00:12:23','2021-01-08 17:23:48',NULL,NULL,'15',NULL,'#ff0000'),(3,'Suspended',1,'2020-04-12 00:12:38','2021-01-08 17:24:01',NULL,NULL,'15',NULL,'#ff0000'),(4,'Terminated',1,'2020-04-12 00:12:48','2021-01-08 17:24:13',NULL,NULL,'15',NULL,'#ff0000'),(5,'Absent',1,'2020-04-12 00:12:56','2020-04-12 00:12:56',NULL,NULL,NULL,NULL,'#ff0000'),(6,'Cancelled',1,'2020-04-16 21:54:20','2020-04-16 21:54:20',NULL,NULL,NULL,NULL,'#ff0000'),(7,'not assign',1,'2020-07-14 02:04:13','2020-07-14 02:04:13',NULL,'2','2',NULL,'#ff0000'),(10,'Manual Inactive',0,'2020-12-30 11:32:49','2025-03-14 19:28:48',NULL,'15','15',NULL,'#ff0000'),(11,'Not Qualified',1,'2020-12-30 11:33:00','2020-12-30 11:33:00',NULL,'15','15',NULL,'#ff0000'),(12,'Transferred',0,'2021-01-08 17:21:46','2025-03-14 19:28:36',NULL,'15','15',NULL,'#ff0000'),(13,'In Suspension Process',1,'2025-03-14 18:40:13','2025-03-14 18:40:13',NULL,'15','15',NULL,'#ff0000');
/*!40000 ALTER TABLE `mem_statuses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:46
