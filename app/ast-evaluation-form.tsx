import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAstEvaluations } from '../hooks/useAstEvaluations';

// Preguntas 1-5: 0 = No Cumple, 1 = Si Cumple
// Preguntas 6-8: 0 = No Cumple, 1 = Cumple Parcialmente, 2 = Cumple Totalmente

const QUESTIONS_01 = [
  {
    id: 1,
    category: 'Llenado del AST',
    text: '¿Todos los trabajadores involucrados colocan sus nombres y firman el AST al inicio y al término de la tarea? ¿Se coloca las firmas de autorización en el AST?',
  },
  {
    id: 2,
    category: 'Llenado del AST',
    text: '¿El formato AST se encuentra correctamente llenado? Se colocó la fecha, el trabajo a efectuar y su ubicación.',
  },
  {
    id: 3,
    category: 'Item EPP',
    text: '¿Todos los trabajadores involucrados cuentan con los equipos de protección personal requeridos para su labor, de acuerdo a lo descrito en el AST?',
  },
  {
    id: 4,
    category: 'Item EPC',
    text: '¿Se cuentan con las protecciones colectivas necesarias en campo de acuerdo a lo establecido en el AST?',
  },
  {
    id: 5,
    category: 'Item de Actividades Desarrolladas',
    text: '¿Se encuentran descritos los pasos de la tarea a realizar?',
  },
];

const QUESTIONS_012 = [
  {
    id: 6,
    category: 'Item de Identificación de Peligros',
    text: '¿Se identifica los peligros directamente relacionados con la actividad a realizar?',
  },
  {
    id: 7,
    category: 'Item de Evaluación de Riesgos',
    text: '¿De acuerdo a los peligros identificados se evaluan los riesgos relacionados a las actividad descrita y el personal entiende los riesgos asociados a su tarea?',
  },
  {
    id: 8,
    category: 'Item de Controles Operacionales',
    text: '¿El personal conoce y establece los controles asociados a cada paso de la tarea, según el orden jerárquico de controles (eliminar, reemplazar, control de ingeniería, control administrativo y EPP)? Verificar en campo su cumplimiento.',
  },
];

type TabType = 'evaluacion' | 'responsables';

