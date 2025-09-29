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

export default function GasesToxicosMonitoringScreen() {
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
    equipoSerie: '',
    calibracionCero: '',
    calibracionSpan: '',
    
    // Datos del monitoreo - Tabla de mediciones (15 filas)
    mediciones: Array.from({ length: 15 }, () => ({
      numero: '',
      hora: '',
      puntoMonitoreo: '',
      actividad: '',
      puestosTrabajo: '',
      o2: '',
      lel: '',
      so2: '',
      co: '',
      no2: '',
      h2s: '',
      co2: '',
    })),
    
    // Controles existentes
    controlesExistentes: {
      ingenieria: {
        extraccionLocalizada: false,
        ventilacionLocalizada: false,
        mangaInyeccion: false,
        ventilacionNatural: false,
      },
      administrativos: {
        rotacionPersonal: false,
        capacitacion: false,
        procedimiento: false,
      },
      epp: {
        mediaCara: false,
        caraCompleta: false,
        uso: false,
      },
    },
    
    // Datos del respirador
    respiradorMarca: '',
    estadoLimpieza: '',
    pruebasSellado: '',
    filtroMarca: '',
    cartuchoMarca: '',
    
    // Responsables
    supervisorNombre: '',
    supervisorFirma: '',
    responsableNombre: '',
    responsableFirma: '',
  });

  const handleSave = () => {
    Alert.alert('Éxito', 'Registro de gases tóxicos e inflamables guardado correctamente');
    router.back();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateControles = (categoria: string, tipo: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      controlesExistentes: {
        ...prev.controlesExistentes,
        [categoria]: {
          ...prev.controlesExistentes[categoria as keyof typeof prev.controlesExistentes],
          [tipo]: value
        }
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
          <Text style={styles.headerTitle}>Gases Tóxicos e Inflamables</Text>
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
              value="O2, GASES INFLAMABLES Y GASES TÓXICOS"
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

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Calibración</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Calibración Cero</Text>
                <TextInput
                  style={styles.input}
                  value={formData.calibracionCero}
                  onChangeText={(value) => updateFormData('calibracionCero', value)}
                  placeholder="Datos de calibración cero"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Calibración Span</Text>
                <TextInput
                  style={styles.input}
                  value={formData.calibracionSpan}
                  onChangeText={(value) => updateFormData('calibracionSpan', value)}
                  placeholder="Datos de calibración span"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Datos del monitoreo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Monitoreo</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Límites Máximos Permisibles</Text>
            <View style={styles.limitesContainer}>
              <Text style={styles.limiteText}>O2: Mayor a 19% - Menor a 22%</Text>
              <Text style={styles.limiteText}>LEL: 0%</Text>
              <Text style={styles.limiteText}>SO2: 0.25 ppm</Text>
              <Text style={styles.limiteText}>CO: 25 ppm</Text>
              <Text style={styles.limiteText}>NO2: 0.2 ppm</Text>
              <Text style={styles.limiteText}>H2S: 1 ppm</Text>
              <Text style={styles.limiteText}>CO2: 5000 ppm</Text>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Mediciones</Text>
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
                    <Text style={styles.label}>% O2</Text>
                    <TextInput
                      style={styles.input}
                      value={medicion.o2}
                      onChangeText={(value) => updateMedicion(index, 'o2', value)}
                      placeholder="%"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.quarterInput}>
                    <Text style={styles.label}>% LEL</Text>
                    <TextInput
                      style={styles.input}
                      value={medicion.lel}
                      onChangeText={(value) => updateMedicion(index, 'lel', value)}
                      placeholder="%"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.quarterInput}>
                    <Text style={styles.label}>SO2 (ppm)</Text>
                    <TextInput
                      style={styles.input}
                      value={medicion.so2}
                      onChangeText={(value) => updateMedicion(index, 'so2', value)}
                      placeholder="ppm"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.quarterInput}>
                    <Text style={styles.label}>CO (ppm)</Text>
                    <TextInput
                      style={styles.input}
                      value={medicion.co}
                      onChangeText={(value) => updateMedicion(index, 'co', value)}
                      placeholder="ppm"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.quarterInput}>
                    <Text style={styles.label}>NO2 (ppm)</Text>
                    <TextInput
                      style={styles.input}
                      value={medicion.no2}
                      onChangeText={(value) => updateMedicion(index, 'no2', value)}
                      placeholder="ppm"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.quarterInput}>
                    <Text style={styles.label}>H2S (ppm)</Text>
                    <TextInput
                      style={styles.input}
                      value={medicion.h2s}
                      onChangeText={(value) => updateMedicion(index, 'h2s', value)}
                      placeholder="ppm"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Punto de Monitoreo</Text>
                    <TextInput
                      style={styles.input}
                      value={medicion.puntoMonitoreo}
                      onChangeText={(value) => updateMedicion(index, 'puntoMonitoreo', value)}
                      placeholder="Descripción del punto"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Actividad</Text>
                    <TextInput
                      style={styles.input}
                      value={medicion.actividad}
                      onChangeText={(value) => updateMedicion(index, 'actividad', value)}
                      placeholder="Actividad realizada"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Puestos de Trabajo</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.puestosTrabajo}
                    onChangeText={(value) => updateMedicion(index, 'puestosTrabajo', value)}
                    placeholder="Puestos de trabajo"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CO2 (ppm)</Text>
                  <TextInput
                    style={styles.input}
                    value={medicion.co2}
                    onChangeText={(value) => updateMedicion(index, 'co2', value)}
                    placeholder="ppm"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Controles existentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controles Existentes</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Ingeniería</Text>
            <View style={styles.controlesContainer}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.ingenieria.extraccionLocalizada && styles.controlButtonActive
                ]}
                onPress={() => updateControles('ingenieria', 'extraccionLocalizada', !formData.controlesExistentes.ingenieria.extraccionLocalizada)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.ingenieria.extraccionLocalizada && styles.controlButtonTextActive
                ]}>
                  Extracción Localizada
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.ingenieria.ventilacionLocalizada && styles.controlButtonActive
                ]}
                onPress={() => updateControles('ingenieria', 'ventilacionLocalizada', !formData.controlesExistentes.ingenieria.ventilacionLocalizada)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.ingenieria.ventilacionLocalizada && styles.controlButtonTextActive
                ]}>
                  Ventilación Localizada
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.ingenieria.mangaInyeccion && styles.controlButtonActive
                ]}
                onPress={() => updateControles('ingenieria', 'mangaInyeccion', !formData.controlesExistentes.ingenieria.mangaInyeccion)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.ingenieria.mangaInyeccion && styles.controlButtonTextActive
                ]}>
                  Manga de Inyección
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.ingenieria.ventilacionNatural && styles.controlButtonActive
                ]}
                onPress={() => updateControles('ingenieria', 'ventilacionNatural', !formData.controlesExistentes.ingenieria.ventilacionNatural)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.ingenieria.ventilacionNatural && styles.controlButtonTextActive
                ]}>
                  Ventilación Natural
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Administrativos</Text>
            <View style={styles.controlesContainer}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.administrativos.rotacionPersonal && styles.controlButtonActive
                ]}
                onPress={() => updateControles('administrativos', 'rotacionPersonal', !formData.controlesExistentes.administrativos.rotacionPersonal)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.administrativos.rotacionPersonal && styles.controlButtonTextActive
                ]}>
                  Rotación de Personal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.administrativos.capacitacion && styles.controlButtonActive
                ]}
                onPress={() => updateControles('administrativos', 'capacitacion', !formData.controlesExistentes.administrativos.capacitacion)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.administrativos.capacitacion && styles.controlButtonTextActive
                ]}>
                  Capacitación
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.administrativos.procedimiento && styles.controlButtonActive
                ]}
                onPress={() => updateControles('administrativos', 'procedimiento', !formData.controlesExistentes.administrativos.procedimiento)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.administrativos.procedimiento && styles.controlButtonTextActive
                ]}>
                  Procedimiento
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>EPP</Text>
            <View style={styles.controlesContainer}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.epp.mediaCara && styles.controlButtonActive
                ]}
                onPress={() => updateControles('epp', 'mediaCara', !formData.controlesExistentes.epp.mediaCara)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.epp.mediaCara && styles.controlButtonTextActive
                ]}>
                  Media Cara
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.epp.caraCompleta && styles.controlButtonActive
                ]}
                onPress={() => updateControles('epp', 'caraCompleta', !formData.controlesExistentes.epp.caraCompleta)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.epp.caraCompleta && styles.controlButtonTextActive
                ]}>
                  Cara Completa
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  formData.controlesExistentes.epp.uso && styles.controlButtonActive
                ]}
                onPress={() => updateControles('epp', 'uso', !formData.controlesExistentes.epp.uso)}
              >
                <Text style={[
                  styles.controlButtonText,
                  formData.controlesExistentes.epp.uso && styles.controlButtonTextActive
                ]}>
                  Uso del Respirador
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Información del Respirador</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Respirador (Marca/Modelo)</Text>
              <TextInput
                style={styles.input}
                value={formData.respiradorMarca}
                onChangeText={(value) => updateFormData('respiradorMarca', value)}
                placeholder="Marca y modelo del respirador"
              />
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
                <Text style={styles.label}>Pruebas de Sellado (+/-)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pruebasSellado}
                  onChangeText={(value) => updateFormData('pruebasSellado', value)}
                  placeholder="Resultado de pruebas"
                />
              </View>
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
    backgroundColor: '#dc2626',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
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
  quarterInput: {
    flex: 1,
    marginRight: 6,
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
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
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
  limitesContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  limiteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
});
