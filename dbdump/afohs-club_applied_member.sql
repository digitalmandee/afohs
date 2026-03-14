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
-- Table structure for table `applied_member`
--

DROP TABLE IF EXISTS `applied_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applied_member` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `amount_paid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cnic` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_permanent_member` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `applied_member_member_id_unique` (`member_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applied_member`
--

LOCK TABLES `applied_member` WRITE;
/*!40000 ALTER TABLE `applied_member` DISABLE KEYS */;
INSERT INTO `applied_member` VALUES (1,1,'sannan','sannan@devmine.co','03334341341','nsjk',20000.00,'31343-4234234-2','2025-10-23','2025-10-31',1,'2025-10-18 22:47:37','2025-10-22 07:42:02',NULL),(2,2,'Farhan','farhan123@gmail.com','03211111111','Lahore',20000.00,'33100-0000000-0','2025-10-01','2025-11-30',1,'2025-10-22 00:44:33','2025-10-22 00:44:50',NULL),(3,3,'Erick','erick009@gmail.com','03679901286','Clifton',20000.00,'90890-9813432-2','2025-11-01','2025-11-30',1,'2025-11-04 21:46:38','2025-12-30 20:46:55',NULL),(4,4,'Tayyab','tayyab1@gmail.com','03117912345',NULL,4000.00,'33100-0022222-2','2025-11-06','2026-04-24',1,'2025-11-07 01:11:17','2025-11-07 01:12:05',NULL),(5,NULL,'Steve','steve56@gmail.com','09007233063','49 Featherstone Street',20000.00,'09000-0656231-0','2025-11-10','2025-11-20',0,'2025-11-11 03:39:51','2025-11-11 03:39:51',NULL),(6,NULL,'Henry','henry77@gmail.com','09006783211','Lahore',20000.00,'78987-6543456-7','2025-11-27','2025-12-11',0,'2025-11-28 02:36:44','2025-11-28 02:36:44',NULL),(7,NULL,'Arya','arya990@gmail.com','07009102264','Lahore',20000.00,'00113-4443221-2','2025-12-01','2025-12-16',0,'2025-12-01 21:35:27','2025-12-01 21:35:27',NULL),(8,NULL,'Muhammad Nouman','Connectwithnouman@gmail.com','03214106907','228 C Bankers Cooperative Housing Society Lahore',50000.00,'54401-4840817-1','2025-12-15','2026-12-31',1,'2025-12-16 03:29:44','2025-12-16 03:30:07',NULL),(9,51968,'kashif','kashif@prismatic-technologies.com','03214590783','228 C Bankers Cooperative Housing Society Lahore',0.00,'97862-1785387-5','2026-01-01','2026-01-31',1,'2025-12-16 20:51:12','2025-12-24 00:22:13',NULL),(10,NULL,'aden','adenpervaiz05@gmail.com','23123123123',NULL,20000.00,'22222-2222222-2','2025-12-17','2026-12-17',1,'2025-12-18 02:57:18','2025-12-18 02:58:32',NULL),(11,51967,'fahad','fahadshd11@gmail.com','21312313213','1',13123213.00,'12314-3124123-4','2025-12-22','2026-12-22',1,'2025-12-23 02:54:37','2025-12-23 02:54:44',NULL),(12,NULL,'aden',NULL,'32423423423',NULL,0.00,NULL,'2026-01-01',NULL,0,'2026-01-01 22:52:49','2026-01-01 22:52:49',NULL),(13,51978,'fahad',NULL,'23131231231',NULL,0.00,NULL,'2026-01-02',NULL,1,'2026-01-03 05:00:01','2026-01-03 05:00:12',NULL);
/*!40000 ALTER TABLE `applied_member` ENABLE KEYS */;
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
