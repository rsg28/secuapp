import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRalsReports } from '../hooks/useRalsReports';

type TabType = 'reporte' | 'cierre' | 'referencia';
type TipoObservacion = 'acto_subestandar' | 'condicion_subestandar' | 'sugerencia_recomendacion' | 'felicitacion' | null;

export default function RALSFormScreen() {
  const { getCurrentCompany } = useAuth();
  const { create: createRalsReport, update: updateRalsReport, getById: getRalsReportById, loading: saving } = useRalsReports();
  const params = useLocalSearchParams();
  const reportId = params.reportId as string | undefined;
  const [loadingData, setLoadingData] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement) {
          (document.activeElement as HTMLElement).blur();
        }
      };
    }, [])
  );
  const [activeTab, setActiveTab] = useState<TabType>('reporte');

  // Reporte
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [empresa, setEmpresa] = useState('');
  const [tipoObservacion, setTipoObservacion] = useState<TipoObservacion>(null);
  const [areaSeccion, setAreaSeccion] = useState('');
  const [descripcionObservado, setDescripcionObservado] = useState('');
  const [accionesCorrectivas, setAccionesCorrectivas] = useState('');
  const [compromisoObservado, setCompromisoObservado] = useState('');

  // Cierre
  const [trabajadorObservadoNombre, setTrabajadorObservadoNombre] = useState('');
  const [trabajadorObservadoFirma, setTrabajadorObservadoFirma] = useState('');
  const [fechaLevantamiento, setFechaLevantamiento] = useState('');
  const [supervisorNombre, setSupervisorNombre] = useState('');
  const [supervisorFirma, setSupervisorFirma] = useState('');

  const ACTOS_SUBESTANDARES = [
    'Operar un equipo sin autorización/Entrenamiento.',
    'Falla al advertir.',
    'Falla al asegurar.',
    'Exponerse y/o exponer a los trabajadores a riesgos innecesarios.',
    'Operar a velocidad excesiva.',
    'No utilizar su equipo de protección personal.',
    'Estar fumando en las zonas operativas o en áreas donde no está permitido.',
    'Encontrarse con signos de haber ingerido alcohol.',
    'No reportar un incidente/accidente.',
    'No asistir a las reuniones de inicio de jornada u otras capacitaciones programadas.',
    'No cumplir con el procedimiento de trabajo.',
    'No realizó el ATS.',
  ];

  const CONDICIONES_SUBESTANDAR = [
    'Instrucciones y/o procedimientos inadecuados.',
    'Falta o inadecuadas barreras, guardas, bermas, barricadas, etc.',
    'Equipos de protección personal inadecuados o insuficientes.',
    'Herramientas, equipos o materiales defectuosos y/o inadecuados.',
    'Área de trabajo congestionada o restringida.',
    'Vías, paredes, tejados inestables.',
    'Almacenamiento inadecuado de productos químicos.',
    'Sistemas de advertencia y/o señalización insuficientes o inadecuadas.',
    'Peligro de explosión y/o incendio.',
    'Orden y Limpieza deficientes en el lugar de trabajo.',
    'Condiciones climáticas adversas.',
    'Condiciones ambientales peligrosas: Polvos, humos, emanaciones y/o vapores.',
    'Área con ventilación deficiente. Otra condición subestándar no clasificada.',
    'Área con exposiciones a ruidos excesivos.',
    'Área con exposiciones a temperaturas altas o bajas.',
    'Área con iluminación excesiva o deficiente.',
  ];

  const TIPOS_OBSERVACION = [
    { id: 'acto_subestandar' as const, label: 'Acto Subestándar' },
    { id: 'condicion_subestandar' as const, label: 'Condición Subestándar' },
    { id: 'sugerencia_recomendacion' as const, label: 'Sugerencia y/o Recomendación' },
    { id: 'felicitacion' as const, label: 'Felicitación a un trabajador' },
  ];

  // Cargar datos existentes si hay reportId
  useEffect(() => {
    if (reportId) {
      loadReportData();
    }
  }, [reportId]);

  const loadReportData = async () => {
    if (!reportId) return;
    try {
      setLoadingData(true);
      const report = await getRalsReportById(reportId);
      
      // Poblar los campos con los datos cargados
      setNombre(report.nombre || '');
      setFecha(typeof report.fecha === 'string' ? (report.fecha?.split('T')[0] || new Date().toISOString().split('T')[0]) : (report.fecha instanceof Date ? report.fecha.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
      setEmpresa(report.empresa || '');
      setTipoObservacion(report.tipo_observacion || null);
      setAreaSeccion(report.area_seccion || '');
      setDescripcionObservado(report.descripcion_observado || '');
      setAccionesCorrectivas(report.acciones_correctivas || '');
      setCompromisoObservado(report.compromiso_observado || '');
      setTrabajadorObservadoNombre(report.trabajador_observado_nombre || '');
      setTrabajadorObservadoFirma(report.trabajador_observado_firma || '');
      setFechaLevantamiento(typeof report.fecha_levantamiento === 'string' ? (report.fecha_levantamiento?.split('T')[0] || '') : (report.fecha_levantamiento instanceof Date ? report.fecha_levantamiento.toISOString().split('T')[0] : ''));
      setSupervisorNombre(report.supervisor_nombre || '');
      setSupervisorFirma(report.supervisor_firma || '');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo cargar el reporte');
      router.back();
    } finally {
      setLoadingData(false);
    }
  };

  const hasFormData = () => {
    if (nombre.trim() || empresa.trim() || tipoObservacion) return true;
    if (areaSeccion.trim() || descripcionObservado.trim()) return true;
    if (accionesCorrectivas.trim() || compromisoObservado.trim()) return true;
    if (trabajadorObservadoNombre.trim() || trabajadorObservadoFirma.trim()) return true;
    if (fechaLevantamiento.trim() || supervisorNombre.trim() || supervisorFirma.trim()) return true;
    return false;
  };

  const saveForm = async () => {
    if (!nombre.trim()) {
      Alert.alert('Campo requerido', 'El nombre del reportante es obligatorio para guardar.');
      return;
    }
    if (!fecha?.trim()) {
      Alert.alert('Campo requerido', 'La fecha es obligatoria para guardar.');
      return;
    }
    const company = getCurrentCompany();
    const payload = {
      nombre,
      fecha,
      empresa: empresa || company?.name,
      tipoObservacion,
      areaSeccion,
      descripcionObservado,
      accionesCorrectivas,
      compromisoObservado,
      trabajadorObservadoNombre,
      trabajadorObservadoFirma,
      fechaLevantamiento,
      supervisorNombre,
      supervisorFirma,
      companyId: company?.id,
    };

    try {
      if (reportId) {
        // Modo edición: actualizar
        await updateRalsReport(reportId, payload);
        // Navegar de vuelta inmediatamente para que useFocusEffect recargue
        router.back();
      } else {
        // Modo creación: crear nuevo
        await createRalsReport(payload);
        router.replace('/otros-types?saved=rals');
      }
      return true;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo guardar el reporte RALS');
      return false;
    }
  };

  const handleGuardar = () => {
    Keyboard.dismiss();
    saveForm();
  };

  const handleBack = async () => {
    Alert.alert(
      'Confirmar',
      '¿Seguro que deseas salir? Los cambios no guardados se perderán.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            if (reportId) {
              // Modo edición: solo volver sin guardar
              router.back();
            } else {
              // Modo creación: guardar si hay datos
              if (hasFormData()) {
                saveForm();
              } else {
                router.replace('/otros-types');
              }
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header - estructura Nueva Respuesta, colores RALS */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={saving || loadingData}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{reportId ? 'Editar Respuesta' : 'Nueva Respuesta'}</Text>
          <Text style={styles.headerSubtitle}>Reporte de Actividades de Liderazgo de Seguridad</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkButton, (saving || !nombre.trim() || !fecha?.trim()) && { opacity: 0.5 }]}
          onPress={handleGuardar}
          disabled={saving || !nombre.trim() || !fecha?.trim()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {loadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Cargando reporte...</Text>
        </View>
      ) : (
        <>
      {/* Tabs - estilo Nueva Respuesta (subrayado) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reporte' && styles.activeTab]}
          onPress={() => setActiveTab('reporte')}
        >
          <Text style={[styles.tabText, activeTab === 'reporte' && styles.activeTabText]}>Reporte</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cierre' && styles.activeTab]}
          onPress={() => setActiveTab('cierre')}
        >
          <Text style={[styles.tabText, activeTab === 'cierre' && styles.activeTabText]}>Cierre</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'referencia' && styles.activeTab]}
          onPress={() => setActiveTab('referencia')}
        >
          <Text style={[styles.tabText, activeTab === 'referencia' && styles.activeTabText]}>Referencia</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        {activeTab === 'reporte' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos generales</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Nombre del reportante"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Fecha *</Text>
                <TextInput
                  style={styles.input}
                  value={fecha}
                  onChangeText={setFecha}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Empresa</Text>
                <TextInput
                  style={styles.input}
                  value={empresa}
                  onChangeText={setEmpresa}
                  placeholder="Nombre de la empresa"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de observación</Text>
              <View style={styles.tiposGrid}>
                {TIPOS_OBSERVACION.map(tipo => (
                  <TouchableOpacity
                    key={tipo.id}
                    style={[styles.tipoCard, tipoObservacion === tipo.id && styles.tipoCardSelected]}
                    onPress={() => setTipoObservacion(tipo.id)}
                  >
                    <View style={[styles.checkbox, tipoObservacion === tipo.id && styles.checkboxChecked]}>
                      {tipoObservacion === tipo.id && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <Text style={[styles.tipoLabel, tipoObservacion === tipo.id && styles.tipoLabelSelected]}>
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalles de la observación</Text>
              <View style={styles.field}>
                <Text style={styles.label}>En qué área/sección lo observó</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={areaSeccion}
                  onChangeText={setAreaSeccion}
                  placeholder="Área o sección donde realizó la observación"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={2}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Breve descripción de lo observado y/o corregido</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={descripcionObservado}
                  onChangeText={setDescripcionObservado}
                  placeholder="Describa lo que observó y las correcciones realizadas"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acciones y compromisos</Text>
              <View style={styles.field}>
                <Text style={styles.label}>Acciones correctivas aplicadas (para actos o conductas inseguras)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={accionesCorrectivas}
                  onChangeText={setAccionesCorrectivas}
                  placeholder="Describa las acciones correctivas..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Compromiso del observado (para actos o conductas inseguras)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={compromisoObservado}
                  onChangeText={setCompromisoObservado}
                  placeholder="Compromiso asumido por el trabajador observado..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </>
        )}

        {activeTab === 'cierre' && (
          <View style={styles.equipoSection}>
            <Text style={styles.equipoTitle}>Cierre y firmas</Text>
            <Text style={styles.equipoSubtitle}>
              Complete los datos del trabajador observado y del supervisor a cargo
            </Text>

            <View style={styles.teamMemberCard}>
              <View style={styles.teamMemberHeader}>
                <Text style={styles.teamMemberIndex}>Trabajador observado</Text>
              </View>
              <Text style={styles.cardHint}>Indique el nombre y firma del trabajador observado</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre y Apellido</Text>
                <TextInput
                  style={styles.teamInput}
                  value={trabajadorObservadoNombre}
                  onChangeText={setTrabajadorObservadoNombre}
                  placeholder="Ej: Juan Pérez García"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Firma</Text>
                <TextInput
                  style={styles.teamInput}
                  value={trabajadorObservadoFirma}
                  onChangeText={setTrabajadorObservadoFirma}
                  placeholder="Nombre o referencia"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.supervisorNote}>
              <Text style={styles.supervisorNoteText}>(Solo ser llenado por el Supervisor a Cargo del área o sección)</Text>
            </View>

            <View style={styles.teamMemberCard}>
              <View style={styles.teamMemberHeader}>
                <Text style={styles.teamMemberIndex}>Seguimiento</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fecha de levantamiento de Acc. Correctivas</Text>
                <TextInput
                  style={styles.teamInput}
                  value={fechaLevantamiento}
                  onChangeText={setFechaLevantamiento}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre y firma del Supervisor a cargo</Text>
                <TextInput
                  style={styles.teamInput}
                  value={supervisorNombre}
                  onChangeText={setSupervisorNombre}
                  placeholder="Nombre del supervisor"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Firma del Supervisor</Text>
                <TextInput
                  style={styles.teamInput}
                  value={supervisorFirma}
                  onChangeText={setSupervisorFirma}
                  placeholder="Nombre o referencia"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          </View>
        )}

        {activeTab === 'referencia' && (
          <View style={styles.equipoSection}>
            <Text style={styles.referenciaTitle}>(Reverso)</Text>
            <Text style={styles.referenciaSubtitle}>
              Listas referenciales para clasificar observaciones de seguridad
            </Text>

            <View style={styles.referenciaCard}>
              <Text style={styles.referenciaCardTitle}>ACTOS SUBESTÁNDARES: (*)</Text>
              {ACTOS_SUBESTANDARES.map((item, i) => (
                <Text key={i} style={styles.referenciaItem}>{i + 1}. {item}</Text>
              ))}
            </View>

            <View style={styles.referenciaCard}>
              <Text style={styles.referenciaCardTitle}>CONDICIONES SUBESTÁNDAR: (*)</Text>
              <Text style={styles.referenciaNote}>(*) Esta lista es referencial, no es limitativa</Text>
              {CONDICIONES_SUBESTANDAR.map((item, i) => (
                <Text key={i} style={styles.referenciaItem}>{i + 1}. {item}</Text>
              ))}
            </View>

            <View style={styles.definicionesCard}>
              <Text style={styles.definicionesTitle}>Definiciones</Text>
              <View style={styles.definicionItem}>
                <Text style={styles.definicionTerm}>RIESGO:</Text>
                <Text style={styles.definicionText}>Posibilidad y/o probabilidad de que ocurra un accidente.</Text>
              </View>
              <View style={styles.definicionItem}>
                <Text style={styles.definicionTerm}>PELIGRO:</Text>
                <Text style={styles.definicionText}>Situación determinada con potencial de daño en términos de lesión a la persona o salud, a la propiedad, al medio ambiente o una combinación de éstas.</Text>
              </View>
              <View style={styles.definicionItem}>
                <Text style={styles.definicionTerm}>INCIDENTE:</Text>
                <Text style={styles.definicionText}>Evento donde pudo existir una lesión o tuvo una atención de primeros auxilios.</Text>
              </View>
              <View style={styles.definicionItem}>
                <Text style={styles.definicionTerm}>ACCIDENTE:</Text>
                <Text style={styles.definicionText}>Evento no planificado que ha ocasionado lesión, enfermedad o daño a los recursos, al medio ambiente o a terceros.</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#22c55e',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: { marginRight: 16 },
  headerContent: { flex: 1 },
  checkButton: { marginLeft: 16, padding: 12, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#dcfce7', marginTop: 2, fontStyle: 'italic' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#22c55e' },
  tabText: { fontSize: 16, fontWeight: '500', color: '#6b7280' },
  activeTabText: { color: '#16a34a', fontWeight: '600' },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  tiposGrid: { gap: 8 },
  tipoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipoCardSelected: { borderColor: '#22c55e', backgroundColor: '#dcfce7', borderWidth: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  tipoLabel: { flex: 1, fontSize: 16, color: '#374151' },
  tipoLabelSelected: { color: '#16a34a', fontWeight: '600' },
  equipoSection: { padding: 20 },
  equipoTitle: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  equipoSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  cardHint: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  teamMemberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  teamMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  teamMemberIndex: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  teamInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  supervisorNote: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  supervisorNoteText: { fontSize: 13, color: '#b91c1c', fontWeight: '500' },
  referenciaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 4,
  },
  referenciaSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  referenciaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  referenciaCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 12,
  },
  referenciaNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  referenciaItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 6,
  },
  definicionesCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  definicionesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 12,
  },
  definicionItem: {
    marginBottom: 12,
  },
  definicionTerm: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 4,
  },
  definicionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  bottomSpacing: { height: 100 },
});
