import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CompanyData {
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export default function CreateCompanyScreen() {
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  const industries = [
    'Manufactura',
    'Minería',
    'Construcción',
    'Químicos',
    'Energía',
    'Logística',
    'Servicios',
    'Otros',
  ];

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  const handleBack = () => {
    if (companyData.name || companyData.industry || companyData.contactPerson || 
        companyData.email || companyData.phone || companyData.address) {
      Alert.alert(
        '¿Descartar cambios?',
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSaveCompany = () => {
    if (!companyData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la empresa');
      return;
    }

    if (!companyData.industry.trim()) {
      Alert.alert('Error', 'Por favor selecciona una industria');
      return;
    }

    if (!companyData.contactPerson.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre del contacto');
      return;
    }

    // Aquí se guardaría la empresa en la base de datos
    // Por ahora solo mostramos un mensaje de éxito
    Alert.alert(
      'Empresa Creada',
      'La empresa se ha creado exitosamente',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Nueva Empresa</Text>
          <Text style={styles.headerSubtitle}>Crear nueva empresa cliente</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!companyData.name || !companyData.industry || !companyData.contactPerson) && styles.saveButtonDisabled
          ]} 
          onPress={handleSaveCompany}
          disabled={!companyData.name || !companyData.industry || !companyData.contactPerson}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información básica de la empresa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Empresa</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de la Empresa *</Text>
            <TextInput
              style={styles.textInput}
              value={companyData.name}
              onChangeText={(text) => setCompanyData(prev => ({ ...prev, name: text }))}
              placeholder="Ej: Industrias del Norte S.A."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Industria *</Text>
            
            {/* Selector de industria */}
            <TouchableOpacity 
              style={styles.industrySelector}
              onPress={() => setShowIndustryDropdown(!showIndustryDropdown)}
            >
              <View style={styles.industrySelectorContent}>
                {companyData.industry ? (
                  <Text style={styles.industrySelectorTextSelected}>
                    {companyData.industry}
                  </Text>
                ) : (
                  <Text style={styles.industrySelectorTextPlaceholder}>
                    Selecciona una industria
                  </Text>
                )}
              </View>
              <Ionicons 
                name={showIndustryDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>

            {/* Dropdown de industrias */}
            {showIndustryDropdown && (
              <View style={styles.industryDropdown}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {industries.map((industry) => (
                    <TouchableOpacity
                      key={industry}
                      style={[
                        styles.industryDropdownOption,
                        companyData.industry === industry && styles.industryDropdownOptionActive
                      ]}
                      onPress={() => {
                        setCompanyData(prev => ({ ...prev, industry }));
                        setShowIndustryDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.industryDropdownOptionText,
                        companyData.industry === industry && styles.industryDropdownOptionTextActive
                      ]}>
                        {industry}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Información de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Persona de Contacto *</Text>
            <TextInput
              style={styles.textInput}
              value={companyData.contactPerson}
              onChangeText={(text) => setCompanyData(prev => ({ ...prev, contactPerson: text }))}
              placeholder="Ej: Juan Pérez"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={companyData.email}
              onChangeText={(text) => setCompanyData(prev => ({ ...prev, email: text }))}
              placeholder="juan.perez@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.textInput}
              value={companyData.phone}
              onChangeText={(text) => setCompanyData(prev => ({ ...prev, phone: text }))}
              placeholder="+56 9 1234 5678"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={companyData.address}
              onChangeText={(text) => setCompanyData(prev => ({ ...prev, address: text }))}
              placeholder="Av. Industrial 1234, Santiago"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Espacio para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  industrySelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  industrySelectorContent: {
    flex: 1,
  },
  industrySelectorTextSelected: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  industrySelectorTextPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  industryDropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  industryDropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  industryDropdownOptionActive: {
    backgroundColor: '#f3f4f6',
  },
  industryDropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  industryDropdownOptionTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 120,
  },
});
