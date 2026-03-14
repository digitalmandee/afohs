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
-- Table structure for table `pos_manufacturers`
--

DROP TABLE IF EXISTS `pos_manufacturers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pos_manufacturers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
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
  UNIQUE KEY `pos_manufacturers_name_deleted_unique` (`name`,`deleted_at`),
  KEY `pos_manufacturers_tenant_id_index` (`tenant_id`),
  KEY `pos_manufacturers_location_id_index` (`location_id`),
  CONSTRAINT `pos_manufacturers_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_manufacturers`
--

LOCK TABLES `pos_manufacturers` WRITE;
/*!40000 ALTER TABLE `pos_manufacturers` DISABLE KEYS */;
INSERT INTO `pos_manufacturers` VALUES (1,'Habib Oil','active',2,2,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,NULL),(2,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:19','2026-02-25 21:09:19',2,NULL),(3,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:22','2026-02-25 21:09:22',3,NULL),(4,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:24','2026-02-25 21:09:24',4,NULL),(5,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:27','2026-02-25 21:09:27',5,NULL),(6,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:30','2026-02-25 21:09:30',6,NULL),(7,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:32','2026-02-25 21:09:32',7,NULL),(8,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:35','2026-02-25 21:09:35',8,NULL),(9,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:42','2026-02-25 21:09:42',9,NULL),(10,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:47','2026-02-25 21:09:47',10,NULL),(11,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:51','2026-02-25 21:09:51',11,NULL),(12,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:09:54','2026-02-25 21:09:54',12,NULL),(13,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:10:00','2026-02-25 21:10:00',13,NULL),(14,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:10:04','2026-02-25 21:10:04',14,NULL),(15,'Habib Oil','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:10:08','2026-02-25 21:10:08',15,NULL),(16,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:10:21','2026-02-25 21:10:21',1,NULL),(17,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:10:31','2026-02-25 21:10:31',2,NULL),(18,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:10:34','2026-02-25 21:10:34',3,NULL),(19,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:10:39','2026-02-25 21:10:39',4,NULL),(20,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:01','2026-02-25 21:11:01',5,NULL),(21,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:04','2026-02-25 21:11:04',6,NULL),(22,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:06','2026-02-25 21:11:06',7,NULL),(23,'Nestle','active',2,2,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,8,NULL),(24,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:09','2026-02-25 21:11:09',9,NULL),(25,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:13','2026-02-25 21:11:13',10,NULL),(26,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:15','2026-02-25 21:11:15',11,NULL),(27,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:19','2026-02-25 21:11:19',12,NULL),(28,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:23','2026-02-25 21:11:23',13,NULL),(29,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:26','2026-02-25 21:11:26',14,NULL),(30,'Nestle','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:30','2026-02-25 21:11:30',15,NULL),(31,'Pepsi','active',2,2,NULL,'2026-02-19 02:44:53','2026-02-19 02:44:53',NULL,1,NULL),(32,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:38','2026-02-25 21:11:38',2,NULL),(33,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:45','2026-02-25 21:11:45',3,NULL),(34,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:48','2026-02-25 21:11:48',4,NULL),(35,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:11:51','2026-02-25 21:11:51',5,NULL),(36,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:12:06','2026-02-25 21:12:06',6,NULL),(37,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:12:10','2026-02-25 21:12:10',7,NULL),(38,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:12:13','2026-02-25 21:12:13',8,NULL),(39,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:12:17','2026-02-25 21:12:17',9,NULL),(40,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:12:44','2026-02-25 21:12:44',10,NULL),(41,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:12:47','2026-02-25 21:12:47',11,NULL),(42,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:12:56','2026-02-25 21:12:56',12,NULL),(43,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:12:59','2026-02-25 21:12:59',13,NULL),(44,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:13:05','2026-02-25 21:13:05',14,NULL),(45,'Pepsi','active',2,2,6,'2026-02-19 02:44:53','2026-02-25 21:13:10','2026-02-25 21:13:10',15,NULL);
/*!40000 ALTER TABLE `pos_manufacturers` ENABLE KEYS */;
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
