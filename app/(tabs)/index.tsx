import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, hasMultipleCompanies, currentCompany, getCurrentCompany, userCompanies, changeCurrentCompany } = useAuth();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoText, setPhotoText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  const handleTakePhoto = async () => {
    try {
      // Solicitar permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos de cámara para tomar fotos');
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setShowPhotoModal(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleSendWhatsApp = () => {
    if (!photoUri || !phoneNumber.trim()) {
      Alert.alert('Error', 'Por favor toma una foto e ingresa un número de teléfono');
      return;
    }

    // Formatear número de teléfono (eliminar espacios, guiones, etc.)
    const cleanPhone = phoneNumber.replace(/\s|-|\(|\)/g, '');
    
    // Crear mensaje para WhatsApp
    const message = photoText.trim() || 'Mensaje desde la app de seguridad';
    
    // Crear URL de WhatsApp
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    // Mostrar instrucciones para el usuario
    Alert.alert(
      'Enviar por WhatsApp',
      'Para incluir la foto en WhatsApp:\n\n1. Se abrirá WhatsApp con el mensaje\n2. Toca el clip 📎 para adjuntar\n3. Selecciona "Galería" y busca la foto\n\n¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Abrir WhatsApp', 
          onPress: () => {
            Linking.canOpenURL(whatsappUrl).then((supported) => {
              if (supported) {
                Linking.openURL(whatsappUrl);
                // Limpiar estado y cerrar modal
                setPhotoUri(null);
                setPhotoText('');
                setPhoneNumber('');
                setShowPhotoModal(false);
              } else {
                Alert.alert('Error', 'WhatsApp no está instalado en este dispositivo');
              }
            });
          }
        }
      ]
    );
  };

  const handleResetPhoto = () => {
    setPhotoUri(null);
    setPhotoText('');
    setPhoneNumber('');
    setShowPhotoModal(false);
  };

  const handleCompanyChange = (company: any) => {
    changeCurrentCompany(company);
    setShowCompanySelector(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>¡Bienvenido, Supervisor!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          {/* Indicador de Empresa */}
          <View style={styles.companyIndicator}>
            {hasMultipleCompanies ? (
              <TouchableOpacity 
                style={[styles.companyBadge, styles.multipleCompaniesBadge]}
                onPress={() => setShowCompanySelector(true)}
              >
                <Ionicons name="business" size={16} color="#fff" />
                <Text style={styles.companyBadgeText}>
                  Empresa
                </Text>
                <Ionicons name="chevron-down" size={14} color="#fff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.companyBadge, styles.singleCompanyBadge]}>
                <Ionicons name="business" size={16} color="#fff" />
                <Text style={styles.companyBadgeText}>
                  {getCurrentCompany()?.name || 'Sin empresa asignada'}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.profileIcon}>
          <IconSymbol name="person.circle.fill" size={40} color="#fff" />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={[styles.statCard, styles.blueCard]}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <IconSymbol name="list.clipboard.fill" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Inspecciones</Text>
            <Text style={styles.statSubtext}>Activas</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, styles.greenCard]}>
            <IconSymbol name="eye.fill" size={24} color="#22c55e" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Observaciones</Text>
            <Text style={styles.statSubtext}>Este mes</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.purpleCard]}>
            <Ionicons name="document-text" size={24} color="#8b5cf6" />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Auditorías</Text>
            <Text style={styles.statSubtext}>Programadas</Text>
          </View>
          <View style={[styles.statCard, styles.orangeCard]}>
            <IconSymbol name="chart.bar.fill" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Línea Base</Text>
            <Text style={styles.statSubtext}>Activas</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.redCard]}>
            <Ionicons name="trending-up" size={24} color="#ef4444" />
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Monitoreo</Text>
            <Text style={styles.statSubtext}>Indicadores</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Ionicons name="grid" size={24} color="#3b82f6" />
            <Text style={styles.actionText}>Ver Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
            <IconSymbol name="camera.fill" size={24} color="#10b981" />
            <Text style={styles.actionText}>Tomar Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#f59e0b" />
            <Text style={styles.actionText}>Reportar Incidente</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, styles.greenBackground]}>
              <IconSymbol name="checkmark" size={16} color="#fff" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Área de Almacén - Completado</Text>
              <Text style={styles.activityTime}>Hace 2 horas</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom spacing for tabs */}
      <View style={styles.bottomSpacing} />

      {/* Modal para foto y envío por WhatsApp */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleResetPhoto}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Enviar Foto por WhatsApp</Text>
              
              {/* Vista previa de la foto */}
              {photoUri && (
                <View style={styles.photoPreview}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoViewer}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Campo para número de teléfono */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número de Teléfono *</Text>
                <TextInput
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Ej: +56 9 1234 5678"
                  keyboardType="phone-pad"
                  autoFocus={true}
                />
              </View>

              {/* Campo para texto del mensaje */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mensaje (opcional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={photoText}
                  onChangeText={setPhotoText}
                  placeholder="Añade un mensaje a la foto..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Botones de acción */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalButtonCancel}
                  onPress={handleResetPhoto}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButtonSend}
                  onPress={handleSendWhatsApp}
                  disabled={!phoneNumber.trim()}
                >
                  <Text style={styles.modalButtonTextSend}>Enviar por WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
              </Modal>

        {/* Modal Selector de Empresas */}
        <Modal
          visible={showCompanySelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCompanySelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Seleccionar Empresa
              </Text>
              
              <ScrollView style={styles.companiesList}>
                {userCompanies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.companyOption,
                      currentCompany?.id === company.id && styles.companyOptionActive
                    ]}
                    onPress={() => handleCompanyChange(company)}
                  >
                    <View style={styles.companyOptionHeader}>
                      <Ionicons name="business" size={20} color="#3b82f6" />
                      <Text style={styles.companyOptionName}>{company.name}</Text>
                      {currentCompany?.id === company.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      )}
                    </View>
                    <View style={styles.companyOptionDetails}>
                      <Text style={styles.companyOptionIndustry}>{company.industry}</Text>
                      <Text style={styles.companyOptionContact}>{company.contactPerson}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCompanySelector(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

    </ScrollView>
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
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#e0f2fe',
    textTransform: 'capitalize',
  },
  profileIcon: {
    marginLeft: 16,
  },
  statsContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greenCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  yellowCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  blueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  redCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  purpleCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  orangeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  greenBackground: {
    backgroundColor: '#22c55e',
  },
  yellowBackground: {
    backgroundColor: '#f59e0b',
  },
  blueBackground: {
    backgroundColor: '#3b82f6',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  bottomSpacing: {
    height: 100,
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
    padding: 28,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalScrollContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoViewer: {
    width: 200,
    height: 150,
    borderRadius: 8,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalButtonSend: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  modalButtonTextSend: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  // Estilos para indicador de empresa
  companyIndicator: {
    marginTop: 12,
    marginBottom: 4,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 180,
    justifyContent: 'space-between',
  },
  multipleCompaniesBadge: {
    backgroundColor: '#6366f1',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  singleCompanyBadge: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#059669',
  },
  companyBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  // Estilos para el selector de empresas
  companiesList: {
    maxHeight: 350,
    marginVertical: 16,
  },
  companyOption: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  companyOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 2,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
  },
  companyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyOptionName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 14,
    flex: 1,
  },
  companyOptionDetails: {
    marginLeft: 34,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
  },
  companyOptionIndustry: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
    fontWeight: '500',
  },
  companyOptionContact: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '400',
  },
  modalCancelButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
});