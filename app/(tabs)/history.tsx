import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface HistoryItem {
  id: string;
  service: string;
  serviceType: string;
  action: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  details: string;
  category: 'abierto' | 'cerrado' | 'general';
}

interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function HistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'abierto' | 'cerrado'>('all');
  const [selectedService, setSelectedService] = useState<Service | null>({
    id: 'inspecciones',
    name: 'Inspecciones',
    icon: 'clipboard',
    color: '#3b82f6'
  });
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showWorkingModal, setShowWorkingModal] = useState(false);

  const services: Service[] = [
    { id: 'inspecciones', name: 'Inspecciones', icon: 'clipboard', color: '#3b82f6' },
    { id: 'observaciones', name: 'Observaciones', icon: 'eye', color: '#10b981' },
    { id: 'auditoria', name: 'Auditoría', icon: 'document-text', color: '#8b5cf6' },
    { id: 'linea-base', name: 'Línea de Base', icon: 'bar-chart', color: '#f59e0b' },
    { id: 'monitoreo', name: 'Monitoreo', icon: 'trending-up', color: '#ef4444' },
  ];

  const historyData: HistoryItem[] = [
    // Historial limpio - sin actividades
  ];

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
        return 'En Progreso';
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
          
          {filteredHistory.map((item) => {
            const categoryInfo = getCategoryInfo(item.category);
            return (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.serviceName}>{item.service}</Text>
                    <Text style={styles.actionText}>{item.action}</Text>
                  </View>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryInfo.color + '20' }
                  ]}>
                    <Ionicons 
                      name={categoryInfo.icon as any} 
                      size={16} 
                      color={categoryInfo.color} 
                    />
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
              </View>
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
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
});
