import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EstresTermicoMonitoringScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { companyId, companyName } = params;

  const [formData, setFormData] = useState({
    // Datos del empleador y del monitoreo
    razonSocial: '',
    areaMonitoreada: '',
    fechaMonitoreo: new Date().toISOString().split('T')[0],
    numTrabajadoresCentro: '',
    numTrabajadoresExpuestos: '',
    
    // Datos del equipo
    equipoMarca: '',
    equipoModelo: '',
    preVerificacion: {
      bh: '',
      bs: '',
      g: '',
      hr: '',
    },
    postVerificacion: {
      bh: '',
      bs: '',
      g: '',
      hr: '',
    },
    
    // Datos del trabajador
    nombre: '',
    dni: '',
    edad: '',
    puesto: '',
    jornada: '',
    estatura: '',
    tiempoProyecto: '',
    experiencia: '',
    peso: '',
    
    // Datos del monitoreo - Tabla de mediciones
    mediciones: [
      { actividad: '', altura: '', hora: '', tbs: '', tbh: '', tg: '', tgbhI: '', tgbhE: '', hr: '', viento: '' },
      { actividad: '', altura: '', hora: '', tbs: '', tbh: '', tg: '', tgbhI: '', tgbhE: '', hr: '', viento: '' },
      { actividad: '', altura: '', hora: '', tbs: '', tbh: '', tg: '', tgbhI: '', tgbhE: '', hr: '', viento: '' },
      { actividad: '', altura: '', hora: '', tbs: '', tbh: '', tg: '', tgbhI: '', tgbhE: '', hr: '', viento: '' },
      { actividad: '', altura: '', hora: '', tbs: '', tbh: '', tg: '', tgbhI: '', tgbhE: '', hr: '', viento: '' },
    ],
    
    // Gasto metabólico - Tabla de actividades
    actividades: [
      { actividad: '', tarea: '', tiempo: '', posicion: '', tipoTrabajo: '' },
      { actividad: '', tarea: '', tiempo: '', posicion: '', tipoTrabajo: '' },
      { actividad: '', tarea: '', tiempo: '', posicion: '', tipoTrabajo: '' },
      { actividad: '', tarea: '', tiempo: '', posicion: '', tipoTrabajo: '' },
      { actividad: '', tarea: '', tiempo: '', posicion: '', tipoTrabajo: '' },
    ],
    
    // Punto de monitoreo
    descripcionArea: '',
    controlesExistentes: '',
    puntoHidratacion: '',
    puntoSombra: '',
    cicloDescanso: '',
    
    // Responsables
    supervisorNombre: '',
    supervisorFirma: '',
    responsableNombre: '',
    responsableFirma: '',
  });

  const handleSave = () => {
    Alert.alert('Éxito', 'Registro de estrés térmico guardado correctamente');
    router.back();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateVerificacion = (tipo: 'preVerificacion' | 'postVerificacion', campo: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [campo]: value
      }
    }));
  };

  const updateMedicion = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      mediciones: prev.mediciones.map((medicion, i) => 
        i === index ? { ...medicion, [field]: value } : medicion
      )
    }));
  };

  const updateActividad = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      actividades: prev.actividades.map((actividad, i) => 
        i === index ? { ...actividad, [field]: value } : actividad
      )
    }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Estrés Térmico por Calor</Text>
          <Text style={styles.headerSubtitle}>{companyName}</Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Ionicons name="checkmark" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Datos del empleador y del monitoreo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Empleador y del Monitoreo</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Razón Social o Denominación Social</Text>
            <TextInput
              style={styles.input}
              value={formData.razonSocial}
              onChangeText={(value) => updateFormData('razonSocial', value)}
              placeholder="Ingrese la razón social"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Riesgo a ser Monitoreado</Text>
            <TextInput
              style={styles.input}
              value="ESTRÉS TÉRMICO"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Área Monitoreada</Text>
            <TextInput
              style={styles.input}
              value={formData.areaMonitoreada}
              onChangeText={(value) => updateFormData('areaMonitoreada', value)}
              placeholder="Ingrese el área monitoreada"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha de Monitoreo</Text>
            <TextInput
              style={styles.input}
              value={formData.fechaMonitoreo}
              onChangeText={(value) => updateFormData('fechaMonitoreo', value)}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>N° Trabajadores en el Centro Laboral</Text>
              <TextInput
                style={styles.input}
                value={formData.numTrabajadoresCentro}
                onChangeText={(value) => updateFormData('numTrabajadoresCentro', value)}
                placeholder="Número"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>N° Trabajadores Expuestos</Text>
              <TextInput
                style={styles.input}
                value={formData.numTrabajadoresExpuestos}
                onChangeText={(value) => updateFormData('numTrabajadoresExpuestos', value)}
                placeholder="Número"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Datos del equipo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Equipo</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Equipo de Medición</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Marca</Text>
                <TextInput
                  style={styles.input}
                  value={formData.equipoMarca}
                  onChangeText={(value) => updateFormData('equipoMarca', value)}
                  placeholder="Marca del equipo"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Modelo/Serie</Text>
                <TextInput
                  style={styles.input}
                  value={formData.equipoModelo}
                  onChangeText={(value) => updateFormData('equipoModelo', value)}
                  placeholder="Modelo/Serie"
                />
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Pre-Verificación</Text>
            <View style={styles.row}>
              <View style={styles.quarterInput}>
                <Text style={styles.label}>BH (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.preVerificacion.bh}
                  onChangeText={(value) => updateVerificacion('preVerificacion', 'bh', value)}
                  placeholder="°C"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.quarterInput}>
                <Text style={styles.label}>BS (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.preVerificacion.bs}
                  onChangeText={(value) => updateVerificacion('preVerificacion', 'bs', value)}
                  placeholder="°C"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.quarterInput}>
                <Text style={styles.label}>G (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.preVerificacion.g}
                  onChangeText={(value) => updateVerificacion('preVerificacion', 'g', value)}
                  placeholder="°C"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.quarterInput}>
                <Text style={styles.label}>HR (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.preVerificacion.hr}
                  onChangeText={(value) => updateVerificacion('preVerificacion', 'hr', value)}
                  placeholder="%"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Post-Verificación</Text>
            <View style={styles.row}>
              <View style={styles.quarterInput}>
                <Text style={styles.label}>BH (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postVerificacion.bh}
                  onChangeText={(value) => updateVerificacion('postVerificacion', 'bh', value)}
                  placeholder="°C"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.quarterInput}>
                <Text style={styles.label}>BS (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postVerificacion.bs}
                  onChangeText={(value) => updateVerificacion('postVerificacion', 'bs', value)}
                  placeholder="°C"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.quarterInput}>
                <Text style={styles.label}>G (°C)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postVerificacion.g}
                  onChangeText={(value) => updateVerificacion('postVerificacion', 'g', value)}
                  placeholder="°C"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.quarterInput}>
                <Text style={styles.label}>HR (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postVerificacion.hr}
                  onChangeText={(value) => updateVerificacion('postVerificacion', 'hr', value)}
                  placeholder="%"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Datos del trabajador */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Trabajador</Text>
          
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(value) => updateFormData('nombre', value)}
                placeholder="Nombre completo"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>DNI</Text>
              <TextInput
                style={styles.input}
                value={formData.dni}
                onChangeText={(value) => updateFormData('dni', value)}
                placeholder="Número de DNI"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Edad</Text>
              <TextInput
                style={styles.input}
                value={formData.edad}
                onChangeText={(value) => updateFormData('edad', value)}
                placeholder="Edad"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Puesto de Trabajo</Text>
              <TextInput
                style={styles.input}
                value={formData.puesto}
                onChangeText={(value) => updateFormData('puesto', value)}
                placeholder="Puesto de trabajo"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Jornada de Trabajo</Text>
              <TextInput
                style={styles.input}
                value={formData.jornada}
                onChangeText={(value) => updateFormData('jornada', value)}
                placeholder="Jornada laboral"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Estatura (m)</Text>
              <TextInput
                style={styles.input}
                value={formData.estatura}
                onChangeText={(value) => updateFormData('estatura', value)}
                placeholder="Estatura en metros"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Tiempo en el Proyecto</Text>
              <TextInput
                style={styles.input}
                value={formData.tiempoProyecto}
                onChangeText={(value) => updateFormData('tiempoProyecto', value)}
                placeholder="Tiempo en el proyecto"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Experiencia</Text>
              <TextInput
                style={styles.input}
                value={formData.experiencia}
                onChangeText={(value) => updateFormData('experiencia', value)}
                placeholder="Años de experiencia"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              value={formData.peso}
              onChangeText={(value) => updateFormData('peso', value)}
              placeholder="Peso en kilogramos"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Datos del monitoreo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Monitoreo</Text>
          
          {formData.mediciones.map((medicion, index) => (
            <View key={index} style={styles.medicionContainer}>
              <Text style={styles.medicionTitle}>Medición {index + 1}</Text>
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Actividad</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.actividad}
                    onChangeText={(value) => updateMedicion(index, 'actividad', value)}
                    placeholder="Actividad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Altura (a)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.altura}
                    onChangeText={(value) => updateMedicion(index, 'altura', value)}
                    placeholder="Altura"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Hora</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.hora}
                    onChangeText={(value) => updateMedicion(index, 'hora', value)}
                    placeholder="HH:MM"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>TBS (°C)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.tbs}
                    onChangeText={(value) => updateMedicion(index, 'tbs', value)}
                    placeholder="°C"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>TBH (°C)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.tbh}
                    onChangeText={(value) => updateMedicion(index, 'tbh', value)}
                    placeholder="°C"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>TG (°C)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.tg}
                    onChangeText={(value) => updateMedicion(index, 'tg', value)}
                    placeholder="°C"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>TGBH i (°C)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.tgbhI}
                    onChangeText={(value) => updateMedicion(index, 'tgbhI', value)}
                    placeholder="°C"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>TGBH e (°C)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.tgbhE}
                    onChangeText={(value) => updateMedicion(index, 'tgbhE', value)}
                    placeholder="°C"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>HR (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.hr}
                    onChangeText={(value) => updateMedicion(index, 'hr', value)}
                    placeholder="%"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>V. Viento (m/s²)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.viento}
                    onChangeText={(value) => updateMedicion(index, 'viento', value)}
                    placeholder="m/s²"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Gasto metabólico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gasto Metabólico</Text>
          
          {formData.actividades.map((actividad, index) => (
            <View key={index} style={styles.actividadContainer}>
              <Text style={styles.actividadTitle}>Actividad {index + 1}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Actividad</Text>
                <TextInput
                  style={styles.input}
                  value={actividad.actividad}
                  onChangeText={(value) => updateActividad(index, 'actividad', value)}
                  placeholder="Tipo de actividad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tarea</Text>
                <TextInput
                  style={styles.input}
                  value={actividad.tarea}
                  onChangeText={(value) => updateActividad(index, 'tarea', value)}
                  placeholder="Descripción de la tarea"
                />
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Tiempo (min)</Text>
                  <TextInput
                    style={styles.input}
                    value={actividad.tiempo}
                    onChangeText={(value) => updateActividad(index, 'tiempo', value)}
                    placeholder="Minutos"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Posición</Text>
                  <TextInput
                    style={styles.input}
                    value={actividad.posicion}
                    onChangeText={(value) => updateActividad(index, 'posicion', value)}
                    placeholder="Posición del cuerpo"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de Trabajo</Text>
                <TextInput
                  style={styles.input}
                  value={actividad.tipoTrabajo}
                  onChangeText={(value) => updateActividad(index, 'tipoTrabajo', value)}
                  placeholder="Parte del cuerpo utilizada"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Punto de monitoreo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Punto de Monitoreo</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción del Área</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcionArea}
              onChangeText={(value) => updateFormData('descripcionArea', value)}
              placeholder="Descripción detallada del área"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Controles Existentes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.controlesExistentes}
              onChangeText={(value) => updateFormData('controlesExistentes', value)}
              placeholder="Controles implementados"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Punto de Hidratación</Text>
              <TextInput
                style={styles.input}
                value={formData.puntoHidratacion}
                onChangeText={(value) => updateFormData('puntoHidratacion', value)}
                placeholder="Ubicación"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Punto de Sombra</Text>
              <TextInput
                style={styles.input}
                value={formData.puntoSombra}
                onChangeText={(value) => updateFormData('puntoSombra', value)}
                placeholder="Ubicación"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ciclo de Descanso (min)</Text>
            <TextInput
              style={styles.input}
              value={formData.cicloDescanso}
              onChangeText={(value) => updateFormData('cicloDescanso', value)}
              placeholder="Minutos de descanso"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Responsables del registro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsables del Registro</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Trabajador/Supervisor del Área Evaluada</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.supervisorNombre}
                onChangeText={(value) => updateFormData('supervisorNombre', value)}
                placeholder="Nombre completo"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma</Text>
              <TextInput
                style={styles.input}
                value={formData.supervisorFirma}
                onChangeText={(value) => updateFormData('supervisorFirma', value)}
                placeholder="Firma digital"
              />
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Responsable de Monitoreo</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={formData.responsableNombre}
                onChangeText={(value) => updateFormData('responsableNombre', value)}
                placeholder="Nombre completo"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma</Text>
              <TextInput
                style={styles.input}
                value={formData.responsableFirma}
                onChangeText={(value) => updateFormData('responsableFirma', value)}
                placeholder="Firma digital"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#f97316',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  subsection: {
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  subsectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 12,
  },
  quarterInput: {
    flex: 1,
    marginRight: 6,
  },
  medicionContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  medicionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  actividadContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actividadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
});
