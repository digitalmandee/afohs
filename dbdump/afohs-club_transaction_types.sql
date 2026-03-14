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
-- Table structure for table `transaction_types`
--

DROP TABLE IF EXISTS `transaction_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_types` (
  `id` int(11) DEFAULT NULL,
  `name` text DEFAULT NULL,
  `status` text DEFAULT NULL,
  `deleted_at` text DEFAULT NULL,
  `created_at` text DEFAULT NULL,
  `updated_at` text DEFAULT NULL,
  `table_name` text DEFAULT NULL,
  `details` text DEFAULT NULL,
  `account` text DEFAULT NULL,
  `cashrec_due` text DEFAULT NULL,
  `mod_id` text DEFAULT NULL,
  `type` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_types`
--

LOCK TABLES `transaction_types` WRITE;
/*!40000 ALTER TABLE `transaction_types` DISABLE KEYS */;
INSERT INTO `transaction_types` VALUES (1,'Room Booking','active',NULL,'2026-01-12 11:51:57','2026-01-12 11:51:57','room_booking','roomInvoice','810109','2019-01-01',NULL,1),(2,'Events Management','active',NULL,'2026-01-12 11:51:57','2026-01-12 11:51:57','event_booking','eventInvoice','810112','2019-01-01',NULL,2),(3,'Membership Fee','active',NULL,'2026-01-12 11:51:57','2026-01-14 16:56:06','finance_invoice','financeInvoice','495000','2019-01-01',NULL,3),(4,'Monthly Maintenance Fee','active',NULL,'2026-01-12 11:51:57','2026-01-12 11:51:57','finance_invoice','financeInvoice','810110','2019-01-01',NULL,4),(5,'Subscription Fee','active',NULL,'2026-01-13 12:11:33','2026-01-14 16:54:43','finance_invoice','financeInvoice',NULL,NULL,NULL,5),(6,'Charges Fee','active',NULL,'2026-01-14 16:50:16','2026-01-14 16:54:36','finance_invoice','financeInvoice',NULL,NULL,NULL,6),(7,'Food Order Fee','active',NULL,'2026-01-14 16:50:16','2026-01-14 16:54:36','orders','orders',NULL,NULL,NULL,7);
/*!40000 ALTER TABLE `transaction_types` ENABLE KEYS */;
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
