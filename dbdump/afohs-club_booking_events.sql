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
-- Table structure for table `booking_events`
--

DROP TABLE IF EXISTS `booking_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_name` varchar(255) NOT NULL,
  `date_time` varchar(255) DEFAULT NULL,
  `max_capacity` bigint(20) DEFAULT NULL,
  `pricing_type` enum('fixed','per person') DEFAULT NULL,
  `price_per_person` bigint(20) DEFAULT NULL,
  `status` enum('pending','upcomming','completed') DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_events`
--

LOCK TABLES `booking_events` WRITE;
/*!40000 ALTER TABLE `booking_events` DISABLE KEYS */;
INSERT INTO `booking_events` VALUES (1,'Laravel Workshop','2025-08-14 11:16:36',50,'per person',50,'upcomming','Tech Hub, New York','images/events/laravel-workshop.jpg','2025-08-07 18:16:36','2025-08-07 18:16:36'),(2,'React Summit','2025-08-21 11:16:36',200,'fixed',500,'pending','San Francisco Convention Center','images/events/react-summit.jpg','2025-08-07 18:16:36','2025-08-07 18:16:36'),(3,'Completed Event','2025-07-28 11:16:36',100,'per person',30,'completed','Online','images/events/completed-event.jpg','2025-08-07 18:16:36','2025-08-07 18:16:36');
/*!40000 ALTER TABLE `booking_events` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:39
