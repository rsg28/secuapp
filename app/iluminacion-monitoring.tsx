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

export default function IluminacionMonitoringScreen() {
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
    equipoSerie: '',
    
    // Datos del monitoreo - Tabla de mediciones (15 filas)
    mediciones: Array.from({ length: 15 }, () => ({
      numero: '',
      hora: '',
      sector: '',
      seccionPuesto: '',
      tipoIluminacion: '',
      nivelIluminacion: '',
      iluminacionPromedio: '',
      iluminacionRequerida: '',
    })),
    
    // Descripción del área
    descripcionArea: '',
    descripcionTareas: '',
    controlesExistentes: '',
    otrasCondiciones: '',
    
    // Responsables
    supervisorNombre: '',
    supervisorFirma: '',
    responsableNombre: '',
    responsableFirma: '',
  });

  const handleSave = () => {
    Alert.alert('Éxito', 'Registro de monitoreo de iluminación guardado correctamente');
    router.back();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <Text style={styles.headerTitle}>Monitoreo de Iluminación</Text>
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
              value="ILUMINACIÓN"
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
                <Text style={styles.label}>Modelo</Text>
                <TextInput
                  style={styles.input}
                  value={formData.equipoModelo}
                  onChangeText={(value) => updateFormData('equipoModelo', value)}
                  placeholder="Modelo del equipo"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>N° Serie</Text>
              <TextInput
                style={styles.input}
                value={formData.equipoSerie}
                onChangeText={(value) => updateFormData('equipoSerie', value)}
                placeholder="Número de serie"
              />
            </View>
          </View>
        </View>

        {/* Resultados del monitoreo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultados del Monitoreo</Text>
          
          {formData.mediciones.map((medicion, index) => (
            <View key={index} style={styles.medicionContainer}>
              <Text style={styles.medicionTitle}>Medición {index + 1}</Text>
              
              <View style={styles.row}>
                <View style={styles.quarterInput}>
                  <Text style={styles.label}>N°</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.numero}
                    onChangeText={(value) => updateMedicion(index, 'numero', value)}
                    placeholder="N°"
                  />
                </View>
                <View style={styles.quarterInput}>
                  <Text style={styles.label}>Hora</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.hora}
                    onChangeText={(value) => updateMedicion(index, 'hora', value)}
                    placeholder="HH:MM"
                  />
                </View>
                <View style={styles.quarterInput}>
                  <Text style={styles.label}>Sector</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.sector}
                    onChangeText={(value) => updateMedicion(index, 'sector', value)}
                    placeholder="Sector"
                  />
                </View>
                <View style={styles.quarterInput}>
                  <Text style={styles.label}>Sección/Puesto</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.seccionPuesto}
                    onChangeText={(value) => updateMedicion(index, 'seccionPuesto', value)}
                    placeholder="Sección/Puesto"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de Iluminación</Text>
                <TextInput
                  style={styles.input}
                  value={medicion.tipoIluminacion}
                  onChangeText={(value) => updateMedicion(index, 'tipoIluminacion', value)}
                  placeholder="Tipo de iluminación"
                />
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Nivel de Iluminación</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.nivelIluminacion}
                    onChangeText={(value) => updateMedicion(index, 'nivelIluminacion', value)}
                    placeholder="Nivel medido"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Iluminación Promedio (Luxes)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.iluminacionPromedio}
                    onChangeText={(value) => updateMedicion(index, 'iluminacionPromedio', value)}
                    placeholder="Luxes"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Iluminación Requerida (Luxes)</Text>
                <TextInput
                  style={styles.input}
                  value={medicion.iluminacionRequerida}
                  onChangeText={(value) => updateMedicion(index, 'iluminacionRequerida', value)}
                  placeholder="Luxes requeridos"
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Descripción del área */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción del Área</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción del Área</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcionArea}
              onChangeText={(value) => updateFormData('descripcionArea', value)}
              placeholder="Descripción detallada del área monitoreada"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción de Tareas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcionTareas}
              onChangeText={(value) => updateFormData('descripcionTareas', value)}
              placeholder="Descripción de las tareas realizadas"
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Otras Condiciones</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.otrasCondiciones}
              onChangeText={(value) => updateFormData('otrasCondiciones', value)}
              placeholder="Otras condiciones observadas"
              multiline
              numberOfLines={3}
            />
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
    backgroundColor: '#eab308',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#eab308',
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
});
