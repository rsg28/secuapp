/**
 * Hook para manejar items de respuestas de inspecciones abiertas
 * 
 * Este hook proporciona funcionalidades específicas para la gestión de items
 * de respuestas de inspecciones abiertas, incluyendo validación automática
 * de columnas y operaciones CRUD completas.
 * 
 * IMPORTANTE: Esta tabla NO incluye la columna 'explanation' (a diferencia
 * de closed_inspection_response_items que sí la incluye).
 * 
 * Funciones incluidas:
 * - getAllItems: Obtener todos los items con paginación
 * - getItemById: Obtener item específico por ID
 * - createItem: Crear nuevo item de respuesta
 * - updateItem: Actualizar item existente
 * - deleteItem: Eliminar item
 * 
 * Columnas válidas: id, response_id, item_id, question_index, response, 
 * created_at, updated_at (SIN explanation)
 * 
 * @returns {object} Objeto con funciones y estados para gestión de items de respuestas abiertas
 */
import { useCRUD } from './useCRUD';
import { validateColumns } from './utils/tableColumns';

// Hook para manejar items de respuestas abiertas
export const useOpenInspectionResponseItems = () => {
  const crud = useCRUD('open-inspection-response-items');

  // Crear item con validación de columnas (SIN explanation)
  const createItem = async (itemData) => {
    const validatedData = validateColumns('open_inspection_response_items', itemData);
    return await crud.create(validatedData);
  };

  // Actualizar item con validación de columnas (SIN explanation)
  const updateItem = async (id, itemData) => {
    const validatedData = validateColumns('open_inspection_response_items', itemData);
    return await crud.update(id, validatedData);
  };

  return {
    items: crud.data,
    loading: crud.loading,
    error: crud.error,
    getAllItems: crud.getAll,
    getItemById: crud.getById,
    createItem,
    updateItem,
    deleteItem: crud.remove
  };
};
