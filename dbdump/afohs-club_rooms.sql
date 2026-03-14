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
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `room_type_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `number_of_beds` bigint(20) NOT NULL,
  `max_capacity` bigint(20) NOT NULL,
  `number_of_bathrooms` bigint(20) NOT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rooms_room_type_id_foreign` (`room_type_id`),
  CONSTRAINT `rooms_room_type_id_foreign` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (16,1,'101',1,3,1,'/tenants/default/booking_rooms/1768498339_executive-suite-room.jpg','2026-01-16 06:32:19','2026-01-16 06:32:19',NULL,NULL,NULL,NULL),(17,1,'102',1,3,1,'/tenants/default/booking_rooms/1768498392_executive-suite-room.jpg','2026-01-16 06:33:12','2026-01-16 06:33:12',NULL,NULL,NULL,NULL),(18,2,'103',1,3,1,'/tenants/default/booking_rooms/1768498489_deluxe-room.jpeg','2026-01-16 06:34:49','2026-01-16 06:34:49',NULL,NULL,NULL,NULL),(19,2,'104',1,3,1,'/tenants/default/booking_rooms/1768498519_deluxe-room.jpeg','2026-01-16 06:35:19','2026-01-16 06:35:19',NULL,NULL,NULL,NULL),(20,2,'105',1,3,1,'/tenants/default/booking_rooms/1768498612_deluxe-room.jpeg','2026-01-16 06:36:52','2026-01-16 06:36:52',NULL,NULL,NULL,NULL),(21,2,'106',1,3,1,'/tenants/default/booking_rooms/1768498642_deluxe-room.jpeg','2026-01-16 06:37:22','2026-01-16 06:37:22',NULL,NULL,NULL,NULL),(22,2,'107',1,3,1,'/tenants/default/booking_rooms/1768498685_deluxe-room.jpeg','2026-01-16 06:38:05','2026-01-16 06:38:05',NULL,NULL,NULL,NULL),(23,2,'108',1,3,1,'/tenants/default/booking_rooms/1768498720_deluxe-room.jpeg','2026-01-16 06:38:40','2026-01-16 06:38:40',NULL,NULL,NULL,NULL),(24,2,'109',1,3,1,'/tenants/default/booking_rooms/1768498782_deluxe-room.jpeg','2026-01-16 06:39:42','2026-01-16 06:39:42',NULL,NULL,NULL,NULL),(25,2,'110',1,3,1,'/tenants/default/booking_rooms/1768498814_deluxe-room.jpeg','2026-01-16 06:40:14','2026-01-16 06:40:14',NULL,NULL,NULL,NULL),(26,2,'111',1,3,1,'/tenants/default/booking_rooms/1768498842_deluxe-room.jpeg','2026-01-16 06:40:42','2026-01-16 06:40:42',NULL,NULL,NULL,NULL),(27,2,'112',1,3,1,'/tenants/default/booking_rooms/1768498874_deluxe-room.jpeg','2026-01-16 06:41:14','2026-01-16 06:41:14',NULL,NULL,NULL,NULL),(28,3,'113',1,3,1,'/tenants/default/booking_rooms/1768498931_7.jfif','2026-01-16 06:42:11','2026-01-16 06:42:11',NULL,NULL,NULL,NULL),(29,3,'114',1,3,1,'/tenants/default/booking_rooms/1768498963_7.jfif','2026-01-16 06:42:43','2026-01-16 06:42:43',NULL,NULL,NULL,NULL),(30,3,'115',1,3,1,'/tenants/default/booking_rooms/1768499000_3.jfif','2026-01-16 06:43:20','2026-01-16 06:43:20',NULL,NULL,NULL,NULL),(31,3,'116',1,3,1,'/tenants/default/booking_rooms/1768499203_3.jfif','2026-01-16 06:44:25','2026-01-16 06:46:43',NULL,NULL,NULL,NULL),(32,3,'117',1,3,1,'/tenants/default/booking_rooms/1768499089_7.jfif','2026-01-16 06:44:49','2026-01-16 06:44:49',NULL,NULL,NULL,NULL),(34,3,'118',3,9,3,'/tenants/default/booking_rooms/1768903234_1.jfif','2026-01-16 23:45:16','2026-02-10 18:48:23',NULL,1,NULL,NULL);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
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
