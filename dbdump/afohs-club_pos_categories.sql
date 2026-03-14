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
-- Table structure for table `pos_categories`
--

DROP TABLE IF EXISTS `pos_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pos_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `deleted_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `tenant_id` bigint(20) unsigned DEFAULT NULL,
  `location_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pos_categories_tenant_id_index` (`tenant_id`),
  KEY `pos_categories_location_id_index` (`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_categories`
--

LOCK TABLES `pos_categories` WRITE;
/*!40000 ALTER TABLE `pos_categories` DISABLE KEYS */;
INSERT INTO `pos_categories` VALUES (1,'Pakistan KITCHEN',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,6,6),(2,'COFFEE',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(3,'BAR',NULL,'inactive',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(4,'STORE',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(5,'BAKERY SHOP',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,2,2),(6,'SALOON',NULL,'active',2,12,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(7,'OTHERS',NULL,'active',2,2,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(8,'BANQUET HALL',NULL,'inactive',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,6,6),(9,'FALCON SHOP',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(10,'CHINESE RESTAURANT',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(11,'BBQ LAWN',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,6,6),(12,'TURKISH KITCHEN',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(13,'BAKERY PRODUCTION',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(14,'Fast Food',NULL,'active',2,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(15,'Turkish Bar',NULL,'active',15,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(16,'CHAYE DHABA',NULL,'active',17,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(17,'BBQ TERRACE',NULL,'active',12,12,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(18,'Rooftop',NULL,'active',15,15,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,1),(19,'Cakes',NULL,'active',6,NULL,NULL,'2026-02-20 00:08:21','2026-02-20 00:08:21',NULL,NULL,NULL);
/*!40000 ALTER TABLE `pos_categories` ENABLE KEYS */;
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
