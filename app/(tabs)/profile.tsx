import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClosedInspectionResponses } from '../../hooks/useClosedInspectionResponses';
import { useOpenInspectionResponses } from '../../hooks/useOpenInspectionResponses';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { countResponsesByInspectorId: countClosedResponses } = useClosedInspectionResponses();
  const { countResponsesByInspectorId: countOpenResponses } = useOpenInspectionResponses();
  const [formCount, setFormCount] = useState<number | null>(null);

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
          <View style={styles.profileImage}>
            <IconSymbol name="person.fill" size={50} color="#fff" />
          </View>
          <TouchableOpacity style={styles.editImageButton}>
            <IconSymbol name="camera.fill" size={16} color="#fff" />
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

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas del Mes</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color="#22c55e" />
            <Text style={styles.statNumber}>{formCount === null ? '...' : formCount}</Text>
            <Text style={styles.statLabel}>Formularios en Proceso</Text>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="camera.fill" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>Pronto</Text>
            <Text style={styles.statLabel}>Fotos Tomadas (Trabajando en ello)</Text>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>Pronto</Text>
            <Text style={styles.statLabel}>Incidentes Reportados (Trabajando en ello)</Text>
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
          
          {/* Botón de Gestión de Empleados solo para managers */}
          {user.role === 'manager' && (
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/employees')}>
              <View style={styles.settingLeft}>
                <IconSymbol name="people.fill" size={20} color="#1e40af" />
                <Text style={styles.settingText}>Gestión de Empleados</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
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
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
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
});