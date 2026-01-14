import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SearchInspectionsScreen() {
  const { width } = useWindowDimensions();
  const [searchId, setSearchId] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchInspectorName, setSearchInspectorName] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [tempDateFrom, setTempDateFrom] = useState<Date>(new Date());
  const [tempDateTo, setTempDateTo] = useState<Date>(new Date());
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [searchType, setSearchType] = useState<'both' | 'closed' | 'open'>('both');

  const handleSearch = () => {
    // Validar que al menos un filtro esté presente
    if (!searchId.trim() && !searchTitle.trim() && !searchInspectorName.trim() && !dateFrom && !dateTo) {
      Alert.alert('Error', 'Debes ingresar al menos un filtro de búsqueda');
      return;
    }

    // Navegar a la página de resultados con los parámetros de búsqueda
    router.push({
      pathname: '/search-results',
      params: {
        id: searchId.trim(),
        title: searchTitle.trim(),
        inspectorName: searchInspectorName.trim(),
        dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : '',
        dateTo: dateTo ? dateTo.toISOString().split('T')[0] : '',
        type: searchType,
      },
    });
  };

  const handleClear = () => {
    setSearchId('');
    setSearchTitle('');
    setSearchInspectorName('');
    setDateFrom(null);
    setDateTo(null);
    setSearchType('both');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Búsqueda de Inspecciones</Text>
          <Text style={styles.headerSubtitle}>Busca por ID, título, inspector o fecha</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filtros de búsqueda */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Filtros de Búsqueda</Text>

          {/* ID */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>ID de Inspección</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el ID o parte del ID"
              placeholderTextColor="#9ca3af"
              value={searchId}
              onChangeText={setSearchId}
            />
          </View>

          {/* Título */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Título / Ubicación</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el título o ubicación"
              placeholderTextColor="#9ca3af"
              value={searchTitle}
              onChangeText={setSearchTitle}
            />
          </View>

          {/* Nombre del Inspector */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre del Inspector</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre y/o apellido del inspector"
              placeholderTextColor="#9ca3af"
              value={searchInspectorName}
              onChangeText={setSearchInspectorName}
            />
          </View>

          {/* Rango de Fechas */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rango de Fechas</Text>
            <View style={styles.dateContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Desde</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    setTempDateFrom(dateFrom || new Date());
                    setShowDateFromPicker(true);
                  }}
                >
                  <Text style={[styles.dateInputText, !dateFrom && styles.dateInputPlaceholder]}>
                    {dateFrom
                      ? dateFrom.toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })
                      : 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Hasta</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    setTempDateTo(dateTo || new Date());
                    setShowDateToPicker(true);
                  }}
                >
                  <Text style={[styles.dateInputText, !dateTo && styles.dateInputPlaceholder]}>
                    {dateTo
                      ? dateTo.toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })
                      : 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tipo de Inspección */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipo de Inspección</Text>
            <View style={styles.typeSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  searchType === 'both' && styles.typeButtonActive
                ]}
                onPress={() => setSearchType('both')}
              >
                <Text style={[
                  styles.typeButtonText,
                  searchType === 'both' && styles.typeButtonTextActive
                ]}>
                  Ambos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  searchType === 'closed' && styles.typeButtonActive
                ]}
                onPress={() => setSearchType('closed')}
              >
                <Text style={[
                  styles.typeButtonText,
                  searchType === 'closed' && styles.typeButtonTextActive
                ]}>
                  Checklist
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  searchType === 'open' && styles.typeButtonActive
                ]}
                onPress={() => setSearchType('open')}
              >
                <Text style={[
                  styles.typeButtonText,
                  searchType === 'open' && styles.typeButtonTextActive
                ]}>
                  Abierta
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.searchButton]}
              onPress={handleSearch}
            >
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.buttonText}>Buscar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {Platform.OS === 'ios' ? (
        <>
          <Modal
            visible={showDateFromPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDateFromPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Seleccionar Fecha Desde</Text>
                  <TouchableOpacity
                    onPress={() => setShowDateFromPicker(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#1f2937" />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDateFrom}
                  mode="date"
                  display="spinner"
                  onChange={(event: any, selectedDate?: Date) => {
                    if (selectedDate) {
                      setTempDateFrom(selectedDate);
                    }
                  }}
                  locale="es-ES"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowDateFromPicker(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={() => {
                      setDateFrom(tempDateFrom);
                      setShowDateFromPicker(false);
                    }}
                  >
                    <Text style={styles.modalConfirmText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            visible={showDateToPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDateToPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Seleccionar Fecha Hasta</Text>
                  <TouchableOpacity
                    onPress={() => setShowDateToPicker(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#1f2937" />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDateTo}
                  mode="date"
                  display="spinner"
                  onChange={(event: any, selectedDate?: Date) => {
                    if (selectedDate) {
                      setTempDateTo(selectedDate);
                    }
                  }}
                  locale="es-ES"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowDateToPicker(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={() => {
                      setDateTo(tempDateTo);
                      setShowDateToPicker(false);
                    }}
                  >
                    <Text style={styles.modalConfirmText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <>
          {showDateFromPicker && (
            <DateTimePicker
              value={dateFrom || new Date()}
              mode="date"
              display="default"
              onChange={(event: any, selectedDate?: Date) => {
                setShowDateFromPicker(false);
                if (event.type === 'set' && selectedDate) {
                  setDateFrom(selectedDate);
                }
              }}
              locale="es-ES"
            />
          )}
          {showDateToPicker && (
            <DateTimePicker
              value={dateTo || new Date()}
              mode="date"
              display="default"
              onChange={(event: any, selectedDate?: Date) => {
                setShowDateToPicker(false);
                if (event.type === 'set' && selectedDate) {
                  setDateTo(selectedDate);
                }
              }}
              locale="es-ES"
            />
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#7dd3fc',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Espacio para tabs y teclado
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
  },
  clearButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    minHeight: 48,
  },
  dateInputText: {
    fontSize: 14,
    color: '#1f2937',
  },
  dateInputPlaceholder: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    paddingTop: 16,
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

