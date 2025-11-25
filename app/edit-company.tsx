import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
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

export default function EditCompanyScreen() {
  const { user } = useAuth();
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const { getCompanyById, updateCompany } = useCompanies();
  const { uploadImage, deleteImage, uploading: uploadingImage } = useImageUpload();
  
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });
  const [companyImage, setCompanyImage] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<CompanyData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

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

  // Cargar datos de la empresa
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!companyId) {
        Alert.alert('Error', 'ID de empresa no válido');
        router.back();
        return;
      }

      // Verificar que el usuario sea manager
      if (user && user.role !== 'manager') {
        Alert.alert(
          'Acceso Denegado',
          'Solo los managers pueden editar empresas.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      try {
        setLoading(true);
        const company = await getCompanyById(companyId);
        
        if (company) {
          const loadedData = {
            name: company.name || '',
            industry: company.industry || '',
            contactPerson: company.contact_person || '',
            email: company.contact_email || '',
            phone: company.contact_phone || '',
            address: company.address || '',
          };
          
          setCompanyData(loadedData);
          setOriginalData(loadedData);
          setCompanyImage(company.image_url || null);
          setOriginalImageUrl(company.image_url || null);
        }
      } catch (error: any) {
        Alert.alert('Error', 'No se pudo cargar la empresa: ' + (error.message || 'Error desconocido'));
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadCompanyData();
    }
  }, [companyId, user]);

  // Si no es manager, no renderizar nada
  if (!user || user.role !== 'manager') {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a tus fotos');
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
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCompanyImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Eliminar Imagen',
      '¿Estás seguro de que quieres eliminar la imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => setCompanyImage(null)
        },
      ]
    );
  };

  const handleChangeImage = () => {
    Alert.alert(
      'Cambiar Imagen',
      '¿Cómo deseas cambiar la imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Galería', onPress: handlePickImage },
        { text: 'Cámara', onPress: handleTakePhoto },
      ]
    );
  };

  const handleSaveCompany = async () => {
    if (!companyData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la empresa');
      return;
    }

    if (!companyImage) {
      Alert.alert('Error', 'Por favor sube una insignia de la empresa');
      return;
    }

    if (!originalData) {
      Alert.alert('Error', 'No se pudieron cargar los datos originales');
      return;
    }

    try {
      setSaving(true);

      // Objeto para almacenar solo los campos que cambiaron
      const updateData: any = {};

      // Comparar cada campo con los valores originales y agregar solo los que cambiaron
      if (companyData.name.trim() !== originalData.name) {
        updateData.name = companyData.name.trim();
      }
      
      if (companyData.industry.trim() !== originalData.industry) {
        updateData.industry = companyData.industry.trim() || null;
      }
      
      if (companyData.contactPerson.trim() !== originalData.contactPerson) {
        updateData.contact_person = companyData.contactPerson.trim() || null;
      }
      
      if (companyData.email.trim() !== originalData.email) {
        updateData.contact_email = companyData.email.trim() || null;
      }
      
      if (companyData.phone.trim() !== originalData.phone) {
        updateData.contact_phone = companyData.phone.trim() || null;
      }
      
      if (companyData.address.trim() !== originalData.address) {
        updateData.address = companyData.address.trim() || null;
      }

      // Manejar cambios en la imagen
      if (companyImage !== originalImageUrl) {
        // Si la imagen cambió (es una URI local, no una URL de S3)
        if (companyImage && !companyImage.startsWith('http')) {
          // Eliminar la imagen anterior si existe
          if (originalImageUrl) {
            try {
              await deleteImage(originalImageUrl);
            } catch (error) {
              // Error al eliminar imagen antigua, continuar de todos modos
            }
          }

          // Subir la nueva imagen
          const newImageUrl = await uploadImage({
            imageUri: companyImage,
            folder: 'company-images',
            identifier: companyId,
          });
          
          updateData.image_url = newImageUrl;
        } else {
          // La imagen se eliminó o cambió a null
          updateData.image_url = companyImage;
        }
      }

      // Solo actualizar si hay cambios
      if (Object.keys(updateData).length === 0) {
        Alert.alert('Sin Cambios', 'No se detectaron cambios para actualizar');
        setSaving(false);
        return;
      }

      // Actualizar solo los campos que cambiaron
      await updateCompany(companyId, updateData);

      Alert.alert(
        'Empresa Actualizada',
        `Se actualizaron ${Object.keys(updateData).length} campo(s) exitosamente`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Error al actualizar la empresa: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Cargando empresa...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Empresa</Text>
        <TouchableOpacity
          style={[styles.saveButton, (saving || uploadingImage) && styles.saveButtonDisabled]}
          onPress={handleSaveCompany}
          disabled={saving || uploadingImage}
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
            <Text style={styles.inputLabel}>Industria</Text>
            
            {/* Selector de industria */}
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowIndustryDropdown(!showIndustryDropdown)}
            >
              <Text style={[
                styles.dropdownButtonText,
                !companyData.industry && styles.dropdownPlaceholder
              ]}>
                {companyData.industry || 'Selecciona una industria'}
              </Text>
              <Ionicons 
                name={showIndustryDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>

            {showIndustryDropdown && (
              <View style={styles.dropdownList}>
                {industries.map((industry) => (
                  <TouchableOpacity
                    key={industry}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCompanyData(prev => ({ ...prev, industry }));
                      setShowIndustryDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      companyData.industry === industry && styles.dropdownItemTextSelected
                    ]}>
                      {industry}
                    </Text>
                    {companyData.industry === industry && (
                      <Ionicons name="checkmark" size={20} color="#6366f1" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={companyData.address}
              onChangeText={(text) => setCompanyData(prev => ({ ...prev, address: text }))}
              placeholder="Dirección de la empresa"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Información de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Persona de Contacto</Text>
            <TextInput
              style={styles.textInput}
              value={companyData.contactPerson}
              onChangeText={(text) => setCompanyData(prev => ({ ...prev, contactPerson: text }))}
              placeholder="Nombre del contacto principal"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={companyData.email}
              onChangeText={(text) => setCompanyData(prev => ({ ...prev, email: text }))}
              placeholder="correo@empresa.com"
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
              placeholder="+1 234 567 8900"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Imagen de la empresa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insignia de la Empresa *</Text>
          <Text style={styles.sectionSubtitle}>
            Sube el logo o insignia de la empresa
          </Text>

          {companyImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: companyImage }} 
                style={styles.imagePreview}
                resizeMode="contain"
              />
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={[styles.imageActionButton, styles.changeButton]}
                  onPress={handleChangeImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={20} color="#fff" />
                      <Text style={styles.imageActionText}>Cambiar</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageActionButton, styles.removeButton]}
                  onPress={handleRemoveImage}
                  disabled={uploadingImage}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.imageActionText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imageUploadContainer}>
              <Ionicons name="image-outline" size={48} color="#9ca3af" />
              <Text style={styles.imageUploadText}>
                No hay imagen seleccionada
              </Text>
              <View style={styles.imageUploadButtons}>
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                >
                  <Ionicons name="images" size={20} color="#6366f1" />
                  <Text style={styles.imageUploadButtonText}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={handleTakePhoto}
                  disabled={uploadingImage}
                >
                  <Ionicons name="camera" size={20} color="#6366f1" />
                  <Text style={styles.imageUploadButtonText}>Cámara</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownItemTextSelected: {
    color: '#6366f1',
    fontWeight: '500',
  },
  imageUploadContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 24,
  },
  imageUploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  imageUploadButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  changeButton: {
    backgroundColor: '#6366f1',
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  imageActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});

