/**
 * Utilidades para manejar las columnas correctas de cada tabla
 * 
 * Este archivo contiene las definiciones de todas las columnas válidas para cada tabla
 * de la base de datos, junto con funciones de validación para asegurar que solo se
 * envíen campos válidos al backend.
 * 
 * Funciones incluidas:
 * - TABLE_COLUMNS: Objeto con todas las columnas por tabla
 * - validateColumns: Filtra datos para incluir solo columnas válidas
 * - getTableColumns: Obtiene las columnas de una tabla específica
 * 
 * Uso: Importar y usar validateColumns antes de enviar datos al backend
 */
// Utilidades para manejar las columnas correctas de cada tabla

export const TABLE_COLUMNS = {
  // Tabla users
  users: [
    'id',
    'email', 
    'password_hash',
    'first_name',
    'last_name',
    'role',
    'phone',
    'is_active',
    'created_at',
    'updated_at'
  ],

  // Tabla companies
  companies: [
    'id',
    'name',
    'industry',
    'address',
    'contact_person',
    'contact_email',
    'contact_phone',
    'created_by',
    'created_at',
    'updated_at'
  ],

  // Tabla services
  services: [
    'id',
    'name',
    'description',
    'icon',
    'color',
    'is_active',
    'created_at'
  ],

  // Tabla closed_inspection_templates
  closed_inspection_templates: [
    'id',
    'title',
    'description',
    'created_by',
    'created_at',
    'updated_at'
  ],

  // Tabla closed_template_items
  closed_template_items: [
    'id',
    'template_id',
    'item_id',
    'question_index',
    'text',
    'sort_order',
    'created_at'
  ],

  // Tabla open_inspection_templates
  open_inspection_templates: [
    'id',
    'title',
    'description',
    'created_by',
    'created_at',
    'updated_at'
  ],

  // Tabla open_template_items
  open_template_items: [
    'id',
    'template_id',
    'item_id',
    'question_index',
    'text',
    'sort_order',
    'created_at'
  ],

  // Tabla closed_inspection_responses
  closed_inspection_responses: [
    'id',
    'template_id',
    'company_id',
    'inspector_id',
    'title',
    'inspection_date',
    'completion_date',
    'notes',
    'created_at',
    'updated_at'
  ],

  // Tabla closed_inspection_response_items
  closed_inspection_response_items: [
    'id',
    'response_id',
    'item_id',
    'question_index',
    'response',
    'explanation',
    'created_at',
    'updated_at'
  ],

  // Tabla open_inspection_responses
  open_inspection_responses: [
    'id',
    'template_id',
    'company_id',
    'inspector_id',
    'title',
    'inspection_date',
    'completion_date',
    'notes',
    'created_at',
    'updated_at'
  ],

  // Tabla open_inspection_response_items
  open_inspection_response_items: [
    'id',
    'response_id',
    'item_id',
    'question_index',
    'response',
    'created_at',
    'updated_at'
  ]
};

// Función para validar que los datos contengan solo las columnas correctas
export const validateColumns = (tableName, data) => {
  const allowedColumns = TABLE_COLUMNS[tableName];
  if (!allowedColumns) {
    throw new Error(`Tabla ${tableName} no encontrada`);
  }

  const filteredData = {};
  Object.keys(data).forEach(key => {
    if (allowedColumns.includes(key)) {
      filteredData[key] = data[key];
    }
  });

  return filteredData;
};

// Función para obtener las columnas de una tabla
export const getTableColumns = (tableName) => {
  return TABLE_COLUMNS[tableName] || [];
};
