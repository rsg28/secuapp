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
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_industry (industry),
    INDEX idx_status (status)
);

-- =====================================================
-- TABLA DE CATEGORÍAS DE SERVICIOS
-- =====================================================
CREATE TABLE service_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    description TEXT,
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
    category_id VARCHAR(36),
    is_template BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_title (title),
    INDEX idx_category (category_id),
    INDEX idx_template (is_template)
);

-- =====================================================
-- TABLA DE ELEMENTOS DE TEMPLATES CERRADOS
-- =====================================================
CREATE TABLE closed_template_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id VARCHAR(36) NOT NULL,
    item_id VARCHAR(50) NOT NULL, -- PQ-1, R1, V1, etc.
    text TEXT NOT NULL,
    category VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES closed_inspection_templates(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_item_id (item_id),
    INDEX idx_sort (sort_order)
);

-- =====================================================
-- TABLA DE TEMPLATES DE INSPECCIONES ABIERTAS
-- =====================================================
CREATE TABLE open_inspection_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    area VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_area (area)
);

-- =====================================================
-- TABLA DE PREGUNTAS PERSONALIZADAS (INSPECCIONES ABIERTAS)
-- =====================================================
CREATE TABLE custom_questions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id VARCHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES open_inspection_templates(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_sort (sort_order)
);

-- =====================================================
-- TABLA DE INSPECCIONES REALIZADAS
-- =====================================================
CREATE TABLE inspections (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_id VARCHAR(36),
    template_type ENUM('closed', 'open') NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    inspector_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('draft', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    inspection_date DATE,
    completion_date TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES closed_inspection_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_company (company_id),
    INDEX idx_inspector (inspector_id),
    INDEX idx_status (status),
    INDEX idx_date (inspection_date)
);

-- =====================================================
-- TABLA DE RESPUESTAS DE INSPECCIONES CERRADAS
-- =====================================================
CREATE TABLE inspection_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    inspection_id VARCHAR(36) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    response ENUM('C', 'CP', 'NC', 'NA') NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    UNIQUE KEY unique_item_response (inspection_id, item_id),
    INDEX idx_inspection (inspection_id),
    INDEX idx_response (response)
);

-- =====================================================
-- TABLA DE RESPUESTAS DE INSPECCIONES ABIERTAS
-- =====================================================
CREATE TABLE open_inspection_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    inspection_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES custom_questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_question_response (inspection_id, question_id),
    INDEX idx_inspection (inspection_id)
);

