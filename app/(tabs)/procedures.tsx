import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCompanies } from '../../hooks/useCompanies';
import { useAuth } from '../../contexts/AuthContext';

interface Company {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  formCount: number;
  lastActivity: string;
  industryKey: string;
  image_url?: string;
}

interface IndustryOption {
  id: string;
  name: string;
  color: string;
}

const INDUSTRY_COLORS: Record<string, string> = {
  manufactura: '#3b82f6',
  mineria: '#ef4444',
  construccion: '#8b5cf6',
  quimicos: '#f59e0b',
  energia: '#10b981',
  logistica: '#06b6d4',
  servicios: '#f97316',
  alimentaria: '#22d3ee',
  retail: '#fca5a5',
  agricultura: '#4ade80',
  salud: '#a855f7',
  tecnologia: '#6366f1',
  sinIndustria: '#6b7280'
};

const sanitizeIndustryKey = (value: string) => {
  if (!value) return 'sinIndustria';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sinIndustria';
};

const formatDate = (value?: string) => {
  if (!value) return 'Sin actividad';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin actividad';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Sin actividad';
  }
};

export default function ProceduresScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [industryOptions, setIndustryOptions] = useState<IndustryOption[]>([
    { id: 'todos', name: 'Todas las Industrias', color: '#6366f1' }
  ]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { getAllCompanies, deleteCompany } = useCompanies();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCompanies();
    }, [])
  );

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      setErrorMessage(null);

      const response = await getAllCompanies(1, 100);
      const rawCompanies = response?.data?.companies || response?.data || [];

      const adaptedCompanies: Company[] = rawCompanies.map((company: any) => {
        const industryName = company.industry || 'Sin Industria';
        const industryKey = sanitizeIndustryKey(industryName);
        return {
          id: company.id,
          name: company.name || 'Sin nombre',
          industry: industryName,
          industryKey,
          contactPerson: company.contact_person || 'Sin contacto',
          email: company.contact_email || 'Sin email',
          phone: company.contact_phone || 'Sin teléfono',
          address: company.address || 'Sin dirección',
          status: company.status === 'inactive' ? 'inactive' : 'active',
          formCount: company.form_count ?? 0,
          lastActivity: formatDate(company.updated_at || company.created_at),
          image_url: company.image_url || undefined,
        };
      });

      const uniqueIndustries = new Map<string, IndustryOption>();
      adaptedCompanies.forEach(company => {
        if (company.industryKey && company.industryKey !== 'sinIndustria') {
          if (!uniqueIndustries.has(company.industryKey)) {
            uniqueIndustries.set(company.industryKey, {
              id: company.industryKey,
              name: company.industry,
              color: INDUSTRY_COLORS[company.industryKey] || '#3b82f6'
            });
          }
        }
      });

      setIndustryOptions([
        { id: 'todos', name: 'Todas las Industrias', color: '#6366f1' },
        ...Array.from(uniqueIndustries.values())
      ]);
      setCompanies(adaptedCompanies);
    } catch (error: any) {
      console.error('Error loading companies:', error?.message);
      setErrorMessage(error?.message || 'No se pudieron cargar las empresas');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    if (selectedCategory !== 'todos') {
      filtered = filtered.filter(company => company.industryKey === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(query) ||
        company.contactPerson.toLowerCase().includes(query) ||
        company.industry.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [companies, selectedCategory, searchQuery]);

  const handleCompanyPress = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyModal(true);
  };

  const handleAddCompany = () => {
    router.push('/create-company');
  };

  const handleDeleteCompany = (company: Company, event: any) => {
    // Prevenir que el evento se propague al TouchableOpacity del card
    event?.stopPropagation();
    
    Alert.alert(
      'Eliminar Empresa',
      `¿Estás seguro de que deseas eliminar "${company.name}"? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(company.id);
              await deleteCompany(company.id);
              // Recargar la lista después de eliminar
              await loadCompanies();
            } catch (error: any) {
              Alert.alert(
                'Error',
                `No se pudo eliminar la empresa: ${error?.message || 'Error desconocido'}`
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
              <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Empresas</Text>
            <Text style={styles.headerSubtitle}>
              Clientes y empresas con formularios asociados
            </Text>
          </View>
        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por empresa, contacto o industria..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Industries */}
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {industryOptions.map((industry) => (
              <TouchableOpacity
                key={industry.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === industry.id && styles.categoryButtonActive,
                  { borderColor: industry.color }
                ]}
                onPress={() => setSelectedCategory(industry.id)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === industry.id && styles.categoryTextActive
                ]}>
                  {industry.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Companies List */}
        <View style={styles.filesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'todos'
                ? 'Todas las Empresas'
                : industryOptions.find(i => i.id === selectedCategory)?.name || 'Empresas'}
              {' '}
              ({filteredCompanies.length})
            </Text>
            {user?.role === 'manager' ? (
              <TouchableOpacity style={styles.addButton} onPress={handleAddCompany}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Nueva</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ height: 36, width: 36 }} />
            )}
          </View>

          {loadingCompanies && (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{ marginTop: 12, color: '#6b7280' }}>Cargando empresas...</Text>
            </View>
          )}

          {!loadingCompanies && errorMessage && (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text style={{ marginTop: 12, color: '#ef4444', textAlign: 'center' }}>{errorMessage}</Text>
            </View>
          )}

          {filteredCompanies.map((company) => (
            <TouchableOpacity 
              key={company.id} 
              style={styles.fileCard}
              onPress={() => handleCompanyPress(company)}
            >
              {user?.role === 'manager' && (
                <>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({
                        pathname: '/edit-company',
                        params: { companyId: company.id }
                      });
                    }}
                  >
                    <Ionicons name="pencil" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => handleDeleteCompany(company, e)}
                    disabled={deletingId === company.id}
                  >
                    {deletingId === company.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="trash" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.fileCardHeader}>
                <View style={styles.fileIconContainer}>
                  <Ionicons 
                    name="business" 
                    size={24} 
                    color={industryOptions.find(i => i.id === company.industryKey)?.color || '#6366f1'} 
                  />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{company.name}</Text>
                  <Text style={styles.companyName}>{company.industry} • {company.contactPerson}</Text>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileSize}>{company.formCount} formularios</Text>
                    <Text style={styles.fileDate}>• {company.lastActivity}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredCompanies.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No se encontraron empresas</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery ? 'Intenta con otros términos de búsqueda' : 'No hay empresas en esta industria'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de detalles de la empresa */}
      <Modal
        visible={showCompanyModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCompanyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayBackground}
            activeOpacity={1}
            onPress={() => setShowCompanyModal(false)}
          />
          <View style={styles.modalContent}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de la Empresa</Text>
              <TouchableOpacity
                onPress={() => setShowCompanyModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Contenido del modal */}
            {selectedCompany && (
              <ScrollView 
                style={styles.modalBodyScroll}
                contentContainerStyle={styles.modalBody}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                bounces={true}
                alwaysBounceVertical={false}
              >
                {/* Imagen de la empresa */}
                {selectedCompany.image_url ? (
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={{ uri: selectedCompany.image_url }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Ionicons name="business" size={64} color="#9ca3af" />
                  </View>
                )}

                {/* Información básica */}
                <View style={styles.modalSection}>
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <Ionicons name="business" size={20} color="#6366f1" />
                    </View>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Nombre de la Empresa</Text>
                      <Text style={styles.modalInfoValue}>{selectedCompany.name}</Text>
                    </View>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <Ionicons name="briefcase" size={20} color="#6366f1" />
                    </View>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Industria</Text>
                      <Text style={styles.modalInfoValue}>{selectedCompany.industry || 'No especificada'}</Text>
                    </View>
                  </View>

                  {selectedCompany.address && (
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoIcon}>
                        <Ionicons name="location" size={20} color="#6366f1" />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Dirección</Text>
                        <Text style={styles.modalInfoValue}>{selectedCompany.address}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Información de contacto */}
                {(selectedCompany.contactPerson || selectedCompany.email || selectedCompany.phone) && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Información de Contacto</Text>
                    
                    {selectedCompany.contactPerson && (
                      <View style={styles.modalInfoRow}>
                        <View style={styles.modalInfoIcon}>
                          <Ionicons name="person" size={20} color="#6366f1" />
                        </View>
                        <View style={styles.modalInfoContent}>
                          <Text style={styles.modalInfoLabel}>Persona de Contacto</Text>
                          <Text style={styles.modalInfoValue}>{selectedCompany.contactPerson}</Text>
                        </View>
                      </View>
                    )}

                    {selectedCompany.email && (
                      <View style={styles.modalInfoRow}>
                        <View style={styles.modalInfoIcon}>
                          <Ionicons name="mail" size={20} color="#6366f1" />
                        </View>
                        <View style={styles.modalInfoContent}>
                          <Text style={styles.modalInfoLabel}>Email</Text>
                          <Text style={styles.modalInfoValue}>{selectedCompany.email}</Text>
                        </View>
                      </View>
                    )}

                    {selectedCompany.phone && (
                      <View style={styles.modalInfoRow}>
                        <View style={styles.modalInfoIcon}>
                          <Ionicons name="call" size={20} color="#6366f1" />
                        </View>
                        <View style={styles.modalInfoContent}>
                          <Text style={styles.modalInfoLabel}>Teléfono</Text>
                          <Text style={styles.modalInfoValue}>{selectedCompany.phone}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Estadísticas */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Estadísticas</Text>
                  
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <Ionicons name="document-text" size={20} color="#6366f1" />
                    </View>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Formularios</Text>
                      <Text style={styles.modalInfoValue}>{selectedCompany.formCount} formularios</Text>
                    </View>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <Ionicons name="time" size={20} color="#6366f1" />
                    </View>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Última Actividad</Text>
                      <Text style={styles.modalInfoValue}>{selectedCompany.lastActivity}</Text>
                    </View>
                  </View>
                </View>

                {/* Botón de editar (solo para managers) */}
                {user?.role === 'manager' && (
                  <TouchableOpacity
                    style={styles.modalEditButton}
                    onPress={() => {
                      setShowCompanyModal(false);
                      router.push({
                        pathname: '/edit-company',
                        params: { companyId: selectedCompany.id }
                      });
                    }}
                  >
                    <Ionicons name="pencil" size={20} color="#fff" />
                    <Text style={styles.modalEditButtonText}>Editar Empresa</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
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
    backgroundColor: '#7dd3fc',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesScrollContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryTextActive: {
    color: '#fff',
  },
  filesContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  fileCard: {
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
    position: 'relative',
  },
  fileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 12,
    color: '#9ca3af',
  },
  fileDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 52,
    backgroundColor: '#6366f1',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 120,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  modalImageContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginTop: 20,
  },
  modalImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  modalImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginTop: 20,
  },
  modalSection: {
    marginTop: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  modalInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  modalInfoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '400',
  },
  modalEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  modalEditButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
