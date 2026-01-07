import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsers } from '../hooks/useUsers';
import { useClosedTemplateItems } from '../hooks/useClosedTemplateItems';
import { useOpenTemplateItems } from '../hooks/useOpenTemplateItems';
import { useClosedInspectionResponseItems } from '../hooks/useClosedInspectionResponseItems';
import { useOpenInspectionResponseItems } from '../hooks/useOpenInspectionResponseItems';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

interface InspectionItem {
  id: string;
  type: 'closed' | 'open';
  title: string;
  inspection_date: string;
  completion_date?: string;
  created_at: string;
  status: 'completed' | 'pending';
  totalQuestions?: number;
  answeredQuestions?: number;
}

export default function EmployeeInspectionsScreen() {
  const { employeeId, employeeName, employeeEmail } = useLocalSearchParams<{
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
  }>();
  
  const { loading, error, getInspectorInspections } = useUsers();
  const { countItemsByTemplateId: countClosedTemplateItems } = useClosedTemplateItems();
  const { countItemsByTemplateId: countOpenTemplateItems } = useOpenTemplateItems();
  const { countItemsByResponseId: countClosedResponseItems } = useClosedInspectionResponseItems();
  const { countItemsByResponseId: countOpenResponseItems } = useOpenInspectionResponseItems();
  
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      loadInspections();
    }
  }, [employeeId]);

  const loadInspections = async () => {
    if (!employeeId) return;
    
    try {
      setLoadingInspections(true);
      const data = await getInspectorInspections(employeeId);
      
      const safeCount = async (fn: () => Promise<number>) => {
        try {
          return await fn();
        } catch (error: any) {
          console.error('Error counting items:', error?.message);
          return 0;
        }
      };

      const inspectionsWithStatus: InspectionItem[] = await Promise.all(
        (data.data.inspections || []).map(async (inspection: any) => {
          const totalQuestions = inspection.template_id
            ? await safeCount(() => 
                inspection.type === 'closed'
                  ? countClosedTemplateItems(inspection.template_id)
                  : countOpenTemplateItems(inspection.template_id)
              )
            : 0;
          const answeredQuestions = await safeCount(() =>
            inspection.type === 'closed'
              ? countClosedResponseItems(inspection.id)
              : countOpenResponseItems(inspection.id)
          );

          return {
            id: inspection.id,
            type: inspection.type,
            title: inspection.title || 'Sin título',
            inspection_date: inspection.inspection_date,
            completion_date: inspection.completion_date,
            created_at: inspection.created_at,
            status: totalQuestions > 0 && totalQuestions === answeredQuestions ? 'completed' : 'pending',
            totalQuestions,
            answeredQuestions
          };
        })
      );

      setInspections(inspectionsWithStatus);
    } catch (error: any) {
      console.error('Error loading inspections:', error);
    } finally {
      setLoadingInspections(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha desconocida';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Fecha desconocida';
    }
  };

  const handleDownload = async (inspection: InspectionItem) => {
    try {
      setDownloadingId(inspection.id);
      const type = inspection.type === 'closed' ? 'closed' : 'open';
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Inicia sesión nuevamente.');
      }

      // Descargar directamente usando FileSystem (React Native compatible)
      const sanitizedTitle = (inspection.title || 'sin-titulo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `inspeccion-${sanitizedTitle}-${Date.now()}.xlsx`;
      
      // @ts-ignore - documentDirectory exists in expo-file-system
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Descargar directamente usando FileSystem
      const downloadResult = await FileSystem.downloadAsync(
        `${API_BASE_URL}/inspection-responses/download?responseId=${inspection.id}&type=${type}`,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Verificar que la descarga fue exitosa
      if (downloadResult.status !== 200) {
        throw new Error(`Error al descargar el archivo: ${downloadResult.status}`);
      }

      // Compartir archivo
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Descargar Inspección',
        });
        Alert.alert('Éxito', 'Archivo Excel generado y listo para compartir');
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
    } catch (error: any) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', `No se pudo generar el archivo: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Inspecciones</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{employeeName}</Text>
          <Text style={styles.headerEmail} numberOfLines={1}>{employeeEmail}</Text>
        </View>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => router.push({
            pathname: '/employee-statistics',
            params: {
              employeeId,
              employeeName,
              employeeEmail,
            }
          })}
        >
          <Ionicons name="stats-chart" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Inspections List */}
      {loading || loadingInspections ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando inspecciones...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Error al cargar inspecciones</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInspections}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : inspections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No hay inspecciones registradas</Text>
        </View>
      ) : (
        <ScrollView style={styles.inspectionsList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {inspections.map((inspection) => (
            <TouchableOpacity
              key={inspection.id}
              style={styles.inspectionCard}
              onPress={() => handleDownload(inspection)}
              activeOpacity={0.7}
              disabled={downloadingId === inspection.id}
            >
              <View style={styles.inspectionInfo}>
                <View style={styles.inspectionHeader}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.inspectionTitle} numberOfLines={2}>
                      {inspection.title}
                    </Text>
                    <View style={[
                      styles.statusCircle,
                      { backgroundColor: inspection.status === 'completed' ? '#22c55e' : '#f59e0b' }
                    ]} />
                  </View>
                </View>
                
                <View style={styles.inspectionMeta}>
                  <View style={styles.metaRow}>
                    <Ionicons name="finger-print" size={14} color="#6b7280" />
                    <Text style={styles.idText} numberOfLines={1} ellipsizeMode="tail">
                      ID: {inspection.id.slice(-8)}
                    </Text>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <Ionicons name={inspection.type === 'closed' ? 'document-text' : 'time'} size={14} color="#6b7280" />
                    <Text style={styles.metaText}>
                      {inspection.type === 'closed' ? 'Checklist' : 'Inspección Abierta'}
                    </Text>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar" size={14} color="#6b7280" />
                    <Text style={styles.metaText}>
                      Fecha: {formatDate(inspection.inspection_date)}
                    </Text>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <Ionicons name="time" size={14} color="#6b7280" />
                    <Text style={styles.metaText}>
                      Creado: {formatDate(inspection.created_at)}
                    </Text>
                  </View>

                  {inspection.totalQuestions !== undefined && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>
                        {inspection.answeredQuestions || 0} / {inspection.totalQuestions} preguntas
                      </Text>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${inspection.totalQuestions > 0 ? ((inspection.answeredQuestions || 0) / inspection.totalQuestions) * 100 : 0}%`,
                              backgroundColor: inspection.status === 'completed' ? '#22c55e' : '#f59e0b'
                            }
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.arrowContainer}>
                {downloadingId === inspection.id ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Ionicons name="download" size={24} color="#3b82f6" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Espacio adicional para evitar que los tabs tapen el contenido */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 2,
  },
  headerEmail: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  inspectionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  inspectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectionInfo: {
    flex: 1,
  },
  inspectionHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  inspectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 2,
  },
  inspectionMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  idText: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 100,
    width: '100%',
  },
});

