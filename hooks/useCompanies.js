/**
 * Hook para manejar empresas (companies)
 * 
 * Este hook proporciona funcionalidades específicas para la gestión de empresas,
 * incluyendo validación automática de columnas y operaciones CRUD completas.
 * 
 * Funciones incluidas:
 * - getAllCompanies: Obtener todas las empresas con paginación
 * - getCompanyById: Obtener empresa específica por ID
 * - createCompany: Crear nueva empresa (requiere created_by)
 * - updateCompany: Actualizar empresa existente
 * - deleteCompany: Eliminar empresa
 * 
 * Columnas válidas: id, name, industry, address, contact_person, contact_email, 
 * contact_phone, created_by, created_at, updated_at
 * 
 * @returns {object} Objeto con funciones y estados para gestión de empresas
 */
import { useCRUD } from './useCRUD';
import { validateColumns } from './utils/tableColumns';

// Hook para manejar empresas
export const useCompanies = () => {
  const crud = useCRUD('companies');

  // Crear empresa con validación de columnas
  const createCompany = async (companyData) => {
    const validatedData = validateColumns('companies', companyData);
    return await crud.create(validatedData);
  };

  // Actualizar empresa con validación de columnas
  const updateCompany = async (id, companyData) => {
    const validatedData = validateColumns('companies', companyData);
    return await crud.update(id, validatedData);
  };

  return {
    companies: crud.data,
    loading: crud.loading,
    error: crud.error,
    getAllCompanies: crud.getAll,
    getCompanyById: crud.getById,
    createCompany,
    updateCompany,
    deleteCompany: crud.remove
  };
};
