import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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

export default function OpenInspectionsScreen() {
  const [inspections, setInspections] = useState<OpenInspection[]>([
    {
      id: '1',
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
        }
      ]
    },
    {
      id: '2',
      title: 'Control de EPP - Personal de Mantenimiento',
      area: 'Mantenimiento',
      inspector: 'Ana García',
      startDate: '2024-01-14 09:00',
      priority: 'medium',
      status: 'pending',
      customQuestions: [
        {
          id: '1',
          text: 'Verificar uso correcto de cascos de seguridad',
          notes: 'Personal nuevo requiere capacitación'
        }
      ]
    },
    {
      id: '3',
      title: 'Inspección de Equipos - Zona de Carga',
      area: 'Almacén',
      inspector: 'Luis Rodríguez',
      startDate: '2024-01-13 10:00',
      priority: 'high',
      status: 'in-progress',
      customQuestions: [
        {
          id: '1',
          text: 'Revisar funcionamiento de montacargas',
          notes: 'Se reportó ruido extraño en motor'
        },
        {
          id: '2',
          text: 'Verificar estado de neumáticos',
          notes: 'Posible desgaste excesivo'
        }
      ]
    },
  ]);

  const handleNewInspection = () => {
    router.push('/create-open-inspection');
  };

  const handleInspectionPress = (inspection: OpenInspection) => {
    router.push(`/open-inspection-detail/${inspection.id}`);
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

  const totalOpen = inspections.filter(i => i.status !== 'completed').length;
  const highPriority = inspections.filter(i => i.priority === 'high' && i.status !== 'completed').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
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
            <Text style={styles.statNumber}>{totalOpen}</Text>
            <Text style={styles.statLabel}>Abiertas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{highPriority}</Text>
            <Text style={styles.statLabel}>Alta Prioridad</Text>
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
          
          {inspections.filter(i => i.status !== 'completed').map((inspection) => (
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
                <View style={styles.priorityBadge}>
                  <View style={[
                    styles.priorityDot,
                    { backgroundColor: getPriorityColor(inspection.priority) }
                  ]} />
                  <Text style={styles.priorityText}>
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
                  <Text style={styles.dateText}>Iniciada: {inspection.startDate}</Text>
                </View>
              </View>

                             <View style={styles.statusContainer}>
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

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="camera.fill" size={16} color="#10b981" />
                  <Text style={styles.actionText}>Fotos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="pencil" size={16} color="#3b82f6" />
                  <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color="#22c55e" />
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
    color: '#dbeafe',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 0,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
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
    fontSize: 24,
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
  newInspectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inspectionsContainer: {
    padding: 20,
    paddingTop: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
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
    fontWeight: '500',
    color: '#374151',
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
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
  questionsCount: {
    fontSize: 12,
    color: '#6b7280',
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
  },
  bottomSpacing: {
    height: 100,
  },
});
