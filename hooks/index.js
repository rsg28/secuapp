/**
 * Archivo de índice para exportar todos los hooks
 * 
 * Este archivo centraliza todas las exportaciones de hooks para facilitar
 * la importación en otros componentes. Incluye hooks base, utilidades,
 * hooks de autenticación, conexión y hooks específicos para cada tabla.
 * 
 * Estructura:
 * - Hook base: useCRUD (reutilizable para todas las tablas)
 * - Utilidades: validateColumns, getTableColumns, TABLE_COLUMNS
 * - Autenticación: useAuth
 * - Conexión: useDatabaseConnection
 * - Entidades principales: useUsers, useCompanies, useServices
 * - Templates: useClosedInspectionTemplates, useOpenInspectionTemplates, etc.
 * - Respuestas: useClosedInspectionResponses, useOpenInspectionResponses, etc.
 * 
 * Uso: import { useCompanies, useAuth } from '../hooks';
 */
// Archivo de índice para exportar todos los hooks
// Esto facilita la importación en otros componentes

// Hook base reutilizable
export { useCRUD } from './useCRUD';

// Utilidades
export { validateColumns, getTableColumns, TABLE_COLUMNS } from './utils/tableColumns';

// Hooks de autenticación
export { useAuth } from './useAuth';

// Hooks de conexión
export { useDatabaseConnection } from './useDatabaseConnection';

// Hooks de entidades principales
export { useUsers } from './useUsers';
export { useCompanies } from './useCompanies';
export { useServices } from './useServices';

// Hooks de templates cerrados
export { useClosedInspectionTemplates } from './useClosedInspectionTemplates';
export { useClosedTemplateItems } from './useClosedTemplateItems';

// Hooks de templates abiertos
export { useOpenInspectionTemplates } from './useOpenInspectionTemplates';
export { useOpenTemplateItems } from './useOpenTemplateItems';

// Hooks de respuestas cerradas
export { useClosedInspectionResponses } from './useClosedInspectionResponses';
export { useClosedInspectionResponseItems } from './useClosedInspectionResponseItems';

// Hooks de respuestas abiertas
export { useOpenInspectionResponses } from './useOpenInspectionResponses';
export { useOpenInspectionResponseItems } from './useOpenInspectionResponseItems';
