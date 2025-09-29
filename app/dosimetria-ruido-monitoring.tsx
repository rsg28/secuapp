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

export default function DosimetriaRuidoMonitoringScreen() {
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
    microfonoMarca: '',
    microfonoModelo: '',
    calibradorMarca: '',
    calibradorModelo: '',
    nivelVerificacion: '',
    frecuenciaVerificacion: '',
    factorPreCal: '',
    factorPostCal: '',
    
    // Datos del monitoreo
    nombre: '',
    edad: '',
    dni: '',
    puesto: '',
    duracionJornada: '',
    tiempoProyecto: '',
    experiencia: '',
    
    // Protectores auditivos
    protectorAuditivo01: {
      tipo: '',
      marca: '',
      modelo: '',
      nrr: '',
    },
    protectorAuditivo02: {
      tipo: '',
      marca: '',
      modelo: '',
      nrr: '',
    },
    
    // Horarios y tareas
    horaInicio: '',
    horaFin: '',
    tareas: '',
    
    // Mediciones de ruido
    nivelMin: '',
    nivelMax: '',
    nivelPico: '',
    nivelEquivalente: '',
    lmp: '',
    
    // Fuentes de ruido
    fuentesRuido: '',
    
    // Controles existentes
    controlesExistentes: '',
    
    // Responsables
    supervisorNombre: '',
    supervisorFirma: '',
    responsableNombre: '',
    responsableFirma: '',
  });

  const handleSave = () => {
    Alert.alert('Éxito', 'Registro de dosimetría de ruido guardado correctamente');
    router.back();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateProtector = (protector: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [`protectorAuditivo${protector}`]: {
        ...prev[`protectorAuditivo${protector}` as keyof typeof prev] as any,
        [field]: value
      }
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
          <Text style={styles.headerTitle}>Dosimetría de Ruido</Text>
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
              value="RUIDO"
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
            <Text style={styles.subsectionTitle}>Micrófono (Si Aplica)</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Marca</Text>
                <TextInput
                  style={styles.input}
                  value={formData.microfonoMarca}
                  onChangeText={(value) => updateFormData('microfonoMarca', value)}
                  placeholder="Marca del micrófono"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Modelo/N° de Serie</Text>
                <TextInput
                  style={styles.input}
                  value={formData.microfonoModelo}
                  onChangeText={(value) => updateFormData('microfonoModelo', value)}
                  placeholder="Modelo/Serie"
                />
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Calibrador Acústico</Text>
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
            <Text style={styles.subsectionTitle}>Valores de Verificación de Campo</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Nivel (dB)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nivelVerificacion}
                  onChangeText={(value) => updateFormData('nivelVerificacion', value)}
                  placeholder="Nivel en dB"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Frecuencia (Hz)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.frecuenciaVerificacion}
                  onChangeText={(value) => updateFormData('frecuenciaVerificacion', value)}
                  placeholder="Frecuencia en Hz"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Factor Pre-Cal (dB)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.factorPreCal}
                  onChangeText={(value) => updateFormData('factorPreCal', value)}
                  placeholder="Factor pre-calibración"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Factor Post-Cal (dB)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.factorPostCal}
                  onChangeText={(value) => updateFormData('factorPostCal', value)}
                  placeholder="Factor post-calibración"
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
                <Text style={styles.label}>Duración de Jornada</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duracionJornada}
                  onChangeText={(value) => updateFormData('duracionJornada', value)}
                  placeholder="Duración de la jornada"
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Experiencia</Text>
              <TextInput
                style={styles.input}
                value={formData.experiencia}
                onChangeText={(value) => updateFormData('experiencia', value)}
                placeholder="Años de experiencia"
              />
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Protectores Auditivos</Text>
            
            <View style={styles.protectorContainer}>
              <Text style={styles.protectorTitle}>Protector Auditivo 01</Text>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Tipo</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.protectorAuditivo01.tipo}
                    onChangeText={(value) => updateProtector('01', 'tipo', value)}
                    placeholder="Tipo de protector"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Marca</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.protectorAuditivo01.marca}
                    onChangeText={(value) => updateProtector('01', 'marca', value)}
                    placeholder="Marca"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Modelo</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.protectorAuditivo01.modelo}
                    onChangeText={(value) => updateProtector('01', 'modelo', value)}
                    placeholder="Modelo"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>NRR</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.protectorAuditivo01.nrr}
                    onChangeText={(value) => updateProtector('01', 'nrr', value)}
                    placeholder="NRR"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.protectorContainer}>
              <Text style={styles.protectorTitle}>Protector Auditivo 02</Text>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Tipo</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.protectorAuditivo02.tipo}
                    onChangeText={(value) => updateProtector('02', 'tipo', value)}
                    placeholder="Tipo de protector"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Marca</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.protectorAuditivo02.marca}
                    onChangeText={(value) => updateProtector('02', 'marca', value)}
                    placeholder="Marca"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Modelo</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.protectorAuditivo02.modelo}
                    onChangeText={(value) => updateProtector('02', 'modelo', value)}
                    placeholder="Modelo"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>NRR</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.protectorAuditivo02.nrr}
                    onChangeText={(value) => updateProtector('02', 'nrr', value)}
                    placeholder="NRR"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Horarios y Tareas</Text>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Inicio</Text>
                <TextInput
                  style={styles.input}
                  value={formData.horaInicio}
                  onChangeText={(value) => updateFormData('horaInicio', value)}
                  placeholder="HH:MM"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Fin</Text>
                <TextInput
                  style={styles.input}
                  value={formData.horaFin}
                  onChangeText={(value) => updateFormData('horaFin', value)}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tarea(s)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.tareas}
                onChangeText={(value) => updateFormData('tareas', value)}
                placeholder="Descripción de tareas realizadas"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Mediciones de Ruido</Text>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Nivel Mín. (dBA)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nivelMin}
                  onChangeText={(value) => updateFormData('nivelMin', value)}
                  placeholder="dB"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Nivel Máx. (dBA)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nivelMax}
                  onChangeText={(value) => updateFormData('nivelMax', value)}
                  placeholder="dB"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Nivel Pico (dBC)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nivelPico}
                  onChangeText={(value) => updateFormData('nivelPico', value)}
                  placeholder="dB"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Nivel Equivalente (dBA)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nivelEquivalente}
                  onChangeText={(value) => updateFormData('nivelEquivalente', value)}
                  placeholder="dB"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LMP (dBA)</Text>
              <TextInput
                style={styles.input}
                value={formData.lmp}
                onChangeText={(value) => updateFormData('lmp', value)}
                placeholder="Límite máximo permisible"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Fuentes de Ruido</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fuentes de Ruido</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.fuentesRuido}
                onChangeText={(value) => updateFormData('fuentesRuido', value)}
                placeholder="Descripción de fuentes de ruido"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Controles Existentes</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Controles Existentes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.controlesExistentes}
                onChangeText={(value) => updateFormData('controlesExistentes', value)}
                placeholder="Descripción de controles implementados"
                multiline
                numberOfLines={4}
              />
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
    backgroundColor: '#7c3aed',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c3aed',
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
  protectorContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  protectorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
});
