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
-- Table structure for table `floors`
--

DROP TABLE IF EXISTS `floors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `floors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `area` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `location_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `floors_tenant_id_index` (`tenant_id`),
  KEY `floors_location_id_index` (`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `floors`
--

LOCK TABLES `floors` WRITE;
/*!40000 ALTER TABLE `floors` DISABLE KEYS */;
INSERT INTO `floors` VALUES (1,'First Floor','First Area','2025-08-07 18:16:35','2025-08-07 18:16:35',1,NULL,NULL),(2,'Second Floor','Second Area','2025-08-07 18:16:35','2025-08-07 18:16:35',1,NULL,NULL),(3,'3rd Floor','3 Floor','2025-08-21 14:51:31','2025-08-21 14:51:31',1,NULL,NULL),(4,'New Floor','Floor','2025-09-17 17:26:20','2025-12-16 05:05:40',1,1,1),(5,'Coffee Shop Floor','Coffee Area','2025-09-25 13:18:56','2026-02-24 22:33:02',0,3,3),(6,'VIP Floor','Sofra','2025-10-06 14:15:00','2026-02-20 02:19:57',0,1,1),(7,'Tea Floor','Tea','2025-10-16 20:34:08','2025-10-16 20:34:08',1,2,2),(8,'Greeen Lounge','Lounge','2025-10-16 20:35:38','2025-10-16 20:35:38',1,2,2),(9,'Sofra','Lounge','2025-10-19 08:20:08','2026-02-24 22:33:17',0,5,5),(10,'Wok','Lounge','2025-10-19 08:22:57','2026-02-24 22:33:27',0,6,6),(11,'Wok','Indoor','2025-10-19 08:23:31','2026-02-24 22:33:25',0,6,6);
/*!40000 ALTER TABLE `floors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:50
