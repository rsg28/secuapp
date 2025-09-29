import { IconSymbol } from '@/components/ui/IconSymbol';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface OpenInspection {
  id: string;
  title: string;
  area: string;
  inspector: string;
  startDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  customQuestions: CustomQuestion[];
}

interface CustomQuestion {
  id: string;
  text: string;
  notes: string;
}

function OpenInspectionDetailScreen() {
  const params = useLocalSearchParams();
  const inspectionId = params.id as string;
  
  // Simular datos de la inspección (en el futuro vendrá del backend)
  const [inspection] = useState<OpenInspection>({
    id: inspectionId,
    title: 'Inspección de Seguridad - Área de Producción',
    area: 'Producción',
    inspector: 'Carlos Mendoza',
    startDate: '2024-01-15 08:00',
    priority: 'high',
    status: 'in-progress',
    customQuestions: [
      {
        id: '1',
        text: 'Verificar estado de extintores en zona A',
        notes: 'Se reportó que algunos extintores podrían estar vencidos'
      },
      {
        id: '2',
        text: 'Revisar señalización de emergencia',
        notes: 'Falta señalización en pasillo principal'
      },
      {
        id: '3',
        text: 'Controlar uso de EPP en personal',
        notes: 'Verificar que todos usen cascos y guantes'
      }
    ]
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in-progress':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in-progress':
        return 'En Progreso';
      case 'pending':
        return 'Pendiente';
      default:
        return 'N/A';
    }
  };

  const handleCompleteInspection = () => {
    Alert.alert(
      'Completar Inspección',
      '¿Estás seguro de que deseas marcar esta inspección como completada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Completar', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Éxito', 'Inspección marcada como completada');
            router.back();
          }
        }
      ]
    );
  };

  const handleEditInspection = () => {
    Alert.alert('Editar', 'Función de edición en desarrollo');
  };

  const handleTakePhoto = () => {
    Alert.alert('Tomar Foto', 'Función de cámara en desarrollo');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      {/* Header Personalizado */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Detalle de Inspección</Text>
          <Text style={styles.headerSubtitle}>
            {inspection.area} • {inspection.inspector}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información Principal */}
        <View style={styles.mainInfo}>
          <Text style={styles.inspectionTitle}>{inspection.title}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <IconSymbol name="calendar" size={16} color="#6b7280" />
              <Text style={styles.infoText}>Iniciada: {inspection.startDate}</Text>
            </View>
          </View>

          <View style={styles.badgesContainer}>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(inspection.priority) + '20' }
            ]}>
              <View style={[
                styles.priorityDot,
                { backgroundColor: getPriorityColor(inspection.priority) }
              ]} />
              <Text style={[
                styles.priorityText,
                { color: getPriorityColor(inspection.priority) }
              ]}>
                {getPriorityText(inspection.priority)}
              </Text>
            </View>

            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(inspection.status) + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(inspection.status) }
              ]}>
                {getStatusText(inspection.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Preguntas Personalizadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas de Inspección</Text>
          
          {inspection.customQuestions.map((question, index) => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>#{index + 1}</Text>
                <Text style={styles.questionText}>{question.text}</Text>
              </View>
              
              {question.notes && (
                <View style={styles.notesContainer}>
                  <IconSymbol name="info.circle" size={14} color="#6b7280" />
                  <Text style={styles.notesText}>{question.notes}</Text>
                </View>
              )}

              <View style={styles.questionActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="camera.fill" size={16} color="#10b981" />
                  <Text style={styles.actionText}>Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="pencil" size={16} color="#3b82f6" />
                  <Text style={styles.actionText}>Notas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#22c55e" />
                  <Text style={styles.actionText}>Completar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Acciones Principales */}
        <View style={styles.mainActions}>
          <TouchableOpacity 
            style={[styles.mainActionButton, styles.editButton]} 
            onPress={handleEditInspection}
          >
            <IconSymbol name="pencil" size={20} color="#fff" />
            <Text style={styles.mainActionText}>Editar Inspección</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainActionButton, styles.photoButton]} 
            onPress={handleTakePhoto}
          >
            <IconSymbol name="camera.fill" size={20} color="#fff" />
            <Text style={styles.mainActionText}>Tomar Fotos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainActionButton, styles.completeButton]} 
            onPress={handleCompleteInspection}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
            <Text style={styles.mainActionText}>Completar</Text>
          </TouchableOpacity>
        </View>

        {/* Espacio para bottom tab */}
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
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
  },
  content: {
    flex: 1,
  },
  mainInfo: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inspectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    lineHeight: 24,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  questionCard: {
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
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginRight: 12,
    minWidth: 24,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
    lineHeight: 20,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
  },
  notesText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
  },
  mainActions: {
    margin: 20,
    marginTop: 0,
    gap: 12,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  photoButton: {
    backgroundColor: '#10b981',
  },
  completeButton: {
    backgroundColor: '#22c55e',
  },
  mainActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default OpenInspectionDetailScreen;
