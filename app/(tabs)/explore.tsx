import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';



export default function ServiciosScreen() {
  const handleOpenInspections = () => {
    router.push('/inspection-types');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Servicios</Text>
          <Text style={styles.headerSubtitle}>
            Catálogo de servicios de seguridad y salud en el trabajo
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Inspecciones Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleOpenInspections}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <IconSymbol name="list.clipboard.fill" size={32} color="#3b82f6" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Inspecciones</Text>
              <Text style={styles.cardDescription}>
                Inspecciones de seguridad en áreas de trabajo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Observaciones Card */}
        <View style={[styles.inspectionCard, styles.disabledCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <IconSymbol name="eye.fill" size={32} color="#9ca3af" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Observaciones</Text>
              <Text style={styles.cardDescription}>
                Observaciones de comportamiento seguro en el trabajo
              </Text>
              <Text style={styles.cardWorking}>Trabajando en ello</Text>
            </View>
            <Ionicons name="construct" size={24} color="#9ca3af" />
          </View>
        </View>

        {/* Auditoría Card */}
        <View style={[styles.inspectionCard, styles.disabledCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="document-text" size={32} color="#9ca3af" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Auditoría</Text>
              <Text style={styles.cardDescription}>
                Auditorías de cumplimiento de seguridad
              </Text>
              <Text style={styles.cardWorking}>Trabajando en ello</Text>
            </View>
            <Ionicons name="construct" size={24} color="#9ca3af" />
          </View>
        </View>

        {/* Línea de Base Card */}
        <View style={[styles.inspectionCard, styles.disabledCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <IconSymbol name="chart.bar.fill" size={32} color="#9ca3af" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Línea de Base</Text>
              <Text style={styles.cardDescription}>
                Establecimiento de estándares de seguridad
              </Text>
              <Text style={styles.cardWorking}>Trabajando en ello</Text>
            </View>
            <Ionicons name="construct" size={24} color="#9ca3af" />
          </View>
        </View>

        {/* Monitoreo Card */}
        <View style={[styles.inspectionCard, styles.disabledCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="trending-up" size={32} color="#9ca3af" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Monitoreo</Text>
              <Text style={styles.cardDescription}>
                Monitoreo continuo de indicadores de seguridad
              </Text>
              <Text style={styles.cardWorking}>Trabajando en ello</Text>
            </View>
            <Ionicons name="construct" size={24} color="#9ca3af" />
          </View>
        </View>

        {/* Espacio para el bottom tab */}
        <View style={{ height: 40 }} />
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
    backgroundColor: '#7dd3fc',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  inspectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledCard: {
    backgroundColor: '#f9fafb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardWorking: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 100,
  },
});