export default function ASTEvaluationFormScreen() {
  const { getCurrentCompany } = useAuth();
  const { create: createAstEvaluation, update: updateAstEvaluation, getById: getAstEvaluationById, loading: saving } = useAstEvaluations();
  const params = useLocalSearchParams();
  const evaluationId = params.evaluationId as string | undefined;
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
  const [activeTab, setActiveTab] = useState<TabType>('evaluacion');
  const [razonSocial, setRazonSocial] = useState('');
  const [area, setArea] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('');
  const [answers01, setAnswers01] = useState<Record<number, 0 | 1>>({});
  const [answers012, setAnswers012] = useState<Record<number, 0 | 1 | 2>>({});
  const [recomendaciones, setRecomendaciones] = useState('');
  const [jefeGrupo, setJefeGrupo] = useState('');
  const [supervisorIngeniero, setSupervisorIngeniero] = useState('');
  const [vbSst, setVbSst] = useState('');
  const [supervisorNombre, setSupervisorNombre] = useState('');
  const [supervisorFirma, setSupervisorFirma] = useState('');
  const [evaluadorNombre, setEvaluadorNombre] = useState('');
  const [evaluadorFirma, setEvaluadorFirma] = useState('');

  // Cargar datos existentes si hay evaluationId
  useEffect(() => {
    if (evaluationId) {
      loadEvaluationData();
    }
  }, [evaluationId]);

  const loadEvaluationData = async () => {
    if (!evaluationId) return;
    try {
      setLoadingData(true);
      const evaluation = await getAstEvaluationById(evaluationId);
      
      // Poblar los campos con los datos cargados
      setRazonSocial(evaluation.razon_social || '');
      setArea(evaluation.area || '');
      setFecha(typeof evaluation.fecha === 'string' ? (evaluation.fecha?.split('T')[0] || new Date().toISOString().split('T')[0]) : (evaluation.fecha instanceof Date ? evaluation.fecha.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
      setDescripcionTrabajo(evaluation.descripcion_trabajo || '');
      setAnswers01(evaluation.answers_01 || {});
      setAnswers012(evaluation.answers_012 || {});
      setRecomendaciones(evaluation.recomendaciones || '');
      setJefeGrupo(evaluation.jefe_grupo || '');
      setSupervisorIngeniero(evaluation.supervisor_ingeniero || '');
      setVbSst(evaluation.vb_sst || '');
      setSupervisorNombre(evaluation.supervisor_nombre || '');
      setSupervisorFirma(evaluation.supervisor_firma || '');
      setEvaluadorNombre(evaluation.evaluador_nombre || '');
      setEvaluadorFirma(evaluation.evaluador_firma || '');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo cargar la evaluación');
      router.back();
    } finally {
      setLoadingData(false);
    }
  };

  const handleAnswer01 = (qId: number, value: 0 | 1) => {
    setAnswers01(prev => ({ ...prev, [qId]: value }));
  };

  const handleAnswer012 = (qId: number, value: 0 | 1 | 2) => {
    setAnswers012(prev => ({ ...prev, [qId]: value }));
  };

  const puntajeObtenido = useMemo(() => {
    const sum01 = QUESTIONS_01.reduce((s, q) => s + (answers01[q.id] ?? 0), 0);
    const sum012 = QUESTIONS_012.reduce((s, q) => s + (answers012[q.id] ?? 0), 0);
    return sum01 + sum012;
  }, [answers01, answers012]);

  const calificacion = useMemo(() => {
    if (puntajeObtenido > 8) return { label: 'Bueno', color: '#22c55e' };
    if (puntajeObtenido > 5) return { label: 'Regular', color: '#f59e0b' };
    return { label: 'Malo', color: '#ef4444' };
  }, [puntajeObtenido]);

  const hasFormData = () => {
    if (razonSocial.trim() || area.trim() || descripcionTrabajo.trim()) return true;
    if (Object.keys(answers01).length > 0 || Object.keys(answers012).length > 0) return true;
    if (recomendaciones.trim() || jefeGrupo.trim() || supervisorIngeniero.trim() || vbSst.trim()) return true;
    if (supervisorNombre.trim() || supervisorFirma.trim() || evaluadorNombre.trim() || evaluadorFirma.trim()) return true;
    return false;
  };

  const saveForm = async () => {
    if (!razonSocial.trim()) {
      Alert.alert('Campo requerido', 'La razón social es obligatoria.');
      return;
    }
    const company = getCurrentCompany();
    const payload = {
      razonSocial,
      area,
      fecha,
      descripcionTrabajo,
      answers01,
      answers012,
      puntajeObtenido,
      calificacion: calificacion.label,
      recomendaciones,
      jefeGrupo,
      supervisorIngeniero,
      vbSst,
      supervisorNombre,
      supervisorFirma,
      evaluadorNombre,
      evaluadorFirma,
      companyId: company?.id,
    };

    try {
      if (evaluationId) {
        // Modo edición: actualizar
        await updateAstEvaluation(evaluationId, payload);
        // Navegar de vuelta inmediatamente para que useFocusEffect recargue
        router.back();
      } else {
        // Modo creación: crear nueva
        await createAstEvaluation(payload);
        router.replace('/otros-types?saved=ast');
      }
      return true;
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo guardar la evaluación AST');
      return false;
    }
  };

  const handleGuardar = () => saveForm();

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
            if (evaluationId) {
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
      {/* Header - estructura Nueva Respuesta, colores AST */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={saving || loadingData}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{evaluationId ? 'Editar Respuesta' : 'Nueva Respuesta'}</Text>
          <Text style={styles.headerSubtitle}>Evaluación del Análisis de Seguridad del Trabajo</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkButton, saving && { opacity: 0.5 }]}
          onPress={handleGuardar}
          disabled={saving}
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
          <ActivityIndicator size="large" color="#06b6d4" />
          <Text style={styles.loadingText}>Cargando evaluación...</Text>
        </View>
      ) : (
        <>
      {/* Tabs - estilo Nueva Respuesta (subrayado) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'evaluacion' && styles.activeTab]}
          onPress={() => setActiveTab('evaluacion')}
        >
          <Text style={[styles.tabText, activeTab === 'evaluacion' && styles.activeTabText]}>
            Evaluación
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'responsables' && styles.activeTab]}
          onPress={() => setActiveTab('responsables')}
        >
          <Text style={[styles.tabText, activeTab === 'responsables' && styles.activeTabText]}>
            Responsables
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        {activeTab === 'evaluacion' && (
          <>
        {/* Datos generales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos generales</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Razón Social *</Text>
            <TextInput
              style={styles.input}
              value={razonSocial}
              onChangeText={setRazonSocial}
              placeholder="Razon Social"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Área</Text>
            <TextInput
              style={styles.input}
              value={area}
              onChangeText={setArea}
              placeholder="Área de trabajo"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Fecha</Text>
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
            <Text style={styles.label}>Descripción del trabajo</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descripcionTrabajo}
              onChangeText={setDescripcionTrabajo}
              placeholder="Describe el trabajo a evaluar"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Preguntas 1-5 (0/1) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluación (Preguntas 1-5)</Text>
          {QUESTIONS_01.map(q => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionCategory}>{q.category}</Text>
              <Text style={styles.questionText}>{q.id}. {q.text}</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[styles.optBtn, answers01[q.id] === 0 && styles.optBtnSelected]}
                  onPress={() => handleAnswer01(q.id, 0)}
                >
                  <Text style={[styles.optText, answers01[q.id] === 0 && styles.optTextSelected]}>0 - No Cumple</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optBtn, answers01[q.id] === 1 && styles.optBtnSelected]}
                  onPress={() => handleAnswer01(q.id, 1)}
                >
                  <Text style={[styles.optText, answers01[q.id] === 1 && styles.optTextSelected]}>1 - Si Cumple</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Preguntas 6-8 (0/1/2) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluación (Preguntas 6-8)</Text>
          {QUESTIONS_012.map(q => (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionCategory}>{q.category}</Text>
              <Text style={styles.questionText}>{q.id}. {q.text}</Text>
              <View style={[styles.optionsRow, styles.optionsRow3]}>
                <TouchableOpacity
                  style={[styles.optBtnSmall, answers012[q.id] === 0 && styles.optBtnSelected]}
                  onPress={() => handleAnswer012(q.id, 0)}
                >
                  <Text style={[styles.optTextSmall, answers012[q.id] === 0 && styles.optTextSelected]}>0</Text>
                  <Text style={styles.optSubtext}>No Cumple</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optBtnSmall, answers012[q.id] === 1 && styles.optBtnSelected]}
                  onPress={() => handleAnswer012(q.id, 1)}
                >
                  <Text style={[styles.optTextSmall, answers012[q.id] === 1 && styles.optTextSelected]}>1</Text>
                  <Text style={styles.optSubtext}>Parcial</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optBtnSmall, answers012[q.id] === 2 && styles.optBtnSelected]}
                  onPress={() => handleAnswer012(q.id, 2)}
                >
                  <Text style={[styles.optTextSmall, answers012[q.id] === 2 && styles.optTextSelected]}>2</Text>
                  <Text style={styles.optSubtext}>Total</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Suma y escala */}
        <View style={styles.section}>
          <View style={styles.poBox}>
            <Text style={styles.poLabel}>Suma del Puntaje Obtenido (PO)</Text>
            <View style={[styles.poValue, { borderColor: calificacion.color }]}>
              <Text style={[styles.poNumber, { color: calificacion.color }]}>{puntajeObtenido}</Text>
            </View>
          </View>
          <View style={styles.escalaBox}>
            <Text style={styles.escalaTitle}>Escala de Cumplimiento</Text>
            <Text style={styles.escalaItem}>Bueno: PO {'>'} 8</Text>
            <Text style={styles.escalaItem}>Regular: 5 {'<'} PO ≤ 8</Text>
            <Text style={styles.escalaItem}>Malo: PO ≤ 5</Text>
            <Text style={[styles.escalaActual, { color: calificacion.color }]}>Calificación: {calificacion.label}</Text>
          </View>
        </View>

        {/* Recomendaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recomendaciones</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={recomendaciones}
            onChangeText={setRecomendaciones}
            placeholder="Escribe las recomendaciones..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
          />
        </View>
          </>
        )}

        {/* Responsables Section - Estilo Equipo de Inspección */}
        {activeTab === 'responsables' && (
          <View style={styles.equipoSection}>
            <Text style={styles.equipoTitle}>Responsables y Firmas</Text>
            <Text style={styles.equipoSubtitle}>
              Complete los datos de los responsables del trabajo y las firmas de aprobación
            </Text>

            <Text style={styles.responsablesGroupTitle}>Responsables del trabajo</Text>
            <View style={styles.responsableCard}>
              <Text style={styles.responsableCardLabel}>Jefe de grupo</Text>
              <TextInput
                style={styles.teamInput}
                value={jefeGrupo}
                onChangeText={setJefeGrupo}
                placeholder="Ej: Juan Pérez García"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.responsableCard}>
              <Text style={styles.responsableCardLabel}>Supervisor/Ingeniero</Text>
              <TextInput
                style={styles.teamInput}
                value={supervisorIngeniero}
                onChangeText={setSupervisorIngeniero}
                placeholder="Ej: María López Sánchez"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.responsableCard}>
              <Text style={styles.responsableCardLabel}>V°B° SST</Text>
              <TextInput
                style={styles.teamInput}
                value={vbSst}
                onChangeText={setVbSst}
                placeholder="Ej: Carlos Ramírez"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Nota */}
            <View style={styles.notaBox}>
              <Text style={styles.notaText}>
                <Text style={styles.notaBold}>Nota:</Text> En caso que la evaluación salga con un PO ≤ 5, se deberá elaborar un nuevo AST in situ con las indicaciones del evaluador.
              </Text>
            </View>

            {/* Firmas - 2 cards estilo equipo */}
            <Text style={styles.responsablesGroupTitle}>Firmas de aprobación</Text>
            <View style={styles.teamMemberCard}>
              <View style={styles.teamMemberHeader}>
                <Text style={styles.teamMemberIndex}>Supervisor/Ingeniero de Campo</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre y Apellido</Text>
                <TextInput
                  style={styles.teamInput}
                  value={supervisorNombre}
                  onChangeText={setSupervisorNombre}
                  placeholder="Ej: Juan Pérez García"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Firma</Text>
                <TextInput
                  style={styles.teamInput}
                  value={supervisorFirma}
                  onChangeText={setSupervisorFirma}
                  placeholder="Nombre o referencia de firma"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
            <View style={styles.teamMemberCard}>
              <View style={styles.teamMemberHeader}>
                <Text style={styles.teamMemberIndex}>Evaluador del AST</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre y Apellido</Text>
                <TextInput
                  style={styles.teamInput}
                  value={evaluadorNombre}
                  onChangeText={setEvaluadorNombre}
                  placeholder="Ej: Carlos Ramírez Vega"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Firma</Text>
                <TextInput
                  style={styles.teamInput}
                  value={evaluadorFirma}
                  onChangeText={setEvaluadorFirma}
                  placeholder="Nombre o referencia de firma"
                  placeholderTextColor="#9ca3af"
                />
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
    backgroundColor: '#7dd3fc',
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
  headerSubtitle: { fontSize: 14, color: '#e0f2fe', marginTop: 2 },
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
  activeTab: { borderBottomColor: '#0ea5e9' },
  tabText: { fontSize: 16, fontWeight: '500', color: '#6b7280' },
  activeTabText: { color: '#0284c7', fontWeight: '600' },
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
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  questionCategory: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  questionText: { fontSize: 15, color: '#1f2937', lineHeight: 22, marginBottom: 12 },
  optionsRow: { flexDirection: 'row', gap: 12 },
  optionsRow3: { gap: 8 },
  optBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  optBtnSmall: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  optBtnSelected: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  optText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  optTextSmall: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  optSubtext: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  optTextSelected: { color: '#047857' },
  poBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  poLabel: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  poValue: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poNumber: { fontSize: 24, fontWeight: 'bold' },
  escalaBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  escalaTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  escalaItem: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  escalaActual: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  notaBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  notaBold: { fontWeight: '700' },
  notaText: { fontSize: 14, color: '#92400e', lineHeight: 22 },
  equipoSection: { padding: 20 },
  equipoTitle: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  equipoSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  responsablesGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  responsableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  responsableCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  teamMemberIndex: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  teamInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
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
