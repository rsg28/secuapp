/**
 * Hook para manejar usuarios (users)
 * 
 * Este hook proporciona funcionalidades específicas para la gestión de usuarios,
 * incluyendo validación automática de columnas y operaciones CRUD completas.
 * 
 * Funciones incluidas:
 * - getAllUsers: Obtener todos los usuarios con paginación
 * - getUserById: Obtener usuario específico por ID
 * - createUser: Crear nuevo usuario (requiere email, password, first_name, last_name)
 * - updateUser: Actualizar usuario existente
 * - deleteUser: Eliminar usuario
 * 
 * Columnas válidas: id, email, password_hash, first_name, last_name, role, 
 * phone, is_active, created_at, updated_at
 * 
 * @returns {object} Objeto con funciones y estados para gestión de usuarios
 */
import { useCRUD } from './useCRUD';
import { validateColumns } from './utils/tableColumns';

// Hook para manejar usuarios
export const useUsers = () => {
  const crud = useCRUD('users');

  // Crear usuario con validación de columnas
  const createUser = async (userData) => {
    const validatedData = validateColumns('users', userData);
    return await crud.create(validatedData);
  };

  // Actualizar usuario con validación de columnas
  const updateUser = async (id, userData) => {
    const validatedData = validateColumns('users', userData);
    return await crud.update(id, validatedData);
  };

  return {
    users: crud.data,
    loading: crud.loading,
    error: crud.error,
    getAllUsers: crud.getAll,
    getUserById: crud.getById,
    createUser,
    updateUser,
    deleteUser: crud.remove
  };
};
