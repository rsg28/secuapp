import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import GradientHeader from '@/components/ui/GradientHeader';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function EmployeesScreen() {
  const { user } = useAuth();
  const { loading, error, getAllUsers, updateUser } = useUsers();
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async (term = search) => {
    try {
      const data = await getAllUsers({ page: 1, limit: 100, search: term });
      setUsersList(data.data.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, [getAllUsers, search]);

  useEffect(() => {
    if (user && user.role !== 'manager') {
      Alert.alert('Acceso denegado', 'Solo managers pueden administrar usuarios.');
      router.back();
      return;
    }
    loadUsers('');
  }, [user?.id, user?.role]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (user?.role === 'manager') {
      loadUsers(search);
    }
  }, [search]);

  const stats = useMemo(() => {
    const managers = usersList.filter((u) => u.role === 'manager').length;
    const active = usersList.filter((u) => u.is_active).length;
    return { total: usersList.length, managers, active };
  }, [usersList]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openInspections = (target: AdminUser) => {
    setSelectedUser(null);
    router.push({
      pathname: '/employee-inspections' as any,
      params: {
        employeeId: target.id,
        employeeName: `${target.first_name} ${target.last_name}`,
        employeeEmail: target.email,
      },
    });
  };

  const applyUpdate = async (target: AdminUser, updates: { role?: string; is_active?: boolean }, confirmTitle: string, confirmMsg: string) => {
    Alert.alert(confirmTitle, confirmMsg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);
            await updateUser(target.id, updates);
            setSelectedUser(null);
            await loadUsers(search);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo actualizar el usuario');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handlePromote = (target: AdminUser) => {
    applyUpdate(
      target,
      { role: 'manager' },
      'Promover a manager',
      `¿Convertir a ${target.first_name} ${target.last_name} en manager? Tendrá acceso a Gestión y reportes.`
    );
  };

  const handleDemote = (target: AdminUser) => {
    applyUpdate(
      target,
      { role: 'employee' },
      'Quitar rol manager',
      `¿Quitar el rol manager a ${target.first_name} ${target.last_name}?`
    );
  };

  const handleToggleActive = (target: AdminUser) => {
    const next = !target.is_active;
    applyUpdate(
      target,
      { is_active: next },
      next ? 'Activar usuario' : 'Desactivar usuario',
      next
        ? `¿Activar la cuenta de ${target.first_name} ${target.last_name}?`
        : `¿Desactivar la cuenta de ${target.first_name} ${target.last_name}? No podrá iniciar sesión.`
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Administración de Usuarios</Text>
          <Text style={styles.headerSubtitle}>Directorio · solo managers</Text>
        </View>
      </GradientHeader>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Buscar por nombre o email"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={() => setSearchInput('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>{stats.total} usuarios</Text>
        <Text style={styles.statsDot}>·</Text>
        <Text style={styles.statsText}>{stats.managers} managers</Text>
        <Text style={styles.statsDot}>·</Text>
        <Text style={styles.statsText}>{stats.active} activos</Text>
      </View>

      {loading && usersList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : error && usersList.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Error al cargar usuarios</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadUsers(search)}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : usersList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No hay usuarios que coincidan</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.employeesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {usersList.map((item) => {
            const isSelf = user?.id === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.employeeCard, !item.is_active && styles.employeeCardInactive]}
                onPress={() => setSelectedUser(item)}
                activeOpacity={0.7}
              >
                <View style={styles.employeeInfo}>
                  <View style={styles.employeeHeader}>
                    <Text style={styles.employeeName}>
                      {item.first_name} {item.last_name}
                      {isSelf ? ' (tú)' : ''}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.is_active ? styles.activeBadge : styles.inactiveBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: item.is_active ? '#166534' : '#991b1b' },
                        ]}
                      >
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.employeeEmail}>{item.email}</Text>

                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        item.role === 'manager' ? styles.managerBadge : styles.employeeBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleBadgeText,
                          { color: item.role === 'manager' ? '#1e3a8a' : '#334155' },
                        ]}
                      >
                        {item.role === 'manager' ? 'Manager' : 'Empleado'}
                      </Text>
                    </View>
                  </View>

                  {item.phone ? <Text style={styles.employeePhone}>{item.phone}</Text> : null}
                  <Text style={styles.employeeJoinDate}>
                    Registrado: {formatDate(item.created_at)}
                  </Text>
                </View>

                <View style={styles.arrowContainer}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <Modal
        visible={!!selectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedUser(null)}
        >
          <View style={styles.modalSheet}>
            {selectedUser && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </Text>
                <Text style={styles.modalSubtitle}>{selectedUser.email}</Text>

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => openInspections(selectedUser)}
                  disabled={actionLoading}
                >
                  <Ionicons name="clipboard-outline" size={20} color="#1e40af" />
                  <Text style={styles.modalActionText}>Ver inspecciones</Text>
                </TouchableOpacity>

                {selectedUser.role !== 'manager' ? (
                  <TouchableOpacity
                    style={styles.modalAction}
                    onPress={() => handlePromote(selectedUser)}
                    disabled={actionLoading}
                  >
                    <Ionicons name="arrow-up-circle-outline" size={20} color="#15803d" />
                    <Text style={[styles.modalActionText, { color: '#15803d' }]}>
                      Promover a manager
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalAction}
                    onPress={() => handleDemote(selectedUser)}
                    disabled={actionLoading || user?.id === selectedUser.id}
                  >
                    <Ionicons name="arrow-down-circle-outline" size={20} color="#b45309" />
                    <Text
                      style={[
                        styles.modalActionText,
                        {
                          color:
                            user?.id === selectedUser.id ? '#94a3b8' : '#b45309',
                        },
                      ]}
                    >
                      {user?.id === selectedUser.id
                        ? 'No puedes quitarte el rol a ti mismo aquí'
                        : 'Quitar rol manager'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => handleToggleActive(selectedUser)}
                  disabled={actionLoading || user?.id === selectedUser.id}
                >
                  <Ionicons
                    name={selectedUser.is_active ? 'ban-outline' : 'checkmark-circle-outline'}
                    size={20}
                    color={
                      user?.id === selectedUser.id
                        ? '#94a3b8'
                        : selectedUser.is_active
                          ? '#dc2626'
                          : '#15803d'
                    }
                  />
                  <Text
                    style={[
                      styles.modalActionText,
                      {
                        color:
                          user?.id === selectedUser.id
                            ? '#94a3b8'
                            : selectedUser.is_active
                              ? '#dc2626'
                              : '#15803d',
                      },
                    ]}
                  >
                    {user?.id === selectedUser.id
                      ? 'No puedes desactivar tu cuenta'
                      : selectedUser.is_active
                        ? 'Desactivar cuenta'
                        : 'Activar cuenta'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setSelectedUser(null)}
                  disabled={actionLoading}
                >
                  <Text style={styles.modalCancelText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    padding: 0,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 12,
    gap: 6,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  statsDot: {
    color: '#cbd5e1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  employeesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeCardInactive: {
    opacity: 0.72,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  employeeName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  employeeEmail: {
    fontSize: 13,
    color: '#3b82f6',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  managerBadge: {
    backgroundColor: '#dbeafe',
  },
  employeeBadge: {
    backgroundColor: '#f1f5f9',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  employeePhone: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  employeeJoinDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  arrowContainer: {
    marginLeft: 8,
    padding: 4,
  },
  bottomSpacer: {
    height: 100,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    marginTop: 2,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e40af',
    flex: 1,
  },
  modalCancel: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
});
