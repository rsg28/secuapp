import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Employee } from '../types/auth';
import { storage } from '../utils/storage';

export default function EmployeesScreen() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    email: '',
    position: '',
    department: '',
    phone: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const loadedEmployees = await storage.loadEmployees();
      if (loadedEmployees.length === 0) {
        // Crear empleados de ejemplo si no hay ninguno
        const sampleEmployees: Employee[] = [
          {
            id: 'emp-001',
            fullName: 'Juan Pérez',
            email: 'juan.perez@secuapp.com',
            position: 'Técnico de Seguridad',
            department: 'Seguridad Industrial',
            phone: '+51 999 123 456',
            status: 'active',
            joinDate: '2024-01-15'
          },
          {
            id: 'emp-002',
            fullName: 'María García',
            email: 'maria.garcia@secuapp.com',
            position: 'Supervisor de Campo',
            department: 'Operaciones',
            phone: '+51 999 234 567',
            status: 'active',
            joinDate: '2024-02-01'
          },
          {
            id: 'emp-003',
            fullName: 'Carlos López',
            email: 'carlos.lopez@secuapp.com',
            position: 'Inspector de Calidad',
            department: 'Calidad',
            phone: '+51 999 345 678',
            status: 'inactive',
            joinDate: '2023-11-20'
          }
        ];
        await storage.saveEmployees(sampleEmployees);
        setEmployees(sampleEmployees);
      } else {
        setEmployees(loadedEmployees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.fullName.trim() || !newEmployee.email.trim()) {
      Alert.alert('Error', 'Nombre y email son obligatorios');
      return;
    }

    try {
      const employee: Employee = {
        id: `emp-${Date.now()}`,
        ...newEmployee,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0]
      };

      await storage.addEmployee(employee);
      setEmployees([...employees, employee]);
      setNewEmployee({
        fullName: '',
        email: '',
        position: '',
        department: '',
        phone: '',
      });
      setIsAddModalVisible(false);
      Alert.alert('Éxito', 'Empleado agregado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el empleado');
    }
  };

  const handleEditEmployee = async () => {
    if (!editingEmployee) return;

    try {
      await storage.updateEmployee(editingEmployee);
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id ? editingEmployee : emp
      ));
      setIsEditModalVisible(false);
      setEditingEmployee(null);
      Alert.alert('Éxito', 'Empleado actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el empleado');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este empleado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.deleteEmployee(employeeId);
              setEmployees(employees.filter(emp => emp.id !== employeeId));
              Alert.alert('Éxito', 'Empleado eliminado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el empleado');
            }
          }
        }
      ]
    );
  };

  const toggleEmployeeStatus = async (employee: Employee) => {
    const updatedEmployee: Employee = {
      ...employee,
      status: employee.status === 'active' ? 'inactive' : 'active'
    };
    
    try {
      await storage.updateEmployee(updatedEmployee);
      setEmployees(employees.map(emp => 
        emp.id === employee.id ? updatedEmployee : emp
      ));
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado del empleado');
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee({ ...employee });
    setIsEditModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#22c55e' : '#ef4444';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Activo' : 'Inactivo';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <Text style={styles.headerSubtitle}>Administra tu equipo de trabajo</Text>
        </View>
      </View>



      {/* Add Employee Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsAddModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Agregar Empleado</Text>
      </TouchableOpacity>

      {/* Employees List */}
      <ScrollView style={styles.employeesList} showsVerticalScrollIndicator={false}>
        {employees.map((employee) => (
          <View key={employee.id} style={styles.employeeCard}>
            <View style={styles.employeeInfo}>
              <View style={styles.employeeHeader}>
                <Text style={styles.employeeName}>{employee.fullName}</Text>
              </View>
              
              <Text style={styles.employeeEmail}>{employee.email}</Text>
              <Text style={styles.employeePosition}>{employee.position}</Text>
              <Text style={styles.employeeDepartment}>{employee.department}</Text>
              <Text style={styles.employeePhone}>{employee.phone}</Text>
              <Text style={styles.employeeJoinDate}>
                Fecha de ingreso: {employee.joinDate}
              </Text>
            </View>

            <View style={styles.employeeActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => openEditModal(employee)}
              >
                <Ionicons name="create" size={20} color="#3b82f6" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteEmployee(employee.id)}
              >
                <Ionicons name="trash" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {/* Espacio adicional para evitar que los tabs tapen el contenido */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Employee Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Nuevo Empleado</Text>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={newEmployee.fullName}
              onChangeText={(text) => setNewEmployee(prev => ({ ...prev, fullName: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newEmployee.email}
              onChangeText={(text) => setNewEmployee(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Cargo"
              value={newEmployee.position}
              onChangeText={(text) => setNewEmployee(prev => ({ ...prev, position: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Departamento"
              value={newEmployee.department}
              onChangeText={(text) => setNewEmployee(prev => ({ ...prev, department: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              value={newEmployee.phone}
              onChangeText={(text) => setNewEmployee(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddEmployee}
            >
              <Text style={styles.saveButtonText}>Agregar Empleado</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Empleado</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {editingEmployee && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  value={editingEmployee.fullName}
                  onChangeText={(text) => setEditingEmployee(prev => prev ? { ...prev, fullName: text } : null)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={editingEmployee.email}
                  onChangeText={(text) => setEditingEmployee(prev => prev ? { ...prev, email: text } : null)}
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Cargo"
                  value={editingEmployee.position}
                  onChangeText={(text) => setEditingEmployee(prev => prev ? { ...prev, position: text } : null)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Departamento"
                  value={editingEmployee.department}
                  onChangeText={(text) => setEditingEmployee(prev => prev ? { ...prev, department: text } : null)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  value={editingEmployee.phone}
                  onChangeText={(text) => setEditingEmployee(prev => prev ? { ...prev, phone: text } : null)}
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleEditEmployee}
                >
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  employeesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 200,
  },
  employeeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
  employeePosition: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  employeeDepartment: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
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
  employeeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  toggleButton: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  deleteButton: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 150,
    width: '100%',
  },
});
