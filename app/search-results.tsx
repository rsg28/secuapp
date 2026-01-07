import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

interface SearchResult {
  id: string;
  title: string;
  inspection_date: string;
  completion_date: string | null;
  type: 'open' | 'closed';
  created_at: string;
  Area?: string;
  Turno?: string;
  Cantidad_de_Personal?: string;
}

export default function SearchResultsScreen() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{
    closed: SearchResult[];
    open: SearchResult[];
  }>({ closed: [], open: [] });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    performSearch();
  }, []);

  const performSearch = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Construir query string desde parámetros
      const searchParams = new URLSearchParams();
      if (params.id) searchParams.append('id', params.id as string);
      if (params.title) searchParams.append('title', params.title as string);
      if (params.inspectorName) searchParams.append('inspectorName', params.inspectorName as string);
      if (params.month) searchParams.append('month', params.month as string);
      if (params.year) searchParams.append('year', params.year as string);
      if (params.type && params.type !== 'both') searchParams.append('type', params.type as string);

      const response = await fetch(`${API_BASE_URL}/search/inspections?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Error al buscar inspecciones');
      }

      setResults(data.data.results || { closed: [], open: [] });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo realizar la búsqueda');
      setResults({ closed: [], open: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (result: SearchResult) => {
    try {
      setDownloadingId(result.id);
      const type = result.type;
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No se encontró el token de autenticación. Inicia sesión nuevamente.');
      }

      // Descargar directamente usando FileSystem (React Native compatible)
      const sanitizedTitle = (result.title || 'sin-titulo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `inspeccion-${sanitizedTitle}-${Date.now()}.xlsx`;
      
      // @ts-ignore - documentDirectory exists in expo-file-system
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Descargar directamente usando FileSystem
      const downloadResult = await FileSystem.downloadAsync(
        `${API_BASE_URL}/inspection-responses/download?responseId=${result.id}&type=${type}`,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Verificar que la descarga fue exitosa
      if (downloadResult.status !== 200) {
        throw new Error(`Error al descargar el archivo: ${downloadResult.status}`);
      }

      // Compartir archivo
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Descargar Inspección',
        });
        Alert.alert('Éxito', 'Archivo Excel generado y listo para compartir');
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
    } catch (error: any) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', `No se pudo generar el archivo: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const allResults = [...results.closed, ...results.open].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const totalResults = allResults.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Resultados de Búsqueda</Text>
          <Text style={styles.headerSubtitle}>
            {totalResults} {totalResults === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Buscando inspecciones...</Text>
        </View>
      ) : totalResults === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No se encontraron resultados</Text>
          <Text style={styles.emptySubtext}>
            Intenta con otros filtros de búsqueda
          </Text>
          <TouchableOpacity
            style={styles.backToSearchButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToSearchButtonText}>Volver a Búsqueda</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {allResults.map((item) => (
            <View key={item.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultTitleContainer}>
                  <Text style={styles.resultTitle} numberOfLines={2}>
                    {item.title || 'Sin título'}
                  </Text>
                  <View style={[
                    styles.typeBadge,
                    item.type === 'closed' ? styles.closedBadge : styles.openBadge
                  ]}>
                    <Text style={styles.typeBadgeText}>
                      {item.type === 'closed' ? 'Checklist' : 'Abierta'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.resultDetails}>
                <View style={styles.resultRow}>
                  <Ionicons name="key" size={16} color="#6b7280" />
                  <Text style={styles.resultText}>
                    ID: {item.id.slice(-8)}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Ionicons name="calendar" size={16} color="#6b7280" />
                  <Text style={styles.resultText}>
                    Fecha: {formatDate(item.inspection_date)}
                  </Text>
                </View>
                {item.Area && (
                  <View style={styles.resultRow}>
                    <Ionicons name="location" size={16} color="#6b7280" />
                    <Text style={styles.resultText}>Área: {item.Area}</Text>
                  </View>
                )}
                {item.Turno && (
                  <View style={styles.resultRow}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.resultText}>Turno: {item.Turno}</Text>
                  </View>
                )}
                {item.completion_date && (
                  <View style={styles.resultRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                    <Text style={[styles.resultText, styles.completedText]}>
                      Completada: {formatDate(item.completion_date)}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownload(item)}
                disabled={downloadingId === item.id}
              >
                {downloadingId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="download" size={20} color="#fff" />
                    <Text style={styles.downloadButtonText}>Descargar Excel</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  backToSearchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  resultTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  closedBadge: {
    backgroundColor: '#dbeafe',
  },
  openBadge: {
    backgroundColor: '#fef3c7',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  resultDetails: {
    gap: 8,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedText: {
    color: '#22c55e',
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

