import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { storage } from '../utils/storage';

interface FormItem {
  id: string;
  text: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  items: FormItem[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom: boolean;
}

export default function CreateFormScreen() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    items: [],
  });

  const [newItemText, setNewItemText] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');

  // Cargar categorías personalizadas al iniciar
  useEffect(() => {
    loadCustomCategories();
  }, []);

  const loadCustomCategories = async () => {
    try {
      const customCategories = await storage.loadCustomCategories();
      setCategories(prev => {
        const defaultCategories = prev.filter(cat => !cat.isCustom);
        return [...defaultCategories, ...customCategories];
      });
    } catch (error) {
      console.error('Error loading custom categories:', error);
    }
  };

  const [categories, setCategories] = useState<Category[]>([
    { id: 'vestimenta', name: 'Vestimenta', icon: 'shirt', color: '#8b5cf6', isCustom: false },
    { id: 'quimicos', name: 'Químicos', icon: 'flask', color: '#ef4444', isCustom: false },
    { id: 'equipos', name: 'Equipos', icon: 'build', color: '#f59e0b', isCustom: false },
    { id: 'instalaciones', name: 'Instalaciones', icon: 'business', color: '#10b981', isCustom: false },
    { id: 'capacitacion', name: 'Capacitación', icon: 'school', color: '#06b6d4', isCustom: false },
    { id: 'almacen', name: 'Almacén', icon: 'cube', color: '#8b5cf6', isCustom: false },
    { id: 'seguridad', name: 'Seguridad', icon: 'shield-checkmark', color: '#22c55e', isCustom: false },
    { id: 'otros', name: 'Otros', icon: 'ellipsis-horizontal', color: '#6b7280', isCustom: false },
  ]);

  const handleBack = () => {
    if (formData.title || formData.description || formData.items.length > 0) {
      Alert.alert(
        '¿Descartar cambios?',
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: FormItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
      };
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setNewItemText('');
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
        name: newCategoryName.trim(),
        icon: 'ellipsis',
        color: newCategoryColor,
        isCustom: true,
      };

      try {
        const customCategories = await storage.loadCustomCategories();
        customCategories.push(newCategory);
        await storage.saveCustomCategories(customCategories);
        setCategories(prev => [...prev, newCategory]);
        setShowCategoryModal(false);
        setNewCategoryName('');
        setNewCategoryColor('#6366f1');
      } catch (error) {
        console.error('Error saving custom category:', error);
        Alert.alert('Error', 'No se pudo guardar la categoría personalizada');
      }
    }
  };

  const handleSaveForm = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el template');
      return;
    }

    if (!formData.category) {
      Alert.alert('Error', 'Por favor selecciona una categoría');
      return;
    }

    if (formData.items.length === 0) {
      Alert.alert('Error', 'Por favor agrega al menos un elemento al template');
      return;
    }

          try {
        const formToSave = {
          ...formData,
          id: Date.now().toString(),
          isTemplate: true,
          createdDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };

        await storage.addForm(formToSave);
        Alert.alert(
          'Template Guardado',
          'El template se ha guardado exitosamente',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } catch (error) {
        console.error('Error saving form:', error);
        Alert.alert('Error', 'No se pudo guardar el template');
      }
  };

  const renderFormItem = (item: FormItem) => (
    <View key={item.id} style={styles.formItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemText}>{item.text}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Ionicons name="close-circle" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header simplificado */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Crear Template</Text>
          <Text style={styles.headerSubtitle}>Nuevo template de inspección</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!formData.title || !formData.category || formData.items.length === 0) && styles.saveButtonDisabled
          ]} 
          onPress={handleSaveForm}
          disabled={!formData.title || !formData.category || formData.items.length === 0}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información básica del template */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Template</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Título *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Ej: Template de Inspección de Área de Trabajo"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe el propósito del template..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

                     <View style={styles.inputGroup}>
             <View style={styles.categoryHeader}>
               <Text style={styles.inputLabel}>Categoría *</Text>
               <TouchableOpacity 
                 style={styles.addCategoryButton}
                 onPress={() => setShowCategoryModal(true)}
               >
                 <Ionicons name="add-circle" size={20} color="#6366f1" />
               </TouchableOpacity>
             </View>
             
             {/* Selector de categoría expandible */}
             <TouchableOpacity 
               style={styles.categorySelector}
               onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
             >
               <View style={styles.categorySelectorContent}>
                 {formData.category ? (
                   <>
                     <Ionicons 
                       name={categories.find(cat => cat.id === formData.category)?.icon as any} 
                       size={20} 
                       color={categories.find(cat => cat.id === formData.category)?.color || '#6366f1'} 
                     />
                     <Text style={styles.categorySelectorTextSelected}>
                       {categories.find(cat => cat.id === formData.category)?.name}
                     </Text>
                   </>
                 ) : (
                   <>
                     <Ionicons name="folder-outline" size={20} color="#9ca3af" />
                     <Text style={styles.categorySelectorTextPlaceholder}>
                       Selecciona una categoría
                     </Text>
                   </>
                 )}
               </View>
               <Ionicons 
                 name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                 size={20} 
                 color="#6b7280" 
               />
             </TouchableOpacity>

             {/* Dropdown de categorías */}
             {showCategoryDropdown && (
               <View style={styles.categoryDropdown}>
                 <ScrollView 
                   showsVerticalScrollIndicator={false}
                   nestedScrollEnabled={true}
                 >
                   {categories.map((category) => (
                     <TouchableOpacity
                       key={category.id}
                       style={[
                         styles.categoryDropdownOption,
                         formData.category === category.id && styles.categoryDropdownOptionActive
                       ]}
                       onPress={() => {
                         setFormData(prev => ({ ...prev, category: category.id }));
                         setShowCategoryDropdown(false);
                       }}
                     >
                       <Ionicons 
                         name={category.icon as any} 
                         size={20} 
                         color={formData.category === category.id ? '#fff' : category.color} 
                       />
                       <Text style={[
                         styles.categoryDropdownOptionText,
                         formData.category === category.id && styles.categoryDropdownOptionTextActive
                       ]}>
                         {category.name}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </ScrollView>
               </View>
             )}
           </View>
        </View>

        {/* Elementos del template */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas del Template</Text>
          
          {/* Agregar nuevo elemento */}
          <View style={styles.addItemContainer}>
                         <TextInput
               style={styles.addItemInput}
               value={newItemText}
               onChangeText={setNewItemText}
               placeholder=""
               onSubmitEditing={handleAddItem}
             />
            <TouchableOpacity 
              style={styles.addItemButton} 
              onPress={handleAddItem}
              disabled={!newItemText.trim()}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Lista de elementos */}
          {formData.items.length > 0 && (
            <View style={styles.itemsList}>
              <Text style={styles.itemsListTitle}>
                Preguntas Agregadas ({formData.items.length})
              </Text>
              {formData.items.map(renderFormItem)}
            </View>
          )}

          {formData.items.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="list" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>
                No hay preguntas agregadas
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Agrega preguntas que se incluirán en el template
              </Text>
            </View>
          )}
        </View>

        {/* Información sobre el template */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Template</Text>
          <View style={styles.templateInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={20} color="#6366f1" />
              <Text style={styles.infoText}>
                Este template será utilizado para crear inspecciones reales
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="document-text" size={20} color="#10b981" />
              <Text style={styles.infoText}>
                Las preguntas se pueden personalizar al usar el template
              </Text>
            </View>
          </View>
        </View>

        {/* Espacio para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal para agregar categoría */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Categoría</Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Nombre de la categoría</Text>
              <TextInput
                style={styles.modalTextInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Ej: Mantenimiento"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Color</Text>
              <View style={styles.colorOptions}>
                {['#6366f1', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#ec4899'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonSave}
                onPress={handleAddCategory}
              >
                <Text style={styles.modalButtonTextSave}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
  },
  addCategoryText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 4,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categorySelectorTextSelected: {
    fontSize: 16,
    marginLeft: 8,
    color: '#1f2937',
    fontWeight: '500',
  },
  categorySelectorTextPlaceholder: {
    fontSize: 16,
    marginLeft: 8,
    color: '#9ca3af',
  },
  categoryDropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryDropdownOptionActive: {
    backgroundColor: '#f3f4f6',
  },
  categoryDropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  categoryDropdownOptionTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  addItemButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  predefinedSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  predefinedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  predefinedSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  predefinedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  predefinedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    maxWidth: '48%',
  },
  predefinedItemText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
    flex: 1,
  },
  itemsList: {
    marginTop: 20,
  },
  itemsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  formItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 22,
  },
  removeButton: {
    marginLeft: 12,
    padding: 4,
  },
  responseOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    minWidth: 100,
  },
  responseCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  responseText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginRight: 4,
  },
  responseLabel: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  explanationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  explanationInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fff',
    minHeight: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  responseInfo: {
    marginBottom: 16,
  },
  responseInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  responseInfoItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  responseInfoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  responseInfoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  responseInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  responseNote: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorOptionSelected: {
    borderColor: '#1f2937',
    borderWidth: 3,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  bottomSpacing: {
    height: 120,
  },
  companySelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  companySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companySelectorText: {
    fontSize: 16,
    marginLeft: 8,
  },
  companySelectorTextSelected: {
    color: '#1f2937',
    fontWeight: '500',
  },
  companySelectorTextPlaceholder: {
    color: '#9ca3af',
  },
  companiesList: {
    maxHeight: 300,
  },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  companyOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  companyOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  companyOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  companyOptionTextActive: {
    color: '#1e40af',
  },
  companyOptionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  companyOptionSubtextActive: {
    color: '#3b82f6',
  },
  templateInfo: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
});
