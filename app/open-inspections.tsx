import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useOpenInspectionTemplates } from '../hooks/useOpenInspectionTemplates';
import { useOpenTemplateItems } from '../hooks/useOpenTemplateItems';

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  isTemplate: boolean;
  createdDate: string;
  lastModified: string;
  itemCount: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function OpenInspectionsScreen() {
  const { user } = useAuth();
  const { templates, createTemplate, deleteTemplate, getTemplatesByUserId, getAllTemplates, updateTemplate } = useOpenInspectionTemplates();
  const { getItemsByTemplateId, createItem, deleteItem, updateItem } = useOpenTemplateItems();
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<Category[]>([]);
  
  // States for creating new template
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('');
  const [newTemplateItems, setNewTemplateItems] = useState<Array<{text: string, category: string}>>([{text: '', category: ''}]);
  
  // States for viewing items
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedTemplateItems, setSelectedTemplateItems] = useState<Array<{category: string, items: any[]}>>([]);
  
  // States for editing template
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [editTemplateTitle, setEditTemplateTitle] = useState('');
  const [editTemplateDescription, setEditTemplateDescription] = useState('');
  const [editTemplateCategory, setEditTemplateCategory] = useState('');
  const [editTemplateItems, setEditTemplateItems] = useState<Array<{id?: string, text: string, category: string}>>([]);

  const isRefreshing = useRef(false);
  const isScreenActive = useRef(false);

  const refreshTemplates = React.useCallback(async () => {
    if (!isScreenActive.current) {
      return;
    }
    if (isRefreshing.current) {
      return;
    }
    if (!user?.id) {
      setFormTemplates([]);
      return;
    }
    isRefreshing.current = true;
    try {
      await getTemplatesByUserId(user.id, 1, 100);
    } catch (error) {
      console.error('Error refreshing open templates:', error);
      throw error;
    } finally {
      isRefreshing.current = false;
    }
  }, [user?.id, getTemplatesByUserId]);

  // Convertir templates de DB a formato FormTemplate cuando cambien
  useEffect(() => {
    if (templates && templates.length > 0) {
      const dbTemplates: FormTemplate[] = templates.map((template: any) => ({
        id: template.id,
        title: template.title,
        description: template.description || '',
        category: template.temp_category || 'productos-quimicos',
        isTemplate: true,
        createdDate: template.created_at ? new Date(template.created_at).toISOString().split('T')[0] : '2024-01-01',
        lastModified: template.updated_at ? new Date(template.updated_at).toISOString().split('T')[0] : '2024-01-01',
        itemCount: 0,
      }));

      setFormTemplates(dbTemplates);
    } else {
      setFormTemplates([]);
    }
  }, [templates]);

  // Detectar categorías únicas de los templates y actualizar dynamicCategories
  useEffect(() => {
    // Usar templates directamente de la base de datos para detectar categorías
    if (templates && templates.length > 0) {
      // Obtener todas las categorías únicas de temp_category
      const uniqueCategories = [...new Set(
        templates
          .map((template: any) => template.temp_category)
          .filter((cat: string | null) => cat && cat.trim() !== '')
      )];
      
      // Crear categorías dinámicas con color uniforme
      const detectedCategories: Category[] = uniqueCategories.map(category => {
        return {
          id: category,
          name: category,
          icon: '',
          color: '#6366f1',
        };
      }).sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabéticamente
      
      setDynamicCategories(detectedCategories);
    } else if (formTemplates && formTemplates.length > 0) {
      // Fallback: usar formTemplates si templates no está disponible
      const uniqueCategories = [...new Set(formTemplates.map(template => template.category))];
      
      const detectedCategories: Category[] = uniqueCategories.map(category => {
        return {
          id: category,
          name: category,
          icon: '',
          color: '#6366f1',
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      
      setDynamicCategories(detectedCategories);
    }
  }, [templates, formTemplates]);

  // Cargar formularios guardados al iniciar
  useEffect(() => {
    loadSavedForms();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      isScreenActive.current = true;
      loadSavedForms();
      refreshTemplates().catch(() => {});
      return () => {
        isScreenActive.current = false;
      };
    }, [refreshTemplates])
  );

  const loadSavedForms = async () => {
    try {
      // Para inspecciones abiertas preferimos reflejar exactamente
      // lo que viene desde la base de datos. Si no hay templates
      // guardados en el backend, mostramos la lista vacía.
      if (!templates || templates.length === 0) {
        setFormTemplates([]);
      }
    } catch (error) {
      setFormTemplates([]);
    }
  };

  const categories: Category[] = [
    { id: 'todos', name: 'Todos', icon: '', color: '#6366f1' },
  ];

  const getFilteredForms = () => {
    if (selectedCategory === 'todos') {
      return formTemplates;
    }
    // Filtrar por categoría, comparando de forma insensible a mayúsculas/minúsculas y espacios
    return formTemplates.filter(form => {
      const formCategory = (form.category || '').trim().toLowerCase();
      const selectedCat = selectedCategory.trim().toLowerCase();
      return formCategory === selectedCat;
    });
  };

  const getAvailableCategories = () => {
    // Siempre mostrar "Todos"
    const availableCategories = [categories[0]]; // "Todos" es el primero
    
    // Usar las categorías dinámicas detectadas de la base de datos
    if (dynamicCategories && dynamicCategories.length > 0) {
      availableCategories.push(...dynamicCategories);
    }
    
    return availableCategories;
  };

  const handleAddForm = () => {
    setNewTemplateTitle('');
    setNewTemplateDescription('');
    setNewTemplateCategory('');
    setNewTemplateItems([{text: '', category: ''}]);
    setShowCreateModal(true);
  };
  
  const handleCreateTemplate = async () => {
    // Validate inputs
    if (!newTemplateTitle.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    if (!newTemplateCategory.trim()) {
      Alert.alert('Error', 'La categoría es requerida');
      return;
    }
    if (!newTemplateDescription.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    
    // Check if a template with the same title + category already exists
    const existingTemplate = templates.find(
      (t: any) => t.title.toLowerCase() === newTemplateTitle.trim().toLowerCase() && 
                  t.temp_category?.toLowerCase() === newTemplateCategory.trim().toLowerCase()
    );
    
    if (existingTemplate) {
      Alert.alert('Error', 'Ya existe un template con este título y categoría');
      return;
    }
    
    let createdTemplate: any = null;
    
    try {
      // Get user info for created_by
      const userId = user?.id;
      if (!userId) {
        Alert.alert('Error', 'No se pudo identificar al usuario');
        return;
      }
      
      // Create template
      const templateData = {
        title: newTemplateTitle.trim(),
        description: newTemplateDescription.trim(),
        temp_category: newTemplateCategory.trim(),
        created_by: userId,
        user_id: userId
      };
      
      createdTemplate = await createTemplate(templateData);
      
      // Filter valid items (with both text and category)
      const validItems = newTemplateItems.filter(item => item.text.trim() && item.category.trim());
      
      // Create items for the template if there are any
      if (validItems.length > 0) {
        const createdItems: any[] = [];
        let itemsError: any = null;
        
        try {
          for (let i = 0; i < validItems.length; i++) {
            const item = validItems[i];
            try {
              const createdItem = await createItem({
                template_id: createdTemplate.id,
                category: item.category.trim(),
                question_index: (i + 1).toString(),
                text: item.text.trim(),
                sort_order: i + 1
              });
              createdItems.push(createdItem);
            } catch (itemError: any) {
              console.error(`Error creando item ${i + 1}:`, itemError);
              itemsError = itemError;
              throw itemError; // Stop creating more items if one fails
            }
          }
        } catch (itemError: any) {
          // If item creation failed, try to delete the template (rollback)
          if (createdTemplate?.id) {
            try {
              await deleteTemplate(createdTemplate.id);
            } catch (deleteError) {
              console.error('Error al eliminar template después de fallo en items:', deleteError);
            }
          }
          
          const errorMessage = itemError?.message || 'Error al crear los items del template';
          Alert.alert('Error', `${errorMessage}. El template no fue creado.`);
          return;
        }
      }
      
      // Refresh templates list from database
      await refreshTemplates();
      
      // Close modal and reset
      setShowCreateModal(false);
      setNewTemplateTitle('');
      setNewTemplateDescription('');
      setNewTemplateCategory('');
      setNewTemplateItems([{text: '', category: ''}]);
      
      Alert.alert('Éxito', 'Template creado correctamente');
    } catch (error: any) {
      // If template creation failed, try to clean up
      if (createdTemplate?.id) {
        try {
          await deleteTemplate(createdTemplate.id);
        } catch (deleteError) {
          console.error('Error al limpiar template después de error:', deleteError);
        }
      }
      
      const errorMessage = error?.message || 'No se pudo crear el template';
      console.error('Error creando template:', error);
      Alert.alert('Error', errorMessage);
    }
  };
  
  const addNewItem = () => {
    setNewTemplateItems([...newTemplateItems, {text: '', category: ''}]);
  };
  
  const updateNewItem = (index: number, field: 'text' | 'category', value: string) => {
    const updatedItems = [...newTemplateItems];
    updatedItems[index][field] = value;
    setNewTemplateItems(updatedItems);
  };
  
  const removeNewItem = (index: number) => {
    if (newTemplateItems.length > 1) {
      setNewTemplateItems(newTemplateItems.filter((_, i) => i !== index));
    }
  };
  
  const addEditItem = () => {
    setEditTemplateItems([...editTemplateItems, {text: '', category: ''}]);
  };
  
  const updateEditItem = (index: number, field: 'text' | 'category', value: string) => {
    const updatedItems = [...editTemplateItems];
    updatedItems[index][field] = value;
    setEditTemplateItems(updatedItems);
  };
  
  const removeEditItem = (index: number) => {
    if (editTemplateItems.length > 1) {
      setEditTemplateItems(editTemplateItems.filter((_, i) => i !== index));
    }
  };

  const handleFormPress = async (form: FormTemplate) => {
    try {
      // Fetch items for this template
      const items = await getItemsByTemplateId(form.id);
      
      // Group items by category
      const groupedByCategory: { [key: string]: any[] } = {};
      if (items && items.length > 0) {
        items.forEach((item: any) => {
          const category = item.category || 'Sin categoría';
          if (!groupedByCategory[category]) {
            groupedByCategory[category] = [];
          }
          groupedByCategory[category].push(item);
        });
      }
      
      // Convert to array format
      const groupedArray = Object.keys(groupedByCategory).map(category => ({
        category,
        items: groupedByCategory[category]
      }));
      
      setSelectedTemplateItems(groupedArray);
      setShowItemsModal(true);
    } catch (error: any) {
      Alert.alert('Error', `No se pudieron cargar los items del template: ${error.message}`);
    }
  };

  const handleEditForm = async (form: FormTemplate) => {
    try {
      setEditingTemplate(form);
      setEditTemplateTitle(form.title);
      setEditTemplateDescription(form.description);
      setEditTemplateCategory(form.category);
      
      // Fetch current items
      const items = await getItemsByTemplateId(form.id);
      
      // Convert items to edit format
      const itemsForEdit = items.map((item: any) => ({
        id: item.id,
        text: item.text,
        category: item.category
      }));
      
      setEditTemplateItems(itemsForEdit.length > 0 ? itemsForEdit : [{text: '', category: ''}]);
      setShowEditModal(true);
    } catch (error: any) {
      Alert.alert('Error', `No se pudieron cargar los items del template: ${error.message}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate) return;
    
    // Validate inputs
    if (!editTemplateTitle.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }
    if (!editTemplateCategory.trim()) {
      Alert.alert('Error', 'La categoría es requerida');
      return;
    }
    if (!editTemplateDescription.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    
    try {
      // Update template
      await updateTemplate(editingTemplate.id, {
        title: editTemplateTitle.trim(),
        description: editTemplateDescription.trim(),
        temp_category: editTemplateCategory.trim()
      });
      
      // Filter valid items
      const validItems = editTemplateItems.filter(item => item.text.trim() && item.category.trim());
      
      // Get current items from database
      const currentItems = await getItemsByTemplateId(editingTemplate.id);
      const currentItemIds = Array.isArray(currentItems) ? currentItems.map((item: any) => item.id) : [];
      const editItemIds = validItems.filter(item => item.id).map(item => item.id!);
      
      // Determine which items to delete, create, or update
      const itemsToDelete = currentItemIds.filter((id: string) => !editItemIds.includes(id));
      const itemsToCreate = validItems.filter(item => !item.id);
      const itemsToUpdate = validItems.filter(item => item.id);
      
      // Delete items
      for (const itemId of itemsToDelete) {
        try {
          await deleteItem(itemId);
        } catch (error) {
          console.error('Error deleting item:', error);
        }
      }
      
      // Create new items
      const existingCount = itemsToUpdate.length;
      for (let i = 0; i < itemsToCreate.length; i++) {
        const item = itemsToCreate[i];
        await createItem({
          template_id: editingTemplate.id,
          category: item.category.trim(),
          question_index: (existingCount + i + 1).toString(),
          text: item.text.trim(),
          sort_order: existingCount + i + 1
        });
      }
      
      // Update existing items
      for (let i = 0; i < itemsToUpdate.length; i++) {
        const item = itemsToUpdate[i];
        if (item.id) {
          await updateItem(item.id, {
            category: item.category.trim(),
            text: item.text.trim(),
            question_index: (i + 1).toString(),
            sort_order: i + 1
          });
        }
      }
      
      // Refresh templates list from database
      await refreshTemplates();
      
      // Close modal and reset
      setShowEditModal(false);
      setEditingTemplate(null);
      setEditTemplateTitle('');
      setEditTemplateDescription('');
      setEditTemplateCategory('');
      setEditTemplateItems([]);
      
      Alert.alert('Éxito', 'Template actualizado correctamente');
    } catch (error: any) {
      const errorMessage = error?.message || 'No se pudo actualizar el template';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleResponseForm = (form: FormTemplate) => {
    router.push({
      pathname: '/edit-response',
      params: {
        templateId: form.id,
        type: 'open',
        templateTitle: form.title
      }
    } as any);
  };

  const handleDeleteForm = (form: FormTemplate) => {
    if (!form) return;
    
    Alert.alert(
      'Eliminar Template',
      `¿Estás seguro de que deseas eliminar "${form.title}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Guardar el ID antes de cerrar el menú
              const templateIdToDelete = form.id;
              
              // First, try to get all items for this template
              try {
                const items = await getItemsByTemplateId(templateIdToDelete);
                
                // Delete all items
                if (items && items.length > 0) {
                  for (const item of items) {
                    await deleteItem(item.id);
                  }
                }
              } catch (itemsError: any) {
                // If there are no items or error getting items, continue anyway
                // Continue with template deletion even if items deletion fails
              }
              
              // Then delete the template
              await deleteTemplate(templateIdToDelete);
              
              // Refresh templates list from database
              await refreshTemplates();
              
              Alert.alert('Éxito', 'Template eliminado correctamente');
            } catch (err: any) {
              const errorMessage = err.message || 'Error desconocido';
              Alert.alert('Error', `No se pudo eliminar el template: ${errorMessage}`);
            }
          },
        },
      ],
    );
  };

  const filteredForms = getFilteredForms();
  const availableCategories = getAvailableCategories();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inspecciones Abiertas</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona tus templates de inspección de seguridad
          </Text>
        </View>
      </View>

      <View style={styles.contentOverlay}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categorías */}
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {availableCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                  { borderColor: category.color }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.name}
            </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>

        {/* Lista de Templates */}
        <View style={styles.formsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'todos' ? 'Todos los Templates' : 
               categories.find(c => c.id === selectedCategory)?.name || 'Templates'}
              {' '}({filteredForms.length})
            </Text>
            <TouchableOpacity style={styles.addButtonFloating} onPress={handleAddForm}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Nuevo</Text>
            </TouchableOpacity>
          </View>

          {filteredForms.map((form) => (
            <View key={form.id} style={styles.formCard}>
            <TouchableOpacity 
                style={styles.formCardContent}
              onPress={() => handleFormPress(form)}
            >
              <View style={styles.formCardHeader}>
                <View style={styles.formInfo}>
                  <View style={styles.formTitleRow}>
                    <Text style={styles.formTitle}>{form.title}</Text>
                    {form.isTemplate && (
                      <View style={styles.templateBadge}>
                        <Text style={styles.templateBadgeText}>Template</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.formDescription}>{form.description}</Text>
                </View>
              </View>

              <View style={styles.formCardFooter}>
                <Text style={styles.formMeta}>
                  {form.itemCount} elementos
                  </Text>
              </View>
            </TouchableOpacity>
              
              {/* Botones de acción en esquina inferior derecha */}
              <TouchableOpacity 
                style={styles.responseButton}
                onPress={() => handleResponseForm(form)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditForm(form)}
              >
                <Ionicons name="create" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteForm(form)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Espacio adicional para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      </View>

      {/* Modal de Crear Template */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.renameModalOverlay}>
          <View style={[styles.renameModalContent, {maxHeight: '90%', width: '95%'}]}>
            <Text style={styles.renameModalTitle}>Crear Nuevo Template</Text>
            
            <ScrollView style={{maxHeight: 500}} showsVerticalScrollIndicator={true}>
              <TextInput
                style={styles.renameInput}
                value={newTemplateTitle}
                onChangeText={setNewTemplateTitle}
                placeholder="Título del template"
              />
              
              <TextInput
                style={styles.renameInput}
                value={newTemplateCategory}
                onChangeText={setNewTemplateCategory}
                placeholder="Categoría"
              />
              
              <TextInput
                style={[styles.renameInput, {minHeight: 80}]}
                value={newTemplateDescription}
                onChangeText={setNewTemplateDescription}
                placeholder="Descripción"
                multiline={true}
              />
              
              <Text style={{fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8}}>Preguntas/Items:</Text>
              
              {newTemplateItems.map((item, index) => (
                <View key={index} style={{marginBottom: 12, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8}}>
                  <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4}}>Item {index + 1}</Text>
                  <TextInput
                    style={[styles.renameInput, {marginBottom: 8}]}
                    value={item.category}
                    onChangeText={(value) => updateNewItem(index, 'category', value)}
                    placeholder="Categoría del item"
                  />
                  <TextInput
                    style={[styles.renameInput, {minHeight: 60}]}
                    value={item.text}
                    onChangeText={(value) => updateNewItem(index, 'text', value)}
                    placeholder="Texto de la pregunta"
                    multiline={true}
                  />
                  {newTemplateItems.length > 1 && (
                    <TouchableOpacity 
                      style={{alignSelf: 'flex-end', marginTop: 8}}
                      onPress={() => removeNewItem(index)}
                    >
                      <Text style={{color: '#ef4444', fontSize: 14}}>Eliminar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                style={{backgroundColor: '#e5e7eb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16}}
                onPress={addNewItem}
              >
                <Text style={{color: '#374151', fontWeight: '600'}}>+ Agregar Item</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.renameModalButtons}>
              <TouchableOpacity 
                style={styles.renameCancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewTemplateTitle('');
                  setNewTemplateDescription('');
                  setNewTemplateCategory('');
                  setNewTemplateItems([{text: '', category: ''}]);
                }}
              >
                <Text style={styles.renameCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.renameConfirmButton}
                onPress={handleCreateTemplate}
              >
                <Text style={styles.renameConfirmText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Items del Template */}
      <Modal
        visible={showItemsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowItemsModal(false)}
      >
        <TouchableOpacity 
          style={styles.renameModalOverlay}
          activeOpacity={1}
          onPress={() => setShowItemsModal(false)}
        >
          <View 
            style={[styles.renameModalContent, {maxHeight: '90%', width: '95%', paddingTop: 20, paddingBottom: 20}]}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity 
              style={{position: 'absolute', top: -6, right: -8, zIndex: 10, padding: 10}}
              onPress={() => setShowItemsModal(false)}
            >
              <Ionicons name="close" size={28} color="#6366f1" />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={true}>
              {selectedTemplateItems.length > 0 ? (
                selectedTemplateItems.map((categoryGroup, idx) => (
                  <View key={idx} style={{marginBottom: 32}}>
                    <View style={{backgroundColor: '#6366f1', padding: 16, borderRadius: 12, marginBottom: 16}}>
                      <Text style={{fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center'}}>
                        {categoryGroup.category}
                      </Text>
                    </View>
                    {categoryGroup.items.map((item: any, itemIdx: number) => (
                      <View key={itemIdx} style={{flexDirection: 'row', marginLeft: 8, marginBottom: 12}}>
                        <Text style={{color: '#6366f1', marginRight: 12, fontSize: 18, fontWeight: '600'}}>•</Text>
                        <Text style={{flex: 1, fontSize: 15, color: '#374151', lineHeight: 24}}>
                          {item.text}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                <View style={{padding: 40, alignItems: 'center'}}>
                  <Text style={{fontSize: 16, color: '#6b7280', textAlign: 'center'}}>
                    Este template no tiene items asignados aún.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Editar Template */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.renameModalOverlay}>
          <View style={[styles.renameModalContent, {maxHeight: '90%', width: '95%'}]}>
            <Text style={styles.renameModalTitle}>Editar Template</Text>
            
            <ScrollView style={{maxHeight: 500}} showsVerticalScrollIndicator={true}>
              <TextInput
                style={styles.renameInput}
                value={editTemplateTitle}
                onChangeText={setEditTemplateTitle}
                placeholder="Título del template"
              />
              
              <TextInput
                style={styles.renameInput}
                value={editTemplateCategory}
                onChangeText={setEditTemplateCategory}
                placeholder="Categoría"
              />
              
              <TextInput
                style={[styles.renameInput, {minHeight: 80}]}
                value={editTemplateDescription}
                onChangeText={setEditTemplateDescription}
                placeholder="Descripción"
                multiline={true}
              />
              
              <Text style={{fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8}}>Preguntas/Items:</Text>
              
              {editTemplateItems.map((item, index) => (
                <View key={index} style={{marginBottom: 12, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8}}>
                  <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4}}>Item {index + 1}</Text>
                  <TextInput
                    style={[styles.renameInput, {marginBottom: 8}]}
                    value={item.category}
                    onChangeText={(value) => updateEditItem(index, 'category', value)}
                    placeholder="Categoría del item"
                  />
                  <TextInput
                    style={[styles.renameInput, {minHeight: 60}]}
                    value={item.text}
                    onChangeText={(value) => updateEditItem(index, 'text', value)}
                    placeholder="Texto de la pregunta"
                    multiline={true}
                  />
                  {editTemplateItems.length > 1 && (
                    <TouchableOpacity 
                      style={{alignSelf: 'flex-end', marginTop: 8}}
                      onPress={() => removeEditItem(index)}
                    >
                      <Text style={{color: '#ef4444', fontSize: 14}}>Eliminar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                style={{backgroundColor: '#e5e7eb', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16}}
                onPress={addEditItem}
              >
                <Text style={{color: '#374151', fontWeight: '600'}}>+ Agregar Item</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.renameModalButtons}>
              <TouchableOpacity 
                style={styles.renameCancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                  setEditTemplateTitle('');
                  setEditTemplateDescription('');
                  setEditTemplateCategory('');
                  setEditTemplateItems([]);
                }}
              >
                <Text style={styles.renameCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.renameConfirmButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.renameConfirmText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 2,
  },
  contentOverlay: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesScrollContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#fff',
  },
  formsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButtonFloating: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  formCardContent: {
    padding: 16,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formInfo: {
    flex: 1,
    marginRight: 12,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  templateBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  templateBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#3b82f6',
  },
  formDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 120,
  },
  // Estilos para el botón de responder
  responseButton: {
    position: 'absolute',
    bottom: 12,
    right: 96,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  // Estilos para el botón de editar
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 54,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  // Estilos para el botón de eliminar
  deleteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  // Estilos para el modal de cambiar nombre
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renameModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  renameModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  renameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  renameCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  renameCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  renameConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  renameConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },

});
