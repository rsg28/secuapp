import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
    const hasResponses = formData.items.some(item => item.response !== null);
    if (hasResponses) {
      Alert.alert(
        'Salir sin guardar',
        '¿Estás seguro de que quieres salir? Se perderán todas las respuestas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleItemResponseChange = (itemId: string, response: 'C' | 'CP' | 'NC' | 'NA') => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            response,
            // Limpiar explicación si no es CP o NC
            explanation: (response === 'CP' || response === 'NC') ? item.explanation : '',
          };
        }
        return item;
      }),
    }));
  };

  const handleItemExplanationChange = (itemId: string, explanation: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          return { ...item, explanation };
        }
        return item;
      }),
    }));
  };

  const handleSaveForm = async () => {
    // Calcular estadísticas
    const stats = {
      cumplido: formData.items.filter(item => item.response === 'C').length,
      parcialmenteCumplido: formData.items.filter(item => item.response === 'CP').length,
      noCumplido: formData.items.filter(item => item.response === 'NC').length,
      noAplica: formData.items.filter(item => item.response === 'NA').length,
    };

    const total = formData.items.length;
    const cumplimiento = ((stats.cumplido + stats.parcialmenteCumplido) / total * 100).toFixed(1);

    // Guardar en AsyncStorage
    try {
      const updatedForm = {
        ...formData,
        items: formData.items,
        lastModified: new Date().toISOString().split('T')[0],
      };
      
      await storage.updateForm(updatedForm);

      Alert.alert(
        'Formulario completado',
        `Resultados:\n\n✅ Cumplido: ${stats.cumplido}\n⚠️ Parcialmente Cumplido: ${stats.parcialmenteCumplido}\n❌ No Cumplido: ${stats.noCumplido}\n➖ No Aplica: ${stats.noAplica}\n\n📊 Nivel de cumplimiento: ${cumplimiento}%`,
        [
          {
            text: 'Ver Detalles',
            onPress: () => showDetailedResults(stats, cumplimiento),
          },
          {
            text: 'Guardar y Salir',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving form:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar el formulario. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  const showDetailedResults = (stats: any, cumplimiento: string) => {
    const itemsWithExplanations = formData.items.filter(
      item => item.response === 'CP' || item.response === 'NC'
    );

    let detailsMessage = `Nivel de cumplimiento: ${cumplimiento}%\n\n`;
    
    if (itemsWithExplanations.length > 0) {
      detailsMessage += 'Elementos que requieren atención:\n\n';
      itemsWithExplanations.forEach(item => {
        const status = item.response === 'CP' ? '⚠️ Parcialmente Cumplido' : '❌ No Cumplido';
        detailsMessage += `${status}: ${item.text}\n`;
        if (item.explanation) {
          detailsMessage += `   Explicación: ${item.explanation}\n`;
        }
        detailsMessage += '\n';
      });
    }

    Alert.alert('Resultados Detallados', detailsMessage, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const getResponseColor = (response: 'C' | 'CP' | 'NC' | 'NA') => {
    switch (response) {
      case 'C': return '#22c55e';
      case 'CP': return '#f59e0b';
      case 'NC': return '#ef4444';
      case 'NA': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getResponseText = (response: 'C' | 'CP' | 'NC' | 'NA') => {
    switch (response) {
      case 'C': return 'Cumplido';
      case 'CP': return 'Parcialmente Cumplido';
      case 'NC': return 'No Cumplido';
      case 'NA': return 'No Aplica';
      default: return '';
    }
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
  const completedItems = formData.items.filter(item => item.response !== null).length;
  const progressPercentage = (completedItems / formData.items.length) * 100;

  const renderFormItem = (item: FormItem) => (
    <View key={item.id} style={styles.formItem}>
      <Text style={styles.itemText}>{item.text}</Text>

      {/* Opciones de respuesta */}
      <View style={styles.responseOptions}>
        {(['C', 'CP', 'NC', 'NA'] as const).map((response) => (
          <TouchableOpacity
            key={response}
            style={[
              styles.responseButton,
              item.response === response && {
                backgroundColor: getResponseColor(response) + '20',
                borderColor: getResponseColor(response),
              },
            ]}
            onPress={() => handleItemResponseChange(item.id, response)}
          >
            <View style={[
              styles.responseCircle,
              item.response === response && { backgroundColor: getResponseColor(response) }
            ]}>
              {item.response === response && (
                <Ionicons name="checkmark" size={12} color="#fff" />
              )}
            </View>
            <Text style={[
              styles.responseText,
              item.response === response && { color: getResponseColor(response) }
            ]}>
              {response}
            </Text>
            <Text style={[
              styles.responseLabel,
              item.response === response && { color: getResponseColor(response) }
            ]}>
              {getResponseText(response)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campo de explicación para CP o NC */}
      {(item.response === 'CP' || item.response === 'NC') && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationLabel}>
            Explicación ({item.response === 'CP' ? 'Parcialmente Cumplido' : 'No Cumplido'}):
          </Text>
          <TextInput
            style={styles.explanationInput}
            value={item.explanation}
            onChangeText={(text) => handleItemExplanationChange(item.id, text)}
            placeholder="Explica por qué..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      )}
    </View>
  );

  return (
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
          <Text style={styles.headerSubtitle}>Completar formulario</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            completedItems === 0 && styles.saveButtonDisabled
          ]} 
          onPress={handleSaveForm}
          disabled={completedItems === 0}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del formulario */}
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

          {/* Barra de progreso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Progreso</Text>
              <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressDetails}>
              {completedItems} de {formData.items.length} elementos completados
            </Text>
          </View>
        </View>

        {/* Elementos del formulario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Elementos a Verificar ({formData.items.length})
          </Text>
          
          {formData.items.map(renderFormItem)}
        </View>

        {/* Información de respuestas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opciones de Respuesta</Text>
          <View style={styles.responseInfo}>
            <View style={styles.responseInfoItem}>
              <View style={[styles.responseInfoCircle, { backgroundColor: '#22c55e' }]}>
                <Text style={styles.responseInfoText}>C</Text>
              </View>
              <Text style={styles.responseInfoLabel}>Cumplido</Text>
            </View>
            <View style={styles.responseInfoItem}>
              <View style={[styles.responseInfoCircle, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.responseInfoText}>CP</Text>
              </View>
              <Text style={styles.responseInfoLabel}>Parcialmente Cumplido</Text>
            </View>
            <View style={styles.responseInfoItem}>
              <View style={[styles.responseInfoCircle, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.responseInfoText}>NC</Text>
              </View>
              <Text style={styles.responseInfoLabel}>No Cumplido</Text>
            </View>
            <View style={styles.responseInfoItem}>
              <View style={[styles.responseInfoCircle, { backgroundColor: '#6b7280' }]}>
                <Text style={styles.responseInfoText}>NA</Text>
              </View>
              <Text style={styles.responseInfoLabel}>No Aplica</Text>
            </View>
          </View>
          <Text style={styles.responseNote}>
            * Para "Parcialmente Cumplido" y "No Cumplido" se puede agregar una explicación opcional.
          </Text>
        </View>

        {/* Espacio para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  progressContainer: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressDetails: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
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
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 16,
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
  responseInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
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
  bottomSpacing: {
    height: 120,
  },
});
