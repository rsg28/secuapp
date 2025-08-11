import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([
    // Templates de Vestimenta
    {
      id: 'vest-001',
      title: 'Inspección EPP General',
      description: 'Verificación de equipos de protección personal básicos',
      category: 'vestimenta',
      isTemplate: true,
      createdDate: '2024-01-15',
      lastModified: '2024-01-15',
      itemCount: 8,
    },
    {
      id: 'vest-002',
      title: 'Control Calzado de Seguridad',
      description: 'Revisión de botas y zapatos de seguridad',
      category: 'vestimenta',
      isTemplate: true,
      createdDate: '2024-01-10',
      lastModified: '2024-01-10',
      itemCount: 5,
    },
    // Templates de Químicos
    {
      id: 'quim-001',
      title: 'Manejo de Sustancias Peligrosas',
      description: 'Control de almacenamiento y manipulación de químicos',
      category: 'quimicos',
      isTemplate: true,
      createdDate: '2024-01-12',
      lastModified: '2024-01-12',
      itemCount: 12,
    },
    {
      id: 'quim-002',
      title: 'Ventilación Área Química',
      description: 'Verificación de sistemas de ventilación en laboratorio',
      category: 'quimicos',
      isTemplate: true,
      createdDate: '2024-01-08',
      lastModified: '2024-01-08',
      itemCount: 6,
    },
    // Templates de Equipos
    {
      id: 'equip-001',
      title: 'Mantenimiento Maquinaria',
      description: 'Lista de verificación para mantenimiento preventivo',
      category: 'equipos',
      isTemplate: true,
      createdDate: '2024-01-14',
      lastModified: '2024-01-14',
      itemCount: 15,
    },
    {
      id: 'equip-002',
      title: 'Herramientas Eléctricas',
      description: 'Inspección de herramientas eléctricas portátiles',
      category: 'equipos',
      isTemplate: true,
      createdDate: '2024-01-11',
      lastModified: '2024-01-11',
      itemCount: 7,
    },
    // Templates de Instalaciones
    {
      id: 'inst-001',
      title: 'Rutas de Evacuación',
      description: 'Verificación de salidas de emergencia y señalización',
      category: 'instalaciones',
      isTemplate: true,
      createdDate: '2024-01-13',
      lastModified: '2024-01-13',
      itemCount: 10,
    },
    {
      id: 'inst-002',
      title: 'Sistemas Contra Incendios',
      description: 'Control de extintores y sistemas de detección',
      category: 'instalaciones',
      isTemplate: true,
      createdDate: '2024-01-09',
      lastModified: '2024-01-09',
      itemCount: 9,
    },
    // Templates de Capacitación
    {
      id: 'cap-001',
      title: 'Inducción Nuevos Empleados',
      description: 'Lista de verificación para capacitación inicial',
      category: 'capacitacion',
      isTemplate: true,
      createdDate: '2024-01-16',
      lastModified: '2024-01-16',
      itemCount: 11,
    },
    // Formularios personalizados del usuario
    {
      id: 'user-001',
      title: 'Inspección Área de Soldadura',
      description: 'Formulario personalizado para área específica',
      category: 'equipos',
      isTemplate: false,
      createdDate: '2024-01-17',
      lastModified: '2024-01-18',
      itemCount: 13,
    },
    {
      id: 'user-002',
      title: 'Control EPP Visitantes',
      description: 'Verificación personalizada para visitantes',
      category: 'vestimenta',
      isTemplate: false,
      createdDate: '2024-01-16',
      lastModified: '2024-01-17',
      itemCount: 6,
    },
  ]);

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
    Alert.alert(
      'Nuevo Formulario',
      '¿Cómo deseas crear el formulario?',
      [
        { text: 'Desde Template', onPress: () => console.log('Template') },
        { text: 'Crear Nuevo', onPress: () => console.log('Nuevo') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleFormPress = (form: FormTemplate) => {
    Alert.alert(
      form.title,
      `${form.description}\n\nElementos: ${form.itemCount}\nÚltima modificación: ${form.lastModified}`,
      [
        { text: 'Editar', onPress: () => console.log('Editar', form.id) },
        { text: 'Usar', onPress: () => console.log('Usar', form.id) },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => handleDeleteForm(form),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleDeleteForm = (form: FormTemplate) => {
    Alert.alert(
      'Eliminar Formulario',
      `¿Estás seguro de que deseas eliminar "${form.title}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setFormTemplates(prev => prev.filter(f => f.id !== form.id));
            
            // Si la categoría actual ya no tiene formularios, cambiar a "todos"
            const remainingInCategory = formTemplates.filter(
              f => f.id !== form.id && f.category === selectedCategory
            );
            
            if (remainingInCategory.length === 0 && selectedCategory !== 'todos') {
              setSelectedCategory('todos');
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
          <Text style={styles.headerTitle}>Formularios de Seguridad</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona tus checklists y templates
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

        {/* Lista de Formularios */}
        <View style={styles.formsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'todos' ? 'Todos los Formularios' : 
               categories.find(c => c.id === selectedCategory)?.name || 'Formularios'}
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
                <Text style={styles.formMeta}>
                  Modificado: {form.lastModified}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Espacio adicional para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
});