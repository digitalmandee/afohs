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
-- Table structure for table `corporate_memberships`
--

DROP TABLE IF EXISTS `corporate_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `corporate_memberships` (
  `id` int(11) DEFAULT NULL,
  `application_no` int(11) DEFAULT NULL,
  `application_date` text DEFAULT NULL,
  `mem_no` text DEFAULT NULL,
  `membership_date` text DEFAULT NULL,
  `applicant_name` text DEFAULT NULL,
  `mem_category_id` int(11) DEFAULT NULL,
  `mem_classification_id` int(11) DEFAULT NULL,
  `status_remarks` text DEFAULT NULL,
  `mem_unique_code` text DEFAULT NULL,
  `card_status` text DEFAULT NULL,
  `father_name` text DEFAULT NULL,
  `father_mem_no` text DEFAULT NULL,
  `cnic` text DEFAULT NULL,
  `date_of_birth` text DEFAULT NULL,
  `gender` text DEFAULT NULL,
  `education` text DEFAULT NULL,
  `ntn` text DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `details` text DEFAULT NULL,
  `blood_group` text DEFAULT NULL,
  `tel_a` text DEFAULT NULL,
  `tel_b` text DEFAULT NULL,
  `mob_a` text DEFAULT NULL,
  `mob_b` text DEFAULT NULL,
  `personal_email` text DEFAULT NULL,
  `official_email` text DEFAULT NULL,
  `card_issued` text DEFAULT NULL,
  `card_issue_date` text DEFAULT NULL,
  `mem_barcode` text DEFAULT NULL,
  `sup_card_issued` text DEFAULT NULL,
  `sup_card_date` text DEFAULT NULL,
  `mem_picture` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `active` int(11) DEFAULT NULL,
  `per_address` text DEFAULT NULL,
  `per_city` text DEFAULT NULL,
  `per_country` text DEFAULT NULL,
  `cur_address` text DEFAULT NULL,
  `cur_city` text DEFAULT NULL,
  `cur_country` text DEFAULT NULL,
  `mem_fee` int(11) DEFAULT NULL,
  `additional_mem` text DEFAULT NULL,
  `additional_mem_remarks` text DEFAULT NULL,
  `mem_discount` text DEFAULT NULL,
  `mem_discount_remarks` text DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `maintenance_amount` int(11) DEFAULT NULL,
  `additional_mt` text DEFAULT NULL,
  `additional_mt_remarks` text DEFAULT NULL,
  `mt_discount` text DEFAULT NULL,
  `mt_discount_remarks` text DEFAULT NULL,
  `total_maintenance` int(11) DEFAULT NULL,
  `card_exp` text DEFAULT NULL,
  `maintenance_per_day` double DEFAULT NULL,
  `active_remarks` text DEFAULT NULL,
  `from` text DEFAULT NULL,
  `to` text DEFAULT NULL,
  `emergency_name` text DEFAULT NULL,
  `emergency_relation` text DEFAULT NULL,
  `emergency_contact` text DEFAULT NULL,
  `passport_no` text DEFAULT NULL,
  `title` text DEFAULT NULL,
  `first_name` text DEFAULT NULL,
  `middle_name` text DEFAULT NULL,
  `name_comment` text DEFAULT NULL,
  `credit_limit` text DEFAULT NULL,
  `kinship` text DEFAULT NULL,
  `transferred_from` text DEFAULT NULL,
  `done_by` text DEFAULT NULL,
  `coa_category_id` int(11) DEFAULT NULL,
  `created_at` text DEFAULT NULL,
  `updated_at` text DEFAULT NULL,
  `deleted_at` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `deleted_by` text DEFAULT NULL,
  `corporate_company` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `corporate_memberships`
--

LOCK TABLES `corporate_memberships` WRITE;
/*!40000 ALTER TABLE `corporate_memberships` DISABLE KEYS */;
INSERT INTO `corporate_memberships` VALUES (1,1,NULL,'CE 01-1','2022-02-28','Maqsood',14,2,NULL,NULL,'Issued','Maqsood Ahmed',NULL,'35202-3431473-9','1978-07-18','Male','MBA',NULL,'For quality family time',NULL,'A+',NULL,NULL,'03008402638',NULL,'md@kips.edu.pk',NULL,NULL,'2022-05-25','0005253928',NULL,NULL,NULL,NULL,1,'482-B, Faisal town, Lahore.','Lahore','Pakistan','73-E EME DHA, Lahore.','Lahore','Pakistan',200000,NULL,NULL,NULL,NULL,200000,3500,NULL,NULL,NULL,NULL,3500,'2024-12-31',116.67,NULL,'0000-00-00','0000-00-00','Zafar Maqsood','Brother','03004329747',NULL,NULL,'Salman',NULL,NULL,NULL,NULL,NULL,NULL,495000,'2022-05-19 17:38:29','2022-05-28 21:14:54',NULL,11,11,NULL,1),(2,2,NULL,'CE 01-2','2022-02-28','Ahmad',14,2,NULL,NULL,'Issued','Mumtaz Ahmed',NULL,'35200-1442883-9','1978-08-13','Male','M.Phil. (physciology)',NULL,'corporate meeting',NULL,'A+',NULL,'04232326628','03004240312',NULL,'drsherazasim@gmail.com',NULL,NULL,'2022-05-30','0005244337',NULL,NULL,NULL,NULL,1,'H. No. 321, Mohallah Qadir Abad, Layyah','Layyah','Pakistan','H. No. 63, Block B3, Johar town, Lahore.','Lahore','Pakistan',200000,NULL,NULL,NULL,NULL,200000,3500,NULL,NULL,NULL,NULL,3500,'2024-12-31',116.67,NULL,'0000-00-00','0000-00-00','Aiman Arshad','Wife','03336182823',NULL,NULL,'Sheraz',NULL,NULL,NULL,NULL,NULL,NULL,495000,'2022-05-19 18:41:06','2022-05-30 12:28:46',NULL,11,11,NULL,1),(3,3,NULL,'CE 01-3','2022-03-28','Khan',14,2,NULL,NULL,'Issued','Aman Ullah khan',NULL,'37604-9509217-7','1967-01-01','Male','MPhil',NULL,NULL,NULL,'A+','04236676276','0515773872','03218230706',NULL,'asadullahkhan19@gmail.com',NULL,NULL,'2022-05-30','0005192065',NULL,NULL,NULL,NULL,1,'344 st #22, sector B1 DHA 1 Islamabad.','Islamabad','Pakistan','7/10 asad jan road, Lahore cantt','Lahore','Pakistan',200000,NULL,NULL,NULL,NULL,200000,3500,NULL,NULL,NULL,NULL,3500,'2024-12-31',116.67,NULL,'0000-00-00','0000-00-00','Bushra Asad','Wife','03364230747',NULL,NULL,'Asad','Ullah',NULL,NULL,NULL,NULL,NULL,495000,'2022-05-19 18:57:04','2022-05-30 12:29:45',NULL,11,11,NULL,1),(4,4,NULL,'CE 01-4','2022-02-28','Kaneez',14,2,NULL,NULL,'Issued','Khawar Ali',NULL,'34602-0714163-4','1978-05-13','Female','MSc','1848046-4',NULL,NULL,'A+',NULL,NULL,'03154038410',NULL,NULL,NULL,NULL,'2022-05-30','0005269221',NULL,NULL,NULL,NULL,1,'Jasoran, teh pasur dist, Sialkot','Sialkot','Pakistan','KSD Khayaban-e-firdosi road, johar town, Lahore','Lahore','Pakistan',200000,NULL,NULL,NULL,NULL,200000,3500,NULL,NULL,NULL,NULL,3500,'2024-12-31',116.67,NULL,'0000-00-00','0000-00-00','Khawar Ali','Husband','03133245551',NULL,NULL,'Zahrah',NULL,NULL,NULL,NULL,NULL,NULL,495000,'2022-05-19 19:08:58','2022-05-30 12:30:38',NULL,11,11,NULL,1),(5,5,NULL,'CE 01-5','2022-03-28','Khan',14,2,NULL,NULL,'Issued','Babar Ali Khan',NULL,'35202-2676898-5','1981-12-30','Male','D.A.E','5144586-6',NULL,NULL,'A+',NULL,NULL,'03054440525','03214751185','preps.rmos@kips.edu.pk',NULL,NULL,'2022-05-30','0007685209',NULL,NULL,NULL,NULL,1,'same',NULL,NULL,'107 umer street main town rehmania society johar town, Lahore.','Lahore','Pakistan',200000,NULL,NULL,NULL,NULL,200000,3500,NULL,NULL,NULL,NULL,3500,'2024-12-31',116.67,NULL,'0000-00-00','0000-00-00','Adeel Badar Khan','Brother','03214605716',NULL,NULL,'Humayun','Babar',NULL,NULL,NULL,NULL,NULL,495000,'2022-05-19 19:27:36','2024-08-02 18:14:15',NULL,11,11,NULL,1),(6,6,NULL,'CE 01-6','2022-02-28','Jawaid',14,2,NULL,NULL,'Issued','Muhammad Sharif',NULL,'35201-1707087-1','1956-10-11','Male','B.A','2891821-5','To recall old song and memories',NULL,'A+',NULL,NULL,'03032790000',NULL,'jawaidkhalid4@gmail.com',NULL,NULL,'2022-05-30','0005250833',NULL,NULL,NULL,NULL,1,'same',NULL,NULL,'181 Block B-1 MA Johar town, Lahore','Lahore','Pakistan',200000,NULL,NULL,NULL,NULL,200000,3500,NULL,NULL,NULL,NULL,3500,'2024-12-31',116.67,NULL,'0000-00-00','0000-00-00','Muhammad Salman','son','03214409053',NULL,NULL,'Khalid',NULL,NULL,NULL,NULL,NULL,NULL,495000,'2022-05-19 19:52:56','2022-05-30 12:34:16',NULL,11,11,NULL,1),(7,7,NULL,'CE 01-7','2022-02-28','Ahmed',14,2,NULL,NULL,'Issued','Nazir Ahmed',NULL,'35202-4503839-3','1963-03-30','Male','Grdauation','0194829-6',NULL,NULL,'A+',NULL,'04235188245','03054441179',NULL,'fahmad2001@gmail.com',NULL,NULL,'2022-05-30','0005270430',NULL,NULL,NULL,NULL,1,'same',NULL,NULL,'house no 35 block h-2 wapda town, Lahore.','Lahore','Pakistan',200000,NULL,NULL,NULL,NULL,200000,3500,NULL,NULL,NULL,NULL,3500,'2024-12-31',116.67,NULL,'0000-00-00','0000-00-00','Saleha Maqsood','Niece','03009888677',NULL,NULL,'Farooq',NULL,NULL,NULL,NULL,NULL,NULL,495000,'2022-05-19 20:01:52','2022-05-30 12:34:42',NULL,11,11,NULL,1),(8,8,NULL,'CE 01-8','2022-02-28','Iftikhar',14,2,NULL,NULL,'Issued','Iftikhar Ahmad',NULL,'36104-9627231-7','1984-04-12','Male','MPhil (Commerce)','7336574-8','To sped good time',NULL,'A+',NULL,'0652660898','03337725965',NULL,'hafizhamid1884@gmail.com',NULL,NULL,'2022-05-25','0005348511',NULL,NULL,NULL,NULL,1,'house #178, street 3 block 14 nawab colony shaheedroad main channu, Khanewal','Khanewal','Pakistan','348-M-Block Johar town, Lahore','Lahore','Pakistan',200000,NULL,NULL,NULL,NULL,200000,3500,NULL,NULL,NULL,NULL,3500,'2024-12-31',116.67,NULL,'0000-00-00','0000-00-00','Rafia Akram','Wife','03333761100',NULL,NULL,'Muhammad','Hamid',NULL,NULL,NULL,NULL,NULL,495000,'2022-05-19 20:09:17','2022-05-30 12:33:37',NULL,11,11,NULL,1),(9,9,NULL,'CS 5125','2022-12-28','Mahar',2,2,NULL,NULL,'In-Process','Malik Fateh Muhammad',NULL,'32402-1403067-1','1973-10-01','Male','BSc Engineering','3020449-6',NULL,NULL,'A+',NULL,'04235153020','03335680786',NULL,'addphed@gmail.com',NULL,NULL,'0000-00-00','5125',NULL,NULL,NULL,NULL,1,'Dajal district Ranjanpur','Ranjanpur','Pakistan','House # 2 PHED 2-C-7, Tipu chowk township, Lahore','Lahore','Pakistan',250000,NULL,NULL,NULL,NULL,250000,2500,NULL,NULL,NULL,NULL,2500,'2025-12-31',NULL,NULL,'0000-00-00','0000-00-00','Muhammad Rashid','Brother','03336488620',NULL,NULL,'Muhammad','Arshad',NULL,NULL,NULL,NULL,'47',495200,'2023-02-06 15:12:51','2023-02-06 15:12:51',NULL,45,45,NULL,NULL),(10,10,NULL,'CE 02-01','2023-05-29','Rashid',14,2,NULL,NULL,'In-Process','Rashid',NULL,'37405-0223625-3','2023-05-29','Male','cdsx',NULL,NULL,NULL,'A+','33',NULL,'323432432','432432','r545',NULL,NULL,'0000-00-00','0011484811',NULL,NULL,NULL,'Received Thru Naveed Butt Discover Pakistan',1,'Lahore','Lahore','Pakistan','Lahore','Lahore','Pakistan',0,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,0,'2025-12-31',0,NULL,'0000-00-00','0000-00-00','dsaf','fdsfd','34324',NULL,NULL,'Adil',NULL,NULL,NULL,NULL,NULL,NULL,495000,'2023-05-29 16:24:37','2023-05-29 17:23:37',NULL,9,3,NULL,NULL),(11,11,NULL,'CE 02-02','2023-05-29','Mustafa',14,2,NULL,NULL,'In-Process','Mustafa',NULL,'35202-2664518-5','2023-05-29','Male','fef',NULL,NULL,NULL,'A+',NULL,NULL,'3424332',NULL,'342432',NULL,NULL,'0000-00-00','0011460625',NULL,NULL,NULL,NULL,1,'Lahore','Lahore','Pakistan','Lahore','Lahore','Pakistan',0,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,0,'2025-12-31',0,NULL,'0000-00-00','0000-00-00','erewt','rwtr','43432',NULL,NULL,'Ghulam',NULL,NULL,NULL,NULL,NULL,NULL,495000,'2023-05-29 16:33:33','2023-05-29 17:24:02',NULL,9,3,NULL,NULL),(12,12,NULL,'CE 02-03','2023-05-29','Shah',14,2,NULL,NULL,'In-Process','Imran',NULL,'35201-1414671-7','2023-05-29','Male','3r43',NULL,NULL,NULL,'A+','32434',NULL,'243432',NULL,NULL,NULL,NULL,'0000-00-00','0011576932',NULL,NULL,NULL,NULL,1,'Lahore','Lahore','Pakistan','Lahore','Lahore','Pakistan',0,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL,0,'2025-12-31',0,NULL,'0000-00-00','0000-00-00','adsad',NULL,NULL,NULL,NULL,'Syed Ali','Imran',NULL,NULL,NULL,NULL,NULL,495000,'2023-05-29 16:38:29','2023-05-29 17:24:18',NULL,9,3,NULL,NULL);
/*!40000 ALTER TABLE `corporate_memberships` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:47
