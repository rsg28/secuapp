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
} from 'react-native';

export default function SearchInspectionsScreen() {
  const { width } = useWindowDimensions();
  const [searchId, setSearchId] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchInspectorName, setSearchInspectorName] = useState('');
  const [searchMonth, setSearchMonth] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchType, setSearchType] = useState<'both' | 'closed' | 'open'>('both');

  const handleSearch = () => {
    // Validar que al menos un filtro esté presente
    if (!searchId.trim() && !searchTitle.trim() && !searchInspectorName.trim() && !searchMonth && !searchYear) {
      Alert.alert('Error', 'Debes ingresar al menos un filtro de búsqueda');
      return;
    }

    // Validar mes y año si se proporcionaron
    if (searchMonth && (!searchYear || searchYear.length !== 4)) {
      Alert.alert('Error', 'Debes ingresar un año válido (4 dígitos) si especificas un mes');
      return;
    }
    if (searchYear && searchYear.length !== 4) {
      Alert.alert('Error', 'El año debe tener 4 dígitos');
      return;
    }
    if (searchMonth && (parseInt(searchMonth) < 1 || parseInt(searchMonth) > 12)) {
      Alert.alert('Error', 'El mes debe estar entre 1 y 12');
      return;
    }

    // Navegar a la página de resultados con los parámetros de búsqueda
    router.push({
      pathname: '/search-results',
      params: {
        id: searchId.trim(),
        title: searchTitle.trim(),
        inspectorName: searchInspectorName.trim(),
        month: searchMonth,
        year: searchYear,
        type: searchType,
      },
    });
  };

  const handleClear = () => {
    setSearchId('');
    setSearchTitle('');
    setSearchInspectorName('');
    setSearchMonth('');
    setSearchYear('');
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

          {/* Mes y Año */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mes y Año</Text>
            <View style={styles.dateRowContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateLabel}>Mes</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="MM"
                  placeholderTextColor="#9ca3af"
                  value={searchMonth}
                  onChangeText={(text) => {
                    // Solo permitir números y máximo 2 dígitos
                    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 2);
                    setSearchMonth(numericValue);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateLabel}>Año</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY"
                  placeholderTextColor="#9ca3af"
                  value={searchYear}
                  onChangeText={(text) => {
                    // Solo permitir números y máximo 4 dígitos
                    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 4);
                    setSearchYear(numericValue);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
            <Text style={styles.dateHint}>Deja vacío para buscar en todos los meses/años</Text>
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
  dateRowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
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
    padding: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  dateHint: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

