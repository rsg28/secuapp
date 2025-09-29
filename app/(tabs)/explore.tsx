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

  const handleClosedInspections = () => {
    router.push('/closed-inspections');
  };

  const handleObservaciones = () => {
    // TODO: Implementar pantalla de observaciones
    console.log('Navegar a observaciones');
  };

  const handleAuditoria = () => {
    // TODO: Implementar pantalla de auditoría
    console.log('Navegar a auditoría');
  };

  const handleLineaBase = () => {
    // TODO: Implementar pantalla de línea de base
    console.log('Navegar a línea de base');
  };

  const handleMonitoreo = () => {
    router.push('/monitoring');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Servicios</Text>
          <Text style={styles.headerSubtitle}>
            Catálogo de servicios de seguridad y salud en el trabajo
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.cardCount}>8 inspecciones activas</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.openStatus]} />
              <Text style={styles.statusText}>Disponible</Text>
            </View>
            <Text style={styles.lastUpdate}>Última actualización: hace 2 horas</Text>
          </View>
        </TouchableOpacity>

        {/* Observaciones Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleObservaciones}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <IconSymbol name="eye.fill" size={32} color="#10b981" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Observaciones</Text>
              <Text style={styles.cardDescription}>
                Observaciones de comportamiento seguro en el trabajo
              </Text>
              <Text style={styles.cardCount}>12 observaciones este mes</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.observationsStatus]} />
              <Text style={styles.statusText}>Disponible</Text>
            </View>
            <Text style={styles.lastUpdate}>Última actualización: hace 1 día</Text>
          </View>
        </TouchableOpacity>

        {/* Auditoría Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleAuditoria}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="document-text" size={32} color="#8b5cf6" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Auditoría</Text>
              <Text style={styles.cardDescription}>
                Auditorías de cumplimiento de seguridad
              </Text>
              <Text style={styles.cardCount}>3 auditorías programadas</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.auditStatus]} />
              <Text style={styles.statusText}>Disponible</Text>
            </View>
            <Text style={styles.lastUpdate}>Última actualización: hace 3 días</Text>
          </View>
        </TouchableOpacity>

        {/* Línea de Base Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleLineaBase}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <IconSymbol name="chart.bar.fill" size={32} color="#f59e0b" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Línea de Base</Text>
              <Text style={styles.cardDescription}>
                Establecimiento de estándares de seguridad
              </Text>
              <Text style={styles.cardCount}>5 líneas de base activas</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.baselineStatus]} />
              <Text style={styles.statusText}>Disponible</Text>
            </View>
            <Text style={styles.lastUpdate}>Última actualización: hace 1 semana</Text>
          </View>
        </TouchableOpacity>

        {/* Monitoreo Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleMonitoreo}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="trending-up" size={32} color="#ef4444" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Monitoreo</Text>
              <Text style={styles.cardDescription}>
                Monitoreo continuo de indicadores de seguridad
              </Text>
              <Text style={styles.cardCount}>15 indicadores activos</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.monitoringStatus]} />
              <Text style={styles.statusText}>Disponible</Text>
            </View>
            <Text style={styles.lastUpdate}>Última actualización: hace 2 horas</Text>
          </View>
        </TouchableOpacity>

        {/* Espacio para el bottom tab */}
        <View style={styles.bottomSpacing} />
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
    justifyContent: 'space-between',
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
  },
  inspectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  cardCount: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  openStatus: {
    backgroundColor: '#3b82f6',
  },
  observationsStatus: {
    backgroundColor: '#10b981',
  },
  auditStatus: {
    backgroundColor: '#8b5cf6',
  },
  baselineStatus: {
    backgroundColor: '#f59e0b',
  },
  monitoringStatus: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  lastUpdate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  bottomSpacing: {
    height: 100,
  },
});