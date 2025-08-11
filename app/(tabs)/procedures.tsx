import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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
}

export default function ProceduresScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');

  const companies: Company[] = [
    {
      id: '1',
      name: 'Industrias del Norte S.A.',
      industry: 'Manufactura',
      contactPerson: 'Juan Pérez',
      email: 'juan.perez@industriasnorte.com',
      phone: '+56 9 1234 5678',
      address: 'Av. Industrial 1234, Santiago',
      status: 'active',
      formCount: 5,
      lastActivity: '2024-01-15',
    },
    {
      id: '2',
      name: 'Minería del Sur Ltda.',
      industry: 'Minería',
      contactPerson: 'María González',
      email: 'maria.gonzalez@mineriasur.cl',
      phone: '+56 9 8765 4321',
      address: 'Camino Minero 567, Antofagasta',
      status: 'active',
      formCount: 3,
      lastActivity: '2024-01-14',
    },
    {
      id: '3',
      name: 'Construcciones Central',
      industry: 'Construcción',
      contactPerson: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@construcciones.cl',
      phone: '+56 9 5555 6666',
      address: 'Calle Obrera 890, Valparaíso',
      status: 'active',
      formCount: 7,
      lastActivity: '2024-01-13',
    },
  ];

  const industries = [
    { id: 'todos', name: 'Todas las Industrias', color: '#6366f1' },
    { id: 'manufactura', name: 'Manufactura', color: '#3b82f6' },
    { id: 'mineria', name: 'Minería', color: '#ef4444' },
    { id: 'construccion', name: 'Construcción', color: '#8b5cf6' },
    { id: 'quimicos', name: 'Químicos', color: '#f59e0b' },
    { id: 'energia', name: 'Energía', color: '#10b981' },
    { id: 'logistica', name: 'Logística', color: '#06b6d4' },
    { id: 'servicios', name: 'Servicios', color: '#f97316' },
  ];

  const getFilteredCompanies = () => {
    let filtered = companies;
    
    // Filtrar por industria
    if (selectedCategory !== 'todos') {
      filtered = filtered.filter(company => company.industry.toLowerCase() === selectedCategory);
    }
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleCompanyPress = (company: Company) => {
    // Aquí se navegaría a una pantalla que muestre todos los formularios de la empresa
    // Por ahora solo mostramos un alert con la información
    Alert.alert(
      company.name,
      `📋 Industria: ${company.industry}\n👤 Contacto: ${company.contactPerson}\n📧 Email: ${company.email}\n📱 Teléfono: ${company.phone}\n📄 Formularios: ${company.formCount}\n🕒 Última actividad: ${company.lastActivity}`,
      [
        { text: 'Ver Formularios', onPress: () => console.log('Ver formularios de:', company.id) },
        { text: 'Editar Empresa', onPress: () => console.log('Editar empresa:', company.id) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleAddCompany = () => {
    router.push('/create-company');
  };

  const filteredCompanies = getFilteredCompanies();

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
            {industries.map((industry) => (
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
               industries.find(i => i.id === selectedCategory)?.name || 'Empresas'}
              {' '}({filteredCompanies.length})
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddCompany}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Nueva</Text>
            </TouchableOpacity>
          </View>

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
                    color={industries.find(i => i.id === company.industry.toLowerCase())?.color || '#6366f1'} 
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