-- =====================================================
-- TABLA DE SERVICIOS DE MONITOREO
-- =====================================================
CREATE TABLE monitoring_services (
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
-- TABLA DE MONITOREOS REALIZADOS
-- =====================================================
CREATE TABLE monitoring_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    service_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    inspector_id VARCHAR(36) NOT NULL,
    monitoring_date DATE NOT NULL,
    results JSON, -- Para almacenar datos flexibles del monitoreo
    notes TEXT,
    status ENUM('draft', 'completed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_id) REFERENCES monitoring_services(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_service (service_id),
    INDEX idx_company (company_id),
    INDEX idx_inspector (inspector_id),
    INDEX idx_date (monitoring_date),
    INDEX idx_status (status)
);

-- =====================================================
-- TABLA DE HISTORIAL DE ACTIVIDADES
-- =====================================================
CREATE TABLE activity_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    activity_type ENUM('inspection', 'monitoring', 'template_created', 'company_added') NOT NULL,
    entity_type ENUM('inspection', 'monitoring', 'template', 'company') NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    metadata JSON, -- Datos adicionales específicos de la actividad
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_type (activity_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar categorías de servicios
INSERT INTO service_categories (id, name, icon, color, description) VALUES
('cat-001', 'Higiene Industrial', 'medical', '#8b5cf6', 'Templates de higiene industrial CCM2L'),
('cat-002', 'Productos Químicos', 'flask', '#ef4444', 'Templates de seguridad para productos químicos'),
('cat-003', 'Vestimenta', 'shirt', '#8b5cf6', 'Templates de inspección de vestimenta'),
('cat-004', 'Equipos', 'build', '#f59e0b', 'Templates de inspección de equipos'),
('cat-005', 'Instalaciones', 'business', '#10b981', 'Templates de inspección de instalaciones'),
('cat-006', 'Capacitación', 'school', '#06b6d4', 'Templates de capacitación'),
('cat-007', 'Almacén', 'cube', '#8b5cf6', 'Templates de inspección de almacén'),
('cat-008', 'Seguridad', 'shield-checkmark', '#22c55e', 'Templates de seguridad general');

-- Insertar servicios de monitoreo
INSERT INTO monitoring_services (id, name, description, icon, color) VALUES
('mon-001', 'Sonometría', 'Monitoreo de ruido', 'volume-high', '#10b981'),
('mon-002', 'Dosimetría de Ruido', 'Dosimetría de ruido', 'headset', '#10b981'),
('mon-003', 'Material Particulado', 'Monitoreo de material particulado', 'cloud', '#f59e0b'),
('mon-004', 'Polvo Respiratorio', 'Monitoreo de polvo respiratorio', 'water', '#f59e0b'),
('mon-005', 'Gases Tóxicos', 'Monitoreo de gases tóxicos', 'flask', '#ef4444'),
('mon-006', 'Iluminación', 'Monitoreo de iluminación', 'sunny', '#fbbf24'),
('mon-007', 'Vibraciones', 'Monitoreo de vibraciones', 'pulse', '#8b5cf6'),
('mon-008', 'Estrés Térmico', 'Monitoreo de estrés térmico', 'thermometer', '#f97316'),
('mon-009', 'Ergonomía Postural', 'Monitoreo ergonómico', 'body', '#ec4899');

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_inspections_company_date ON inspections(company_id, inspection_date);
CREATE INDEX idx_inspections_inspector_status ON inspections(inspector_id, status);
CREATE INDEX idx_monitoring_company_date ON monitoring_records(company_id, monitoring_date);
CREATE INDEX idx_activity_user_date ON activity_history(user_id, created_at);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
DELIMITER $$
CREATE TRIGGER update_users_timestamp 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
BEGIN 
    SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

CREATE TRIGGER update_companies_timestamp 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
BEGIN 
    SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

CREATE TRIGGER update_templates_timestamp 
    BEFORE UPDATE ON closed_inspection_templates 
    FOR EACH ROW 
BEGIN 
    SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

CREATE TRIGGER update_open_templates_timestamp 
    BEFORE UPDATE ON open_inspection_templates 
    FOR EACH ROW 
BEGIN 
    SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

CREATE TRIGGER update_inspections_timestamp 
    BEFORE UPDATE ON inspections 
    FOR EACH ROW 
BEGIN 
    SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

CREATE TRIGGER update_monitoring_timestamp 
    BEFORE UPDATE ON monitoring_records 
    FOR EACH ROW 
BEGIN 
    SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$
DELIMITER ;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para estadísticas de inspecciones
CREATE VIEW inspection_stats AS
SELECT 
    c.name as company_name,
    COUNT(i.id) as total_inspections,
    COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_inspections,
    COUNT(CASE WHEN i.status = 'in_progress' THEN 1 END) as in_progress_inspections,
    MAX(i.inspection_date) as last_inspection_date
FROM companies c
LEFT JOIN inspections i ON c.id = i.company_id
GROUP BY c.id, c.name;

-- Vista para templates con conteo de items
CREATE VIEW template_details AS
SELECT 
    t.id,
    t.title,
    t.description,
    sc.name as category_name,
    sc.color as category_color,
    COUNT(ti.id) as items_count,
    t.created_at,
    t.updated_at
FROM closed_inspection_templates t
LEFT JOIN service_categories sc ON t.category_id = sc.id
LEFT JOIN closed_template_items ti ON t.id = ti.template_id
GROUP BY t.id;

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =====================================================

-- Procedimiento para crear una nueva inspección
DELIMITER $$
CREATE PROCEDURE CreateInspection(
    IN p_template_id VARCHAR(36),
    IN p_company_id VARCHAR(36),
    IN p_inspector_id VARCHAR(36),
    IN p_title VARCHAR(255),
    OUT p_inspection_id VARCHAR(36)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    SET p_inspection_id = UUID();
    
    INSERT INTO inspections (id, template_id, template_type, company_id, inspector_id, title, inspection_date)
    VALUES (p_inspection_id, p_template_id, 'closed', p_company_id, p_inspector_id, p_title, CURDATE());
    
    -- Insertar en historial de actividades
    INSERT INTO activity_history (user_id, activity_type, entity_type, entity_id, description)
    VALUES (p_inspector_id, 'inspection', 'inspection', p_inspection_id, CONCAT('Nueva inspección creada: ', p_title));
    
    COMMIT;
END$$
DELIMITER ;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

/*
ESTRUCTURA DE LA BASE DE DATOS:

1. USUARIOS Y EMPRESAS:
   - users: Gestión de usuarios (managers/employees)
   - companies: Empresas clientes

2. TEMPLATES:
   - closed_inspection_templates: Templates de inspecciones cerradas
   - closed_template_items: Elementos de cada template
   - open_inspection_templates: Templates de inspecciones abiertas
   - custom_questions: Preguntas personalizadas

3. INSPECCIONES:
   - inspections: Inspecciones realizadas
   - inspection_responses: Respuestas de inspecciones cerradas
   - open_inspection_responses: Respuestas de inspecciones abiertas

4. MONITOREO:
   - monitoring_services: Servicios de monitoreo disponibles
   - monitoring_records: Registros de monitoreo realizados

5. AUDITORÍA:
   - activity_history: Historial de actividades del sistema

CARACTERÍSTICAS:
- UUIDs para IDs únicos y seguros
- Timestamps automáticos
- Índices optimizados
- Triggers para actualización automática
- Vistas para consultas complejas
- Procedimientos almacenados para operaciones comunes
- Integridad referencial con foreign keys
- Soporte para JSON para datos flexibles

ESCALABILIDAD:
- Índices compuestos para consultas frecuentes
- Particionado por fechas (implementar según necesidad)
- Archivo de datos antiguos (implementar según política de retención)
*/
