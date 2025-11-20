import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
    Image,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useCompanies } from '../hooks/useCompanies';
import { useImageUpload } from '../hooks/useImageUpload';

interface CompanyData {
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export default function CreateCompanyScreen() {
  const { user } = useAuth();
  const { createCompany, updateCompany } = useCompanies();
  const { uploadImage, uploading: uploadingImage } = useImageUpload();
  
  // Verificar que el usuario sea manager
  useEffect(() => {
    if (user && user.role !== 'manager') {
      Alert.alert(
        'Acceso Denegado',
        'Solo los managers pueden crear empresas.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [user]);

  // Si no es manager, no renderizar nada
  if (!user || user.role !== 'manager') {
    return null;
  }
  
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
  const [companyImage, setCompanyImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCompanyImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Error al seleccionar imagen: ' + error.message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para acceder a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCompanyImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Error al tomar foto: ' + error.message);
    }
  };

  const handleRemoveImage = () => {
    setCompanyImage(null);
  };

  const handleSaveCompany = async () => {
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

    // La imagen es requerida (solo managers pueden crear empresas)
    if (!companyImage) {
      Alert.alert('Error', 'Por favor sube una insignia de la empresa');
      return;
    }

    try {
      setSaving(true);

      let imageUrl: string | null = null;

      // Subir imagen si existe
      if (companyImage) {
        // Primero creamos la empresa temporalmente para obtener el ID
        // Pero mejor: subimos la imagen después de crear la empresa
        // Necesitamos el company_id, así que creamos primero sin imagen, luego actualizamos
        const tempCompany = await createCompany({
          name: companyData.name,
          industry: companyData.industry,
          contact_person: companyData.contactPerson,
          contact_email: companyData.email || null,
          contact_phone: companyData.phone || null,
          address: companyData.address || null,
          image_url: null,
          created_by: user?.id || null,
        });

        // Ahora subimos la imagen con el company_id
        imageUrl = await uploadImage({
          imageUri: companyImage,
          folder: 'company-images',
          identifier: tempCompany.id,
        });

        // Actualizamos la empresa con la URL de la imagen
        await updateCompany(tempCompany.id, {
          image_url: imageUrl,
        });
      } else {
        // Crear empresa sin imagen (solo si no es manager)
        await createCompany({
          name: companyData.name,
          industry: companyData.industry,
          contact_person: companyData.contactPerson,
          contact_email: companyData.email || null,
          contact_phone: companyData.phone || null,
          address: companyData.address || null,
          image_url: null,
          created_by: user?.id || null,
        });
      }

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
    } catch (error: any) {
      console.error('Error creating company:', error);
      Alert.alert('Error', 'Error al crear la empresa: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
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
            ((!companyData.name || !companyData.industry || !companyData.contactPerson || !companyImage) || saving || uploadingImage) && styles.saveButtonDisabled
          ]} 
          onPress={handleSaveCompany}
          disabled={(!companyData.name || !companyData.industry || !companyData.contactPerson || !companyImage) || saving || uploadingImage}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#fff" />
          )}
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

        {/* Insignia de la empresa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Insignia de la Empresa <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            La insignia es requerida para crear una empresa
          </Text>
          
          {companyImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: companyImage }} style={styles.previewImage} />
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={styles.imageActionButton}
                  onPress={handlePickImage}
                  disabled={uploadingImage || saving}
                >
                  <Ionicons name="camera" size={20} color="#3b82f6" />
                  <Text style={styles.imageActionText}>Cambiar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.imageActionButton, styles.imageDeleteButton]}
                  onPress={handleRemoveImage}
                  disabled={uploadingImage || saving}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                  <Text style={[styles.imageActionText, styles.imageDeleteText]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#9ca3af" />
              <Text style={styles.imagePlaceholderText}>
                Insignia requerida
              </Text>
              <View style={styles.imageButtons}>
                <TouchableOpacity 
                  style={styles.imageButton}
                  onPress={handleTakePhoto}
                  disabled={uploadingImage || saving}
                >
                  <Ionicons name="camera" size={20} color="#3b82f6" />
                  <Text style={styles.imageButtonText}>Tomar Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.imageButton}
                  onPress={handlePickImage}
                  disabled={uploadingImage || saving}
                >
                  <Ionicons name="images" size={20} color="#3b82f6" />
                  <Text style={styles.imageButtonText}>Galería</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {(uploadingImage || saving) && (
            <View style={styles.uploadingIndicator}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.uploadingText}>
                {uploadingImage ? 'Subiendo imagen...' : 'Guardando empresa...'}
              </Text>
            </View>
          )}
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
  required: {
    color: '#ef4444',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    marginTop: -8,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'contain',
    backgroundColor: '#f3f4f6',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  imageDeleteButton: {
    backgroundColor: '#fee2e2',
  },
  imageActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  imageDeleteText: {
    color: '#ef4444',
  },
  imagePlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 6,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
