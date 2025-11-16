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
 * image_url, created_at, updated_at (SIN explanation)
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

  const fetchItemsByResponseId = async (responseId) => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('authToken');
    const API_BASE_URL = 'https://www.securg.xyz/api/v1';

    const response = await fetch(`${API_BASE_URL}/open-inspection-response-items/response/${responseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener items de respuesta');
    }

    const data = await response.json();
    return data.data.items;
  };

  return {
    items: crud.data,
    loading: crud.loading,
    error: crud.error,
    getAllItems: crud.getAll,
    getItemById: crud.getById,
    createItem,
    updateItem,
    deleteItem: crud.remove,
    getItemsByResponseId: fetchItemsByResponseId,
    countItemsByResponseId: async (responseId) => {
      const items = await fetchItemsByResponseId(responseId);
      return items.length;
    }
  };
};
