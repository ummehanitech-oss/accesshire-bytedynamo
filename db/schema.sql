-- =============================================================================
-- AccessHire - Draft MySQL Database Schema
-- Team ByteDynamo | RepoForge Hackathon | PS003
--
-- NOTE: This is a draft relational schema for future MySQL migration.
-- Currently, the application stores data locally via server/src/storage.js
-- in server/data/profile.json and server/data/applications.json.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS accesshire_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE accesshire_db;

-- -----------------------------------------------------------------------------
-- Table: profiles
-- Stores candidate details, background, and accessibility preferences.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NULL,
  years_experience DECIMAL(4, 1) NOT NULL DEFAULT 0.0,
  education VARCHAR(255) NULL,
  accessibility_preference ENUM('voice', 'keyboard', 'screen-reader', 'simplified', '') NOT NULL DEFAULT '' COMMENT 'Accessibility mode: voice, keyboard, screen-reader, simplified, or empty string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: profile_skills
-- Relational store for normalized candidate skills.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_skills_profile
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
    ON DELETE CASCADE,
  INDEX idx_profile_skill (profile_id, skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: job_analyses
-- Stores analyzed job postings, Gemini breakdown, compatibility, and source URL.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_analyses (
  id VARCHAR(64) PRIMARY KEY COMMENT 'Unique application identifier e.g. job_1727850000_abc12',
  profile_id INT NULL COMMENT 'Associated candidate profile ID if logged in',
  job_title VARCHAR(255) NOT NULL DEFAULT 'Job Position',
  company VARCHAR(255) NOT NULL DEFAULT 'Unknown Company',
  source_url VARCHAR(2048) NULL COMMENT 'Nullable web link if imported from a public job page',
  raw_job_text MEDIUMTEXT NOT NULL COMMENT 'Raw job text extracted from paste, file, or URL',
  summary TEXT NOT NULL COMMENT 'Plain English summary (max 5 short sentences)',
  compatibility_score TINYINT UNSIGNED NULL COMMENT 'Score between 0 and 100, or NULL if profile empty',
  score_reason TEXT NULL COMMENT 'Explanation of compatibility match',
  required_skills_json JSON NOT NULL COMMENT 'JSON array of required skills',
  nice_to_have_skills_json JSON NOT NULL COMMENT 'JSON array of optional/preferred skills',
  documents_needed_json JSON NOT NULL COMMENT 'JSON array of required application documents',
  information_needed_json JSON NOT NULL COMMENT 'JSON array of information needed before applying',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_analyses_profile
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
    ON DELETE SET NULL,
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: analysis_steps
-- Ordered, actionable step-by-step application instructions.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id VARCHAR(64) NOT NULL,
  step_order INT NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_steps_analysis
    FOREIGN KEY (analysis_id) REFERENCES job_analyses(id)
    ON DELETE CASCADE,
  INDEX idx_analysis_steps_order (analysis_id, step_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: checklist_progress
-- Tracks completion status for individual checklist steps per job analysis.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id VARCHAR(64) NOT NULL,
  step_index INT NOT NULL COMMENT '0-based index of the application step',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progress_analysis
    FOREIGN KEY (analysis_id) REFERENCES job_analyses(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_analysis_step (analysis_id, step_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Initial Seed Data (Design example)
-- -----------------------------------------------------------------------------
INSERT INTO profiles (id, full_name, email, years_experience, education, summary, accessibility_preference)
VALUES (
  1,
  'Alex Taylor',
  'alex.taylor@example.com',
  2.0,
  'Associate Degree / Self-Taught',
  'Frontend developer passionate about building clean, accessible web interfaces.',
  'screen-reader'
) ON DUPLICATE KEY UPDATE id=id;

INSERT INTO profile_skills (profile_id, skill_name) VALUES
  (1, 'JavaScript'),
  (1, 'React'),
  (1, 'HTML'),
  (1, 'CSS'),
  (1, 'Communication'),
  (1, 'Problem Solving')
ON DUPLICATE KEY UPDATE profile_id=profile_id;
