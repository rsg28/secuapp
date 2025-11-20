-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema aws-secu
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema aws-secu
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `aws-secu` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `aws-secu` ;

-- -----------------------------------------------------
-- Table `aws-secu`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `role` ENUM('manager', 'employee') NOT NULL DEFAULT 'employee',
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `is_active` TINYINT(1) NULL DEFAULT '1',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email` (`email` ASC) VISIBLE,
  INDEX `idx_email` (`email` ASC) VISIBLE,
  INDEX `idx_role` (`role` ASC) VISIBLE,
  INDEX `idx_active` (`is_active` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`closed_inspection_templates`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`closed_inspection_templates` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `temp_category` VARCHAR(255) NULL DEFAULT NULL,
  `created_by` VARCHAR(36) NULL DEFAULT NULL,
  `user_id` VARCHAR(36) NULL DEFAULT 'ALL',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `created_by` (`created_by` ASC) VISIBLE,
  INDEX `idx_title` (`title` ASC) VISIBLE,
  CONSTRAINT `closed_inspection_templates_ibfk_1`
    FOREIGN KEY (`created_by`)
    REFERENCES `aws-secu`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`companies`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`companies` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `industry` VARCHAR(100) NULL DEFAULT NULL,
  `address` TEXT NULL DEFAULT NULL,
  `contact_person` VARCHAR(255) NULL DEFAULT NULL,
  `contact_email` VARCHAR(255) NULL DEFAULT NULL,
  `contact_phone` VARCHAR(20) NULL DEFAULT NULL,
  `image_url` VARCHAR(500) NULL DEFAULT NULL,
  `created_by` VARCHAR(36) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `created_by` (`created_by` ASC) VISIBLE,
  INDEX `idx_name` (`name` ASC) VISIBLE,
  INDEX `idx_industry` (`industry` ASC) VISIBLE,
  INDEX `idx_image_url` (`image_url` ASC) VISIBLE,
  CONSTRAINT `companies_ibfk_1`
    FOREIGN KEY (`created_by`)
    REFERENCES `aws-secu`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`closed_inspection_responses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`closed_inspection_responses` (
  `id` VARCHAR(36) NOT NULL,
  `template_id` VARCHAR(36) NOT NULL,
  `company_id` VARCHAR(36) NOT NULL,
  `inspector_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `inspection_date` DATE NULL DEFAULT NULL,
  `completion_date` TIMESTAMP NULL DEFAULT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_template` (`template_id` ASC) VISIBLE,
  INDEX `idx_company` (`company_id` ASC) VISIBLE,
  INDEX `idx_inspector` (`inspector_id` ASC) VISIBLE,
  INDEX `idx_date` (`inspection_date` ASC) VISIBLE,
  CONSTRAINT `closed_inspection_responses_ibfk_1`
    FOREIGN KEY (`template_id`)
    REFERENCES `aws-secu`.`closed_inspection_templates` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `closed_inspection_responses_ibfk_2`
    FOREIGN KEY (`company_id`)
    REFERENCES `aws-secu`.`companies` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `closed_inspection_responses_ibfk_3`
    FOREIGN KEY (`inspector_id`)
    REFERENCES `aws-secu`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`closed_template_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`closed_template_items` (
  `id` VARCHAR(36) NOT NULL,
  `template_id` VARCHAR(36) NOT NULL,
  `category` VARCHAR(255) NULL DEFAULT NULL,
  `question_index` VARCHAR(20) NOT NULL,
  `text` TEXT NOT NULL,
  `question_type` ENUM('text', 'single_choice', 'multiple_choice') NULL DEFAULT 'text',
  `options` JSON NULL DEFAULT NULL,
  `sort_order` INT NULL DEFAULT '0',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_template` (`template_id` ASC) VISIBLE,
  INDEX `idx_question_index` (`question_index` ASC) VISIBLE,
  INDEX `idx_sort` (`sort_order` ASC) VISIBLE,
  INDEX `idx_question_type` (`question_type` ASC) VISIBLE,
  CONSTRAINT `closed_template_items_ibfk_1`
    FOREIGN KEY (`template_id`)
    REFERENCES `aws-secu`.`closed_inspection_templates` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`closed_inspection_response_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`closed_inspection_response_items` (
  `id` VARCHAR(36) NOT NULL,
  `response_id` VARCHAR(36) NOT NULL,
  `item_id` VARCHAR(36) NOT NULL,
  `question_index` VARCHAR(20) NOT NULL,
  `response` VARCHAR(500) NOT NULL,
  `explanation` TEXT NULL DEFAULT NULL,
  `image_url` VARCHAR(500) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_response_item` (`response_id` ASC, `item_id` ASC) VISIBLE,
  INDEX `idx_response` (`response_id` ASC) VISIBLE,
  INDEX `idx_item_id` (`item_id` ASC) VISIBLE,
  INDEX `idx_question_index` (`question_index` ASC) VISIBLE,
  INDEX `idx_response_type` (`response` ASC) VISIBLE,
  INDEX `idx_image_url` (`image_url` ASC) VISIBLE,
  CONSTRAINT `closed_inspection_response_items_ibfk_1`
    FOREIGN KEY (`response_id`)
    REFERENCES `aws-secu`.`closed_inspection_responses` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_response_item_template_item`
    FOREIGN KEY (`item_id`)
    REFERENCES `aws-secu`.`closed_template_items` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`open_inspection_templates`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`open_inspection_templates` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `temp_category` VARCHAR(255) NULL DEFAULT NULL,
  `created_by` VARCHAR(36) NULL DEFAULT NULL,
  `user_id` VARCHAR(36) NULL DEFAULT 'ALL',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `created_by` (`created_by` ASC) VISIBLE,
  INDEX `idx_title` (`title` ASC) VISIBLE,
  INDEX `idx_user_id` (`user_id` ASC) VISIBLE,
  CONSTRAINT `open_inspection_templates_ibfk_1`
    FOREIGN KEY (`created_by`)
    REFERENCES `aws-secu`.`users` (`id`)
    ON DELETE SET NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`open_template_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`open_template_items` (
  `id` VARCHAR(36) NOT NULL,
  `template_id` VARCHAR(36) NOT NULL,
  `category` VARCHAR(255) NULL DEFAULT NULL,
  `question_index` VARCHAR(20) NOT NULL,
  `text` TEXT NOT NULL,
  `question_type` ENUM('text', 'single_choice', 'multiple_choice') NULL DEFAULT 'text',
  `options` JSON NULL DEFAULT NULL,
  `sort_order` INT NULL DEFAULT '0',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_template` (`template_id` ASC) VISIBLE,
  INDEX `idx_question_index` (`question_index` ASC) VISIBLE,
  INDEX `idx_sort` (`sort_order` ASC) VISIBLE,
  INDEX `idx_question_type` (`question_type` ASC) VISIBLE,
  CONSTRAINT `open_template_items_ibfk_1`
    FOREIGN KEY (`template_id`)
    REFERENCES `aws-secu`.`open_inspection_templates` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`open_inspection_responses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`open_inspection_responses` (
  `id` VARCHAR(36) NOT NULL,
  `template_id` VARCHAR(36) NOT NULL,
  `company_id` VARCHAR(36) NOT NULL,
  `inspector_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `inspection_date` DATE NULL DEFAULT NULL,
  `completion_date` TIMESTAMP NULL DEFAULT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_template` (`template_id` ASC) VISIBLE,
  INDEX `idx_company` (`company_id` ASC) VISIBLE,
  INDEX `idx_inspector` (`inspector_id` ASC) VISIBLE,
  INDEX `idx_date` (`inspection_date` ASC) VISIBLE,
  CONSTRAINT `open_inspection_responses_ibfk_1`
    FOREIGN KEY (`template_id`)
    REFERENCES `aws-secu`.`open_inspection_templates` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `open_inspection_responses_ibfk_2`
    FOREIGN KEY (`company_id`)
    REFERENCES `aws-secu`.`companies` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `open_inspection_responses_ibfk_3`
    FOREIGN KEY (`inspector_id`)
    REFERENCES `aws-secu`.`users` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`open_inspection_response_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`open_inspection_response_items` (
  `id` VARCHAR(36) NOT NULL,
  `response_id` VARCHAR(36) NOT NULL,
  `item_id` VARCHAR(36) NOT NULL,
  `question_index` VARCHAR(20) NOT NULL,
  `response` TEXT NULL DEFAULT NULL,
  `image_url` VARCHAR(500) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_response_item` (`response_id` ASC, `item_id` ASC) VISIBLE,
  INDEX `idx_response` (`response_id` ASC) VISIBLE,
  INDEX `idx_item_id` (`item_id` ASC) VISIBLE,
  INDEX `idx_question_index` (`question_index` ASC) VISIBLE,
  INDEX `idx_image_url` (`image_url` ASC) VISIBLE,
  CONSTRAINT `fk_open_response_item_template_item`
    FOREIGN KEY (`item_id`)
    REFERENCES `aws-secu`.`open_template_items` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `open_inspection_response_items_ibfk_1`
    FOREIGN KEY (`response_id`)
    REFERENCES `aws-secu`.`open_inspection_responses` (`id`)
    ON DELETE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


-- -----------------------------------------------------
-- Table `aws-secu`.`services`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `aws-secu`.`services` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `icon` VARCHAR(50) NULL DEFAULT NULL,
  `color` VARCHAR(7) NULL DEFAULT NULL,
  `is_active` TINYINT(1) NULL DEFAULT '1',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_name` (`name` ASC) VISIBLE,
  INDEX `idx_active` (`is_active` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
