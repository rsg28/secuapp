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

interface ClosedInspection {
  id: string;
  title: string;
  area: string;
  inspector: string;
  startDate: string;
  completionDate: string;
  result: 'passed' | 'failed' | 'conditional';
  score: number;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  observations: string[];
}

export default function ClosedInspectionsScreen() {
  const [inspections, setInspections] = useState<ClosedInspection[]>([
    {
      id: '1',
      title: 'Inspección de Seguridad - Área de Producción',
      area: 'Producción',
      inspector: 'Carlos Mendoza',
      startDate: '2024-01-10 08:00',
      completionDate: '2024-01-12 16:30',
      result: 'passed',
      score: 92,
      totalItems: 25,
      passedItems: 23,
      failedItems: 2,
      observations: [
        'Se requiere actualizar señalización en zona de maquinaria',
        'EPP en buen estado para todo el personal',
      ],
    },
    {
      id: '2',
      title: 'Verificación EPP - Personal de Mantenimiento',
      area: 'Mantenimiento',
      inspector: 'Ana García',
      startDate: '2024-01-08 09:00',
      completionDate: '2024-01-09 14:00',
      result: 'conditional',
      score: 78,
      totalItems: 18,
      passedItems: 14,
      failedItems: 4,
      observations: [
        'Falta reemplazar 3 cascos vencidos',
        'Se requiere capacitación adicional en uso de EPP',
      ],
    },
    {
      id: '3',
      title: 'Control de Sustancias Químicas - Laboratorio',
      area: 'Laboratorio',
      inspector: 'Luis Rodríguez',
      startDate: '2024-01-05 10:00',
      completionDate: '2024-01-06 17:00',
      result: 'passed',
      score: 95,
      totalItems: 20,
      passedItems: 19,
      failedItems: 1,
      observations: [
        'Sistema de ventilación funcionando correctamente',
        'Inventario de sustancias actualizado',
      ],
    },
    {
      id: '4',
      title: 'Inspección de Equipos - Zona de Carga',
      area: 'Almacén',
      inspector: 'María López',
      startDate: '2024-01-03 08:30',
      completionDate: '2024-01-04 12:00',
      result: 'failed',
      score: 65,
      totalItems: 22,
      passedItems: 14,
      failedItems: 8,
      observations: [
        'Montacargas requiere mantenimiento urgente',
        'Señalización de seguridad insuficiente',
        'Falta implementar protocolo de carga',
      ],
    },
    {
      id: '5',
      title: 'Verificación de Rutas de Evacuación',
      area: 'Instalaciones',
      inspector: 'Roberto Silva',
      startDate: '2024-01-01 14:00',
      completionDate: '2024-01-02 11:00',
      result: 'passed',
      score: 88,
      totalItems: 15,
      passedItems: 13,
      failedItems: 2,
      observations: [
        'Rutas de evacuación despejadas',
        'Señales de emergencia visibles',
      ],
    },
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleInspectionPress = (inspection: ClosedInspection) => {
    Alert.alert(
      inspection.title,
      `Área: ${inspection.area}\nInspector: ${inspection.inspector}\nResultado: ${getResultText(inspection.result)}\nPuntuación: ${inspection.score}/100\nFecha de inicio: ${inspection.startDate}\nFecha de finalización: ${inspection.completionDate}\n\nObservaciones:\n${inspection.observations.map(obs => `• ${obs}`).join('\n')}`,
      [
        { text: 'Ver Reporte', onPress: () => console.log('Ver reporte:', inspection.id) },
        { text: 'Exportar PDF', onPress: () => console.log('Exportar PDF:', inspection.id) },
        { text: 'Compartir', onPress: () => console.log('Compartir:', inspection.id) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleNewInspection = () => {
    router.push('/inspection-form');
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'passed':
        return '#22c55e';
      case 'conditional':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'passed':
        return 'Aprobada';
      case 'conditional':
        return 'Condicional';
      case 'failed':
        return 'Rechazada';
      default:
        return 'N/A';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Inspecciones Cerradas</Text>
          <Text style={styles.headerSubtitle}>
            Inspecciones completadas y archivadas
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{inspections.length}</Text>
            <Text style={styles.statLabel}>Total Completadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {inspections.filter(i => i.result === 'passed').length}
            </Text>
            <Text style={styles.statLabel}>Aprobadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {Math.round(inspections.reduce((acc, i) => acc + i.score, 0) / inspections.length)}%
            </Text>
            <Text style={styles.statLabel}>Puntuación Promedio</Text>
          </View>
        </View>

        {/* New Inspection Button */}
        <TouchableOpacity style={styles.newInspectionButton} onPress={handleNewInspection}>
          <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
          <Text style={styles.newInspectionText}>Nueva Inspección</Text>
        </TouchableOpacity>

        {/* Inspections List */}
        <View style={styles.inspectionsContainer}>
          <Text style={styles.sectionTitle}>Inspecciones Completadas</Text>
          
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
                  styles.resultBadge,
                  { backgroundColor: getResultColor(inspection.result) + '20' }
                ]}>
                  <Text style={[
                    styles.resultText,
                    { color: getResultColor(inspection.result) }
                  ]}>
                    {getResultText(inspection.result)}
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
                  <Text style={styles.dateText}>Finalizada: {inspection.completionDate}</Text>
                </View>
              </View>

              <View style={styles.scoreContainer}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.scoreText}>Puntuación: {inspection.score}/100</Text>
                  <Text style={styles.itemsText}>
                    {inspection.passedItems}/{inspection.totalItems} elementos aprobados
                  </Text>
                </View>
                <View style={styles.scoreBar}>
                  <View 
                    style={[
                      styles.scoreFill, 
                      { 
                        width: `${inspection.score}%`,
                        backgroundColor: getScoreColor(inspection.score)
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.observationsContainer}>
                <Text style={styles.observationsTitle}>Observaciones Principales:</Text>
                {inspection.observations.slice(0, 2).map((observation, index) => (
                  <Text key={index} style={styles.observationText}>
                    • {observation}
                  </Text>
                ))}
                {inspection.observations.length > 2 && (
                  <Text style={styles.moreObservationsText}>
                    +{inspection.observations.length - 2} observaciones más
                  </Text>
                )}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="document.fill" size={16} color="#3b82f6" />
                  <Text style={styles.actionText}>Reporte</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="camera.fill" size={16} color="#10b981" />
                  <Text style={styles.actionText}>Fotos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="share" size={16} color="#f59e0b" />
                  <Text style={styles.actionText}>Compartir</Text>
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
    backgroundColor: '#22c55e',
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
    color: '#dcfce7',
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
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  resultText: {
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
  scoreContainer: {
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  itemsText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  observationsContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  observationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  observationText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  moreObservationsText: {
    fontSize: 12,
    color: '#3b82f6',
    fontStyle: 'italic',
    marginTop: 4,
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
