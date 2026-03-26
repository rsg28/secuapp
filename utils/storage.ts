import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SAVED_FORMS: 'savedForms',
  CUSTOM_CATEGORIES: 'customCategories',
  USER_SESSION: 'userSession',
  EMPLOYEES: 'employees',
  TEMPLATE_ID_MAP: 'templateIdMap',
  OFFLINE_ITEMS: 'offlineItems', // Inspecciones/AST/RALS creados offline (pendientes de sync)
  PENDING_DELETES: 'pendingDeletes', // IDs eliminados offline (pendientes de DELETE en API)
  CLOSED_TEMPLATES_PREFIX: 'closed_templates_user_',
  OPEN_TEMPLATES_PREFIX: 'open_templates_user_',
  CLOSED_TEMPLATE_ITEMS_PREFIX: 'closed_template_items_',
  OPEN_TEMPLATE_ITEMS_PREFIX: 'open_template_items_',
};

export const storage = {
  // Guardar formularios
  async saveForms(forms: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_FORMS, JSON.stringify(forms));
    } catch (error) {
      console.error('Error saving forms:', error);
    }
  },

  // Cargar formularios
  async loadForms(): Promise<any[]> {
    try {
      const forms = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_FORMS);
      return forms ? JSON.parse(forms) : [];
    } catch (error) {
      console.error('Error loading forms:', error);
      return [];
    }
  },

  // Agregar un formulario
  async addForm(form: any): Promise<void> {
    try {
      const forms = await this.loadForms();
      forms.push(form);
      await this.saveForms(forms);
    } catch (error) {
      console.error('Error adding form:', error);
    }
  },

  // Actualizar un formulario
  async updateForm(updatedForm: any): Promise<void> {
    try {
      const forms = await this.loadForms();
      const index = forms.findIndex((form: any) => form.id === updatedForm.id);
      if (index !== -1) {
        forms[index] = updatedForm;
        await this.saveForms(forms);
      }
    } catch (error) {
      console.error('Error updating form:', error);
    }
  },

  // Eliminar un formulario
  async deleteForm(formId: string): Promise<void> {
    try {
      const forms = await this.loadForms();
      const filteredForms = forms.filter((form: any) => form.id !== formId);
      await this.saveForms(filteredForms);
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  },

  // Guardar categorías personalizadas
  async saveCustomCategories(categories: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving custom categories:', error);
    }
  },

  // Cargar categorías personalizadas
  async loadCustomCategories(): Promise<any[]> {
    try {
      const categories = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
      return categories ? JSON.parse(categories) : [];
    } catch (error) {
      console.error('Error loading custom categories:', error);
      return [];
    }
  },

  // Limpiar todo el almacenamiento
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  // Autenticación y sesión de usuario
  async saveUserSession(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  },

  async getUserSession(): Promise<any | null> {
    try {
      const session = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error loading user session:', error);
      return null;
    }
  },

  async clearUserSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } catch (error) {
      console.error('Error clearing user session:', error);
    }
  },

  // Gestión de empleados
  async saveEmployees(employees: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch (error) {
      console.error('Error saving employees:', error);
    }
  },

  async loadEmployees(): Promise<any[]> {
    try {
      const employees = await AsyncStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      return employees ? JSON.parse(employees) : [];
    } catch (error) {
      console.error('Error loading employees:', error);
      return [];
    }
  },

  // Mapa de IDs de templates (clave sugerida: title::temp_category)
  async saveTemplateIdMap(map: Record<string, string>): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATE_ID_MAP, JSON.stringify(map));
    } catch (error) {
      console.error('Error saving template id map:', error);
    }
  },

  async loadTemplateIdMap(): Promise<Record<string, string>> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATE_ID_MAP);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('Error loading template id map:', error);
      return {};
    }
  },

  async addEmployee(employee: any): Promise<void> {
    try {
      const employees = await this.loadEmployees();
      employees.push(employee);
      await this.saveEmployees(employees);
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  },

  async updateEmployee(updatedEmployee: any): Promise<void> {
    try {
      const employees = await this.loadEmployees();
      const index = employees.findIndex((emp: any) => emp.id === updatedEmployee.id);
      if (index !== -1) {
        employees[index] = updatedEmployee;
        await this.saveEmployees(employees);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      const employees = await this.loadEmployees();
      const filteredEmployees = employees.filter((emp: any) => emp.id !== employeeId);
      await this.saveEmployees(filteredEmployees);
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  },

  // Gestión de empresas
  async saveCompanies(companies: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('companies', JSON.stringify(companies));
    } catch (error) {
      console.error('Error saving companies:', error);
    }
  },

  async loadCompanies(): Promise<any[]> {
    try {
      const companies = await AsyncStorage.getItem('companies');
      return companies ? JSON.parse(companies) : [];
    } catch (error) {
      console.error('Error loading companies:', error);
      return [];
    }
  },

  // Gestión de user templates
  async saveUserTemplates(templates: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('userTemplates', JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving user templates:', error);
    }
  },

  async loadUserTemplates(): Promise<any[]> {
    try {
      const templates = await AsyncStorage.getItem('userTemplates');
      return templates ? JSON.parse(templates) : [];
    } catch (error) {
      console.error('Error loading user templates:', error);
      return [];
    }
  },

  // Offline: items creados sin conexión (pendientes de sincronizar)
  async saveOfflineItems(items: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving offline items:', error);
    }
  },

  async loadOfflineItems(): Promise<any[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_ITEMS);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('Error loading offline items:', error);
      return [];
    }
  },

  async addOfflineItem(item: any): Promise<void> {
    const items = await this.loadOfflineItems();
    items.push(item);
    await this.saveOfflineItems(items);
  },

  async addPendingDelete(id: string): Promise<void> {
    const ids = await this.getPendingDeletes();
    if (!ids.includes(id)) {
      ids.push(id);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_DELETES, JSON.stringify(ids));
    }
  },

  async removePendingDelete(id: string): Promise<void> {
    const ids = (await this.getPendingDeletes()).filter((i) => i !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_DELETES, JSON.stringify(ids));
  },

  async getPendingDeletes(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_DELETES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async removeOfflineItem(id: string): Promise<void> {
    const items = await this.loadOfflineItems();
    const filtered = items.filter((i: any) => i.id !== id);
    await this.saveOfflineItems(filtered);
  },

  // Payload completo de inspección offline (response + items) para edición y sync
  OFFLINE_INSPECTION_PREFIX: 'offline_inspection_',

  async saveOfflineInspectionPayload(localId: string, payload: { response: any; items: any[] }): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.OFFLINE_INSPECTION_PREFIX}${localId}`,
        JSON.stringify(payload)
      );
    } catch (error) {
      console.error('Error saving offline inspection payload:', error);
    }
  },

  async getOfflineInspectionPayload(localId: string): Promise<{ response: any; items: any[] } | null> {
    try {
      const raw = await AsyncStorage.getItem(`${this.OFFLINE_INSPECTION_PREFIX}${localId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error loading offline inspection payload:', error);
      return null;
    }
  },

  async removeOfflineInspectionPayload(localId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.OFFLINE_INSPECTION_PREFIX}${localId}`);
    } catch (error) {
      console.error('Error removing offline inspection payload:', error);
    }
  },

  // Cache de templates (inspecciones cerradas/abiertas) para uso offline
  async saveClosedTemplatesForUser(userId: string, templates: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CLOSED_TEMPLATES_PREFIX}${userId}`,
        JSON.stringify(templates)
      );
    } catch (error) {
      console.error('Error saving closed templates cache:', error);
    }
  },

  async loadClosedTemplatesForUser(userId: string): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.CLOSED_TEMPLATES_PREFIX}${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error loading closed templates cache:', error);
      return null;
    }
  },

  async saveOpenTemplatesForUser(userId: string, templates: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.OPEN_TEMPLATES_PREFIX}${userId}`,
        JSON.stringify(templates)
      );
    } catch (error) {
      console.error('Error saving open templates cache:', error);
    }
  },

  async loadOpenTemplatesForUser(userId: string): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.OPEN_TEMPLATES_PREFIX}${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error loading open templates cache:', error);
      return null;
    }
  },

  async saveClosedTemplateItems(templateId: string, items: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CLOSED_TEMPLATE_ITEMS_PREFIX}${templateId}`,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error('Error saving closed template items cache:', error);
    }
  },

  async loadClosedTemplateItems(templateId: string): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.CLOSED_TEMPLATE_ITEMS_PREFIX}${templateId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error loading closed template items cache:', error);
      return null;
    }
  },

  async saveOpenTemplateItems(templateId: string, items: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.OPEN_TEMPLATE_ITEMS_PREFIX}${templateId}`,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error('Error saving open template items cache:', error);
    }
  },

  async loadOpenTemplateItems(templateId: string): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.OPEN_TEMPLATE_ITEMS_PREFIX}${templateId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error loading open template items cache:', error);
      return null;
    }
  },
};
