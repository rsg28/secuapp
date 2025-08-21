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



export default function InspeccionesScreen() {
  const handleOpenInspections = () => {
    router.push('/open-inspections');
  };

  const handleClosedInspections = () => {
    router.push('/closed-inspections');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inspecciones</Text>
          <Text style={styles.headerSubtitle}>
            Selecciona el tipo de inspección que deseas realizar
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Open Inspections Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleOpenInspections}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <IconSymbol name="list.clipboard.fill" size={32} color="#3b82f6" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Inspecciones Abiertas</Text>
              <Text style={styles.cardDescription}>
                Inspecciones en curso y pendientes de completar
              </Text>
              <Text style={styles.cardCount}>8 inspecciones activas</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.openStatus]} />
              <Text style={styles.statusText}>Abiertas</Text>
            </View>
            <Text style={styles.lastUpdate}>Última actualización: hace 2 horas</Text>
          </View>
        </TouchableOpacity>

        {/* Closed Inspections Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleClosedInspections}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <IconSymbol name="checkmark.circle.fill" size={32} color="#22c55e" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Inspecciones Cerradas</Text>
              <Text style={styles.cardDescription}>
                Gestión de templates y formularios de inspección
              </Text>
              <Text style={styles.cardCount}>15 templates disponibles</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, styles.closedStatus]} />
              <Text style={styles.statusText}>Cerradas</Text>
            </View>
            <Text style={styles.lastUpdate}>Última actualización: ayer</Text>
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
  closedStatus: {
    backgroundColor: '#22c55e',
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