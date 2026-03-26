import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { loadReportEmployeeSelection } from './select-report-employees';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

interface AppService {
  id: string;
  name: string;
  icon: string;
  color: string;
  available: boolean;
}

const appServices: AppService[] = [
  { id: 'inspecciones', name: 'Inspecciones', icon: 'clipboard', color: '#3b82f6', available: true },
  { id: 'monitoreo', name: 'Monitoreo', icon: 'trending-up', color: '#ef4444', available: false },
  { id: 'observaciones', name: 'Observaciones', icon: 'eye', color: '#f59e0b', available: false },
  { id: 'auditoria', name: 'Auditoría', icon: 'document-text', color: '#8b5cf6', available: false },
  { id: 'linea-base', name: 'Línea de Base', icon: 'bar-chart', color: '#10b981', available: false },
];

export default function GenerateReportsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectionSummary, setSelectionSummary] = useState<string>('');
  const [selectedService, setSelectedService] = useState<AppService>(appServices[0]);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [tempDateFrom, setTempDateFrom] = useState<Date>(new Date());
  const [tempDateTo, setTempDateTo] = useState<Date>(new Date());
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
  const [inspectionType, setInspectionType] = useState<'both' | 'closed' | 'open'>('both');
  const [showInspectionTypePicker, setShowInspectionTypePicker] = useState(false);
  const [reportStatus, setReportStatus] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [showReportStatusPicker, setShowReportStatusPicker] = useState(false);
  const [generating, setGenerating] = useState(false);

  const refreshSelection = useCallback(async () => {
    const sel = await loadReportEmployeeSelection();
    setSelectedEmployees(new Set(sel.ids));
    if (sel.ids.length === 0) {
      setSelectionSummary('Ninguno seleccionado');
      return;
    }
    const names = sel.ids
      .map((id) => sel.namesById[id])
      .filter(Boolean) as string[];
    if (names.length > 0) {
      const preview = names.slice(0, 4).join(', ');
      setSelectionSummary(
        `${sel.ids.length} empleado${sel.ids.length !== 1 ? 's' : ''}: ${preview}${sel.ids.length > 4 ? '…' : ''}`
      );
    } else {
      setSelectionSummary(`${sel.ids.length} empleado${sel.ids.length !== 1 ? 's' : ''} seleccionado${sel.ids.length !== 1 ? 's' : ''}`);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSelection();
    }, [refreshSelection])
  );

  const formatLocalDateForQuery = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleGenerate = async () => {
    if (selectedEmployees.size === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un empleado');
      return;
    }

    if (!dateFrom || !dateTo) {
      Alert.alert('Error', 'Debes seleccionar un rango de fechas');
      return;
    }

    const dateFromStr = formatLocalDateForQuery(dateFrom);
    const dateToStr = formatLocalDateForQuery(dateTo);

    try {
      setGenerating(true);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeIds: Array.from(selectedEmployees),
          dateFrom: dateFromStr,
          dateTo: dateToStr,
          inspectionType,
          service: selectedService.name,
          status: reportStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al generar el reporte');
      }

      // Descargar el archivo Excel directamente
      const arrayBuffer = await response.arrayBuffer();
      const fileName = `reporte-${Date.now()}.xlsx`;
      // @ts-ignore
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Convertir ArrayBuffer a base64
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // Guardar archivo
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Descargar Reporte',
        });
        Alert.alert('Éxito', 'Reporte generado y listo para compartir');
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
      setGenerating(false);
    } catch (error: any) {
      Alert.alert('Error', `Error al generar el reporte: ${error.message}`);
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeRoot} edges={['bottom']}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Franja azul bajo barra de estado (evita blanco arriba del header) */}
      <View style={[styles.headerStatusFill, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Generar reportes</Text>
            <Text style={styles.headerSubtitle}>Completa los filtros y elige empleados</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Servicios de la Aplicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios</Text>
          <View style={styles.serviceButtonsContainer}>
            {appServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceButton,
                  selectedService.id === service.id && { backgroundColor: service.color, borderColor: service.color },
                  !service.available && styles.serviceButtonDisabled,
                ]}
                onPress={() => {
                  if (service.available) {
                    setSelectedService(service);
                  }
                }}
                disabled={!service.available}
              >
                <Ionicons
                  name={service.icon as any}
                  size={18}
                  style={styles.serviceIcon}
                  color={selectedService.id === service.id ? '#fff' : service.available ? '#6b7280' : '#d1d5db'}
                />
                <Text
                  style={[
                    styles.serviceButtonText,
                    selectedService.id === service.id && styles.serviceButtonTextActive,
                    !service.available && styles.serviceButtonTextDisabled,
                  ]}
                  numberOfLines={1}
                >
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {!selectedService.available && (
            <Text style={styles.serviceUnavailableText}>
              Este servicio estará disponible próximamente
            </Text>
          )}
        </View>

        {/* Inspección: tipo + estado */}
        {selectedService.id === 'inspecciones' && (
          <View style={styles.section}>
            <Text style={styles.sectionKicker}>Paso 2</Text>
            <Text style={styles.sectionTitle}>Inspección</Text>
            <Text style={styles.sectionDesc}>Tipo de checklist y si debe estar completa.</Text>
            <Text style={styles.fieldLabel}>Tipo de inspección</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShowInspectionTypePicker(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.dropdownInputText} numberOfLines={1}>
                {inspectionType === 'both' ? 'Ambos' : inspectionType === 'closed' ? 'Checklist' : 'Abiertas'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Estado de completitud</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShowReportStatusPicker(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.dropdownInputText} numberOfLines={1}>
                {reportStatus === 'all'
                  ? 'Todas'
                  : reportStatus === 'completed'
                    ? 'Completadas'
                    : 'Incompletas'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {/* Rango de Fechas */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>{selectedService.id === 'inspecciones' ? 'Paso 3' : 'Paso 2'}</Text>
          <Text style={styles.sectionTitle}>Rango de fechas</Text>
          <Text style={styles.sectionDesc}>Incluye el día “hasta” completo.</Text>
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
            <View style={[styles.dateInputContainer, styles.dateInputColSpaced]}>
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

        {/* Empleados */}
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>{selectedService.id === 'inspecciones' ? 'Paso 4' : 'Paso 3'}</Text>
          <Text style={styles.sectionTitle}>Empleados</Text>
          <Text style={styles.sectionDesc}>Solo se exportan datos de quienes marques en la lista.</Text>
          <View style={styles.employeeCard}>
            <TouchableOpacity
              style={styles.pickEmployeesButton}
              onPress={() => router.push('/select-report-employees')}
              activeOpacity={0.88}
            >
              <Ionicons name="people-outline" size={20} color="#fff" />
              <Text style={styles.pickEmployeesButtonText}>Seleccionar empleados</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.employeeNamesBlock}>
              {selectedEmployees.size > 0 ? (
                <>
                  <Text style={styles.employeeNamesLabel}>Seleccionados</Text>
                  <Text style={styles.employeeNamesText}>{selectionSummary}</Text>
                </>
              ) : (
                <Text style={styles.employeeNamesEmpty}>
                  Ningún empleado seleccionado. Pulsa el botón para abrir la lista.
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Botón Generar */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateButtonText}>Generando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generar Reporte</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal Estado (completitud) */}
      <Modal
        visible={showReportStatusPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReportStatusPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReportStatusPicker(false)}
        >
          <View style={styles.dropdownModal}>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setReportStatus('all');
                setShowReportStatusPicker(false);
              }}
            >
              <Text style={[styles.dropdownOptionText, reportStatus === 'all' && styles.dropdownOptionTextActive]}>
                Todas
              </Text>
              {reportStatus === 'all' && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setReportStatus('completed');
                setShowReportStatusPicker(false);
              }}
            >
              <Text
                style={[styles.dropdownOptionText, reportStatus === 'completed' && styles.dropdownOptionTextActive]}
              >
                Completadas
              </Text>
              {reportStatus === 'completed' && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setReportStatus('incomplete');
                setShowReportStatusPicker(false);
              }}
            >
              <Text
                style={[styles.dropdownOptionText, reportStatus === 'incomplete' && styles.dropdownOptionTextActive]}
              >
                Incompletas
              </Text>
              {reportStatus === 'incomplete' && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para Tipo de Inspecciones */}
      <Modal
        visible={showInspectionTypePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInspectionTypePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInspectionTypePicker(false)}
        >
          <View style={styles.dropdownModal}>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setInspectionType('both');
                setShowInspectionTypePicker(false);
              }}
            >
              <Text style={[styles.dropdownOptionText, inspectionType === 'both' && styles.dropdownOptionTextActive]}>
                Ambos
              </Text>
              {inspectionType === 'both' && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setInspectionType('closed');
                setShowInspectionTypePicker(false);
              }}
            >
              <Text style={[styles.dropdownOptionText, inspectionType === 'closed' && styles.dropdownOptionTextActive]}>
                Checklist
              </Text>
              {inspectionType === 'closed' && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setInspectionType('open');
                setShowInspectionTypePicker(false);
              }}
            >
              <Text style={[styles.dropdownOptionText, inspectionType === 'open' && styles.dropdownOptionTextActive]}>
                Abiertas
              </Text>
              {inspectionType === 'open' && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerStatusFill: {
    backgroundColor: '#2563eb',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#dbeafe',
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  fieldLabelSpaced: {
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  sectionHint: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  employeeCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  employeeNamesBlock: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
  },
  employeeNamesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  employeeNamesText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 21,
  },
  employeeNamesEmpty: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
  },
  selectAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    minHeight: 48,
  },
  dropdownInputText: {
    fontSize: 14,
    color: '#1f2937',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownOptionTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  serviceButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    gap: 6,
    flex: 1,
    minWidth: '30%',
    justifyContent: 'center',
  },
  serviceIcon: {
    marginRight: 6,
  },
  serviceButtonDisabled: {
    opacity: 0.5,
  },
  serviceButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  serviceButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  serviceButtonTextDisabled: {
    color: '#d1d5db',
  },
  serviceUnavailableText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputColSpaced: {
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
  checkboxContainer: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  selectedCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  pickEmployeesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  pickEmployeesButtonText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  generateButtonTextAfterIcon: {
    marginLeft: 10,
  },
  bottomSpacer: {
    height: 20,
  },
});

