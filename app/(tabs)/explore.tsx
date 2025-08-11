import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { storage } from '../../utils/storage';

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

export default function FormulariosScreen() {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  // Cargar formularios guardados al iniciar
  useEffect(() => {
    clearDuplicateTemplates();
    loadSavedForms();
    initializeDefaultTemplate();
  }, []);

  // Recargar formularios cuando la pantalla vuelva a tener foco
  useFocusEffect(
    React.useCallback(() => {
      loadSavedForms();
    }, [])
  );

  const loadSavedForms = async () => {
    try {
      const savedForms = await storage.loadForms();
      
      // Convertir formularios guardados al formato FormTemplate
      const userForms = savedForms.map((form: any) => ({
        id: form.id,
        title: form.title,
        description: form.description,
        category: form.category,
        isTemplate: form.isTemplate || false,
        createdDate: form.createdDate || '2024-01-15',
        lastModified: form.lastModified || '2024-01-15',
        itemCount: form.items ? form.items.length : 0,
      }));

      // Solo mostrar los formularios guardados (sin duplicar)
      setFormTemplates(userForms);
    } catch (error) {
      console.error('Error loading forms:', error);
      setFormTemplates([]);
    }
  };

  // Limpiar templates duplicados
  const clearDuplicateTemplates = async () => {
    try {
      const savedForms = await storage.loadForms();
      const uniqueForms = savedForms.filter((form: any, index: number, self: any[]) => 
        index === self.findIndex((f: any) => f.id === form.id)
      );
      
      if (uniqueForms.length !== savedForms.length) {
        await storage.saveForms(uniqueForms);
        console.log('Templates duplicados eliminados');
      }
    } catch (error) {
      console.error('Error clearing duplicate templates:', error);
    }
  };

  // Inicializar template por defecto si no existe
  const initializeDefaultTemplate = async () => {
    try {
      const savedForms = await storage.loadForms();
      const defaultTemplateExists = savedForms.some((form: any) => form.id === 'seg-001');
      
      if (!defaultTemplateExists) {
        const defaultTemplate = {
          id: 'seg-001',
          title: 'Template de Inspección de Seguridad General',
          description: 'Template base para inspecciones de seguridad en áreas de trabajo',
          category: 'seguridad',
          isTemplate: true,
          createdDate: '2024-01-15',
          lastModified: '2024-01-15',
          items: [
            { id: '1', text: '¿Los empleados están usando el equipo de protección personal requerido?' },
            { id: '2', text: '¿Las áreas de trabajo están libres de obstáculos y desorden?' },
            { id: '3', text: '¿Los equipos de emergencia están accesibles y funcionando correctamente?' },
            { id: '4', text: '¿Las señales de seguridad están visibles y en buen estado?' },
            { id: '5', text: '¿Los extintores están en su lugar y no han expirado?' },
            { id: '6', text: '¿Las salidas de emergencia están despejadas y marcadas correctamente?' },
            { id: '7', text: '¿El piso está en buenas condiciones sin resbalones o tropiezos?' },
            { id: '8', text: '¿La iluminación es adecuada para el trabajo que se realiza?' },
            { id: '9', text: '¿Los equipos eléctricos están en buen estado y sin cables expuestos?' },
            { id: '10', text: '¿Los productos químicos están almacenados y etiquetados correctamente?' },
            { id: '11', text: '¿Los empleados han recibido la capacitación necesaria para su trabajo?' },
            { id: '12', text: '¿Se están siguiendo los procedimientos de seguridad establecidos?' },
          ],
        };
        
        await storage.addForm(defaultTemplate);
        console.log('Template por defecto inicializado');
      }
    } catch (error) {
      console.error('Error initializing default template:', error);
    }
  };

  const categories: Category[] = [
    { id: 'todos', name: 'Todos', icon: 'apps', color: '#6366f1' },
    { id: 'vestimenta', name: 'Vestimenta', icon: 'shirt', color: '#8b5cf6' },
    { id: 'quimicos', name: 'Químicos', icon: 'flask', color: '#ef4444' },
    { id: 'equipos', name: 'Equipos', icon: 'build', color: '#f59e0b' },
    { id: 'instalaciones', name: 'Instalaciones', icon: 'business', color: '#10b981' },
    { id: 'capacitacion', name: 'Capacitación', icon: 'school', color: '#06b6d4' },
  ];

  const getFilteredForms = () => {
    if (selectedCategory === 'todos') {
      return formTemplates;
    }
    return formTemplates.filter(form => form.category === selectedCategory);
  };

  const getAvailableCategories = () => {
    // Siempre mostrar "Todos"
    const availableCategories = [categories[0]]; // "Todos" es el primero
    
    // Agregar solo categorías que tengan formularios
    categories.slice(1).forEach(category => {
      const hasTemplates = formTemplates.some(form => form.category === category.id);
      if (hasTemplates) {
        availableCategories.push(category);
      }
    });
    
    return availableCategories;
  };

  const handleAddForm = () => {
    router.push('/create-form');
  };

  // Datos de empresas disponibles
  const companies = [
    {
      id: '1',
      name: 'Industrias del Norte S.A.',
      industry: 'Manufactura',
      contactPerson: 'Juan Pérez',
    },
    {
      id: '2',
      name: 'Minería del Sur Ltda.',
      industry: 'Minería',
      contactPerson: 'María González',
    },
    {
      id: '3',
      name: 'Construcciones Central',
      industry: 'Construcción',
      contactPerson: 'Carlos Rodríguez',
    },
  ];

  // Función para usar template con asignación de empresa
  const handleUseTemplateWithCompany = (form: FormTemplate) => {
    setSelectedTemplate(form);
    setShowCompanyModal(true);
  };

  // Función para recargar formularios cuando se regrese de crear uno nuevo
  const handleFocus = () => {
    loadSavedForms();
  };

  const handleFormPress = (form: FormTemplate) => {
    Alert.alert(
      form.title,
      `${form.description}\n\nElementos: ${form.itemCount}`,
      [
        { text: 'Usar con Empresa', onPress: () => handleUseTemplateWithCompany(form) },
        { text: 'Editar', onPress: () => console.log('Editar', form.id) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleDeleteForm = (form: FormTemplate) => {
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
            setFormTemplates(prev => prev.filter(f => f.id !== form.id));
            
            // Si la categoría actual ya no tiene formularios, cambiar a "todos"
            const remainingInCategory = formTemplates.filter(
              f => f.id !== form.id && f.category === selectedCategory
            );
            
            if (remainingInCategory.length === 0 && selectedCategory !== 'todos') {
              setSelectedCategory('todos');
            }

            // Si es un template personalizado, eliminarlo de AsyncStorage
            if (!form.isTemplate) {
              try {
                await storage.deleteForm(form.id);
              } catch (error) {
                console.error('Error deleting template from AsyncStorage:', error);
              }
            }
          },
        },
      ]
    );
  };

  const filteredForms = getFilteredForms();
  const availableCategories = getAvailableCategories();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Formularios de Inspección</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona tus templates de inspección de seguridad
          </Text>
        </View>
      </View>

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
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? '#fff' : category.color} 
                />
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
            <TouchableOpacity 
              key={form.id} 
              style={styles.formCard}
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
                <View style={[
                  styles.categoryIcon,
                  { backgroundColor: categories.find(c => c.id === form.category)?.color + '20' }
                ]}>
                  <Ionicons 
                    name={categories.find(c => c.id === form.category)?.icon as any || 'document'}
                    size={20} 
                    color={categories.find(c => c.id === form.category)?.color || '#6366f1'} 
                  />
                </View>
              </View>
              
              <View style={styles.formCardFooter}>
                <Text style={styles.formMeta}>
                  {form.itemCount} elementos
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Espacio adicional para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal para selección de empresa */}
      <Modal
        visible={showCompanyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCompanyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Asignar Template a Empresa
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedTemplate?.title}
            </Text>
            
            <ScrollView style={styles.companiesList}>
              {companies.map((company) => (
                <TouchableOpacity
                  key={company.id}
                  style={styles.companyOption}
                  onPress={() => {
                    setShowCompanyModal(false);
                    setSelectedTemplate(null);
                    // Aquí se navegaría al form-detail con la empresa seleccionada
                    router.push(`/form-detail?id=${selectedTemplate?.id}&companyId=${company.id}&companyName=${company.name}`);
                  }}
                >
                  <View style={styles.companyOptionHeader}>
                    <Ionicons name="business" size={20} color="#3b82f6" />
                    <Text style={styles.companyOptionName}>{company.name}</Text>
                  </View>
                  <View style={styles.companyOptionDetails}>
                    <Text style={styles.companyOptionIndustry}>{company.industry}</Text>
                    <Text style={styles.companyOptionContact}>{company.contactPerson}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowCompanyModal(false);
                setSelectedTemplate(null);
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
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
    backgroundColor: '#7dd3fc',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 2,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  companiesList: {
    maxHeight: 300,
  },
  companyOption: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  companyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  companyOptionDetails: {
    marginLeft: 32,
  },
  companyOptionIndustry: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  companyOptionContact: {
    fontSize: 12,
    color: '#9ca3af',
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
});