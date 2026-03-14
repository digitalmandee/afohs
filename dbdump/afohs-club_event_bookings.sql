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
-- Table structure for table `event_bookings`
--

DROP TABLE IF EXISTS `event_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_bookings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `booking_no` varchar(255) NOT NULL,
  `customer_id` bigint(20) unsigned DEFAULT NULL,
  `member_id` bigint(20) unsigned DEFAULT NULL,
  `corporate_member_id` bigint(20) unsigned DEFAULT NULL,
  `event_venue_id` bigint(20) unsigned DEFAULT NULL,
  `family_id` bigint(20) unsigned DEFAULT NULL,
  `booking_date` date DEFAULT NULL,
  `booking_type` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `cnic` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ledger_amount` varchar(255) DEFAULT NULL,
  `booked_by` varchar(255) DEFAULT NULL,
  `nature_of_event` varchar(255) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `event_time_from` time DEFAULT NULL,
  `event_time_to` time DEFAULT NULL,
  `menu_charges` decimal(10,2) DEFAULT NULL,
  `addons_charges` decimal(10,2) DEFAULT NULL,
  `total_per_person_charges` decimal(10,2) DEFAULT NULL,
  `no_of_guests` bigint(20) NOT NULL DEFAULT 0,
  `guest_charges` bigint(20) NOT NULL DEFAULT 0,
  `extra_guests` bigint(20) NOT NULL DEFAULT 0,
  `extra_guest_charges` bigint(20) NOT NULL DEFAULT 0,
  `total_food_charges` bigint(20) NOT NULL DEFAULT 0,
  `total_other_charges` bigint(20) NOT NULL DEFAULT 0,
  `total_charges` bigint(20) NOT NULL DEFAULT 0,
  `surcharge_type` enum('fixed','percentage') NOT NULL DEFAULT 'percentage',
  `surcharge_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `surcharge_note` varchar(255) DEFAULT NULL,
  `reduction_type` enum('fixed','percentage') NOT NULL DEFAULT 'percentage',
  `reduction_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reduction_note` varchar(255) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `security_deposit` decimal(15,2) DEFAULT 0.00,
  `advance_amount` decimal(10,2) DEFAULT 0.00,
  `paid_amount` bigint(20) NOT NULL DEFAULT 0,
  `booking_docs` text DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `additional_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_data`)),
  `status` enum('pending','confirmed','completed','cancelled','no_show','refunded') NOT NULL DEFAULT 'pending',
  `created_by` bigint(20) DEFAULT NULL,
  `updated_by` bigint(20) DEFAULT NULL,
  `deleted_by` bigint(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_bookings_booking_no_unique` (`booking_no`),
  KEY `event_bookings_event_venue_id_foreign` (`event_venue_id`),
  CONSTRAINT `event_bookings_event_venue_id_foreign` FOREIGN KEY (`event_venue_id`) REFERENCES `event_venues` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_bookings`
--

LOCK TABLES `event_bookings` WRITE;
/*!40000 ALTER TABLE `event_bookings` DISABLE KEYS */;
INSERT INTO `event_bookings` VALUES (1,'1',NULL,202,NULL,4,NULL,'2025-10-27','0','Farooq Mahmoood','IH 345, PAF Falcon Complex Gulberg III LHR','61101-4454953-1','03008448874','no@gmail.com',NULL,'Asif','Anniversary','2025-10-31','21:00:00','02:30:00',0.00,0.00,0.00,14,0,0,0,0,0,0,'percentage',0.00,NULL,'percentage',10.00,NULL,1782756.00,0.00,0.00,0,'[\"\\/tenants\\/default\\/booking_documents\\/1761550198_screenshot-(10).png\"]','approved','{\"completed_time\":\"13:33\"}','completed',1,1,NULL,'2025-10-27 19:29:58','2025-10-27 20:35:56',NULL),(2,'2',NULL,525,NULL,3,9405,'2025-10-27','0','Hasham','IH 280','36402-9534457-9','03222221090','hashaamdogar@gmail.com',NULL,'Adnan','Anniversary','2025-11-01','20:00:00','03:30:00',140000.00,0.00,140000.00,1,140000,0,0,140000,0,150150,'percentage',0.00,NULL,'fixed',10000.00,NULL,150150.00,0.00,0.00,0,'[\"\\/tenants\\/default\\/booking_documents\\/1761553959_screenshot-(64).png\"]','confirmed',NULL,'completed',1,1,NULL,'2025-10-27 20:32:39','2025-10-27 20:33:14',NULL),(3,'3',NULL,3,NULL,2,NULL,'2025-10-27','0','Dr. Qaiser Rafiq','IH-493 Falcon complex Lahore','36104-6448012-3','03077777801','',NULL,'Sir Bilal','Birthday','2026-02-04','21:30:00','23:00:00',140000.00,0.00,140000.00,7,700000,0,0,700000,0,360450,'percentage',0.00,NULL,'percentage',50.00,NULL,500630.00,0.00,0.00,0,'[\"\\/tenants\\/default\\/booking_documents\\/1761560802_screenshot-2025-10-23-070210.png\"]','','{\"cancellation_reason\":\"The Person is  unavailable at the moment!\"}','cancelled',1,1,NULL,'2025-10-27 22:26:42','2025-12-19 01:50:13',NULL),(4,'4',NULL,3603,NULL,2,NULL,'2025-10-28','0','Muhammad Yousaf','22-F Model Town, LHR','35200-5906387-1','03009492623','',NULL,'Kirron','Walima','2025-10-31','22:00:00','03:00:00',300000.00,0.00,300000.00,20,6000000,0,0,6000000,0,4843360,'percentage',0.00,NULL,'percentage',20.00,NULL,4842560.00,0.00,0.00,0,'[\"\\/tenants\\/default\\/booking_documents\\/1761637421_screenshot-(64).png\"]','allocated','{\"cancellation_reason\":\"The bride ran away so No Walima\"}','cancelled',1,1,NULL,'2025-10-28 19:43:41','2025-12-22 03:48:30',NULL),(5,'5',NULL,51961,NULL,5,51962,'2025-12-18','0','Dr. faisal sb','228 C Bankers Cooperative Housing Society Lahore','67835-7623576-5','03214106907','Connectwithnouman8@gmail.com',NULL,'arslan sb','wedding','2025-12-18','06:00:00','09:00:00',140000.00,0.00,140000.00,1000,140000000,0,0,140000000,0,70077500,'percentage',0.00,NULL,'percentage',50.00,NULL,70087500.00,0.00,0.00,0,'[\"\\/tenants\\/default\\/booking_documents\\/1766061137_whatsapp-image-2025-12-17-at-4.57.34-pm.jpeg\"]','testing',NULL,'completed',1,1,NULL,'2025-12-19 01:32:17','2025-12-22 03:58:14',NULL),(6,'6',NULL,949,NULL,2,31558,'2025-12-18','0','Major Muhammad Nouman','H.No. 20 Rah-e-Firdos Road, Margalla Town, Orchard Scheme','37405-5643979-7','03215007177','',NULL,'demo','demo','2025-12-19','06:00:00','22:00:00',300000.00,0.00,300000.00,10,3000000,0,0,3000000,0,3000000,'percentage',0.00,NULL,'fixed',500.00,NULL,3000000.00,0.00,0.00,0,'[\"\\/tenants\\/default\\/booking_documents\\/1766061474_whatsapp-image-2025-12-17-at-8.47.45-pm.jpeg\"]','testing',NULL,'confirmed',1,1,NULL,'2025-12-19 01:37:54','2025-12-22 03:45:23',NULL),(7,'7',NULL,6,NULL,5,NULL,'2025-12-18','0','AM Syed Sabahat','n/a','35243-54','52545','',NULL,'none','sf','2025-12-19','06:00:00','10:00:00',300000.00,0.00,300000.00,10,3000000,0,0,3000000,0,3000000,'percentage',0.00,NULL,'fixed',0.00,NULL,3000000.00,0.00,0.00,0,'[\"\\/tenants\\/default\\/booking_documents\\/1766061622_whatsapp-image-2025-12-17-at-4.57.34-pm.jpeg\"]','','{\"cancellation_reason\":\"hijgjig\"}','cancelled',1,1,NULL,'2025-12-19 01:40:22','2025-12-22 03:54:59',NULL),(8,'8',NULL,1,NULL,6,NULL,'2025-12-21','0','Sohail','n/a','34343-3','343245424','',NULL,'none','Birthday','2025-12-24','22:07:00','12:07:00',0.00,0.00,0.00,5,0,0,0,0,0,50000,'percentage',0.00,NULL,'fixed',0.00,NULL,50000.00,0.00,0.00,0,'[]','',NULL,'confirmed',1,NULL,NULL,'2025-12-22 04:08:27','2025-12-22 04:08:27',NULL),(9,'9',NULL,51985,NULL,3,NULL,'2026-01-09','0','Ali Hayat','H. No. 33, Street 38, Sector G-12/2, Islamabad','34402-9956185-1','03016714174','',NULL,'aden pervaiz','birthday party','2026-01-15','13:00:00','16:00:00',3000.00,0.00,3000.00,20,60000,0,0,60000,0,53000,'percentage',0.00,NULL,'percentage',50.00,NULL,30000.00,0.00,0.00,0,'[]','','{\"completed_time\":\"18:30\"}','completed',1,1,NULL,'2026-01-10 01:46:38','2026-01-10 03:29:36',NULL),(10,'10',15,NULL,NULL,4,NULL,'2026-01-09','1','Mike','London','3434354545555','6785678567','Mike@example.com',NULL,'wdqw','ddqwdqw','2026-01-26','09:07:00','10:09:00',3000.00,0.00,3000.00,3,9000,0,0,9000,0,9600,'percentage',0.00,NULL,'fixed',0.00,NULL,9600.00,0.00,0.00,0,'[\"\\/tenants\\/default\\/booking_documents\\/1767966182_screenshot-from-2025-08-19-15-55-45.png\"]','','{\"cancellation_reason\":\"mikuuuuegtw\"}','cancelled',1,1,NULL,'2026-01-10 02:43:02','2026-01-10 02:43:53',NULL),(11,'11',2536,NULL,NULL,6,NULL,'2026-01-10','1','cassie','','','','',NULL,'cassie','cdqwdcqwcd','2026-01-20','09:08:00','07:06:00',10000.00,0.00,10000.00,1,10000,0,0,10000,0,10000,'percentage',0.00,NULL,'fixed',30.00,NULL,10000.00,0.00,0.00,0,'[]','','{\"cancellation_reason\":\"wdwa\"}','cancelled',1,1,NULL,'2026-01-11 02:47:20','2026-01-11 02:52:25',NULL),(12,'12',2539,NULL,NULL,2,NULL,'2026-01-22','1','aden','','','','',NULL,'aden','vdsva','2026-01-14','07:06:00','21:32:00',3000.00,0.00,3000.00,34,102000,0,0,102000,0,150860,'percentage',0.00,NULL,'percentage',5.00,NULL,150860.00,0.00,2000.00,2000,'[]','','{\"completed_time\":\"17:42\"}','completed',1,1,NULL,'2026-01-23 01:41:02','2026-01-23 01:42:36',NULL),(13,'13',NULL,2222,NULL,4,NULL,'2026-01-24','0','Tariq Yunus','H. No. 325, 7/7 Street 06, Hamza Block, Green View Colony Faisalabad','33100-0638678-9','03009653107','ELEGANTDIL@HOTMAIL.COM',NULL,'aden','funcashcu','2025-04-23','03:42:00','03:24:00',2299.00,0.00,2299.00,30,68970,0,0,68970,0,81879,'percentage',0.00,NULL,'percentage',30.00,NULL,81879.00,0.00,20000.00,20000,'[]','','{\"completed_time\":\"16:34\"}','completed',1,1,NULL,'2026-01-25 00:32:17','2026-01-25 00:34:31',NULL),(14,'14',2546,NULL,NULL,6,NULL,'2026-03-04','1','test test','','','03000000900','test@exampe.com',NULL,'aden pervaiz','party','2026-03-04','18:00:00','22:00:00',3299.00,0.00,3299.00,12,39588,0,0,39588,0,57958,'percentage',0.00,NULL,'fixed',30.00,NULL,57958.00,0.00,20000.00,20000,'[\"\\/tenants\\/default\\/booking_documents\\/1772613938_whatsapp-image-2024-01-01-at-7.11.20-pm.jpeg\"]','','{\"completed_time\":\"15:04\"}','completed',1,1,NULL,'2026-03-04 21:45:38','2026-03-04 23:04:11',NULL),(15,'15',2546,NULL,NULL,4,NULL,'2026-03-09','1','test test','','','03000000900','test@exampe.com',NULL,'aden pervaiz','birthday','2026-03-09','21:00:00','23:00:00',3699.00,0.00,3699.00,10,36990,0,0,36990,0,51561,'percentage',0.00,NULL,'percentage',10.00,NULL,51561.00,0.00,20000.00,20000,'[]','awdoihwalndlwhdoiwad;n',NULL,'confirmed',1,1,NULL,'2026-03-09 19:59:53','2026-03-09 19:59:53',NULL),(16,'16',2547,NULL,NULL,1,NULL,'2026-03-09','1','walkin customer','','','','',NULL,'casie','meeting','2026-03-10','14:00:00','15:00:00',2299.00,0.00,2299.00,20,45980,0,0,45980,0,30490,'percentage',0.00,NULL,'percentage',50.00,NULL,30490.00,0.00,0.00,30490,'[]','','{\"completed_time\":\"13:58\"}','completed',1,1,NULL,'2026-03-09 20:06:06','2026-03-09 20:58:08',NULL),(17,'17',NULL,270,NULL,3,NULL,'2026-03-09','0','Faiz Bakhsh','IH 364,FALCON COMPLEX','35202-2919014-5','03004009358','faiz@lawbizgroup.com',NULL,'Faiz Bakhsh-FR 270','GTG Dinner','2026-03-10','06:00:00','22:00:00',2299.00,0.00,2299.00,35,80465,0,0,80465,0,112340,'percentage',0.00,NULL,'fixed',0.00,NULL,112340.00,0.00,25000.00,25000,'[\"\\/tenants\\/default\\/booking_documents\\/1773056439_no-image.jpg\"]','',NULL,'confirmed',1,1,NULL,'2026-03-09 23:40:39','2026-03-12 21:19:29',NULL),(18,'18',NULL,2234,NULL,3,NULL,'2026-03-12','0','Zafar Iqbal','H. No. 25, Block A, Near Hameed Palace Batala Colony Faisalabad','33100-0914445-5','03008664100','ZAFARMERAJ4100@GMAIL.COM',NULL,'dwqdv','qwbl','2026-09-09','21:00:00','22:00:00',1999.00,0.00,1999.00,1,1999,0,0,1999,0,1999,'percentage',0.00,NULL,'fixed',0.00,NULL,1999.00,0.00,1.00,0,'[]','\n[Cancelled: 2026-03-12 12:17:19]\n[Advance Returned (Cancelled Booking): 2026-03-12 12:19:46] Amount: 1999 via Cash',NULL,'cancelled',1,1,NULL,'2026-03-12 19:16:57','2026-03-12 19:19:46',NULL),(19,'19',2347,NULL,NULL,2,NULL,'2026-03-12','1','Muhammad Saleem Malik - Guj Gymkhana - 512','Gujrat Gym Khana','34201-6454941-3','03555758232','No@gmail.com',NULL,'kevin','baoudb','2026-03-24','20:00:00','21:00:00',3299.00,0.00,3299.00,1,3299,0,0,3299,0,3299,'percentage',0.00,NULL,'fixed',0.00,NULL,3299.00,0.00,0.00,0,'[]','\n[Cancelled: 2026-03-12 12:29:11] Reason: mpok\n[Advance Returned (Cancelled Booking): 2026-03-12 12:31:26] Amount: 1000 via Cash Note: dwd\n[Undo Cancel: 2026-03-12 12:40:18]\n[Cancelled: 2026-03-12 12:40:35]',NULL,'cancelled',1,1,NULL,'2026-03-12 19:28:39','2026-03-12 19:40:35',NULL);
/*!40000 ALTER TABLE `event_bookings` ENABLE KEYS */;
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
