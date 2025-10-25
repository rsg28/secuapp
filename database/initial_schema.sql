-- =====================================================
-- SECUAPP - Base de Datos Inicial
-- AWS RDS MySQL/PostgreSQL Schema
-- =====================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS secuapp_db;
USE secuapp_db;

-- =====================================================
-- TABLA DE USUARIOS
-- =====================================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('manager', 'employee') NOT NULL DEFAULT 'employee',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- =====================================================
-- TABLA DE EMPRESAS
-- =====================================================
CREATE TABLE companies (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    address TEXT,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_industry (industry)
);

-- =====================================================
-- TABLA DE SERVICIOS
-- =====================================================
CREATE TABLE services (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);

-- =====================================================
-- TABLA DE TEMPLATES DE INSPECCIONES CERRADAS
-- =====================================================
CREATE TABLE closed_inspection_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_title (title)
);

-- =====================================================
-- TABLA DE ELEMENTOS DE TEMPLATES CERRADOS
-- =====================================================
CREATE TABLE closed_template_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id VARCHAR(36) NOT NULL,
    item_id VARCHAR(50) NOT NULL, -- ID randomizado
    question_index VARCHAR(20) NOT NULL, -- 1, 2a, 3b, A1, B2, etc.
    text TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES closed_inspection_templates(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_item_id (item_id),
    INDEX idx_question_index (question_index),
    INDEX idx_sort (sort_order)
);

-- =====================================================
-- TABLA DE TEMPLATES DE INSPECCIONES ABIERTAS
-- =====================================================
CREATE TABLE open_inspection_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_title (title)
);

-- =====================================================
-- TABLA DE ELEMENTOS DE TEMPLATES ABIERTOS
-- =====================================================
CREATE TABLE open_template_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id VARCHAR(36) NOT NULL,
    item_id VARCHAR(50) NOT NULL, -- ID randomizado
    question_index VARCHAR(20) NOT NULL, -- 1, 2a, 3b, A1, B2, etc.
    text TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES open_inspection_templates(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_item_id (item_id),
    INDEX idx_question_index (question_index),
    INDEX idx_sort (sort_order)
);

-- =====================================================
-- TABLA DE RESPUESTAS DE INSPECCIONES CERRADAS (FORMULARIOS COMPLETADOS)
-- =====================================================
CREATE TABLE closed_inspection_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    inspector_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    inspection_date DATE,
    completion_date TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES closed_inspection_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_company (company_id),
    INDEX idx_inspector (inspector_id),
    INDEX idx_date (inspection_date)
);

-- =====================================================
-- TABLA DE RESPUESTAS DE INSPECCIONES ABIERTAS (FORMULARIOS COMPLETADOS)
-- =====================================================
CREATE TABLE open_inspection_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    inspector_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    inspection_date DATE,
    completion_date TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES open_inspection_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_company (company_id),
    INDEX idx_inspector (inspector_id),
    INDEX idx_date (inspection_date)
);

-- =====================================================
-- TABLA DE ITEMS DE RESPUESTAS DE INSPECCIONES CERRADAS (RESPUESTAS INDIVIDUALES)
-- =====================================================
CREATE TABLE closed_inspection_response_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    response_id VARCHAR(36) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    question_index VARCHAR(20) NOT NULL,
    response ENUM('C', 'CP', 'NC', 'NA') NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (response_id) REFERENCES closed_inspection_responses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response_item (response_id, item_id),
    INDEX idx_response (response_id),
    INDEX idx_item_id (item_id),
    INDEX idx_question_index (question_index),
    INDEX idx_response_type (response)
);

-- =====================================================
-- TABLA DE ITEMS DE RESPUESTAS DE INSPECCIONES ABIERTAS (RESPUESTAS INDIVIDUALES)
-- =====================================================
CREATE TABLE open_inspection_response_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    response_id VARCHAR(36) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    question_index VARCHAR(20) NOT NULL,
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (response_id) REFERENCES open_inspection_responses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response_item (response_id, item_id),
    INDEX idx_response (response_id),
    INDEX idx_item_id (item_id),
    INDEX idx_question_index (question_index)
);
