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
  user_id?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

type QuestionType = 'text' | 'single_choice' | 'multiple_choice';

interface CategoryQuestion {
  id: string;
  text: string;
}

interface CategoryGroup {
  id: string;
  name: string;
  question_type: QuestionType;
  questions: CategoryQuestion[];
  options: string[];
}

export default function OpenInspectionsScreen() {
  const { user } = useAuth();
  const { templates, createTemplate, deleteTemplate, getTemplatesByUserId, getAllTemplates, updateTemplate } = useOpenInspectionTemplates();
  const { getItemsByTemplateId, createItem, deleteItem, updateItem } = useOpenTemplateItems();
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<Category[]>([]);
  
  // Helpers for template creation UI
  const generateId = () => Math.random().toString(36).slice(2, 9);
  const createEmptyQuestion = (): CategoryQuestion => ({
    id: generateId(),
    text: '',
  });
  const createEmptyCategoryGroup = (questionType: QuestionType = 'text'): CategoryGroup => ({
    id: generateId(),
    name: '',
    question_type: questionType,
    questions: [createEmptyQuestion()],
    options: questionType === 'text' ? [] : ['', ''],
  });

  // States for creating new template
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('');
  const [newCategoryGroups, setNewCategoryGroups] = useState<CategoryGroup[]>([createEmptyCategoryGroup()]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  
  // States for viewing items
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedTemplateItems, setSelectedTemplateItems] = useState<Array<{category: string, items: any[]}>>([]);
  const [selectedCategoryInModal, setSelectedCategoryInModal] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // States for editing template
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [editTemplateTitle, setEditTemplateTitle] = useState('');
  const [editTemplateDescription, setEditTemplateDescription] = useState('');
  const [editTemplateCategory, setEditTemplateCategory] = useState('');
  const [editTemplateItems, setEditTemplateItems] = useState<Array<{
    id?: string, 
    text: string, 
    category: string,
    question_type?: 'text' | 'single_choice' | 'multiple_choice',
    options?: string[]
  }>>([]);

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
        user_id: template.user_id || undefined,
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

  // Cargar templates del servidor al iniciar
  useEffect(() => {
    if (user?.id) {
      getTemplatesByUserId(user.id, 1, 100).catch(() => {});
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      isScreenActive.current = true;
      if (user?.id) {
        refreshTemplates().catch(() => {});
      }
      return () => {
        isScreenActive.current = false;
      };
    }, [refreshTemplates, user?.id])
  );

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
    setNewCategoryGroups([createEmptyCategoryGroup()]);
    setIsCreatingTemplate(false);
    setShowCreateModal(true);
  };
  
  const handleCreateTemplate = async () => {
    if (isCreatingTemplate) {
      return;
    }
    // Validate inputs
    if (!newTemplateTitle.trim()) {
      Alert.alert('Error', 'El nombre de inspección es requerido');
      return;
    }
    if (!newTemplateCategory.trim()) {
      Alert.alert('Error', 'El tipo de inspección es requerido');
      return;
    }
    if (!newTemplateDescription.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }
    if (newCategoryGroups.length === 0) {
      Alert.alert('Error', 'Agrega al menos una categoría de preguntas.');
      return;
    }

    const hasEmptyCategoryName = newCategoryGroups.some(group => !group.name.trim());
    if (hasEmptyCategoryName) {
      Alert.alert('Error', 'Todas las categorías deben tener un nombre.');
      return;
    }

    const trimmedItems = newCategoryGroups.flatMap((group) =>
      group.questions.map((question) => ({
        text: question.text.trim(),
        category: group.name.trim(),
        question_type: group.question_type,
        options: group.question_type === 'text' ? [] : (group.options || [])
      }))
    );

    const hasEmptyQuestion = newCategoryGroups.some(group =>
      group.questions.some(question => !question.text.trim())
    );
    if (trimmedItems.length === 0 || hasEmptyQuestion) {
      Alert.alert('Error', 'Completa todas las preguntas con texto.');
      return;
    }
    // Validate options for choice questions
    const hasInvalidChoice = newCategoryGroups.some(group => {
      if (group.question_type === 'single_choice' || group.question_type === 'multiple_choice') {
        const options = group.options || [];
        return options.length < 2 || options.some(opt => !opt.trim());
      }
      return false;
    });
    if (hasInvalidChoice) {
      Alert.alert('Error', 'Las preguntas de tipo choice deben tener al menos 2 opciones válidas.');
      return;
    }
    
    // Check if a template with the same title + category already exists
    const existingTemplate = templates.find(
      (t: any) => t.title.toLowerCase() === newTemplateTitle.trim().toLowerCase() && 
                  t.temp_category?.toLowerCase() === newTemplateCategory.trim().toLowerCase()
    );
    
    if (existingTemplate) {
      Alert.alert('Error', 'Ya existe un template con esta ubicación y tipo de inspección');
      return;
    }
    
    let createdTemplate: any = null;
    
    try {
      setIsCreatingTemplate(true);
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
      // Create items for the template if there are any
      if (trimmedItems.length > 0) {
        const createdItems: any[] = [];
        let itemsError: any = null;
        
        try {
          for (let i = 0; i < trimmedItems.length; i++) {
            const item = trimmedItems[i];
            try {
              const itemData: any = {
                template_id: createdTemplate.id,
                category: item.category,
                question_index: (i + 1).toString(),
                text: item.text,
                question_type: item.question_type,
                sort_order: i + 1
              };
              // Add options only for choice types
              if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
                itemData.options = item.options.filter(opt => opt.trim());
              }
              const createdItem = await createItem(itemData);
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
      setNewCategoryGroups([createEmptyCategoryGroup()]);
      
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
    } finally {
      setIsCreatingTemplate(false);
    }
  };
  
  const addCategoryGroup = () => {
    setNewCategoryGroups((prev) => [...prev, createEmptyCategoryGroup()]);
  };

  const updateCategoryGroupName = (groupId: string, name: string) => {
    setNewCategoryGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, name } : group
      )
    );
  };

  const updateCategoryQuestionType = (groupId: string, questionType: QuestionType) => {
    setNewCategoryGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          question_type: questionType,
          questions: group.questions.length > 0 ? group.questions : [createEmptyQuestion()],
          options: questionType === 'text'
            ? []
            : (group.options && group.options.length >= 2 ? group.options : ['', '']),
        };
      })
    );
  };

  const addQuestionToGroup = (groupId: string) => {
    setNewCategoryGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, questions: [...group.questions, createEmptyQuestion()] }
          : group
      )
    );
  };

  const updateQuestionText = (groupId: string, questionId: string, text: string) => {
    setNewCategoryGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          questions: group.questions.map((question) =>
            question.id === questionId ? { ...question, text } : question
          ),
        };
      })
    );
  };

  const removeQuestionFromGroup = (groupId: string, questionId: string) => {
    setNewCategoryGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        if (group.questions.length === 1) return group;
        return {
          ...group,
          questions: group.questions.filter((question) => question.id !== questionId),
        };
      })
    );
  };

  const removeCategoryGroup = (groupId: string) => {
    setNewCategoryGroups((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((group) => group.id !== groupId);
    });
  };

  const updateGroupOption = (groupId: string, optionIndex: number, value: string) => {
    setNewCategoryGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        const options = [...(group.options || [])];
        options[optionIndex] = value;
        return { ...group, options };
      })
    );
  };

  const addGroupOption = (groupId: string) => {
    setNewCategoryGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, options: [...(group.options || []), ''] }
          : group
      )
    );
  };

  const removeGroupOption = (groupId: string, optionIndex: number) => {
    setNewCategoryGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;
        if (!group.options || group.options.length <= 2) return group;
        return {
          ...group,
          options: group.options.filter((_, idx) => idx !== optionIndex),
        };
      })
    );
  };
  
  const addEditItem = () => {
    setEditTemplateItems([...editTemplateItems, {text: '', category: '', question_type: 'text', options: []}]);
  };
  
  const updateEditItem = (index: number, field: 'text' | 'category' | 'question_type', value: string | 'text' | 'single_choice' | 'multiple_choice') => {
    const updatedItems = [...editTemplateItems];
    if (field === 'question_type') {
      updatedItems[index].question_type = value as 'text' | 'single_choice' | 'multiple_choice';
      // Reset options when changing to text
      if (value === 'text') {
        updatedItems[index].options = [];
      } else if (!updatedItems[index].options || updatedItems[index].options!.length === 0) {
        // Initialize with 2 empty options for choice types
        updatedItems[index].options = ['', ''];
      }
    } else {
      (updatedItems[index] as any)[field] = value;
    }
    setEditTemplateItems(updatedItems);
  };

  const updateEditItemOption = (itemIndex: number, optionIndex: number, value: string) => {
    const updatedItems = [...editTemplateItems];
    if (!updatedItems[itemIndex].options) {
      updatedItems[itemIndex].options = [];
    }
    updatedItems[itemIndex].options![optionIndex] = value;
    setEditTemplateItems(updatedItems);
  };

  const addEditItemOption = (itemIndex: number) => {
    const updatedItems = [...editTemplateItems];
    if (!updatedItems[itemIndex].options) {
      updatedItems[itemIndex].options = [];
    }
    updatedItems[itemIndex].options!.push('');
    setEditTemplateItems(updatedItems);
  };

  const removeEditItemOption = (itemIndex: number, optionIndex: number) => {
    const updatedItems = [...editTemplateItems];
    if (updatedItems[itemIndex].options && updatedItems[itemIndex].options!.length > 2) {
      updatedItems[itemIndex].options = updatedItems[itemIndex].options!.filter((_, i) => i !== optionIndex);
      setEditTemplateItems(updatedItems);
    }
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
      // Establecer la primera categoría como seleccionada por defecto
      if (groupedArray.length > 0) {
        setSelectedCategoryInModal(groupedArray[0].category);
      } else {
        setSelectedCategoryInModal(null);
      }
      setShowCategoryDropdown(false);
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
        category: item.category,
        question_type: item.question_type || 'text',
        options: item.options && Array.isArray(item.options) ? item.options : (typeof item.options === 'string' ? JSON.parse(item.options) : [])
      }));
      
      setEditTemplateItems(itemsForEdit.length > 0 ? itemsForEdit : [{text: '', category: '', question_type: 'text', options: []}]);
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
      
      // Validate options for choice questions
      const hasInvalidChoice = validItems.some(item => {
        if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
          return !item.options || item.options.length < 2 || item.options.some(opt => !opt.trim());
        }
        return false;
      });
      if (hasInvalidChoice) {
        Alert.alert('Error', 'Las preguntas de tipo choice deben tener al menos 2 opciones válidas.');
        return;
      }
      
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
        const itemData: any = {
          template_id: editingTemplate.id,
          category: item.category.trim(),
          question_index: (existingCount + i + 1).toString(),
          text: item.text.trim(),
          question_type: item.question_type || 'text',
          sort_order: existingCount + i + 1
        };
        // Add options only for choice types
        if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
          itemData.options = item.options ? item.options.filter((opt: string) => opt.trim()) : [];
        }
        await createItem(itemData);
      }
      
      // Update existing items
      for (let i = 0; i < itemsToUpdate.length; i++) {
        const item = itemsToUpdate[i];
        if (item.id) {
          const updateData: any = {
            category: item.category.trim(),
            text: item.text.trim(),
            question_index: (i + 1).toString(),
            question_type: item.question_type || 'text',
            sort_order: i + 1
          };
          // Add options only for choice types
          if (item.question_type === 'single_choice' || item.question_type === 'multiple_choice') {
            updateData.options = item.options ? item.options.filter((opt: string) => opt.trim()) : [];
          }
          await updateItem(item.id, updateData);
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Inspecciones Abiertas</Text>
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
                style={[
                  styles.editButton,
                  form.user_id === 'ALL' && styles.disabledButton
                ]}
                onPress={() => {
                  if (form.user_id !== 'ALL') {
                    handleEditForm(form);
                  }
                }}
                disabled={form.user_id === 'ALL'}
              >
                <Ionicons 
                  name="create" 
                  size={20} 
                  color={form.user_id === 'ALL' ? '#9ca3af' : '#fff'} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.deleteButton,
                  form.user_id === 'ALL' && styles.disabledButton
                ]}
                onPress={() => {
                  if (form.user_id !== 'ALL') {
                    handleDeleteForm(form);
                  }
                }}
                disabled={form.user_id === 'ALL'}
              >
                <Ionicons 
                  name="trash" 
                  size={20} 
                  color={form.user_id === 'ALL' ? '#9ca3af' : '#fff'} 
                />
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
                placeholder="Nombre de Inspección"
              />
              
              <TextInput
                style={styles.renameInput}
                value={newTemplateCategory}
                onChangeText={setNewTemplateCategory}
                placeholder="Tipo de Inspección"
              />
              
              <TextInput
                style={[styles.renameInput, {minHeight: 80}]}
                value={newTemplateDescription}
                onChangeText={setNewTemplateDescription}
                placeholder="Descripción"
                multiline={true}
              />
              
              <Text style={{fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8}}>Categorías y Preguntas:</Text>
              
              {newCategoryGroups.map((group, groupIndex) => (
                <View key={group.id} style={styles.categoryGroupCard}>
                  <View style={styles.categoryGroupHeader}>
                    <Text style={styles.categoryBadge}>Categoría {groupIndex + 1}</Text>
                    {newCategoryGroups.length > 1 && (
                      <TouchableOpacity onPress={() => removeCategoryGroup(group.id)}>
                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={[styles.renameInput, {marginBottom: 10}]}
                    value={group.name}
                    onChangeText={(value) => updateCategoryGroupName(group.id, value)}
                    placeholder="Nombre de la categoría"
                  />
                  <Text style={styles.categoryLabel}>Tipo de pregunta</Text>
                  <View style={styles.typeSelectorRow}>
                    {(['text', 'single_choice', 'multiple_choice'] as QuestionType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeSelectorButton,
                          group.question_type === type && styles.typeSelectorButtonActive
                        ]}
                        onPress={() => updateCategoryQuestionType(group.id, type)}
                      >
                        <Text
                          style={[
                            styles.typeSelectorText,
                            group.question_type === type && styles.typeSelectorTextActive
                          ]}
                        >
                          {type === 'text' ? 'Texto' : type === 'single_choice' ? 'Opción única' : 'Múltiple'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {(group.question_type === 'single_choice' || group.question_type === 'multiple_choice') && (
                    <View style={styles.categoryOptionsWrapper}>
                      <Text style={styles.categoryLabel}>Opciones (se aplican a todas las preguntas)</Text>
                      {group.options.map((option, optionIndex) => (
                        <View key={`${group.id}-option-${optionIndex}`} style={styles.optionRow}>
                          <TextInput
                            style={[styles.renameInput, {flex: 1, marginBottom: 0}]}
                            value={option}
                            onChangeText={(value) => updateGroupOption(group.id, optionIndex, value)}
                            placeholder={`Opción ${optionIndex + 1}`}
                          />
                          {group.options.length > 2 && (
                            <TouchableOpacity
                              style={styles.removeOptionButton}
                              onPress={() => removeGroupOption(group.id, optionIndex)}
                            >
                              <Ionicons name="close-circle" size={20} color="#dc2626" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity
                        style={styles.addOptionButton}
                        onPress={() => addGroupOption(group.id)}
                      >
                        <Ionicons name="add-circle-outline" size={18} color="#2563eb" />
                        <Text style={styles.addOptionText}>Agregar opción</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {group.questions.map((question, questionIndex) => (
                    <View key={question.id} style={styles.questionCard}>
                      <View style={styles.questionHeader}>
                        <Text style={styles.categoryLabel}>Pregunta {questionIndex + 1}</Text>
                        {group.questions.length > 1 && (
                          <TouchableOpacity onPress={() => removeQuestionFromGroup(group.id, question.id)}>
                            <Ionicons name="trash-outline" size={16} color="#dc2626" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <TextInput
                        style={[styles.renameInput, {marginBottom: 8}]}
                        value={question.text}
                        onChangeText={(value) => updateQuestionText(group.id, question.id, value)}
                        placeholder="Escribe la pregunta"
                        multiline
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addQuestionButton}
                    onPress={() => addQuestionToGroup(group.id)}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#2563eb" />
                    <Text style={styles.addQuestionText}>Agregar pregunta</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity 
                style={styles.addCategoryButton}
                onPress={addCategoryGroup}
              >
                <Ionicons name="add" size={16} color="#0f172a" />
                <Text style={styles.addCategoryText}>Agregar categoría</Text>
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
                  setNewCategoryGroups([createEmptyCategoryGroup()]);
                }}
              >
                <Text style={styles.renameCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.renameConfirmButton, isCreatingTemplate && styles.renameConfirmButtonDisabled]}
                onPress={handleCreateTemplate}
                disabled={isCreatingTemplate}
              >
                <Text style={styles.renameConfirmText}>{isCreatingTemplate ? 'Creando...' : 'Crear'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Items del Template */}
      <Modal
        visible={showItemsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowItemsModal(false)}
      >
        <View 
          style={styles.itemsModalOverlay}
        >
          <TouchableOpacity 
            style={styles.itemsModalOverlayTouchable}
            activeOpacity={1}
            onPress={() => {
              setShowItemsModal(false);
              setShowCategoryDropdown(false);
            }}
          />
          <View 
            style={styles.itemsModalContent}
          >
            {/* Header del Modal */}
            <View style={styles.itemsModalHeader}>
              <Text style={styles.itemsModalTitle}>Inspeccion</Text>
              <TouchableOpacity 
                style={styles.itemsModalCloseButton}
                onPress={() => {
                  setShowItemsModal(false);
                  setShowCategoryDropdown(false);
                }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.itemsModalScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.itemsModalScrollContent}
              nestedScrollEnabled={true}
              bounces={true}
              scrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {selectedTemplateItems.length > 0 ? (
                <View style={styles.itemsListContainer}>
                  {selectedTemplateItems.map((categoryGroup, categoryIdx) => (
                    <View key={categoryIdx} style={styles.itemsCategorySection}>
                      <Text style={styles.itemsCategoryTitle}>
                        {categoryGroup.category}
                      </Text>
                      {categoryGroup.items.map((item: any, itemIdx: number) => (
                        <View key={itemIdx} style={styles.itemsQuestionCard}>
                          <View style={styles.itemsQuestionHeader}>
                            {item.question_index && (
                              <View style={styles.itemsQuestionIndex}>
                                <Text style={styles.itemsQuestionIndexText}>
                                  {item.question_index}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.itemsQuestionText}>
                              {item.text}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.itemsEmptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                  <Text style={styles.itemsEmptyText}>
                    Este template no tiene preguntas asignadas aún.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
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
                  <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4, marginTop: 8}}>Tipo de pregunta</Text>
                  <View style={{flexDirection: 'row', marginBottom: 8, gap: 8}}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: (item.question_type || 'text') === 'text' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateEditItem(index, 'question_type', 'text')}
                    >
                      <Text style={{color: (item.question_type || 'text') === 'text' ? '#fff' : '#374151', fontWeight: '600'}}>Texto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: item.question_type === 'single_choice' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateEditItem(index, 'question_type', 'single_choice')}
                    >
                      <Text style={{color: item.question_type === 'single_choice' ? '#fff' : '#374151', fontWeight: '600'}}>Opción Única</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: item.question_type === 'multiple_choice' ? '#6366f1' : '#e5e7eb',
                        alignItems: 'center'
                      }}
                      onPress={() => updateEditItem(index, 'question_type', 'multiple_choice')}
                    >
                      <Text style={{color: item.question_type === 'multiple_choice' ? '#fff' : '#374151', fontWeight: '600'}}>Múltiple</Text>
                    </TouchableOpacity>
                  </View>
                  {(item.question_type === 'single_choice' || item.question_type === 'multiple_choice') && (
                    <View style={{marginBottom: 8}}>
                      <Text style={{fontSize: 12, color: '#6b7280', marginBottom: 4}}>Opciones</Text>
                      {(item.options || []).map((option, optIndex) => (
                        <View key={optIndex} style={{flexDirection: 'row', marginBottom: 4, alignItems: 'center'}}>
                          <TextInput
                            style={[styles.renameInput, {flex: 1, marginBottom: 0}]}
                            value={option}
                            onChangeText={(value) => updateEditItemOption(index, optIndex, value)}
                            placeholder={`Opción ${optIndex + 1}`}
                          />
                          {(item.options || []).length > 2 && (
                            <TouchableOpacity
                              style={{marginLeft: 8, padding: 8}}
                              onPress={() => removeEditItemOption(index, optIndex)}
                            >
                              <Ionicons name="close-circle" size={20} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity
                        style={{alignSelf: 'flex-start', marginTop: 4}}
                        onPress={() => addEditItemOption(index)}
                      >
                        <Text style={{color: '#6366f1', fontSize: 12}}>+ Agregar opción</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TextInput
                    style={[styles.renameInput, {minHeight: 60, marginTop: 8}]}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
  disabledButton: {
    backgroundColor: '#e5e7eb',
    opacity: 0.6,
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
  categoryGroupCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textTransform: 'uppercase',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeSelectorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeSelectorButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  typeSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  typeSelectorTextActive: {
    color: '#1d4ed8',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  removeOptionButton: {
    padding: 4,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  addOptionText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryOptionsWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 12,
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    gap: 6,
  },
  addQuestionText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
    gap: 8,
  },
  addCategoryText: {
    color: '#0f172a',
    fontWeight: '600',
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
  renameConfirmButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  renameConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  // Estilos para el modal de items mejorado
  itemsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  itemsModalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  itemsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '95%',
    maxWidth: 600,
    height: '85%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  itemsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  itemsModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  itemsModalCloseButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  itemsCategorySelectorContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 100,
  },
  itemsCategorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemsCategorySelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 10,
  },
  itemsCategoryDropdownWrapper: {
    position: 'absolute',
    top: '100%',
    left: 24,
    right: 24,
    marginTop: 4,
    zIndex: 1000,
    elevation: 10,
  },
  itemsCategoryDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  itemsCategoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemsCategoryDropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  itemsCategoryDropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  itemsCategoryDropdownItemTextActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
  itemsModalScrollView: {
    flex: 1,
    flexGrow: 1,
  },
  itemsModalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  itemsCategoryContainer: {
    marginBottom: 32,
  },
  itemsCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  itemsCategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  itemsCategoryBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsCategoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  itemsListContainer: {
    // gap no funciona en React Native, usamos marginBottom en cada card
  },
  itemsCategorySection: {
    marginBottom: 32,
  },
  itemsCategoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  itemsQuestionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemsQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemsQuestionIndex: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemsQuestionIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  itemsQuestionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsQuestionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
  itemsQuestionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
    fontWeight: '500',
    flex: 1,
  },
  itemsEmptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsEmptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
});
