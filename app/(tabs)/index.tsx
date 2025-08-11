import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>¡Bienvenido, Supervisor!</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.profileIcon}>
          <IconSymbol name="person.circle.fill" size={40} color="#fff" />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.greenCard]}>
            <IconSymbol name="checkmark.shield.fill" size={24} color="#22c55e" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Áreas Seguras</Text>
          </View>
          <View style={[styles.statCard, styles.yellowCard]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.blueCard]}>
            <IconSymbol name="list.clipboard.fill" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Completado</Text>
          </View>
          <View style={[styles.statCard, styles.redCard]}>
            <IconSymbol name="xmark.shield.fill" size={24} color="#ef4444" />
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Críticos</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/explore')}
          >
            <IconSymbol name="checkmark.square.fill" size={24} color="#3b82f6" />
            <Text style={styles.actionText}>Nuevo Formulario</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol name="camera.fill" size={24} color="#10b981" />
            <Text style={styles.actionText}>Tomar Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#f59e0b" />
            <Text style={styles.actionText}>Reportar Incidente</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, styles.greenBackground]}>
              <IconSymbol name="checkmark" size={16} color="#fff" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Área de Almacén - Completado</Text>
              <Text style={styles.activityTime}>Hace 2 horas</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, styles.yellowBackground]}>
              <IconSymbol name="exclamationmark" size={16} color="#fff" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Oficina Principal - Pendiente</Text>
              <Text style={styles.activityTime}>Hace 4 horas</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, styles.blueBackground]}>
              <IconSymbol name="camera" size={16} color="#fff" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Foto de evidencia subida</Text>
              <Text style={styles.activityTime}>Ayer</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Areas to Review */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Áreas por Revisar</Text>
        <View style={styles.areasList}>
          <TouchableOpacity style={styles.areaItem}>
            <View style={styles.areaInfo}>
              <Text style={styles.areaName}>Área de Producción</Text>
              <Text style={styles.areaStatus}>Revisión pendiente</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.areaItem}>
            <View style={styles.areaInfo}>
              <Text style={styles.areaName}>Zona de Carga</Text>
              <Text style={styles.areaStatus}>Revisión vencida</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.areaItem}>
            <View style={styles.areaInfo}>
              <Text style={styles.areaName}>Laboratorio</Text>
              <Text style={styles.areaStatus}>Programada para hoy</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#e0f2fe',
    textTransform: 'capitalize',
  },
  profileIcon: {
    marginLeft: 16,
  },
  statsContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greenCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  yellowCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  blueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  redCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  greenBackground: {
    backgroundColor: '#22c55e',
  },
  yellowBackground: {
    backgroundColor: '#f59e0b',
  },
  blueBackground: {
    backgroundColor: '#3b82f6',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  areasList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  areaInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  areaStatus: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});