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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCompanies } from '../../hooks/useCompanies';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [industryOptions, setIndustryOptions] = useState<IndustryOption[]>([
    { id: 'todos', name: 'Todas las Industrias', color: '#6366f1' }
  ]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { getAllCompanies } = useCompanies();

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
          lastActivity: formatDate(company.updated_at || company.created_at) 
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
    // Aquí se navegaría a una pantalla que muestre todos los formularios de la empresa
    // Por ahora solo mostramos un alert con la información
    Alert.alert(
      company.name,
      `📋 Industria: ${company.industry}\n👤 Contacto: ${company.contactPerson}\n📧 Email: ${company.email}\n📱 Teléfono: ${company.phone}\n📄 Formularios: ${company.formCount}\n🕒 Última actividad: ${company.lastActivity}`,
      [
        { text: 'Ver Formularios', onPress: () => {} },
        { text: 'Editar Empresa', onPress: () => {} },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleAddCompany = () => {
    router.push('/create-company');
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
              {selectedCategory === 'todos' ? 'Todas las Empresas' : 
               industryOptions.find(i => i.id === selectedCategory)?.name || 'Empresas'}
              {' '}({filteredCompanies.length})
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddCompany}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Nueva</Text>
            </TouchableOpacity>
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
                <View style={styles.fileStatus}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: company.status === 'active' ? '#22c55e' : '#f59e0b' }
                  ]} />
                  <Text style={styles.statusText}>
                    {company.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Text>
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
  fileStatus: {
    alignItems: 'center',
    marginLeft: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
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
});
