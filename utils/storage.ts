import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SAVED_FORMS: 'savedForms',
  CUSTOM_CATEGORIES: 'customCategories',
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
};
