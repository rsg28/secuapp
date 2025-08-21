import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

interface CustomQuestion {
  id: string;
  text: string;
  notes: string;
}

export default function CreateOpenInspectionScreen() {
  const [area, setArea] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      const question: CustomQuestion = {
        id: Date.now().toString(),
        text: newQuestion.trim(),
        notes: newNotes.trim(),
      };
      setCustomQuestions([...customQuestions, question]);
      setNewQuestion('');
      setNewNotes('');
    }
  };

  const handleRemoveQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  };

  const handleSaveInspection = () => {
    if (!area.trim()) {
      Alert.alert('Error', 'Por favor ingresa el área de inspección');
      return;
    }

    if (customQuestions.length === 0) {
      Alert.alert('Error', 'Por favor agrega al menos una pregunta o statement');
      return;
    }

    // Aquí se guardaría la inspección
    Alert.alert(
      'Inspección Creada',
      'La inspección se ha creado exitosamente',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'N/A';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Crear Nueva Inspección</Text>
          <Text style={styles.headerSubtitle}>
            Inspección personalizada sin formulario predefinido
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Área de Inspección */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Área de Inspección</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe el área o zona a inspeccionar..."
            value={area}
            onChangeText={setArea}
            multiline
          />
        </View>

        {/* Prioridad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prioridad</Text>
          <View style={styles.priorityContainer}>
            {(['high', 'medium', 'low'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  priority === p && { backgroundColor: getPriorityColor(p) }
                ]}
                onPress={() => setPriority(p)}
              >
                <Text style={[
                  styles.priorityButtonText,
                  priority === p && styles.priorityButtonTextActive
                ]}>
                  {getPriorityText(p)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preguntas Personalizadas */}
        <View style={styles.section}>
          {/* Agregar Nueva Pregunta */}
          <View style={styles.addQuestionContainer}>
            <TextInput
              style={styles.questionInput}
              placeholder=""
              value={newQuestion}
              onChangeText={setNewQuestion}
              multiline
            />
            <TextInput
              style={styles.notesInput}
              placeholder=""
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
            />
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddQuestion}
              disabled={!newQuestion.trim()}
            >
              <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Preguntas */}
          {customQuestions.map((question, index) => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>#{index + 1}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveQuestion(question.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.questionText}>{question.text}</Text>
              {question.notes && (
                <Text style={styles.questionNotes}>Notas: {question.notes}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Botón de Guardar */}
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!area.trim() || customQuestions.length === 0) && styles.saveButtonDisabled
          ]} 
          onPress={handleSaveInspection}
          disabled={!area.trim() || customQuestions.length === 0}
        >
          <IconSymbol name="checkmark.circle.fill" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Crear Inspección</Text>
        </TouchableOpacity>

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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    padding: 20,
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
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  addQuestionContainer: {
    marginBottom: 20,
  },
  questionInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    minHeight: 50,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#fff',
    minHeight: 40,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  questionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  removeButton: {
    padding: 4,
  },
  questionText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  questionNotes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    margin: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
});
