import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';

interface Employee {
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
  const { users, loading, error, getNonManagerUsers } = useUsers();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getNonManagerUsers();
      setEmployees(data.data.users || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleEmployeePress = (employee: Employee) => {
    router.push({
      pathname: '/employee-inspections' as any,
      params: {
        employeeId: employee.id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        employeeEmail: employee.email
      }
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gestión de Empleados</Text>
          <Text style={styles.headerSubtitle}>Lista de empleados</Text>
        </View>
      </View>

      {/* Employees List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando empleados...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Error al cargar empleados</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadEmployees}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : employees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No hay empleados registrados</Text>
        </View>
      ) : (
        <ScrollView style={styles.employeesList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {employees.map((employee) => (
            <TouchableOpacity
              key={employee.id}
              style={styles.employeeCard}
              onPress={() => handleEmployeePress(employee)}
              activeOpacity={0.7}
            >
              <View style={styles.employeeInfo}>
                <View style={styles.employeeHeader}>
                  <Text style={styles.employeeName}>
                    {employee.first_name} {employee.last_name}
                  </Text>
                  {employee.is_active ? (
                    <View style={[styles.statusBadge, styles.activeBadge]}>
                      <Text style={[styles.statusText, { color: '#166534' }]}>Activo</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, styles.inactiveBadge]}>
                      <Text style={[styles.statusText, { color: '#991b1b' }]}>Inactivo</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.employeeEmail}>{employee.email}</Text>
                <Text style={styles.employeeRole}>Rol: {employee.role || 'employee'}</Text>
                {employee.phone && (
                  <Text style={styles.employeePhone}>{employee.phone}</Text>
                )}
                <Text style={styles.employeeJoinDate}>
                  Registrado: {formatDate(employee.created_at)}
                </Text>
              </View>

              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Espacio adicional para evitar que los tabs tapen el contenido */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 30,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
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
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
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
    fontSize: 12,
    fontWeight: '600',
  },
  employeeEmail: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 4,
  },
  employeeRole: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  employeePhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  employeeJoinDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  arrowContainer: {
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 100,
    width: '100%',
  },
});
