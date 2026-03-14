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
-- Table structure for table `event_booking_menus`
--

DROP TABLE IF EXISTS `event_booking_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_booking_menus` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `event_booking_id` bigint(20) unsigned NOT NULL,
  `event_menu_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `amount` varchar(255) NOT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`items`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_booking_menus_event_booking_id_foreign` (`event_booking_id`),
  CONSTRAINT `event_booking_menus_event_booking_id_foreign` FOREIGN KEY (`event_booking_id`) REFERENCES `event_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_booking_menus`
--

LOCK TABLES `event_booking_menus` WRITE;
/*!40000 ALTER TABLE `event_booking_menus` DISABLE KEYS */;
INSERT INTO `event_booking_menus` VALUES (1,1,1,'Chicken Roast','140000','[{\"id\":\"11\",\"name\":\"Chicken Achari Karahi or Murgh Chana\"},{\"id\":\"8\",\"name\":\"Soft Drinks\"}]','2025-10-27 20:25:34','2025-10-27 20:25:34'),(2,2,1,'Chicken Roast','140000','[{\"id\":\"10\",\"name\":\"Chicken Kabab or Chicken Boti\"}]','2025-10-27 20:32:39','2025-10-27 20:32:39'),(6,4,2,'Mutton','300000','[{\"id\":\"1\",\"name\":\"Assorted Naan\"}]','2025-10-28 19:46:17','2025-10-28 19:46:17'),(15,3,1,'Chicken','140000','[{\"id\":\"6\",\"name\":\"Desert One Type\"}]','2025-12-19 01:50:13','2025-12-19 01:50:13'),(17,6,2,'Mutton','300000','[{\"id\":\"5\",\"name\":\"Raita\"}]','2025-12-22 03:45:23','2025-12-22 03:45:23'),(18,7,2,'Mutton','300000','[{\"id\":\"5\",\"event_menu_id\":\"2\",\"status\":\"active\"}]','2025-12-22 03:54:59','2025-12-22 03:54:59'),(19,5,1,'Chicken','140000','[{\"id\":\"3\",\"event_menu_id\":\"1\",\"status\":\"active\"},{\"id\":\"4\",\"event_menu_id\":\"1\",\"status\":\"active\"}]','2025-12-22 03:58:14','2025-12-22 03:58:14'),(21,10,2,'Mutton','3000','[{\"id\":\"7\",\"event_menu_id\":\"2\",\"menu_category_id\":\"9\",\"status\":\"active\"},{\"id\":\"8\",\"event_menu_id\":\"2\",\"menu_category_id\":\"13\",\"status\":\"active\"},{\"id\":\"6\",\"name\":\"Desert One Type\",\"menu_category_id\":\"6\"},{\"id\":\"10\",\"event_menu_id\":\"2\",\"menu_category_id\":\"15\",\"status\":\"active\"},{\"id\":\"11\",\"event_menu_id\":\"2\",\"menu_category_id\":\"4\",\"status\":\"active\"}]','2026-01-10 02:43:02','2026-01-10 02:43:02'),(22,9,2,'Mutton','3000','[{\"id\":\"7\",\"event_menu_id\":\"2\",\"menu_category_id\":\"9\",\"status\":\"active\"},{\"id\":\"8\",\"event_menu_id\":\"2\",\"menu_category_id\":\"13\",\"status\":\"active\"},{\"id\":\"9\",\"event_menu_id\":\"2\",\"menu_category_id\":\"17\",\"status\":\"active\"},{\"id\":\"10\",\"event_menu_id\":\"2\",\"menu_category_id\":\"15\",\"status\":\"active\"},{\"id\":\"11\",\"event_menu_id\":\"2\",\"menu_category_id\":\"4\",\"status\":\"active\"}]','2026-01-10 03:29:36','2026-01-10 03:29:36'),(23,11,3,'menu A','10000','[{\"id\":\"12\",\"event_menu_id\":\"3\",\"menu_category_id\":\"1\",\"status\":\"active\"},{\"id\":\"13\",\"event_menu_id\":\"3\",\"menu_category_id\":\"2\",\"status\":\"active\"},{\"id\":\"14\",\"event_menu_id\":\"3\",\"menu_category_id\":\"3\",\"status\":\"active\"},{\"id\":\"15\",\"event_menu_id\":\"3\",\"menu_category_id\":\"6\",\"status\":\"active\"},{\"id\":\"16\",\"event_menu_id\":\"3\",\"menu_category_id\":\"8\",\"status\":\"active\"},{\"id\":\"17\",\"event_menu_id\":\"3\",\"menu_category_id\":\"7\",\"status\":\"active\"}]','2026-01-11 02:47:20','2026-01-11 02:47:20'),(25,12,2,'Mutton','3000','[{\"id\":\"7\",\"event_menu_id\":\"2\",\"menu_category_id\":\"9\",\"status\":\"active\"},{\"id\":\"8\",\"event_menu_id\":\"2\",\"menu_category_id\":\"13\",\"status\":\"active\"},{\"id\":\"9\",\"event_menu_id\":\"2\",\"menu_category_id\":\"17\",\"status\":\"active\"},{\"id\":\"10\",\"event_menu_id\":\"2\",\"menu_category_id\":\"15\",\"status\":\"active\"},{\"id\":\"11\",\"event_menu_id\":\"2\",\"menu_category_id\":\"4\",\"status\":\"active\"}]','2026-01-23 01:42:36','2026-01-23 01:42:36'),(27,13,1,'Menu 3','2299','[{\"id\":\"44\",\"event_menu_id\":\"1\",\"menu_category_id\":\"29\",\"status\":\"active\"},{\"id\":\"45\",\"event_menu_id\":\"1\",\"menu_category_id\":\"34\",\"status\":\"active\"},{\"id\":\"46\",\"event_menu_id\":\"1\",\"menu_category_id\":\"1\",\"status\":\"active\"},{\"id\":\"47\",\"event_menu_id\":\"1\",\"menu_category_id\":\"26\",\"status\":\"active\"},{\"id\":\"48\",\"event_menu_id\":\"1\",\"menu_category_id\":\"4\",\"status\":\"active\"},{\"id\":\"49\",\"event_menu_id\":\"1\",\"menu_category_id\":\"8\",\"status\":\"active\"},{\"id\":\"50\",\"event_menu_id\":\"1\",\"menu_category_id\":\"7\",\"status\":\"active\"}]','2026-01-25 00:34:31','2026-01-25 00:34:31'),(29,14,8,'Menu 8','3299','[{\"id\":\"84\",\"event_menu_id\":\"8\",\"menu_category_id\":\"30\",\"status\":\"active\"},{\"id\":\"85\",\"event_menu_id\":\"8\",\"menu_category_id\":\"27\",\"status\":\"active\"},{\"id\":\"86\",\"event_menu_id\":\"8\",\"menu_category_id\":\"1\",\"status\":\"active\"},{\"id\":\"87\",\"event_menu_id\":\"8\",\"menu_category_id\":\"26\",\"status\":\"active\"},{\"id\":\"88\",\"event_menu_id\":\"8\",\"menu_category_id\":\"4\",\"status\":\"active\"},{\"id\":\"89\",\"event_menu_id\":\"8\",\"menu_category_id\":\"6\",\"status\":\"active\"},{\"id\":\"90\",\"event_menu_id\":\"8\",\"menu_category_id\":\"8\",\"status\":\"active\"},{\"id\":\"91\",\"event_menu_id\":\"8\",\"menu_category_id\":\"7\",\"status\":\"active\"}]','2026-03-04 23:04:11','2026-03-04 23:04:11'),(30,15,9,'Menu 9','3699','[{\"id\":\"118\",\"event_menu_id\":\"9\",\"menu_category_id\":\"33\",\"status\":\"active\"},{\"id\":\"119\",\"event_menu_id\":\"9\",\"menu_category_id\":\"25\",\"status\":\"active\"},{\"id\":\"120\",\"event_menu_id\":\"9\",\"menu_category_id\":\"1\",\"status\":\"active\"},{\"id\":\"121\",\"event_menu_id\":\"9\",\"menu_category_id\":\"26\",\"status\":\"active\"},{\"id\":\"122\",\"event_menu_id\":\"9\",\"menu_category_id\":\"4\",\"status\":\"active\"},{\"id\":\"123\",\"event_menu_id\":\"9\",\"menu_category_id\":\"6\",\"status\":\"active\"},{\"id\":\"124\",\"event_menu_id\":\"9\",\"menu_category_id\":\"8\",\"status\":\"active\"},{\"id\":\"125\",\"event_menu_id\":\"9\",\"menu_category_id\":\"7\",\"status\":\"active\"}]','2026-03-09 19:59:53','2026-03-09 19:59:53'),(32,16,1,'Menu 3','2299','[{\"id\":\"44\",\"event_menu_id\":\"1\",\"menu_category_id\":\"29\",\"status\":\"active\"},{\"id\":\"45\",\"event_menu_id\":\"1\",\"menu_category_id\":\"34\",\"status\":\"active\"},{\"id\":\"46\",\"event_menu_id\":\"1\",\"menu_category_id\":\"1\",\"status\":\"active\"},{\"id\":\"47\",\"event_menu_id\":\"1\",\"menu_category_id\":\"26\",\"status\":\"active\"},{\"id\":\"48\",\"event_menu_id\":\"1\",\"menu_category_id\":\"4\",\"status\":\"active\"},{\"id\":\"49\",\"event_menu_id\":\"1\",\"menu_category_id\":\"8\",\"status\":\"active\"},{\"id\":\"50\",\"event_menu_id\":\"1\",\"menu_category_id\":\"7\",\"status\":\"active\"}]','2026-03-09 20:58:08','2026-03-09 20:58:08'),(34,18,3,'Menu 1','1999','[{\"id\":\"28\",\"event_menu_id\":\"3\",\"menu_category_id\":\"2\",\"status\":\"active\"},{\"id\":\"29\",\"event_menu_id\":\"3\",\"menu_category_id\":\"25\",\"status\":\"active\"},{\"id\":\"30\",\"event_menu_id\":\"3\",\"menu_category_id\":\"1\",\"status\":\"active\"},{\"id\":\"31\",\"event_menu_id\":\"3\",\"menu_category_id\":\"26\",\"status\":\"active\"},{\"id\":\"32\",\"event_menu_id\":\"3\",\"menu_category_id\":\"4\",\"status\":\"active\"},{\"id\":\"33\",\"event_menu_id\":\"3\",\"menu_category_id\":\"6\",\"status\":\"active\"},{\"id\":\"34\",\"event_menu_id\":\"3\",\"menu_category_id\":\"8\",\"status\":\"active\"},{\"id\":\"35\",\"event_menu_id\":\"3\",\"menu_category_id\":\"7\",\"status\":\"active\"}]','2026-03-12 19:16:57','2026-03-12 19:16:57'),(35,19,7,'Menu 7','3299','[{\"id\":\"126\",\"event_menu_id\":\"7\",\"menu_category_id\":\"9\",\"status\":\"active\"},{\"id\":\"127\",\"event_menu_id\":\"7\",\"menu_category_id\":\"28\",\"status\":\"active\"},{\"id\":\"128\",\"event_menu_id\":\"7\",\"menu_category_id\":\"1\",\"status\":\"active\"},{\"id\":\"129\",\"event_menu_id\":\"7\",\"menu_category_id\":\"26\",\"status\":\"active\"},{\"id\":\"130\",\"event_menu_id\":\"7\",\"menu_category_id\":\"4\",\"status\":\"active\"},{\"id\":\"131\",\"event_menu_id\":\"7\",\"menu_category_id\":\"6\",\"status\":\"active\"},{\"id\":\"132\",\"event_menu_id\":\"7\",\"menu_category_id\":\"8\",\"status\":\"active\"},{\"id\":\"133\",\"event_menu_id\":\"7\",\"menu_category_id\":\"7\",\"status\":\"active\"}]','2026-03-12 19:28:39','2026-03-12 19:28:39'),(38,17,1,'Menu 3','2299','[{\"id\":\"44\",\"event_menu_id\":\"1\",\"menu_category_id\":\"29\",\"status\":\"active\"},{\"id\":\"45\",\"event_menu_id\":\"1\",\"menu_category_id\":\"34\",\"status\":\"active\"},{\"id\":\"46\",\"event_menu_id\":\"1\",\"menu_category_id\":\"1\",\"status\":\"active\"},{\"id\":\"47\",\"event_menu_id\":\"1\",\"menu_category_id\":\"26\",\"status\":\"active\"},{\"id\":\"48\",\"event_menu_id\":\"1\",\"menu_category_id\":\"4\",\"status\":\"active\"},{\"id\":\"49\",\"event_menu_id\":\"1\",\"menu_category_id\":\"8\",\"status\":\"active\"},{\"id\":\"50\",\"event_menu_id\":\"1\",\"menu_category_id\":\"7\",\"status\":\"active\"}]','2026-03-12 21:19:29','2026-03-12 21:19:29');
/*!40000 ALTER TABLE `event_booking_menus` ENABLE KEYS */;
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
