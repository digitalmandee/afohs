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
-- Table structure for table `corporate_mem_families`
--

DROP TABLE IF EXISTS `corporate_mem_families`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `corporate_mem_families` (
  `id` int(11) DEFAULT NULL,
  `member_id` int(11) DEFAULT NULL,
  `next_of_kin` text DEFAULT NULL,
  `relationship` text DEFAULT NULL,
  `name` text DEFAULT NULL,
  `date_of_birth` text DEFAULT NULL,
  `fam_relationship` int(11) DEFAULT NULL,
  `nationality` text DEFAULT NULL,
  `cnic` text DEFAULT NULL,
  `contact` text DEFAULT NULL,
  `maritial_status` text DEFAULT NULL,
  `fam_picture` text DEFAULT NULL,
  `sup_card_no` text DEFAULT NULL,
  `card_status` text DEFAULT NULL,
  `sup_card_issue` text DEFAULT NULL,
  `sup_card_exp` text DEFAULT NULL,
  `sup_barcode` text DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `member_name` text DEFAULT NULL,
  `membership_number` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `passport_no` text DEFAULT NULL,
  `title` text DEFAULT NULL,
  `first_name` text DEFAULT NULL,
  `middle_name` text DEFAULT NULL,
  `name_comment` text DEFAULT NULL,
  `gender` text DEFAULT NULL,
  `created_at` text DEFAULT NULL,
  `updated_at` text DEFAULT NULL,
  `deleted_at` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `deleted_by` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `corporate_mem_families`
--

LOCK TABLES `corporate_mem_families` WRITE;
/*!40000 ALTER TABLE `corporate_mem_families` DISABLE KEYS */;
INSERT INTO `corporate_mem_families` VALUES (1,1,NULL,NULL,'Salman','1978-01-04',4,'Pakistani','35202-3680778-8',NULL,'Married',NULL,'CE 01-1-A','Issued','2022-05-25','2024-12-31','0005317562',1,'Salman  Maqsood','CE 01-1',NULL,NULL,NULL,'Sadia',NULL,NULL,'Female','2022-05-19 17:40:37','2022-05-28 21:15:49',NULL,11,11,NULL),(2,1,NULL,NULL,'Ahmed','2003-09-30',2,'Pakistani','35202-7999813-9',NULL,'Single',NULL,'CE 01-1-B','Issued','2022-05-25','2024-12-31','0005285487',1,'Salman  Maqsood','CE 01-1',NULL,NULL,NULL,'Ammar',NULL,NULL,'Male','2022-05-19 18:20:55','2022-05-28 21:16:20',NULL,11,11,NULL),(3,1,NULL,NULL,'Salman','2006-08-15',3,'Pakistani','35202-6458023-8',NULL,'Single',NULL,'CE 01-1-C','Issued','2022-05-25','2024-12-31','0005239662',1,'Salman  Maqsood','CE 01-1',NULL,NULL,NULL,'Meerab',NULL,NULL,'Female','2022-05-19 18:21:46','2022-05-28 21:15:34',NULL,11,11,NULL),(4,1,NULL,NULL,'Salman','2010-10-31',3,'Pakistani','35202-7024351-6',NULL,'Single',NULL,'CE 01-1-D','Issued','2022-05-25','2024-12-31','0005203245',1,'Salman  Maqsood','CE 01-1',NULL,NULL,NULL,'Rania',NULL,NULL,'Other','2022-05-19 18:25:07','2022-05-28 21:16:08',NULL,11,11,NULL),(5,2,NULL,NULL,'Arshad','1970-01-01',4,'Pakistani','32102-8388871-4','03336182823','Married',NULL,'CE 01-2-A','Issued','2022-05-25','2024-12-31','0005195806',1,'Sheraz  Ahmad','CE 01-2',NULL,NULL,NULL,'Aiman',NULL,NULL,'Female','2022-05-19 18:42:06','2022-05-30 12:28:46',NULL,11,11,NULL),(6,2,NULL,NULL,'Ahmad','2022-05-19',2,'Pakistani','36302-3934611-1',NULL,'Single',NULL,'CE 01-2-B','Issued','0000-00-00','2024-12-31','01-2b',1,'Sheraz  Ahmad','CE 01-2',NULL,NULL,NULL,'Ezaan',NULL,NULL,'Male','2022-05-19 18:42:55','2022-05-30 12:28:46',NULL,11,11,NULL),(7,2,NULL,NULL,'Sheraz','2017-08-14',3,'Pakistani','36302-0966453-0',NULL,'Single',NULL,'CE 01-2-C','Issued','0000-00-00','2024-12-31','01-2c',1,'Sheraz  Ahmad','CE 01-2',NULL,NULL,NULL,'Urwa',NULL,NULL,'Female','2022-05-19 18:43:54','2022-05-30 12:28:46',NULL,11,11,NULL),(8,2,NULL,NULL,'Ahmad','2019-07-18',2,'Pakistani','36302-7516322-5',NULL,'Single',NULL,'CE 01-2-D','Issued','0000-00-00','2024-12-31','01-2d',1,'Sheraz  Ahmad','CE 01-2',NULL,NULL,NULL,'Shayan',NULL,NULL,'Male','2022-05-19 18:45:39','2022-05-30 12:28:46',NULL,11,11,NULL),(9,3,NULL,NULL,'Asad','2007-05-03',4,'Pakistani','37406-2985511-0','03364230747','Married',NULL,'CE 01-3-A','Issued','2022-05-25','2024-12-31','01-3a',1,'Asad Ullah Khan','CE 01-3',NULL,NULL,NULL,'Bushra',NULL,NULL,'Female','2022-05-19 18:59:48','2022-05-30 12:29:45',NULL,11,11,NULL),(10,3,NULL,NULL,'Khan','2008-07-07',2,'Pakistani','37406-1721717-9',NULL,'Single',NULL,'CE 01-3-B','Issued','2022-05-25','2024-12-31','01-3b',1,'Asad Ullah Khan','CE 01-3',NULL,NULL,NULL,'Abdullah',NULL,NULL,'Male','2022-05-19 19:00:40','2022-05-30 12:29:45',NULL,11,11,NULL),(11,3,NULL,NULL,'Khan','2010-12-27',2,'Pakistani','37406-8959562-3',NULL,'Single',NULL,'CE 01-3-C','Issued','2022-05-25','2024-12-31','01-3c',1,'Asad Ullah Khan','CE 01-3',NULL,NULL,NULL,'Omar','Aman Ullah',NULL,'Male','2022-05-19 19:01:38','2022-05-30 12:29:45',NULL,11,11,NULL),(12,3,NULL,NULL,'Khan','2018-09-23',2,'Pakistani','37406-7112894-7',NULL,'Single',NULL,'CE 01-3-D','Issued','2022-05-25','2024-12-31','01-3d',1,'Asad Ullah Khan','CE 01-3',NULL,NULL,NULL,'Mustafa','Ullah',NULL,'Male','2022-05-19 19:02:35','2022-05-30 12:29:45',NULL,11,11,NULL),(13,4,NULL,NULL,'Ali','1972-06-02',9,'Pakistani','34602-0439360-1','03133245551','Married',NULL,'CE 01-4-A','Issued','2022-05-25','2024-12-31','01-4a',1,'Zahrah  Kaneez','CE 01-4',NULL,NULL,NULL,'Khawar',NULL,NULL,'Male','2022-05-19 19:11:02','2022-05-30 12:30:38',NULL,11,11,NULL),(14,4,NULL,NULL,'Hadi','2013-03-11',2,'Pakistani','34602-5797104-3',NULL,'Single',NULL,'CE 01-4-B','Issued','0000-00-00','2022-05-19','01-4b',1,'Zahrah  Kaneez','CE 01-4',NULL,NULL,NULL,'Abdul',NULL,NULL,'Male','2022-05-19 19:13:14','2022-05-30 12:30:38',NULL,11,11,NULL),(15,5,NULL,NULL,'Humayun','1981-10-16',4,'Pakistani','37301-8071821-0',NULL,'Married',NULL,'CE 01-5-A','Issued','2022-05-25','2024-12-31','01-5a',1,'Humayun Babar Khan','CE 01-5',NULL,NULL,NULL,'Rabia',NULL,NULL,'Female','2022-05-19 19:28:44','2024-08-02 18:14:15',NULL,11,11,NULL),(16,5,NULL,NULL,'Muhammad','2006-09-20',2,'Pakistani','35202-6899968-5',NULL,'Single',NULL,'CE 01-5-B','Issued','2022-05-25','2024-12-31',NULL,1,'Humayun Babar Khan','CE 01-5',NULL,NULL,NULL,'Wali',NULL,NULL,'Male','2022-05-19 19:35:06','2024-08-02 18:14:15',NULL,11,11,NULL),(17,5,NULL,NULL,'Humayun','2008-10-05',3,'Pakistani','35202-3739712-8',NULL,'Single',NULL,'CE 01-5-C','Issued','2022-05-25','2024-12-31','01-5C',1,'Humayun Babar Khan','CE 01-5',NULL,NULL,NULL,'Nimra',NULL,NULL,'Female','2022-05-19 19:40:34','2024-08-02 18:14:15',NULL,11,11,NULL),(18,5,NULL,NULL,'Humayun','2012-10-22',3,'Pakistani','35202-9993601-2',NULL,'Single',NULL,'CE 01-5-D','Issued','2022-05-25','2024-12-31','01-5d',1,'Humayun Babar Khan','CE 01-5',NULL,NULL,NULL,'Areeba',NULL,NULL,'Female','2022-05-19 19:41:36','2024-08-02 18:14:15',NULL,11,11,NULL),(19,5,NULL,NULL,'Shaban','2017-04-29',2,'Pakistani','35202-9949670-3',NULL,'Single',NULL,'CE 01-5-E','Issued','0000-00-00','2024-12-31','01-5e',1,'Humayun Babar Khan','CE 01-5',NULL,NULL,NULL,'Muhammad',NULL,NULL,'Male','2022-05-19 19:44:13','2024-08-02 18:14:15',NULL,11,11,NULL),(20,6,NULL,NULL,'Khalid','1965-09-03',4,'Pakistani','35201-1567077-4',NULL,'Married',NULL,'CE 01-6-A','Issued','2022-05-25','2024-12-31','01-6a',1,'Khalid  Jawaid','CE 01-6',NULL,NULL,NULL,'Tasneem',NULL,NULL,'Female','2022-05-19 19:53:54','2022-05-30 12:34:16',NULL,11,11,NULL),(21,7,NULL,NULL,'Farooq','1964-07-31',4,'Pakistani','35202-5500598-8',NULL,'Married',NULL,'CE 01-7-A','Issued','2022-05-30','2024-12-31','01-7a',1,'Farooq  Ahmed','CE 01-7',NULL,NULL,NULL,'Ghazala',NULL,NULL,'Female','2022-05-19 20:02:50','2022-05-30 12:34:42',NULL,11,11,NULL),(22,7,NULL,NULL,'Farooq','2001-10-31',3,'Pakistani','35202-2511623-0',NULL,'Single',NULL,'CE 01-7-B','Issued','2022-05-25','2024-12-31','01-7b',1,'Farooq  Ahmed','CE 01-7',NULL,NULL,NULL,'Farah',NULL,NULL,'Female','2022-05-19 20:03:32','2022-05-30 12:34:42',NULL,11,11,NULL),(23,8,NULL,NULL,'Akram','1989-03-06',4,'Pakistani','33301-336608','03333761100','Married',NULL,'CE 01-8-A','Issued','2022-05-25','2024-12-31','01-8a',1,'Muhammad Hamid Iftikhar','CE 01-8',NULL,NULL,NULL,'Rafia',NULL,NULL,'Female','2022-05-19 20:13:47','2022-05-30 12:33:37',NULL,11,11,NULL),(24,8,NULL,NULL,'Hamid','2013-12-03',3,'Pakistani','556r7',NULL,'Single',NULL,'CE 01-8-B','Issued','2022-05-25','2024-12-31','01-8b',1,'Muhammad Hamid Iftikhar','CE 01-8',NULL,NULL,NULL,'Mahdiyah',NULL,NULL,'Female','2022-05-19 20:14:26','2022-05-30 12:33:37',NULL,11,11,NULL),(25,8,NULL,NULL,'Muhammad','2021-12-17',2,'Pakistani','76t67-t86',NULL,'Single',NULL,'CE 01-8-C','Issued','0000-00-00','2024-12-31','01-8c',1,'Muhammad Hamid Iftikhar','CE 01-8',NULL,NULL,NULL,'Fareh',NULL,NULL,'Male','2022-05-19 20:17:54','2022-05-30 12:33:37',NULL,11,11,NULL),(26,3,NULL,NULL,'Asad','2007-05-03',3,NULL,'37406-2985511',NULL,'Single',NULL,'CE 01-3-E','Issued','2022-05-24','2024-12-31','Ce 01-3E',1,'Asad Ullah Khan','CE 01-3',NULL,NULL,NULL,'Fatima',NULL,NULL,'Female','2022-05-24 16:09:12','2022-05-30 12:29:45',NULL,11,11,NULL),(27,9,NULL,NULL,'Rahim','1975-12-19',4,'Pakistani','32403-7635590-2',NULL,'Married',NULL,'CS 5125-A','Issued','0000-00-00','2025-12-31','5125a',1,'Muhammad Arshad Mahar','CS 5125',NULL,NULL,NULL,'Shazia',NULL,NULL,'Female','2023-02-06 15:13:46','2023-02-06 15:13:46',NULL,45,45,NULL);
/*!40000 ALTER TABLE `corporate_mem_families` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-12 17:34:45
