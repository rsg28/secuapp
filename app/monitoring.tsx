import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function MonitoringScreen() {
  const router = useRouter();
  const { getCurrentCompany } = useAuth();

  const handleTemplatePress = (templateId: string) => {
    const company = getCurrentCompany();
    if (company) {
      if (templateId === 'sonometria-001') {
        router.push({
          pathname: '/sonometria-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else if (templateId === 'material-particulado-001') {
        router.push({
          pathname: '/material-particulado-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else if (templateId === 'ergonomia-postural-001') {
        router.push({
          pathname: '/ergonomia-postural-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else if (templateId === 'estres-termico-001') {
        router.push({
          pathname: '/estres-termico-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else if (templateId === 'polvo-respiratorio-001') {
        router.push({
          pathname: '/polvo-respiratorio-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else if (templateId === 'gases-toxicos-001') {
        router.push({
          pathname: '/gases-toxicos-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else if (templateId === 'iluminacion-001') {
        router.push({
          pathname: '/iluminacion-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else if (templateId === 'vibraciones-001') {
        router.push({
          pathname: '/vibraciones-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      } else if (templateId === 'dosimetria-ruido-001') {
        router.push({
          pathname: '/dosimetria-ruido-monitoring',
          params: {
            companyId: company.id,
            companyName: company.name
          }
        } as any);
      }
    } else {
      Alert.alert('Error', 'No hay empresa seleccionada');
    }
  };

  const monitoringTemplates = [
    {
      id: 'sonometria-001',
      title: 'Sonometría - Monitoreo de Ruido',
      description: 'Registro del monitoreo de agentes físicos, químicos, psicosociales y factores de riesgos disergonómicos - Ruido',
      icon: 'volume-high-outline' as keyof typeof Ionicons.glyphMap,
      color: '#ef4444',
      category: 'Agentes Físicos'
    },
    {
      id: 'material-particulado-001',
      title: 'Material Particulado - Lectura Directa',
      description: 'Ficha de medición de material particulado por lectura directa con fracciones respirable e inhalable',
      icon: 'cloud-outline' as keyof typeof Ionicons.glyphMap,
      color: '#f59e0b',
      category: 'Agentes Químicos'
    },
    {
      id: 'ergonomia-postural-001',
      title: 'Evaluación Ergonómica Postural',
      description: 'Registro del monitoreo de agentes físicos, químicos, psicosociales y factores de riesgos disergonómicos - Ergonómico',
      icon: 'body-outline' as keyof typeof Ionicons.glyphMap,
      color: '#10b981',
      category: 'Factores Disergonómicos'
    },
    {
      id: 'estres-termico-001',
      title: 'Estrés Térmico por Calor',
      description: 'Ficha de medición de estrés térmico por calor con monitoreo de temperatura, humedad y gasto metabólico',
      icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap,
      color: '#f97316',
      category: 'Agentes Físicos'
    },
    {
      id: 'polvo-respiratorio-001',
      title: 'Polvo Respiratorio e Inhalable',
      description: 'Registro del monitoreo de agentes físicos, químicos, psicosociales y factores de riesgos disergonómicos - Polvo',
      icon: 'partly-sunny-outline' as keyof typeof Ionicons.glyphMap,
      color: '#8b5cf6',
      category: 'Agentes Químicos'
    },
    {
      id: 'gases-toxicos-001',
      title: 'Gases Tóxicos e Inflamables',
      description: 'Registro del monitoreo de O2, gases inflamables y gases tóxicos con mediciones de SO2, CO, NO2, H2S, CO2',
      icon: 'flask-outline' as keyof typeof Ionicons.glyphMap,
      color: '#dc2626',
      category: 'Agentes Químicos'
    },
    {
      id: 'iluminacion-001',
      title: 'Monitoreo de Iluminación',
      description: 'Registro del monitoreo de iluminación con mediciones de niveles de luxes y evaluación de puestos de trabajo',
      icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap,
      color: '#eab308',
      category: 'Agentes Físicos'
    },
    {
      id: 'vibraciones-001',
      title: 'Monitoreo de Vibraciones',
      description: 'Registro del monitoreo de vibraciones con mediciones de aceleración en ejes X, Y, Z y evaluación de exposición',
      icon: 'pulse-outline' as keyof typeof Ionicons.glyphMap,
      color: '#059669',
      category: 'Agentes Físicos'
    },
    {
      id: 'dosimetria-ruido-001',
      title: 'Dosimetría de Ruido',
      description: 'Registro del monitoreo de ruido por dosimetría con mediciones de niveles mínimos, máximos, pico y equivalente',
      icon: 'headset-outline' as keyof typeof Ionicons.glyphMap,
      color: '#7c3aed',
      category: 'Agentes Físicos'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monitoreo</Text>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content}>
        {monitoringTemplates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => handleTemplatePress(template.id)}
          >
            <View style={styles.templateHeader}>
              <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
                <Ionicons name={template.icon} size={24} color="#fff" />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateCategory}>{template.category}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
            <Text style={styles.templateDescription}>{template.description}</Text>
          </TouchableOpacity>
        ))}
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
    marginBottom: 40,
    // aqui
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  templateCategory: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  templateDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '400',
  },
});
