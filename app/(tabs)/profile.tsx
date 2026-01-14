import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useClosedInspectionResponses } from '../../hooks/useClosedInspectionResponses';
import { useOpenInspectionResponses } from '../../hooks/useOpenInspectionResponses';
import { useImageUpload } from '../../hooks/useImageUpload';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

export default function ProfileScreen() {
  const { user, logout, refreshProfile, updateProfile } = useAuth();
  const { countResponsesByInspectorId: countClosedResponses } = useClosedInspectionResponses();
  const { countResponsesByInspectorId: countOpenResponses } = useOpenInspectionResponses();
  const { uploadImage, deleteImage, uploading: uploadingImage } = useImageUpload();
  const [formCount, setFormCount] = useState<number | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    const loadFormCounts = async () => {
      if (!user?.id) return;
      try {
        const [closedCount, openCount] = await Promise.all([
          countClosedResponses(user.id),
          countOpenResponses(user.id)
        ]);
        setFormCount(closedCount + openCount);
      } catch (error) {
        setFormCount(0);
      }
    };

    loadFormCounts();
  }, [user?.id]);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleChangeProfileImage = () => {
    Alert.alert(
      'Cambiar Foto de Perfil',
      '¿Cómo deseas cambiar tu foto de perfil?',
      [
        {
          text: 'Tomar Foto',
          onPress: handleTakePhoto,
        },
        {
          text: 'Galería',
          onPress: handlePickImage,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
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
        aspect: [1, 1], // Aspect ratio cuadrado para que se muestre completo
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
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
        aspect: [1, 1], // Aspect ratio cuadrado para que se muestre completo
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Error al tomar foto: ' + error.message);
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Usuario no identificado');
      return;
    }

    try {
      setUpdatingProfile(true);

      // Eliminar imagen anterior de S3 si existe
      if (user.profile_image_url) {
        try {
          await deleteImage(user.profile_image_url);
        } catch (deleteError: any) {
          console.warn('Error eliminando imagen anterior (continuando):', deleteError);
          // Continuar con la subida aunque falle la eliminación
        }
      }

      // Subir nueva imagen
      const imageUrl = await uploadImage({
        imageUri,
        folder: 'profile-images',
        identifier: user.id,
      });

      if (imageUrl) {
        // Actualizar usuario con la nueva URL usando el endpoint de perfil
        await updateProfile({
          profile_image_url: imageUrl,
        });

        // Actualizar el usuario en el contexto
        await refreshProfile();
        
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Error al actualizar foto de perfil: ' + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Editar Perfil', 'Funcionalidad próximamente disponible');
  };

  const handleChangePassword = () => {
    Alert.alert('Cambiar Contraseña', 'Funcionalidad próximamente disponible');
  };

  const handleNotifications = () => {
    Alert.alert('Notificaciones', 'Funcionalidad próximamente disponible');
  };

  const handleHelp = () => {
    Alert.alert('Ayuda', 'Para soporte técnico contacta al administrador del sistema');
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario');
      return;
    }

    if (comment.trim().length < 5) {
      Alert.alert('Error', 'El comentario debe tener al menos 5 caracteres');
      return;
    }

    try {
      setSendingComment(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Inicia sesión nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment: comment.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'No se pudo enviar el comentario');
      }

      Alert.alert(
        '✅ Comentario Enviado',
        'Tu comentario ha sido enviado exitosamente. ¡Gracias por ayudarnos a mejorar!\n\nTu feedback es muy valioso para nosotros.',
        [{ text: 'De nada', style: 'default' }]
      );
      setComment('');
    } catch (error: any) {
      console.error('Error sending comment:', error);
      Alert.alert('Error', error?.message || 'No se pudo enviar el comentario');
    } finally {
      setSendingComment(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Usuario no autenticado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {user.profile_image_url ? (
            <Image 
              source={{ uri: user.profile_image_url }} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profileImage}>
              <IconSymbol name="person.fill" size={50} color="#fff" />
            </View>
          )}
          <TouchableOpacity 
            style={styles.editImageButton}
            onPress={handleChangeProfileImage}
            disabled={updatingProfile || uploadingImage}
          >
            {updatingProfile || uploadingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol name="camera.fill" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user.fullName}</Text>
        <Text style={styles.userPosition}>
          {user.role === 'manager' ? 'Manager de Seguridad' : 'Empleado'}
        </Text>
        <Text style={styles.userDepartment}>
          {user.company || 'Departamento de Seguridad'}
        </Text>
      </View>

      {/* User Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <IconSymbol name="envelope.fill" size={20} color="#10b981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <IconSymbol name="phone.fill" size={20} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{user.phone || 'No registrado'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Statistics Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.statsButton}
          onPress={() => router.push('/statistics')}
        >
          <View style={styles.statsButtonContent}>
            <IconSymbol name="chart.bar.fill" size={24} color="#fff" />
            <View style={styles.statsButtonTextContainer}>
              <Text style={styles.statsButtonTitle}>Ver Estadísticas</Text>
              <Text style={styles.statsButtonSubtitle}>
                Inspecciones y actividad detallada
              </Text>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comentarios y Sugerencias</Text>
        <View style={styles.commentCard}>
          <Text style={styles.commentLabel}>
            Comparte tus comentarios, sugerencias o recomendaciones
          </Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Escribe tu comentario aquí..."
            placeholderTextColor="#9ca3af"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
          <View style={styles.commentFooter}>
            <Text style={styles.commentCounter}>
              {comment.length}/2000 caracteres
            </Text>
            <TouchableOpacity
              style={[styles.submitButton, sendingComment && styles.submitButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={sendingComment || !comment.trim()}
            >
              {sendingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <IconSymbol name="paperplane.fill" size={16} color="#fff" />
                  <Text style={styles.submitButtonText}>Enviar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
            <View style={styles.settingLeft}>
              <IconSymbol name="pencil" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Editar Perfil</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
            <View style={styles.settingLeft}>
              <IconSymbol name="lock.fill" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Cambiar Contraseña</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleNotifications}>
            <View style={styles.settingLeft}>
              <IconSymbol name="bell.fill" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Notificaciones</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleHelp}>
            <View style={styles.settingLeft}>
              <IconSymbol name="questionmark.circle.fill" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Ayuda y Soporte</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Gestión de Manager - Solo visible para managers */}
      {user.role === 'manager' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/employees')}>
              <View style={styles.settingLeft}>
                <IconSymbol name="people.fill" size={20} color="#1e40af" />
                <Text style={styles.settingText}>Gestión de Empleados</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/search-inspections')}>
              <View style={styles.settingLeft}>
                <IconSymbol name="magnifyingglass" size={20} color="#1e40af" />
                <Text style={styles.settingText}>Búsqueda de Inspecciones</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/generate-reports')}>
              <View style={styles.settingLeft}>
                <IconSymbol name="document-text" size={20} color="#1e40af" />
                <Text style={styles.settingText}>Generar Reportes</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>SecuApp versión 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2024 Sistema de Seguridad Laboral</Text>
      </View>
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
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 16,
    color: '#e0f2fe',
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 14,
    color: '#e0f2fe',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 180,
    paddingTop: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentCounter: {
    fontSize: 12,
    color: '#9ca3af',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statsButtonTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  statsButtonTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsButtonSubtitle: {
    color: '#dbeafe',
    fontSize: 14,
  },
});