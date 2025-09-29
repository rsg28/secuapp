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

export default function PolvoRespiratorioMonitoringScreen() {
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
    calibradorMarca: '',
    calibradorModelo: '',
    tipoCiclon: '',
    flujoPreMuestreo: '',
    flujoPostMuestreo: '',
    
    // Datos del trabajador
    nombre: '',
    edad: '',
    dni: '',
    puesto: '',
    jornadaTrabajo: '',
    tiempoProyecto: '',
    experiencia: '',
    actividad: '',
    
    // Datos del respirador
    tipoRespirador: {
      mediaCara: false,
      caraCompleta: false,
    },
    respiradorMarca: '',
    respiradorUso: {
      si: false,
      no: false,
    },
    estadoLimpieza: '',
    pruebasAjuste: '',
    ventilacion: '',
    filtroMarca: '',
    cartuchoMarca: '',
    codigoFiltro: '',
    
    // Datos del monitoreo - Tabla de mediciones
    mediciones: [
      { horaInicio: '', horaFin: '', tareasRealizadas: '', fuenteAgente: '', controlesExistentes: '' },
      { horaInicio: '', horaFin: '', tareasRealizadas: '', fuenteAgente: '', controlesExistentes: '' },
      { horaInicio: '', horaFin: '', tareasRealizadas: '', fuenteAgente: '', controlesExistentes: '' },
      { horaInicio: '', horaFin: '', tareasRealizadas: '', fuenteAgente: '', controlesExistentes: '' },
      { horaInicio: '', horaFin: '', tareasRealizadas: '', fuenteAgente: '', controlesExistentes: '' },
    ],
    
    // Controles existentes
    controlesExistentes: {
      ingenieria: false,
      administrativos: false,
      epp: false,
    },
    
    // Responsables
    supervisorNombre: '',
    supervisorFirma: '',
    responsableNombre: '',
    responsableFirma: '',
  });

  const handleSave = () => {
    Alert.alert('Éxito', 'Registro de polvo respiratorio e inhalable guardado correctamente');
    router.back();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateRespirador = (tipo: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      tipoRespirador: {
        ...prev.tipoRespirador,
        [tipo]: value
      }
    }));
  };

  const updateUso = (tipo: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      respiradorUso: {
        ...prev.respiradorUso,
        [tipo]: value
      }
    }));
  };

  const updateControles = (tipo: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      controlesExistentes: {
        ...prev.controlesExistentes,
        [tipo]: value
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Polvo Respiratorio e Inhalable</Text>
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
              value="POLVO RESPIRATORIO E INHALABLE"
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
                <Text style={styles.label}>Modelo/N° de Serie</Text>
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
            <Text style={styles.subsectionTitle}>Calibrador de Flujo</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Marca</Text>
                <TextInput
                  style={styles.input}
                  value={formData.calibradorMarca}
                  onChangeText={(value) => updateFormData('calibradorMarca', value)}
                  placeholder="Marca del calibrador"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Modelo/N° de Serie</Text>
                <TextInput
                  style={styles.input}
                  value={formData.calibradorModelo}
                  onChangeText={(value) => updateFormData('calibradorModelo', value)}
                  placeholder="Modelo/Serie"
                />
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Configuración del Equipo</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Ciclón (Si Aplica)</Text>
              <TextInput
                style={styles.input}
                value={formData.tipoCiclon}
                onChangeText={(value) => updateFormData('tipoCiclon', value)}
                placeholder="Tipo de ciclón"
              />
            </View>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Flujo Pre-Muestreo (L/min)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.flujoPreMuestreo}
                  onChangeText={(value) => updateFormData('flujoPreMuestreo', value)}
                  placeholder="L/min"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Flujo Post-Muestreo (L/min)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.flujoPostMuestreo}
                  onChangeText={(value) => updateFormData('flujoPostMuestreo', value)}
                  placeholder="L/min"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Datos del monitoreo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Monitoreo</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Información del Trabajador</Text>
            
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
                <Text style={styles.label}>Edad</Text>
                <TextInput
                  style={styles.input}
                  value={formData.edad}
                  onChangeText={(value) => updateFormData('edad', value)}
                  placeholder="Edad"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>DNI</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dni}
                  onChangeText={(value) => updateFormData('dni', value)}
                  placeholder="Número de DNI"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Puesto</Text>
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
                  value={formData.jornadaTrabajo}
                  onChangeText={(value) => updateFormData('jornadaTrabajo', value)}
                  placeholder="Jornada laboral"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Tiempo en Proyecto</Text>
                <TextInput
                  style={styles.input}
                  value={formData.tiempoProyecto}
                  onChangeText={(value) => updateFormData('tiempoProyecto', value)}
                  placeholder="Tiempo en el proyecto"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Experiencia</Text>
                <TextInput
                  style={styles.input}
                  value={formData.experiencia}
                  onChangeText={(value) => updateFormData('experiencia', value)}
                  placeholder="Años de experiencia"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Actividad</Text>
                <TextInput
                  style={styles.input}
                  value={formData.actividad}
                  onChangeText={(value) => updateFormData('actividad', value)}
                  placeholder="Actividad principal"
                />
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Información del Respirador</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Respirador</Text>
              <View style={styles.controlesContainer}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    formData.tipoRespirador.mediaCara && styles.controlButtonActive
                  ]}
                  onPress={() => updateRespirador('mediaCara', !formData.tipoRespirador.mediaCara)}
                >
                  <Text style={[
                    styles.controlButtonText,
                    formData.tipoRespirador.mediaCara && styles.controlButtonTextActive
                  ]}>
                    Media Cara
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    formData.tipoRespirador.caraCompleta && styles.controlButtonActive
                  ]}
                  onPress={() => updateRespirador('caraCompleta', !formData.tipoRespirador.caraCompleta)}
                >
                  <Text style={[
                    styles.controlButtonText,
                    formData.tipoRespirador.caraCompleta && styles.controlButtonTextActive
                  ]}>
                    Cara Completa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Respirador (Marca/Modelo)</Text>
              <TextInput
                style={styles.input}
                value={formData.respiradorMarca}
                onChangeText={(value) => updateFormData('respiradorMarca', value)}
                placeholder="Marca y modelo del respirador"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Uso del Respirador</Text>
              <View style={styles.controlesContainer}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    formData.respiradorUso.si && styles.controlButtonActive
                  ]}
                  onPress={() => updateUso('si', !formData.respiradorUso.si)}
                >
                  <Text style={[
                    styles.controlButtonText,
                    formData.respiradorUso.si && styles.controlButtonTextActive
                  ]}>
                    Sí
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    formData.respiradorUso.no && styles.controlButtonActive
                  ]}
                  onPress={() => updateUso('no', !formData.respiradorUso.no)}
                >
                  <Text style={[
                    styles.controlButtonText,
                    formData.respiradorUso.no && styles.controlButtonTextActive
                  ]}>
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Estado/Limpieza</Text>
                <TextInput
                  style={styles.input}
                  value={formData.estadoLimpieza}
                  onChangeText={(value) => updateFormData('estadoLimpieza', value)}
                  placeholder="Estado del respirador"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Pruebas de Ajuste (+/-)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pruebasAjuste}
                  onChangeText={(value) => updateFormData('pruebasAjuste', value)}
                  placeholder="Resultado de pruebas"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ventilación</Text>
              <TextInput
                style={styles.input}
                value={formData.ventilacion}
                onChangeText={(value) => updateFormData('ventilacion', value)}
                placeholder="Tipo de ventilación"
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Filtro (Marca/Modelo)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.filtroMarca}
                  onChangeText={(value) => updateFormData('filtroMarca', value)}
                  placeholder="Marca y modelo del filtro"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Cartucho (Marca/Modelo)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.cartuchoMarca}
                  onChangeText={(value) => updateFormData('cartuchoMarca', value)}
                  placeholder="Marca y modelo del cartucho"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código de Filtro</Text>
              <TextInput
                style={styles.input}
                value={formData.codigoFiltro}
                onChangeText={(value) => updateFormData('codigoFiltro', value)}
                placeholder="Código del filtro"
              />
            </View>
          </View>
        </View>

        {/* Datos del monitoreo - Tabla */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registro de Mediciones</Text>
          
          {formData.mediciones.map((medicion, index) => (
            <View key={index} style={styles.medicionContainer}>
              <Text style={styles.medicionTitle}>Medición {index + 1}</Text>
              
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Hora de Inicio</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.horaInicio}
                    onChangeText={(value) => updateMedicion(index, 'horaInicio', value)}
                    placeholder="HH:MM"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Hora de Fin</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.horaFin}
                    onChangeText={(value) => updateMedicion(index, 'horaFin', value)}
                    placeholder="HH:MM"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tareas Realizadas</Text>
                <TextInput
                  style={styles.input}
                  value={medicion.tareasRealizadas}
                  onChangeText={(value) => updateMedicion(index, 'tareasRealizadas', value)}
                  placeholder="Descripción de tareas"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fuente de Agente</Text>
                <TextInput
                  style={styles.input}
                  value={medicion.fuenteAgente}
                  onChangeText={(value) => updateMedicion(index, 'fuenteAgente', value)}
                  placeholder="Fuente del agente"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Controles Existentes</Text>
                <TextInput
                  style={styles.input}
                  value={medicion.controlesExistentes}
                  onChangeText={(value) => updateMedicion(index, 'controlesExistentes', value)}
                  placeholder="Controles implementados"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Controles existentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controles Existentes</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Controles</Text>
            <View style={styles.controlesContainer}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.ingenieria && styles.controlButtonActive
                ]}
                onPress={() => updateControles('ingenieria', !formData.controlesExistentes.ingenieria)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.ingenieria && styles.controlButtonTextActive
                ]}>
                  Ingeniería
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.administrativos && styles.controlButtonActive
                ]}
                onPress={() => updateControles('administrativos', !formData.controlesExistentes.administrativos)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.administrativos && styles.controlButtonTextActive
                ]}>
                  Administrativos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.epp && styles.controlButtonActive
                ]}
                onPress={() => updateControles('epp', !formData.controlesExistentes.epp)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.epp && styles.controlButtonTextActive
                ]}>
                  EPP
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Responsables del registro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsables del Registro</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Supervisor/Trabajador del Área Evaluada</Text>
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
    backgroundColor: '#8b5cf6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 12,
  },
  controlesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  controlButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  controlButtonTextActive: {
    color: '#fff',
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
});
