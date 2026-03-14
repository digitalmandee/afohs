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
-- Table structure for table `mem_categories`
--

DROP TABLE IF EXISTS `mem_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mem_categories` (
  `id` int(11) DEFAULT NULL,
  `code` int(11) DEFAULT NULL,
  `unique_code` text DEFAULT NULL,
  `desc` text DEFAULT NULL,
  `fee` int(11) DEFAULT NULL,
  `monthly_sub_fee` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `created_at` text DEFAULT NULL,
  `updated_at` text DEFAULT NULL,
  `deleted_at` text DEFAULT NULL,
  `created_by` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `deleted_by` text DEFAULT NULL,
  `account` int(11) DEFAULT NULL,
  `name` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mem_categories`
--

LOCK TABLES `mem_categories` WRITE;
/*!40000 ALTER TABLE `mem_categories` DISABLE KEYS */;
INSERT INTO `mem_categories` VALUES (1,1,'SO','Armed Forces (Serving)',10000,500,1,'2019-11-26 15:52:48','2021-03-24 15:12:53',NULL,NULL,9,NULL,495100,'Armed Forces (Serving)-SO'),(2,2,'CS','Civil Services',300000,2500,1,'2019-11-26 15:52:48','2021-03-22 15:44:38',NULL,NULL,2,NULL,495200,'Civil Services-CS'),(3,3,'FR','Falcon Resident',200000,2000,1,'2019-11-26 15:52:48','2021-03-22 15:44:46',NULL,NULL,2,NULL,495300,'Falcon Resident-FR'),(4,4,'AE/D','Associate D',350000,3500,1,'2019-11-26 15:52:48','2021-03-22 15:44:53',NULL,NULL,2,NULL,495400,'Associate D-AE/D'),(5,5,'OP','Overseas Pakistani',300000,3000,1,'2019-11-26 15:52:48','2022-08-20 20:43:44',NULL,NULL,3,NULL,495500,'Overseas Pakistani-OP'),(6,6,'AS','Askari-V',200000,2000,1,'2019-11-26 15:52:48','2021-03-22 15:45:27',NULL,NULL,2,NULL,495600,'Askari-V-AS'),(7,7,'AE','Associate',400000,3500,1,'2019-11-26 15:52:48','2022-08-20 20:44:16',NULL,NULL,3,NULL,495700,'Associate-AE'),(8,8,'FR/D','Falcon Resident D',150000,2000,1,'2019-11-26 15:52:48','2021-03-22 15:46:27',NULL,NULL,2,NULL,495800,'Falcon Resident D-FR/D'),(9,9,'AS/D','Askari-V D',150000,2000,1,'2019-11-26 15:52:48','2021-03-22 15:46:35',NULL,NULL,2,NULL,495900,'Askari-V D-AS/D'),(10,10,'SC','Special Category',10000,5000,1,'2019-11-26 15:52:48','2021-03-22 15:46:51',NULL,NULL,2,NULL,496000,'Special Category-SC'),(11,11,'HY','Honorary Member',0,0,1,'2019-11-26 15:52:48','2021-09-09 19:49:23',NULL,NULL,7,NULL,496100,'Honorary Member-HY'),(12,12,'AF','Armed Forces (Retd.)',10000,500,1,'2019-11-26 15:52:48','2021-03-22 15:47:23',NULL,NULL,2,NULL,496200,'Armed Forces (Retd.)-AF'),(13,NULL,'SC(Shuhda)','Shuhda Category',0,0,1,'2020-04-24 18:02:25','2020-12-15 22:37:32','2020-12-15 22:37:32',NULL,NULL,'15',NULL,NULL),(14,NULL,'CE','Corporate Executive',0,0,1,'2022-05-10 20:04:55','2022-05-10 20:04:55',NULL,'15',15,NULL,495000,'Memberships');
/*!40000 ALTER TABLE `mem_categories` ENABLE KEYS */;
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
