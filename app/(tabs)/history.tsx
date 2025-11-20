import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
    GestureResponderEvent,
    useWindowDimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { 
    getResponsesByInspectorId: getClosedResponses,
    deleteResponse: deleteClosedResponse,
    loading: closedLoading 
  } = useClosedInspectionResponses();
  const { 
    getResponsesByInspectorId: getOpenResponses,
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
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedItemForSend, setSelectedItemForSend] = useState<HistoryItem | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { width, height } = useWindowDimensions();
  const responsive = useMemo(() => {
    const horizontalPadding = Math.max(16, Math.min(28, width * 0.06));
    const headerPaddingTop = Math.max(48, height * 0.06);
    const headerTitleSize = Math.max(24, Math.min(30, width * 0.08));
    const headerSubtitleSize = Math.max(13, Math.min(16, width * 0.045));
    const baseText = Math.max(13, Math.min(16, width * 0.04));
    const smallText = Math.max(12, Math.min(14, width * 0.035));
    const sectionPadding = Math.max(16, height * 0.02);
    const cardPadding = Math.max(12, Math.min(20, width * 0.045));
    const cardRadius = Math.max(12, width * 0.03);
    const actionButtonPadding = Math.max(10, Math.min(14, height * 0.018));
    const cardSpacing = Math.max(12, height * 0.02);
    const chipPaddingHorizontal = Math.max(12, width * 0.035);
    const chipPaddingVertical = Math.max(6, height * 0.012);
    const scrollBottomPadding = Math.max(32, height * 0.08);
    const serviceButtonPaddingHorizontal = Math.max(16, width * 0.045);
    const serviceIconSize = Math.max(18, Math.min(22, width * 0.055));
    const modalTitleSize = Math.max(18, Math.min(22, width * 0.06));

    return {
      horizontalPadding,
      headerPaddingTop,
      headerTitleSize,
      headerSubtitleSize,
      baseText,
      smallText,
      sectionPadding,
      cardPadding,
      cardRadius,
      actionButtonPadding,
      cardSpacing,
      chipPaddingHorizontal,
      chipPaddingVertical,
      scrollBottomPadding,
      serviceButtonPaddingHorizontal,
      serviceIconSize,
      modalTitleSize
    };
  }, [width, height]);

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

  const handleDownload = async (item: HistoryItem) => {
    try {
      setDownloadingId(item.id);
      const type = item.category === 'cerrado' ? 'closed' : 'open';
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Inicia sesión nuevamente.');
      }

      // Descargar directamente usando FileSystem (React Native compatible)
      const sanitizedTitle = (item.title || item.details || 'sin-titulo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `inspeccion-${sanitizedTitle}-${Date.now()}.xlsx`;
      
      // @ts-ignore - documentDirectory exists in expo-file-system
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Descargar directamente usando FileSystem
      const downloadResult = await FileSystem.downloadAsync(
        `${API_BASE_URL}/inspection-responses/download?responseId=${item.id}&type=${type}`,
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

  const handleSend = async () => {
    if (!selectedItemForSend) return;
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sendEmail.trim()) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico');
      return;
    }
    
    if (!emailRegex.test(sendEmail.trim())) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    try {
      setSendingId(selectedItemForSend.id);
      const type = selectedItemForSend.category === 'cerrado' ? 'closed' : 'open';

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Inicia sesión nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/inspection-responses/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          responseId: selectedItemForSend.id,
          type,
          email: sendEmail.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo procesar el envío');
      }

      Alert.alert('Éxito', `El archivo se ha enviado a ${sendEmail.trim()}`);
      setShowSendModal(false);
      setSendEmail('');
      setSelectedItemForSend(null);
    } catch (error: any) {
      console.error('Error sending email:', error);
      Alert.alert('Error', error?.message || 'No se pudo enviar el archivo por correo');
    } finally {
      setSendingId(null);
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
      <View style={[styles.header, { paddingHorizontal: responsive.horizontalPadding, paddingTop: responsive.headerPaddingTop }]}>
        <View>
          <Text style={[styles.headerTitle, { fontSize: responsive.headerTitleSize }]}>Historial</Text>
          <Text style={[styles.headerSubtitle, { fontSize: responsive.headerSubtitleSize }]}>
            Registro de actividades de inspección
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsive.scrollBottomPadding }}
      >
        {/* Selector de Servicio */}
        <View style={[styles.serviceSelectorContainer, { paddingHorizontal: responsive.horizontalPadding, paddingVertical: responsive.sectionPadding }]}>
          <Text style={[styles.serviceSelectorLabel, { fontSize: responsive.baseText }]}>Servicio:</Text>
          <TouchableOpacity 
            style={[styles.serviceSelectorButton, { paddingHorizontal: responsive.serviceButtonPaddingHorizontal, paddingVertical: responsive.actionButtonPadding }]}
            onPress={() => setShowServiceModal(true)}
          >
            <View style={styles.serviceSelectorContent}>
              {selectedService ? (
                <>
                  <Ionicons 
                    name={selectedService.icon as any} 
                    size={responsive.serviceIconSize} 
                    color={selectedService.color} 
                  />
                  <Text style={[styles.serviceSelectorText, { fontSize: responsive.baseText }]}>{selectedService.name}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="apps" size={responsive.serviceIconSize} color="#6b7280" />
                  <Text style={[styles.serviceSelectorTextPlaceholder, { fontSize: responsive.baseText }]}>Seleccionar servicio</Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-down" size={responsive.serviceIconSize} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Filtros - Solo mostrar para inspecciones */}
        {shouldShowCategoryFilters && (
          <View style={[styles.filtersContainer, { paddingVertical: responsive.sectionPadding * 0.6 }]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filtersScrollContent, { paddingHorizontal: responsive.horizontalPadding }]}
            >
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { paddingHorizontal: responsive.chipPaddingHorizontal, paddingVertical: responsive.chipPaddingVertical },
                  selectedFilter === 'all' && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={[
                  styles.filterText,
                  { fontSize: responsive.smallText },
                  selectedFilter === 'all' && styles.filterTextActive
                ]}>
                  Todos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { paddingHorizontal: responsive.chipPaddingHorizontal, paddingVertical: responsive.chipPaddingVertical },
                  selectedFilter === 'abierto' && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter('abierto')}
              >
                <Ionicons 
                  name="time" 
                  size={Math.max(14, responsive.smallText + 2)} 
                  color={selectedFilter === 'abierto' ? '#fff' : '#f59e0b'} 
                />
                <Text style={[
                  styles.filterText,
                  { fontSize: responsive.smallText },
                  selectedFilter === 'abierto' && styles.filterTextActive
                ]}>
                  Abierto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { paddingHorizontal: responsive.chipPaddingHorizontal, paddingVertical: responsive.chipPaddingVertical },
                  selectedFilter === 'cerrado' && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter('cerrado')}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={Math.max(14, responsive.smallText + 2)} 
                  color={selectedFilter === 'cerrado' ? '#fff' : '#22c55e'} 
                />
                <Text style={[
                  styles.filterText,
                  { fontSize: responsive.smallText },
                  selectedFilter === 'cerrado' && styles.filterTextActive
                ]}>
                  Cerrado
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Lista de Historial */}
        <View style={[styles.historyContainer, { paddingHorizontal: responsive.horizontalPadding, paddingTop: responsive.sectionPadding }]}>
          <Text style={[styles.sectionTitle, { fontSize: Math.max(18, width * 0.05), marginBottom: responsive.sectionPadding * 0.65 }]}>
            {selectedService ? `${selectedService.name} - ` : ''}Actividades Recientes ({filteredHistory.length})
          </Text>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={[styles.loadingText, { fontSize: responsive.baseText }]}>Cargando inspecciones...</Text>
            </View>
          )}
          
          {!loading && filteredHistory.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#d1d5db" />
              <Text style={[styles.emptyText, { fontSize: responsive.baseText + 1 }]}>No hay inspecciones registradas</Text>
              <Text style={[styles.emptySubtext, { fontSize: responsive.smallText }]}>
                {selectedFilter === 'all' 
                  ? 'Comienza a crear inspecciones para verlas aquí'
                  : `No hay inspecciones de tipo "${selectedFilter === 'abierto' ? 'Abierto' : 'Cerrado'}"`}
              </Text>
            </View>
          )}
          
          {!loading && filteredHistory.map((item) => {
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.historyCard, { padding: responsive.cardPadding, borderRadius: responsive.cardRadius, marginBottom: responsive.cardSpacing }]}
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
                    <Text style={[styles.detailsHeading, { fontSize: Math.max(16, width * 0.048) }]}>{item.details}</Text>
                    <Text style={[styles.serviceName, { fontSize: responsive.smallText }]}>{item.service}</Text>
                  </View>
                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={(event: GestureResponderEvent) => {
                        event.stopPropagation();
                        handleDownload(item);
                      }}
                      disabled={downloadingId === item.id}
                    >
                      {downloadingId === item.id ? (
                        <ActivityIndicator size="small" color="#2563eb" />
                      ) : (
                        <Ionicons name="download" size={18} color="#2563eb" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={(event: GestureResponderEvent) => {
                        event.stopPropagation();
                        setSelectedItemForSend(item);
                        setSendEmail('');
                        setShowSendModal(true);
                      }}
                    >
                      <Ionicons name="send" size={18} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(event: GestureResponderEvent) => {
                        event.stopPropagation();
                        handleDeleteResponse(item);
                      }}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.historyCardBody}>
                  <View style={styles.historyMeta}>
                    <View style={styles.timestampContainer}>
                      <Ionicons name="time" size={14} color="#6b7280" />
                      <Text style={[styles.timestampText, { fontSize: responsive.smallText }]}>{item.timestamp}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { fontSize: responsive.smallText },
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
        <View style={[styles.bottomSpacing, { height: responsive.scrollBottomPadding }]} />
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
              <Text style={[styles.modalTitle, { fontSize: responsive.modalTitleSize }]}>Seleccionar Servicio</Text>
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
                        size={responsive.serviceIconSize + 2} 
                        color={service.color} 
                      />
                    </View>
                    <Text style={[styles.serviceOptionText, { fontSize: responsive.baseText }]}>{service.name}</Text>
                  </View>
                  {selectedService?.id === service.id && (
                    <Ionicons name="checkmark-circle" size={responsive.serviceIconSize + 2} color={service.color} />
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
            <Text style={[styles.workingModalTitle, { fontSize: responsive.modalTitleSize }]}>Trabajando en ello</Text>
            <Text style={[styles.workingModalSubtitle, { fontSize: responsive.baseText }]}>
              Esta funcionalidad estará disponible próximamente
            </Text>
            <TouchableOpacity 
              style={styles.workingModalButton}
              onPress={() => setShowWorkingModal(false)}
            >
              <Text style={[styles.workingModalButtonText, { fontSize: responsive.baseText }]}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Enviar por Correo */}
      <Modal
        visible={showSendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSendModal(false);
          setSendEmail('');
          setSelectedItemForSend(null);
        }}
      >
        <View style={styles.workingModalOverlay}>
          <View style={styles.sendModalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: responsive.modalTitleSize }]}>Enviar Inspección</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowSendModal(false);
                  setSendEmail('');
                  setSelectedItemForSend(null);
                }}
                disabled={!!sendingId}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sendModalBody}>
              <Text style={[styles.sendModalLabel, { fontSize: responsive.baseText }]}>
                Correo electrónico de destino
              </Text>
              <TextInput
                style={styles.sendModalInput}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#9ca3af"
                value={sendEmail}
                onChangeText={setSendEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!sendingId}
              />
              
              {selectedItemForSend && (
                <Text style={[styles.sendModalInfo, { fontSize: responsive.smallText }]}>
                  Enviando: {selectedItemForSend.title || selectedItemForSend.details}
                </Text>
              )}
            </View>

            <View style={styles.sendModalActions}>
              <TouchableOpacity
                style={[styles.sendModalCancelButton, { opacity: sendingId ? 0.5 : 1 }]}
                onPress={() => {
                  setShowSendModal(false);
                  setSendEmail('');
                  setSelectedItemForSend(null);
                }}
                disabled={!!sendingId}
              >
                <Text style={[styles.sendModalCancelText, { fontSize: responsive.baseText }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sendModalSendButton,
                  { opacity: sendingId || !sendEmail.trim() ? 0.5 : 1 }
                ]}
                onPress={handleSend}
                disabled={!!sendingId || !sendEmail.trim()}
              >
                {sendingId ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#fff" />
                    <Text style={[styles.sendModalSendText, { fontSize: responsive.baseText }]}>Enviar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  historyInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 14,
    color: '#6b7280',
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
  // Modal de envío
  sendModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 0,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sendModalBody: {
    padding: 20,
  },
  sendModalLabel: {
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  sendModalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  sendModalInfo: {
    color: '#6b7280',
    marginTop: 12,
    fontStyle: 'italic',
  },
  sendModalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  sendModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendModalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  sendModalSendButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendModalSendText: {
    color: '#fff',
    fontWeight: '600',
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
  detailsHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
});
 