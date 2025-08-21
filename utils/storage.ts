import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SAVED_FORMS: 'savedForms',
  CUSTOM_CATEGORIES: 'customCategories',
  USER_SESSION: 'userSession',
  EMPLOYEES: 'employees',
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
};
