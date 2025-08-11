import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface FormItem {
  id: string;
  question: string;
  type: 'yesno' | 'text' | 'number' | 'select' | 'photo';
  required: boolean;
  value?: any;
  options?: string[];
  notes?: string;
}

interface FormSection {
  id: string;
  title: string;
  description: string;
  items: FormItem[];
}

export default function InspectionFormScreen() {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<FormSection[]>([
    {
      id: '1',
      title: 'Información General',
      description: 'Datos básicos de la inspección',
      items: [
        {
          id: '1.1',
          question: 'Área de inspección',
          type: 'select',
          required: true,
          options: ['Producción', 'Mantenimiento', 'Laboratorio', 'Almacén', 'Oficinas', 'Instalaciones'],
        },
        {
          id: '1.2',
          question: 'Fecha de inspección',
          type: 'text',
          required: true,
          value: new Date().toLocaleDateString('es-ES'),
        },
        {
          id: '1.3',
          question: 'Inspector responsable',
          type: 'text',
          required: true,
          value: 'Carlos Mendoza',
        },
        {
          id: '1.4',
          question: 'Hora de inicio',
          type: 'text',
          required: true,
          value: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    },
    {
      id: '2',
      title: 'Equipos de Protección Personal (EPP)',
      description: 'Verificación del uso correcto de EPP',
      items: [
        {
          id: '2.1',
          question: '¿Todo el personal usa casco de seguridad?',
          type: 'yesno',
          required: true,
        },
        {
          id: '2.2',
          question: '¿Se verifica el estado de los cascos regularmente?',
          type: 'yesno',
          required: true,
        },
        {
          id: '2.3',
          question: '¿El personal usa calzado de seguridad apropiado?',
          type: 'yesno',
          required: true,
        },
        {
          id: '2.4',
          question: '¿Se proporcionan guantes de protección cuando es necesario?',
          type: 'yesno',
          required: true,
        },
        {
          id: '2.5',
          question: 'Observaciones sobre EPP',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      id: '3',
      title: 'Condiciones del Área',
      description: 'Estado general del área de trabajo',
      items: [
        {
          id: '3.1',
          question: '¿El área está limpia y ordenada?',
          type: 'yesno',
          required: true,
        },
        {
          id: '3.2',
          question: '¿La iluminación es adecuada?',
          type: 'yesno',
          required: true,
        },
        {
          id: '3.3',
          question: '¿La ventilación funciona correctamente?',
          type: 'yesno',
          required: true,
        },
        {
          id: '3.4',
          question: '¿Las rutas de evacuación están despejadas?',
          type: 'yesno',
          required: true,
        },
        {
          id: '3.5',
          question: 'Nivel de ruido (dB)',
          type: 'number',
          required: false,
        },
        {
          id: '3.6',
          question: 'Observaciones sobre condiciones',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      id: '4',
      title: 'Equipos y Maquinaria',
      description: 'Estado y funcionamiento de equipos',
      items: [
        {
          id: '4.1',
          question: '¿Los equipos tienen mantenimiento al día?',
          type: 'yesno',
          required: true,
        },
        {
          id: '4.2',
          question: '¿Las protecciones están en su lugar?',
          type: 'yesno',
          required: true,
        },
        {
          id: '4.3',
          question: '¿Los interruptores de emergencia funcionan?',
          type: 'yesno',
          required: true,
        },
        {
          id: '4.4',
          question: '¿Hay señales de seguridad visibles?',
          type: 'yesno',
          required: true,
        },
        {
          id: '4.5',
          question: 'Observaciones sobre equipos',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      id: '5',
      title: 'Documentación y Procedimientos',
      description: 'Verificación de documentación requerida',
      items: [
        {
          id: '5.1',
          question: '¿Los procedimientos están actualizados?',
          type: 'yesno',
          required: true,
        },
        {
          id: '5.2',
          question: '¿El personal está capacitado en los procedimientos?',
          type: 'yesno',
          required: true,
        },
        {
          id: '5.3',
          question: '¿Se mantienen registros de capacitación?',
          type: 'yesno',
          required: true,
        },
        {
          id: '5.4',
          question: 'Observaciones sobre documentación',
          type: 'text',
          required: false,
        },
      ],
    },
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleItemChange = (sectionIndex: number, itemIndex: number, value: any) => {
    const newFormData = [...formData];
    newFormData[sectionIndex].items[itemIndex].value = value;
    setFormData(newFormData);
  };

  const handleNextSection = () => {
    if (currentSection < formData.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSaveInspection = () => {
    // Validar campos requeridos
    const currentSectionData = formData[currentSection];
    const requiredItems = currentSectionData.items.filter(item => item.required);
    const filledRequiredItems = requiredItems.filter(item => 
      item.value !== undefined && item.value !== '' && item.value !== null
    );

    if (filledRequiredItems.length < requiredItems.length) {
      Alert.alert('Campos Requeridos', 'Por favor completa todos los campos obligatorios antes de continuar.');
      return;
    }

    if (currentSection < formData.length - 1) {
      handleNextSection();
    } else {
      // Última sección - completar inspección
      Alert.alert(
        'Inspección Completada',
        '¿Deseas finalizar y guardar la inspección?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Completar', 
            onPress: () => {
              Alert.alert('Éxito', 'Inspección guardada exitosamente', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
              ]);
            }
          },
        ]
      );
    }
  };

  const renderFormItem = (item: FormItem, itemIndex: number) => {
    switch (item.type) {
      case 'yesno':
        return (
          <View style={styles.yesNoContainer}>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                item.value === true && styles.yesNoButtonSelected
              ]}
              onPress={() => handleItemChange(currentSection, itemIndex, true)}
            >
              <Text style={[
                styles.yesNoText,
                item.value === true && styles.yesNoTextSelected
              ]}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.yesNoButton,
                item.value === false && styles.yesNoButtonSelected
              ]}
              onPress={() => handleItemChange(currentSection, itemIndex, false)}
            >
              <Text style={[
                styles.yesNoText,
                item.value === false && styles.yesNoTextSelected
              ]}>No</Text>
            </TouchableOpacity>
          </View>
        );

      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={item.value || ''}
            onChangeText={(text) => handleItemChange(currentSection, itemIndex, text)}
            placeholder="Escribe tu respuesta aquí..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
        );

      case 'number':
        return (
          <TextInput
            style={styles.textInput}
            value={item.value || ''}
            onChangeText={(text) => handleItemChange(currentSection, itemIndex, text)}
            placeholder="Ingresa un número..."
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        );

      case 'select':
        return (
          <View style={styles.selectContainer}>
            {item.options?.map((option, optionIndex) => (
              <TouchableOpacity
                key={optionIndex}
                style={[
                  styles.selectOption,
                  item.value === option && styles.selectOptionSelected
                ]}
                onPress={() => handleItemChange(currentSection, itemIndex, option)}
              >
                <Text style={[
                  styles.selectOptionText,
                  item.value === option && styles.selectOptionTextSelected
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'photo':
        return (
          <TouchableOpacity style={styles.photoButton}>
            <IconSymbol name="camera.fill" size={24} color="#3b82f6" />
            <Text style={styles.photoButtonText}>Tomar Foto</Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  const currentSectionData = formData[currentSection];
  const progress = ((currentSection + 1) / formData.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Formulario de Inspección</Text>
          <Text style={styles.headerSubtitle}>
            Sección {currentSection + 1} de {formData.length}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% completado</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{currentSectionData.title}</Text>
          <Text style={styles.sectionDescription}>{currentSectionData.description}</Text>
        </View>

        {/* Form Items */}
        <View style={styles.formItems}>
          {currentSectionData.items.map((item, itemIndex) => (
            <View key={item.id} style={styles.formItem}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionText}>
                  {item.question}
                  {item.required && <Text style={styles.required}> *</Text>}
                </Text>
              </View>
              
              {renderFormItem(item, itemIndex)}
              
              {item.notes && (
                <Text style={styles.itemNotes}>{item.notes}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentSection > 0 && (
            <TouchableOpacity style={styles.previousButton} onPress={handlePreviousSection}>
              <Ionicons name="arrow-back" size={20} color="#6b7280" />
              <Text style={styles.previousButtonText}>Anterior</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={handleSaveInspection}
          >
            <Text style={styles.nextButtonText}>
              {currentSection < formData.length - 1 ? 'Siguiente' : 'Completar Inspección'}
            </Text>
            {currentSection < formData.length - 1 && (
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
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
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  formItems: {
    marginBottom: 32,
  },
  formItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
  questionHeader: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 24,
  },
  required: {
    color: '#ef4444',
  },
  yesNoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  yesNoButtonSelected: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  yesNoTextSelected: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  selectOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  selectOptionTextSelected: {
    color: '#fff',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    backgroundColor: '#f0f9ff',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    marginLeft: 8,
    fontWeight: '600',
  },
  itemNotes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  previousButtonText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});
