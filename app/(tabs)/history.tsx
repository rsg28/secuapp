import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HistoryItem {
  id: string;
  type: 'formulario' | 'foto' | 'incidente';
  title: string;
  area: string;
  date: string;
  status: 'completado' | 'pendiente' | 'reportado';
}

export default function HistoryScreen() {
  const historyData: HistoryItem[] = [
    {
      id: '1',
      type: 'formulario',
      title: 'Checklist de Seguridad - Área Producción',
      area: 'Producción',
      date: '2024-01-15 14:30',
      status: 'completado',
    },
    {
      id: '2',
      type: 'foto',
      title: 'Evidencia - Extintor Revisado',
      area: 'Almacén',
      date: '2024-01-15 13:45',
      status: 'completado',
    },
    {
      id: '3',
      type: 'incidente',
      title: 'Reporte - Salida de Emergencia Obstruida',
      area: 'Oficina',
      date: '2024-01-15 12:20',
      status: 'reportado',
    },
    {
      id: '4',
      type: 'formulario',
      title: 'Checklist de Seguridad - Laboratorio',
      area: 'Laboratorio',
      date: '2024-01-15 11:15',
      status: 'completado',
    },
    {
      id: '5',
      type: 'foto',
      title: 'Evidencia - Botiquín Completo',
      area: 'Producción',
      date: '2024-01-15 10:30',
      status: 'completado',
    },
    {
      id: '6',
      type: 'formulario',
      title: 'Checklist de Seguridad - Zona de Carga',
      area: 'Almacén',
      date: '2024-01-14 16:45',
      status: 'pendiente',
    },
    {
      id: '7',
      type: 'incidente',
      title: 'Reporte - Iluminación Deficiente',
      area: 'Zona de Carga',
      date: '2024-01-14 15:30',
      status: 'reportado',
    },
    {
      id: '8',
      type: 'foto',
      title: 'Evidencia - Señalización Actualizada',
      area: 'Oficina',
      date: '2024-01-14 14:20',
      status: 'completado',
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'formulario':
        return 'clipboard';
      case 'foto':
        return 'camera';
      case 'incidente':
        return 'warning';
      default:
        return 'document';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completado':
        return '#22c55e';
      case 'pendiente':
        return '#f59e0b';
      case 'reportado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completado':
        return 'Completado';
      case 'pendiente':
        return 'Pendiente';
      case 'reportado':
        return 'Reportado';
      default:
        return 'Desconocido';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'formulario':
        return 'Formulario';
      case 'foto':
        return 'Fotografía';
      case 'incidente':
        return 'Incidente';
      default:
        return 'Documento';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial de Actividades</Text>
        <Text style={styles.headerSubtitle}>
          Registro completo de todas las actividades
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
          <Text style={[styles.filterText, styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Formularios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Fotos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Incidentes</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
        {historyData.map((item) => (
          <TouchableOpacity key={item.id} style={styles.historyItem}>
            <View style={styles.historyItemHeader}>
              <View style={styles.historyItemLeft}>
                <View style={[styles.typeIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Ionicons 
                    name={getTypeIcon(item.type) as any} 
                    size={20} 
                    color={getStatusColor(item.status)} 
                  />
                </View>
                <View style={styles.historyItemContent}>
                  <Text style={styles.historyItemTitle}>{item.title}</Text>
                  <View style={styles.historyItemMeta}>
                    <Text style={styles.historyItemArea}>📍 {item.area}</Text>
                    <Text style={styles.historyItemDate}>🕐 {item.date}</Text>
                  </View>
                  <View style={styles.historyItemFooter}>
                    <View style={styles.typeTag}>
                      <Text style={styles.typeTagText}>{getTypeText(item.type)}</Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusTagText}>{getStatusText(item.status)}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </View>
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
    backgroundColor: '#7dd3fc',
    padding: 20,
    paddingTop: 60,
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
  },
  filterText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  historyContainer: {
    flex: 1,
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  historyItemMeta: {
    marginBottom: 8,
  },
  historyItemArea: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  historyItemDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeTagText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});