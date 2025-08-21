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

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoText, setPhotoText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Inspecciones</Text>
            <Text style={styles.statSubtext}>Ver todas</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, styles.greenCard]}>
            <IconSymbol name="eye.fill" size={24} color="#22c55e" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Observaciones</Text>
            <Text style={styles.statSubtext}>de Tarea</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.purpleCard]}>
            <IconSymbol name="chart.bar.fill" size={24} color="#8b5cf6" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Análisis</Text>
            <Text style={styles.statSubtext}>Trabajo Seguro</Text>
          </View>
          <View style={[styles.statCard, styles.orangeCard]}>
            <IconSymbol name="ellipsis.circle.fill" size={24} color="#f97316" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Otros</Text>
            <Text style={styles.statSubtext}>Documentos</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/explore')}
          >
            <Ionicons name="add-circle" size={24} color="#3b82f6" />
            <Text style={styles.actionText}>Nuevo Template</Text>
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
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalScrollContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
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
});