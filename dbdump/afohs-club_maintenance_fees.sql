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
-- Table structure for table `maintenance_fees`
--

DROP TABLE IF EXISTS `maintenance_fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_fees` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `corporate_member_id` bigint(20) unsigned DEFAULT NULL,
  `year` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `paid_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `maintenance_fees_member_id_foreign` (`member_id`),
  KEY `maintenance_fees_corporate_member_id_foreign` (`corporate_member_id`),
  CONSTRAINT `maintenance_fees_corporate_member_id_foreign` FOREIGN KEY (`corporate_member_id`) REFERENCES `corporate_members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_fees_member_id_foreign` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_fees`
--

LOCK TABLES `maintenance_fees` WRITE;
/*!40000 ALTER TABLE `maintenance_fees` DISABLE KEYS */;
INSERT INTO `maintenance_fees` VALUES (1,51965,NULL,2025,1,21000.00,'paid',NULL,'2025-12-20 03:53:07','2025-12-20 03:53:07'),(2,51957,NULL,2025,1,9000.00,'paid',NULL,'2025-12-20 05:02:00','2025-12-20 05:02:00'),(3,51969,NULL,2025,1,1500.00,'paid',NULL,'2025-12-28 01:31:45','2025-12-28 01:31:45'),(4,51974,NULL,2025,11,2500.00,'paid',NULL,'2026-01-02 01:22:58','2026-01-02 01:22:58'),(5,51975,NULL,2026,1,6000.00,'paid',NULL,'2026-01-03 00:00:39','2026-01-03 00:00:39'),(6,51985,NULL,2026,1,10500.00,'paid',NULL,'2026-01-10 00:16:41','2026-01-10 00:16:41'),(7,51985,NULL,2026,4,10500.00,'paid',NULL,'2026-01-10 00:17:02','2026-01-10 00:17:02');
/*!40000 ALTER TABLE `maintenance_fees` ENABLE KEYS */;
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
