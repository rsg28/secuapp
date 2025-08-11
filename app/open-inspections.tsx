import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  progress: number;
  priority: 'high' | 'medium' | 'low';
  estimatedCompletion: string;
}

export default function OpenInspectionsScreen() {
  const [inspections, setInspections] = useState<OpenInspection[]>([
    {
      id: '1',
      title: 'Inspección de Seguridad - Área de Producción',
      area: 'Producción',
      inspector: 'Carlos Mendoza',
      startDate: '2024-01-15 08:00',
      progress: 65,
      priority: 'high',
      estimatedCompletion: '2024-01-16 17:00',
    },
    {
      id: '2',
      title: 'Verificación EPP - Personal de Mantenimiento',
      area: 'Mantenimiento',
      inspector: 'Ana García',
      startDate: '2024-01-15 09:30',
      progress: 40,
      priority: 'medium',
      estimatedCompletion: '2024-01-17 15:00',
    },
    {
      id: '3',
      title: 'Control de Sustancias Químicas - Laboratorio',
      area: 'Laboratorio',
      inspector: 'Luis Rodríguez',
      startDate: '2024-01-14 14:00',
      progress: 80,
      priority: 'high',
      estimatedCompletion: '2024-01-15 18:00',
    },
    {
      id: '4',
      title: 'Inspección de Equipos - Zona de Carga',
      area: 'Almacén',
      inspector: 'María López',
      startDate: '2024-01-14 10:00',
      progress: 25,
      priority: 'low',
      estimatedCompletion: '2024-01-18 12:00',
    },
    {
      id: '5',
      title: 'Verificación de Rutas de Evacuación',
      area: 'Instalaciones',
      inspector: 'Roberto Silva',
      startDate: '2024-01-13 16:00',
      progress: 90,
      priority: 'medium',
      estimatedCompletion: '2024-01-15 10:00',
    },
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleInspectionPress = (inspection: OpenInspection) => {
    Alert.alert(
      inspection.title,
      `Área: ${inspection.area}\nInspector: ${inspection.inspector}\nProgreso: ${inspection.progress}%\nFecha de inicio: ${inspection.startDate}\nEstimado de finalización: ${inspection.estimatedCompletion}`,
      [
        { text: 'Continuar', onPress: () => router.push('/inspection-form') },
        { text: 'Editar', onPress: () => console.log('Editar inspección:', inspection.id) },
        { text: 'Pausar', onPress: () => console.log('Pausar inspección:', inspection.id) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleNewInspection = () => {
    Alert.alert(
      'Nueva Inspección',
      '¿Cómo deseas crear la inspección?',
      [
        { text: 'Desde Template', onPress: () => router.push('/inspection-form') },
        { text: 'Crear Nueva', onPress: () => router.push('/inspection-form') },
        { text: 'Cancelar', style: 'cancel' },
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Inspecciones Abiertas</Text>
          <Text style={styles.headerSubtitle}>
            Inspecciones en curso y pendientes
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{inspections.length}</Text>
            <Text style={styles.statLabel}>Total Abiertas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {inspections.filter(i => i.priority === 'high').length}
            </Text>
            <Text style={styles.statLabel}>Prioridad Alta</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {Math.round(inspections.reduce((acc, i) => acc + i.progress, 0) / inspections.length)}%
            </Text>
            <Text style={styles.statLabel}>Progreso Promedio</Text>
          </View>
        </View>

        {/* New Inspection Button */}
        <TouchableOpacity style={styles.newInspectionButton} onPress={handleNewInspection}>
          <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
          <Text style={styles.newInspectionText}>Nueva Inspección</Text>
        </TouchableOpacity>

        {/* Inspections List */}
        <View style={styles.inspectionsContainer}>
          <Text style={styles.sectionTitle}>Inspecciones Activas</Text>
          
          {inspections.map((inspection) => (
            <TouchableOpacity 
              key={inspection.id} 
              style={styles.inspectionCard}
              onPress={() => handleInspectionPress(inspection)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.inspectionInfo}>
                  <Text style={styles.inspectionTitle}>{inspection.title}</Text>
                  <Text style={styles.inspectionArea}>{inspection.area}</Text>
                </View>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(inspection.priority) + '20' }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    { color: getPriorityColor(inspection.priority) }
                  ]}>
                    {getPriorityText(inspection.priority)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.inspectorInfo}>
                  <IconSymbol name="person.fill" size={16} color="#6b7280" />
                  <Text style={styles.inspectorText}>{inspection.inspector}</Text>
                </View>
                <View style={styles.dateInfo}>
                  <IconSymbol name="calendar" size={16} color="#6b7280" />
                  <Text style={styles.dateText}>Inicio: {inspection.startDate}</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>Progreso: {inspection.progress}%</Text>
                  <Text style={styles.estimatedText}>
                    Estimado: {inspection.estimatedCompletion}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${inspection.progress}%` }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="camera.fill" size={16} color="#3b82f6" />
                  <Text style={styles.actionText}>Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="document.fill" size={16} color="#10b981" />
                  <Text style={styles.actionText}>Notas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#f59e0b" />
                  <Text style={styles.actionText}>Completar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
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
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  newInspectionButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newInspectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inspectionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inspectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  inspectionInfo: {
    flex: 1,
    marginRight: 16,
  },
  inspectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  inspectionArea: {
    fontSize: 14,
    color: '#6b7280',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 16,
  },
  inspectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inspectorText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  estimatedText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
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
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});
