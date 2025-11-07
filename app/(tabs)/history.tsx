import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
    GestureResponderEvent,
    Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../contexts/AuthContext';
import { useClosedInspectionResponses } from '../../hooks/useClosedInspectionResponses';
import { useOpenInspectionResponses } from '../../hooks/useOpenInspectionResponses';
import { useClosedTemplateItems } from '../../hooks/useClosedTemplateItems';
import { useOpenTemplateItems } from '../../hooks/useOpenTemplateItems';
import { useClosedInspectionResponseItems } from '../../hooks/useClosedInspectionResponseItems';
import { useOpenInspectionResponseItems } from '../../hooks/useOpenInspectionResponseItems';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

interface HistoryItem {
  id: string;
  service: string;
  serviceType: string;
  action: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  details: string;
  category: 'abierto' | 'cerrado' | 'general';
  template_id?: string;
  company_id?: string;
  title?: string;
  totalQuestions?: number;
  answeredQuestions?: number;
}

interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const escapeCsvValue = (value: any) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const isRemoteDebugging = Platform.OS !== 'web'
  && typeof global !== 'undefined'
  && typeof (global as any).nativeCallSyncHook === 'undefined';

const canUseBrowserDownload = typeof window !== 'undefined'
  && typeof document !== 'undefined'
  && typeof URL !== 'undefined'
  && typeof Blob !== 'undefined';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { 
    getResponsesByInspectorId: getClosedResponses,
    getResponseById: getClosedResponseById,
    deleteResponse: deleteClosedResponse,
    loading: closedLoading 
  } = useClosedInspectionResponses();
  const { 
    getResponsesByInspectorId: getOpenResponses,
    getResponseById: getOpenResponseById,
    deleteResponse: deleteOpenResponse,
    loading: openLoading 
  } = useOpenInspectionResponses();
  const { 
    countItemsByTemplateId: countClosedTemplateItems,
    getItemsByTemplateId: getClosedTemplateItems
  } = useClosedTemplateItems();
  const { 
    countItemsByTemplateId: countOpenTemplateItems,
    getItemsByTemplateId: getOpenTemplateItems
  } = useOpenTemplateItems();
  const { 
    countItemsByResponseId: countClosedResponseItems,
    getItemsByResponseId: getClosedResponseItems
  } = useClosedInspectionResponseItems();
  const { 
    countItemsByResponseId: countOpenResponseItems,
    getItemsByResponseId: getOpenResponseItems
  } = useOpenInspectionResponseItems();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'abierto' | 'cerrado'>('all');
  const [selectedService, setSelectedService] = useState<Service | null>({
    id: 'inspecciones',
    name: 'Inspecciones',
    icon: 'clipboard',
    color: '#3b82f6'
  });
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showWorkingModal, setShowWorkingModal] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const services: Service[] = [
    { id: 'inspecciones', name: 'Inspecciones', icon: 'clipboard', color: '#3b82f6' },
    { id: 'observaciones', name: 'Observaciones', icon: 'eye', color: '#10b981' },
    { id: 'auditoria', name: 'Auditoría', icon: 'document-text', color: '#8b5cf6' },
    { id: 'linea-base', name: 'Línea de Base', icon: 'bar-chart', color: '#f59e0b' },
    { id: 'monitoreo', name: 'Monitoreo', icon: 'trending-up', color: '#ef4444' },
  ];

  // Load inspections when component mounts or when service changes to "inspecciones"
  useFocusEffect(
    React.useCallback(() => {
      if (selectedService?.id === 'inspecciones' && user?.id) {
        loadInspections();
      }
    }, [selectedService?.id, user?.id])
  );

  const loadInspections = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [closedData, openData] = await Promise.all([
        getClosedResponses(user.id, 1, 100),
        getOpenResponses(user.id, 1, 100)
      ]);

      const safeCount = async (fn: () => Promise<number>) => {
        try {
          return await fn();
        } catch (error: any) {
          console.error('Error counting items:', error?.message);
          return 0;
        }
      };

      const closedItems: HistoryItem[] = await Promise.all(
        (closedData?.data?.responses || []).map(async (response: any) => {
          const totalQuestions = response.template_id
            ? await safeCount(() => countClosedTemplateItems(response.template_id))
            : 0;
          const answeredQuestions = await safeCount(() => countClosedResponseItems(response.id));

          return {
            id: response.id,
            service: 'Inspección Cerrada',
            serviceType: 'inspecciones',
            action: 'Inspección completada',
            timestamp: formatDate(response.created_at),
            status: totalQuestions === answeredQuestions ? 'completed' : 'pending',
            details: response.title || 'Sin título',
            category: 'cerrado' as const,
            template_id: response.template_id,
            company_id: response.company_id,
            title: response.title,
            totalQuestions,
            answeredQuestions,
            createdAt: response.created_at
          } as HistoryItem & { createdAt?: string };
        })
      );

      const openItems: HistoryItem[] = await Promise.all(
        (openData?.data?.responses || []).map(async (response: any) => {
          const totalQuestions = response.template_id
            ? await safeCount(() => countOpenTemplateItems(response.template_id))
            : 0;
          const answeredQuestions = await safeCount(() => countOpenResponseItems(response.id));

          return {
            id: response.id,
            service: 'Inspección Abierta',
            serviceType: 'inspecciones',
            action: 'Inspección completada',
            timestamp: formatDate(response.created_at),
            status: totalQuestions === answeredQuestions ? 'completed' : 'pending',
            details: response.title || 'Sin título',
            category: 'abierto' as const,
            template_id: response.template_id,
            company_id: response.company_id,
            title: response.title,
            totalQuestions,
            answeredQuestions,
            createdAt: response.created_at
          } as HistoryItem & { createdAt?: string };
        })
      );

      const allItems = [...closedItems, ...openItems]
        .map(item => ({ ...item, createdAt: (item as any).createdAt || new Date().toISOString() }))
        .sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime())
        .map(({ createdAt, ...rest }) => rest);

      setHistoryData(allItems);
    } catch (error: any) {
      console.error('Error loading inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha desconocida';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Hoy';
      } else if (diffDays === 1) {
        return 'Ayer';
      } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
      } else {
        return date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {
      return 'Fecha desconocida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'pending':
        return 'Incompleto';
      case 'failed':
        return 'Fallido';
      default:
        return 'Desconocido';
    }
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'abierto':
        return { name: 'Abierto', color: '#f59e0b', icon: 'time' };
      case 'cerrado':
        return { name: 'Cerrado', color: '#22c55e', icon: 'checkmark-circle' };
      case 'general':
        return { name: 'General', color: '#6b7280', icon: 'apps' };
      default:
        return { name: 'Otro', color: '#6b7280', icon: 'apps' };
    }
  };

  const getFilteredHistory = () => {
    let filtered = historyData;
    
    // Filtrar por servicio si está seleccionado
    if (selectedService) {
      filtered = filtered.filter(item => item.serviceType === selectedService.id);
    }
    
    // Solo aplicar filtros de categorías específicas si el servicio seleccionado es "Inspecciones"
    if (selectedFilter !== 'all' && selectedService?.id === 'inspecciones') {
      filtered = filtered.filter(item => item.category === selectedFilter);
    }
    
    return filtered;
  };

  const filteredHistory = getFilteredHistory();

  // Solo mostrar filtros de categorías específicas para inspecciones
  const shouldShowCategoryFilters = !selectedService || selectedService.id === 'inspecciones';

  const handleDeleteResponse = (item: HistoryItem) => {
    const isClosed = item.category === 'cerrado';

    Alert.alert(
      'Eliminar respuesta',
      '¿Deseas eliminar esta respuesta y todos sus items asociados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              if (isClosed) {
                await deleteClosedResponse(item.id);
              } else {
                await deleteOpenResponse(item.id);
              }
              await loadInspections();
            } catch (error: any) {
              console.error('Error deleting response:', error);
              Alert.alert('Error', error?.message || 'No se pudo eliminar la respuesta');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDownloadExcel = async (item: HistoryItem) => {
    const isClosed = item.category === 'cerrado';
    const templateId = item.template_id;

    if (!templateId) {
      Alert.alert('Error', 'No se encontró el template asociado a esta inspección');
      return;
    }

    try {
      setDownloadingId(item.id);

      const [responseData, templateItemsRaw, responseItemsRaw] = await Promise.all([
        isClosed ? getClosedResponseById(item.id) : getOpenResponseById(item.id),
        isClosed ? getClosedTemplateItems(templateId) : getOpenTemplateItems(templateId),
        isClosed ? getClosedResponseItems(item.id) : getOpenResponseItems(item.id)
      ]);

      const templateItems = Array.isArray(templateItemsRaw) ? templateItemsRaw : [];
      const responseItems = Array.isArray(responseItemsRaw) ? responseItemsRaw : [];

      const templateMap: Record<string, any> = {};
      templateItems.forEach((templateItem: any) => {
        templateMap[templateItem.id] = templateItem;
      });

      const lines: string[] = [];
      lines.push(`Título,${escapeCsvValue(responseData?.title || 'Sin título')}`);
      lines.push(`Tipo,${escapeCsvValue(isClosed ? 'Inspección Cerrada' : 'Inspección Abierta')}`);
      lines.push(`Fecha de inspección,${escapeCsvValue(responseData?.inspection_date || '')}`);
      lines.push(`Fecha de finalización,${escapeCsvValue(responseData?.completion_date || '')}`);
      if (responseData?.company_name) {
        lines.push(`Empresa,${escapeCsvValue(responseData.company_name)}`);
      }
      if (!isClosed && responseData?.notes) {
        lines.push(`Notas,${escapeCsvValue(responseData.notes)}`);
      }
      lines.push('');

      if (isClosed) {
        lines.push('Pregunta,Respuesta,Explicación');
        responseItems.forEach((responseItem: any) => {
          const templateItem = templateMap[responseItem.item_id] || {};
          lines.push([
            escapeCsvValue(templateItem.text || `Pregunta ${responseItem.question_index}`),
            escapeCsvValue(responseItem.response),
            escapeCsvValue(responseItem.explanation)
          ].join(','));
        });
      } else {
        lines.push('Pregunta,Respuesta');
        responseItems.forEach((responseItem: any) => {
          const templateItem = templateMap[responseItem.item_id] || {};
          lines.push([
            escapeCsvValue(templateItem.text || `Pregunta ${responseItem.question_index}`),
            escapeCsvValue(responseItem.response)
          ].join(','));
        });
      }

      const csv = lines.join('\n');
      const fileName = `inspeccion-${item.id}.csv`;

      if (Platform.OS === 'web' || isRemoteDebugging) {
        if (!canUseBrowserDownload) {
          Alert.alert(
            'Descarga no soportada',
            'Este entorno no soporta descargas directas. Desactiva la depuración remota e inténtalo de nuevo.'
          );
          return;
        }
        try {
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          Alert.alert('Descarga lista', 'El archivo CSV se ha descargado.');
          return;
        } catch (webError) {
          console.error('Error al descargar en web:', webError);
          Alert.alert(
            'Descarga no soportada',
            'No se pudo descargar el archivo en este entorno. Desactiva la depuración remota e inténtalo nuevamente.'
          );
          return;
        }
      }

      const documentDirectory = (FileSystem as any)?.documentDirectory as string | null | undefined;
      const cacheDirectory = (FileSystem as any)?.cacheDirectory as string | null | undefined;
      const directory = documentDirectory ?? cacheDirectory;
      if (!directory) {
        if (canUseBrowserDownload) {
          try {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            Alert.alert('Descarga lista', 'El archivo CSV se ha descargado.');
            return;
          } catch (webError) {
            console.error('Error fall-back descarga web:', webError);
          }
        }

        Alert.alert(
          'No disponible en este entorno',
          'No se pudo acceder a una carpeta temporal para guardar el archivo. Desactiva la depuración remota o prueba en un dispositivo real.'
        );
        return;
      }

      const fileUri = `${directory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Descarga lista', `Archivo generado en: ${fileUri}`);
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Compartir inspección',
        UTI: 'public.comma-separated-values-text'
      });
    } catch (error: any) {
      console.error('Error generating excel:', error);
      Alert.alert('Error', error?.message || 'No se pudo generar el archivo');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setShowServiceModal(false);
    
    // Mostrar popup "Trabajando en ello" para servicios que no sean inspecciones
    if (service.id !== 'inspecciones') {
      setShowWorkingModal(true);
      // Resetear filtro de categorías si no es inspecciones
      setSelectedFilter('all');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Historial</Text>
          <Text style={styles.headerSubtitle}>
            Registro de actividades de inspección
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selector de Servicio */}
        <View style={styles.serviceSelectorContainer}>
          <Text style={styles.serviceSelectorLabel}>Servicio:</Text>
          <TouchableOpacity 
            style={styles.serviceSelectorButton}
            onPress={() => setShowServiceModal(true)}
          >
            <View style={styles.serviceSelectorContent}>
              {selectedService ? (
                <>
                  <Ionicons 
                    name={selectedService.icon as any} 
                    size={20} 
                    color={selectedService.color} 
                  />
                  <Text style={styles.serviceSelectorText}>{selectedService.name}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="apps" size={20} color="#6b7280" />
                  <Text style={styles.serviceSelectorTextPlaceholder}>Seleccionar servicio</Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Filtros - Solo mostrar para inspecciones */}
        {shouldShowCategoryFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === 'all' && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={[
                  styles.filterText,
                  selectedFilter === 'all' && styles.filterTextActive
                ]}>
                  Todos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === 'abierto' && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter('abierto')}
              >
                <Ionicons 
                  name="time" 
                  size={16} 
                  color={selectedFilter === 'abierto' ? '#fff' : '#f59e0b'} 
                />
                <Text style={[
                  styles.filterText,
                  selectedFilter === 'abierto' && styles.filterTextActive
                ]}>
                  Abierto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === 'cerrado' && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter('cerrado')}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={selectedFilter === 'cerrado' ? '#fff' : '#22c55e'} 
                />
                <Text style={[
                  styles.filterText,
                  selectedFilter === 'cerrado' && styles.filterTextActive
                ]}>
                  Cerrado
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Lista de Historial */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>
            {selectedService ? `${selectedService.name} - ` : ''}Actividades Recientes ({filteredHistory.length})
          </Text>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={styles.loadingText}>Cargando inspecciones...</Text>
            </View>
          )}
          
          {!loading && filteredHistory.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No hay inspecciones registradas</Text>
              <Text style={styles.emptySubtext}>
                {selectedFilter === 'all' 
                  ? 'Comienza a crear inspecciones para verlas aquí'
                  : `No hay inspecciones de tipo "${selectedFilter === 'abierto' ? 'Abierto' : 'Cerrado'}"`}
              </Text>
            </View>
          )}
          
          {!loading && filteredHistory.map((item) => {
            const categoryInfo = getCategoryInfo(item.category);
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.historyCard}
                onPress={() => {
                  // Navigate to edit existing response screen
                  router.push({
                    pathname: '/edit-existing-response',
                    params: {
                      responseId: item.id,
                      type: item.category === 'cerrado' ? 'closed' : 'open',
                      templateId: item.template_id || '',
                      templateTitle: item.details || 'Template'
                    }
                  });
                }}
              >
                <View style={styles.historyCardHeader}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.serviceName}>{item.service}</Text>
                    <Text style={styles.actionText}>{item.action}</Text>
                  </View>
                  <View style={styles.historyActions}>
                    {item.status === 'completed' && (
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={(event: GestureResponderEvent) => {
                          event.stopPropagation();
                          handleDownloadExcel(item);
                        }}
                        disabled={downloadingId === item.id}
                      >
                        {downloadingId === item.id ? (
                          <ActivityIndicator size="small" color="#2563eb" />
                        ) : (
                          <Ionicons name="download" size={18} color="#2563eb" />
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteResponse(item)}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.historyCardBody}>
                  <Text style={styles.detailsText}>{item.details}</Text>
                  <View style={styles.historyMeta}>
                    <View style={styles.timestampContainer}>
                      <Ionicons name="time" size={14} color="#6b7280" />
                      <Text style={styles.timestampText}>{item.timestamp}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(item.status) }
                      ]}>
                        {getStatusText(item.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Espacio adicional para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de Selección de Servicios */}
      <Modal
        visible={showServiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Servicio</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowServiceModal(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.servicesList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceOption}
                  onPress={() => handleServiceSelect(service)}
                >
                  <View style={styles.serviceOptionContent}>
                    <View style={[
                      styles.serviceOptionIcon,
                      { backgroundColor: service.color + '20' }
                    ]}>
                      <Ionicons 
                        name={service.icon as any} 
                        size={24} 
                        color={service.color} 
                      />
                    </View>
                    <Text style={styles.serviceOptionText}>{service.name}</Text>
                  </View>
                  {selectedService?.id === service.id && (
                    <Ionicons name="checkmark-circle" size={24} color={service.color} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal "Trabajando en ello" */}
      <Modal
        visible={showWorkingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWorkingModal(false)}
      >
        <View style={styles.workingModalOverlay}>
          <View style={styles.workingModalContent}>
            <View style={styles.workingModalIcon}>
              <Ionicons name="construct" size={48} color="#f59e0b" />
            </View>
            <Text style={styles.workingModalTitle}>Trabajando en ello</Text>
            <Text style={styles.workingModalSubtitle}>
              Esta funcionalidad estará disponible próximamente
            </Text>
            <TouchableOpacity 
              style={styles.workingModalButton}
              onPress={() => setShowWorkingModal(false)}
            >
              <Text style={styles.workingModalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    color: '#e9d5ff',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  serviceSelectorContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  serviceSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  serviceSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceSelectorText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 12,
  },
  serviceSelectorTextPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 12,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  filterTextActive: {
    color: '#fff',
  },
  historyContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  historyCard: {
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
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  downloadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  historyInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyCardBody: {
    marginTop: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 120,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  servicesList: {
    maxHeight: 300,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serviceOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  // Estilos para el modal "Trabajando en ello"
  workingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workingModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  workingModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  workingModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  workingModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  workingModalButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  workingModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
