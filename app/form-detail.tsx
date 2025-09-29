import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { storage } from '../utils/storage';

interface FormItem {
  id: string;
  text: string;
  response: 'C' | 'CP' | 'NC' | 'NA' | null;
  explanation: string;
}

interface FormData {
  id: string;
  title: string;
  description: string;
  category: string;
  items: FormItem[];
  createdDate: string;
  lastModified: string;
}

export default function FormDetailScreen() {
  const params = useLocalSearchParams();
  const formId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    id: formId || 'form-001',
    title: '',
    description: '',
    category: '',
    createdDate: '',
    lastModified: '',
    items: [],
  });

  // Cargar datos del formulario desde AsyncStorage
  useEffect(() => {
    if (formId) {
      loadFormData();
    }
  }, [formId]);

  const loadFormData = async () => {
    try {
      const savedForms = await storage.loadForms();
      const form = savedForms.find((f: any) => f.id === formId);
      
      if (form) {
        setFormData({
          id: form.id,
          title: form.title,
          description: form.description,
          category: form.category,
          createdDate: form.createdDate,
          lastModified: form.lastModified,
          items: form.items || [],
        });
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleProceed = () => {
    // Por ahora mostrar mensaje de trabajo en progreso
    console.log('Procediendo con el formulario...');
    // TODO: Implementar navegación a formulario de inspección para la empresa seleccionada
  };





  const getCategoryInfo = (categoryId: string) => {
    const defaultCategories = [
      { id: 'vestimenta', name: 'Vestimenta', icon: 'shirt', color: '#8b5cf6' },
      { id: 'quimicos', name: 'Químicos', icon: 'flask', color: '#ef4444' },
      { id: 'equipos', name: 'Equipos', icon: 'build', color: '#f59e0b' },
      { id: 'instalaciones', name: 'Instalaciones', icon: 'business', color: '#10b981' },
      { id: 'capacitacion', name: 'Capacitación', icon: 'school', color: '#06b6d4' },
      { id: 'almacen', name: 'Almacén', icon: 'cube', color: '#8b5cf6' },
      { id: 'seguridad', name: 'Seguridad', icon: 'shield-checkmark', color: '#22c55e' },
      { id: 'otros', name: 'Otros', icon: 'ellipsis', color: '#6b7280' },
    ];
    
    // Buscar en categorías por defecto
    const defaultCategory = defaultCategories.find(c => c.id === categoryId);
    if (defaultCategory) return defaultCategory;
    
    // Si no se encuentra, buscar en categorías personalizadas
    // Por ahora retornamos una categoría genérica
    return { id: categoryId, name: categoryId, icon: 'cube', color: '#6366f1' };
  };

  const categoryInfo = getCategoryInfo(formData.category);



  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
                {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{formData.title}</Text>
            <Text style={styles.headerSubtitle}>Template de Inspección</Text>
          </View>

        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del template */}
        <View style={styles.section}>
          <View style={styles.formInfoHeader}>
            <View style={styles.formInfo}>
              <Text style={styles.formDescription}>{formData.description}</Text>
              <View style={styles.formMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar" size={16} color="#6b7280" />
                  <Text style={styles.metaText}>Creado: {formData.createdDate}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={16} color="#6b7280" />
                  <Text style={styles.metaText}>Modificado: {formData.lastModified}</Text>
                </View>
              </View>
            </View>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: categoryInfo.color + '20' }
            ]}>
              <Ionicons 
                name={categoryInfo.icon as any} 
                size={24} 
                color={categoryInfo.color} 
              />
            </View>
          </View>
        </View>

        {/* Elementos del template */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Elementos del Template ({formData.items.length})
          </Text>
          
          {formData.items.map((item, index) => (
            <View key={item.id} style={styles.templateItem}>
              <View style={styles.templateItemHeader}>
                <Text style={styles.templateItemNumber}>{index + 1}</Text>
                <Text style={styles.templateItemText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>



        {/* Espacio para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Botón de Proceder */}
      <View style={styles.proceedButtonContainer}>
        <TouchableOpacity 
          style={styles.proceedButton}
          onPress={handleProceed}
        >
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </>
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
  // Estilos para el botón de proceder
  proceedButtonContainer: {
    position: 'absolute',
    bottom: 40, // Espacio para el bottom tab
    right: 20,
    zIndex: 1000,
  },
  proceedButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 25,
    width: 60,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  formInfoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  formInfo: {
    flex: 1,
    marginRight: 16,
  },
  formDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  formMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 120,
  },
  templateItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  templateItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  templateItemNumber: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  templateItemText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
    flex: 1,
  },

});
