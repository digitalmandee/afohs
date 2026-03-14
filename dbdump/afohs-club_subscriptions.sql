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
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `corporate_member_id` bigint(20) unsigned DEFAULT NULL,
  `customer_id` bigint(20) unsigned DEFAULT NULL,
  `family_member_id` bigint(20) unsigned DEFAULT NULL,
  `subscription_category_id` bigint(20) unsigned NOT NULL,
  `subscription_type_id` bigint(20) unsigned NOT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `status` enum('active','in_active','expired','suspended','cancelled') DEFAULT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `invoice_id` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_subscription_category_id_foreign` (`subscription_category_id`),
  KEY `subscriptions_subscription_type_id_foreign` (`subscription_type_id`),
  KEY `subscriptions_family_member_id_foreign` (`family_member_id`),
  KEY `subscriptions_member_id_family_member_id_index` (`member_id`,`family_member_id`),
  KEY `subscriptions_invoice_id_foreign` (`invoice_id`),
  KEY `subscriptions_corporate_member_id_foreign` (`corporate_member_id`),
  KEY `subscriptions_customer_id_foreign` (`customer_id`),
  CONSTRAINT `subscriptions_corporate_member_id_foreign` FOREIGN KEY (`corporate_member_id`) REFERENCES `corporate_members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_family_member_id_foreign` FOREIGN KEY (`family_member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `subscriptions_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `financial_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_member_id_foreign` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_subscription_category_id_foreign` FOREIGN KEY (`subscription_category_id`) REFERENCES `subscription_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subscriptions_subscription_type_id_foreign` FOREIGN KEY (`subscription_type_id`) REFERENCES `subscription_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES (1,1,NULL,NULL,NULL,6,3,'2025-11-05','2025-12-05','active','tenants/default/subscription_qr_codes/1762330411_690b072b3d71a.png','2025-11-05 21:13:30','2025-11-05 21:13:31',NULL),(2,250,NULL,NULL,NULL,1,1,'2025-11-05',NULL,'active','tenants/default/subscription_qr_codes/1762345739_690b430b09082.png','2025-11-06 01:28:58','2025-11-06 01:28:59',NULL),(3,262,NULL,NULL,NULL,3,2,'2025-11-05','2025-12-05','active','tenants/default/subscription_qr_codes/1762345889_690b43a140cd7.png','2025-11-06 01:31:28','2025-11-06 01:31:29',NULL),(4,84,NULL,NULL,NULL,4,2,'2025-11-10','2025-11-12','active','tenants/default/subscription_qr_codes/1762773563_6911ca3b13087.png','2025-11-11 00:19:22','2025-11-11 00:19:23',NULL),(5,571,NULL,NULL,NULL,1,1,'2025-11-10','2025-11-11','active','tenants/default/subscription_qr_codes/1762785824_6911fa20343fc.png','2025-11-11 03:43:43','2025-11-11 03:43:44',NULL),(6,8218,NULL,NULL,30057,3,2,'2025-11-10','2025-11-12','active','tenants/default/subscription_qr_codes/1762786608_6911fd30e4901.png','2025-11-11 03:56:48','2025-11-11 03:56:48',NULL),(7,51948,NULL,NULL,NULL,8,1,'2025-12-01','2025-12-31','active','tenants/default/subscription_qr_codes/1764231084_692807acbabb4.png','2025-11-27 21:11:23','2025-11-27 21:11:24',NULL),(8,1363,NULL,NULL,32681,17,4,'2025-11-28','2025-11-29','active','tenants/default/subscription_qr_codes/1764325221_69297765f34c6.png','2025-11-28 23:20:21','2025-11-28 23:20:21',NULL),(9,309,NULL,NULL,30437,7,1,'2025-11-28','2025-11-29','active','tenants/default/subscription_qr_codes/1764335207_69299e671b4f3.png','2025-11-29 02:06:46','2025-11-29 02:06:47',NULL),(10,412,NULL,NULL,34836,12,1,'2025-12-02','2025-12-02','active','tenants/default/subscription_qr_codes/1764660836_692e9664c5b04.png','2025-12-02 20:33:55','2025-12-02 20:33:56',NULL),(39,5625,NULL,NULL,44338,1,1,'2026-01-01','2026-01-31','active',NULL,'2026-02-13 02:13:44','2026-02-13 02:13:44',39684),(40,1450,NULL,NULL,32832,2,1,'2026-01-01','2026-02-28','active',NULL,'2026-02-13 02:14:47','2026-02-13 02:14:47',39733),(41,1234,NULL,NULL,NULL,13,1,'2026-02-21','2026-02-22','active',NULL,'2026-02-22 04:11:21','2026-02-22 04:11:21',106479),(42,233,NULL,NULL,NULL,6,1,'2026-02-23','2026-02-24','active',NULL,'2026-02-22 04:17:25','2026-02-22 04:17:25',106481),(43,1234,NULL,NULL,NULL,12,1,'2026-03-03','2026-04-03','active',NULL,'2026-03-03 20:08:08','2026-03-03 20:08:08',130308),(44,1234,NULL,NULL,NULL,11,1,'2026-04-01','2026-04-15','active',NULL,'2026-03-03 20:08:08','2026-03-03 20:08:08',130308),(45,4566,NULL,NULL,NULL,9,1,'2026-03-03','2026-04-03','active',NULL,'2026-03-03 20:17:13','2026-03-03 20:17:13',130309),(46,4566,NULL,NULL,NULL,10,1,'2026-03-03','2026-04-03','active',NULL,'2026-03-03 20:17:13','2026-03-03 20:17:13',130309),(47,145,NULL,NULL,NULL,15,1,'2026-03-03','2026-04-03','active',NULL,'2026-03-03 20:26:19','2026-03-03 20:26:19',130310),(48,145,NULL,NULL,NULL,16,1,'2026-03-03','2026-04-03','active',NULL,'2026-03-03 20:26:19','2026-03-03 20:26:19',130310),(49,346,NULL,NULL,NULL,11,1,'2026-03-03','2026-04-03','active',NULL,'2026-03-03 20:28:24','2026-03-03 20:28:24',130311),(50,NULL,NULL,256,NULL,16,1,'2026-03-03','2026-04-03','active',NULL,'2026-03-03 20:46:20','2026-03-03 20:46:20',130312),(51,281,NULL,NULL,NULL,1,1,'2026-03-04','2026-04-04','active',NULL,'2026-03-04 21:08:07','2026-03-04 21:08:07',133315),(52,52107,NULL,NULL,NULL,13,1,'2026-03-01','2026-03-02','active',NULL,'2026-03-05 23:21:07','2026-03-05 23:21:07',139617),(53,234,NULL,NULL,NULL,13,1,'2026-03-06','2026-03-06','active',NULL,'2026-03-06 23:00:44','2026-03-06 23:00:44',142543);
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:36
