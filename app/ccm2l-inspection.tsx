import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';

interface FormItem {
  id: string;
  text: string;
  category: string;
  response: 'C' | 'CP' | 'NC' | 'NA' | null;
  explanation?: string;
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


export default function CCM2LInspectionScreen() {
  const params = useLocalSearchParams();
  const formId = params.id as string;
  const { getCurrentCompany } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    id: formId || 'ccm2l-001',
    title: '',
    description: '',
    category: '',
    createdDate: '',
    lastModified: '',
    items: [],
  });

  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

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
        
        // Establecer la primera categoría como activa
        if (form.items && form.items.length > 0) {
          setCurrentCategory(form.items[0].category);
        }
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
    console.log('Procediendo con la inspección...');
    // TODO: Implementar navegación a formulario de inspección para la empresa seleccionada
  };

  const handleResponseChange = (itemId: string, response: 'C' | 'CP' | 'NC' | 'NA') => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, response }
          : item
      ),
    }));
  };


  const handleSaveInspection = async () => {
    const company = getCurrentCompany();
    if (!company) {
      Alert.alert('Error', 'No hay empresa seleccionada');
      return;
    }

    try {
      const inspectionData = {
        id: `inspection-${Date.now()}`,
        templateId: formId,
        companyId: company.id,
        companyName: company.name,
        title: formData.title,
        inspectionDate: new Date().toISOString(),
        inspector: 'Supervisor',
        items: formData.items,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };

      const savedInspections = await storage.loadForms();
      savedInspections.push(inspectionData);
      await storage.saveForms(savedInspections);

      Alert.alert(
        'Inspección Guardada',
        `La inspección ${formId === 'ccm2l-001' ? 'CCM2L' : formId === 'pq-001' ? 'de Productos Químicos' : 'de Seguridad'} se ha guardado exitosamente`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving inspection:', error);
      Alert.alert('Error', 'No se pudo guardar la inspección');
    }
  };

  const getCategoryItems = (category: string) => {
    return formData.items.filter(item => item.category === category);
  };

  const getAvailableCategories = () => {
    const categories = [...new Set(formData.items.map(item => item.category))];
    return categories;
  };

  const getResponseColor = (response: string) => {
    switch (response) {
      case 'C': return '#22c55e'; // Verde
      case 'CP': return '#f59e0b'; // Amarillo
      case 'NC': return '#ef4444'; // Rojo
      case 'NA': return '#6b7280'; // Gris
      default: return '#d1d5db'; // Gris claro
    }
  };

  const getResponseLabel = (response: string) => {
    switch (response) {
      case 'C': return 'Cumple';
      case 'CP': return 'Cumple Parcialmente';
      case 'NC': return 'No Cumple';
      case 'NA': return 'No Aplica';
      default: return 'Sin evaluar';
    }
  };

  const availableCategories = getAvailableCategories();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
         {/* Header */}
         <View style={[
           styles.header,
           formId === 'pq-001' && styles.headerPQ
         ]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
           <View style={styles.headerContent}>
             <Text style={styles.headerTitle}>{formData.title}</Text>
             <Text style={styles.headerSubtitle}>
               {formId === 'ccm2l-001' ? 'Inspección CCM2L' : 
                formId === 'pq-001' ? 'Inspección Productos Químicos' : 
                'Inspección de Seguridad'}
             </Text>
           </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Información del template */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de la Inspección</Text>
            <Text style={styles.formDescription}>{formData.description}</Text>
            <View style={styles.formMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={16} color="#6b7280" />
                <Text style={styles.metaText}>Fecha: {new Date().toLocaleDateString('es-ES')}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="business" size={16} color="#6b7280" />
                <Text style={styles.metaText}>Empresa: {getCurrentCompany()?.name || 'Sin empresa'}</Text>
              </View>
            </View>
          </View>

           {/* Selector de categorías */}
           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Categorías de Evaluación</Text>
             <TouchableOpacity
               style={styles.dropdownButton}
               onPress={() => setShowDropdown(!showDropdown)}
             >
               <Text style={styles.dropdownText}>{currentCategory || 'Seleccionar categoría'}</Text>
               <Ionicons 
                 name={showDropdown ? "chevron-up" : "chevron-down"} 
                 size={20} 
                 color="#6b7280" 
               />
             </TouchableOpacity>
             
             {showDropdown && (
               <View style={styles.dropdownMenu}>
                 {availableCategories.map((category) => (
                   <TouchableOpacity
                     key={category}
                     style={[
                       styles.dropdownItem,
                       currentCategory === category && styles.dropdownItemActive,
                       formId === 'pq-001' && currentCategory === category && styles.dropdownItemActivePQ,
                     ]}
                     onPress={() => {
                       setCurrentCategory(category);
                       setShowDropdown(false);
                     }}
                   >
                     <Text style={[
                       styles.dropdownItemText,
                       currentCategory === category && styles.dropdownItemTextActive
                     ]}>
                       {category}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </View>
             )}
           </View>

          {/* Items de la categoría actual */}
          {currentCategory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {currentCategory} ({getCategoryItems(currentCategory).length} items)
              </Text>
              
              {getCategoryItems(currentCategory).map((item, index) => (
                <View key={item.id} style={styles.itemCard}>
                   <View style={styles.itemHeader}>
                     <Text style={[
                       styles.itemNumber,
                       formId === 'pq-001' && styles.itemNumberPQ
                     ]}>{item.id}</Text>
                     <Text style={styles.itemText}>{item.text}</Text>
                   </View>
                  
                   {/* Opciones de respuesta */}
                   <View style={styles.responseGrid}>
                     <View style={styles.responseRow}>
                       <TouchableOpacity
                         style={[
                           styles.responseButton,
                           item.response === 'C' && styles.responseButtonActive,
                           { borderColor: getResponseColor('C') }
                         ]}
                         onPress={() => handleResponseChange(item.id, 'C')}
                       >
                         <Text style={[
                           styles.responseText,
                           { color: getResponseColor('C') }
                         ]}>
                           C
                         </Text>
                       </TouchableOpacity>
                       <TouchableOpacity
                         style={[
                           styles.responseButton,
                           item.response === 'CP' && styles.responseButtonActive,
                           { borderColor: getResponseColor('CP') }
                         ]}
                         onPress={() => handleResponseChange(item.id, 'CP')}
                       >
                         <Text style={[
                           styles.responseText,
                           { color: getResponseColor('CP') }
                         ]}>
                           CP
                         </Text>
                       </TouchableOpacity>
                     </View>
                     <View style={styles.responseRow}>
                       <TouchableOpacity
                         style={[
                           styles.responseButton,
                           item.response === 'NC' && styles.responseButtonActive,
                           { borderColor: getResponseColor('NC') }
                         ]}
                         onPress={() => handleResponseChange(item.id, 'NC')}
                       >
                         <Text style={[
                           styles.responseText,
                           { color: getResponseColor('NC') }
                         ]}>
                           NC
                         </Text>
                       </TouchableOpacity>
                       <TouchableOpacity
                         style={[
                           styles.responseButton,
                           item.response === 'NA' && styles.responseButtonActive,
                           { borderColor: getResponseColor('NA') }
                         ]}
                         onPress={() => handleResponseChange(item.id, 'NA')}
                       >
                         <Text style={[
                           styles.responseText,
                           { color: getResponseColor('NA') }
                         ]}>
                           NA
                         </Text>
                       </TouchableOpacity>
                     </View>
                   </View>

                </View>
              ))}
            </View>
          )}



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
     backgroundColor: '#8b5cf6',
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
   headerPQ: {
     backgroundColor: '#ef4444',
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
    color: '#e0e7ff',
    marginTop: 2,
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#8b5cf6',
  },
  dropdownItemActivePQ: {
    backgroundColor: '#ef4444',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownItemTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  itemCard: {
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
   itemNumber: {
     backgroundColor: '#8b5cf6',
     color: '#fff',
     fontSize: 14,
     fontWeight: 'bold',
     width: 32,
     height: 32,
     borderRadius: 16,
     textAlign: 'center',
     lineHeight: 32,
     marginRight: 12,
   },
   itemNumberPQ: {
     backgroundColor: '#ef4444',
   },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  responseGrid: {
    marginBottom: 12,
  },
  responseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  responseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  responseButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  responseText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 120,
  },
  // Estilos para el botón de proceder
  proceedButtonContainer: {
    position: 'absolute',
    bottom: 40, // Espacio para el bottom tab
    right: 20,
    zIndex: 1000,
  },
  proceedButton: {
    backgroundColor: '#22c55e',
    borderRadius: 25,
    width: 60,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
