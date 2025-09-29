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

export default function ErgonomiaPosturalMonitoringScreen() {
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
    
    // Datos del monitoreo
    nombre: '',
    dni: '',
    edad: '',
    puesto: '',
    tiempoEnProyecto: '',
    actividad: '',
    experiencia: '',
    descripcionTareas: '',
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
    Alert.alert('Éxito', 'Registro de evaluación ergonómica postural guardado correctamente');
    router.back();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Evaluación Ergonómica Postural</Text>
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
              value="ERGONÓMICO"
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
                <Text style={styles.label}>Tiempo en Proyecto</Text>
                <TextInput
                  style={styles.input}
                  value={formData.tiempoEnProyecto}
                  onChangeText={(value) => updateFormData('tiempoEnProyecto', value)}
                  placeholder="Tiempo en el proyecto"
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
            <Text style={styles.subsectionTitle}>Evaluación de Tareas</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción de Tareas</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.descripcionTareas}
                onChangeText={(value) => updateFormData('descripcionTareas', value)}
                placeholder="Descripción detallada de las tareas realizadas"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Controles Existentes</Text>
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
    backgroundColor: '#10b981',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
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
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  controlButtonTextActive: {
    color: '#fff',
  },
});
