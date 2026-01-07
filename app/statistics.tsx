import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useClosedInspectionResponses } from '../hooks/useClosedInspectionResponses';
import { useOpenInspectionResponses } from '../hooks/useOpenInspectionResponses';
import { useClosedTemplateItems } from '../hooks/useClosedTemplateItems';
import { useOpenTemplateItems } from '../hooks/useOpenTemplateItems';
import { useClosedInspectionResponseItems } from '../hooks/useClosedInspectionResponseItems';
import { useOpenInspectionResponseItems } from '../hooks/useOpenInspectionResponseItems';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

type TimeFilter = 'week' | 'month' | 'year' | 'all';

interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Statistics {
  inProgress: number;
  completed: number;
  total: number;
  closedInProgress: number;
  closedCompleted: number;
  openInProgress: number;
  openCompleted: number;
}

interface ChartDataPoint {
  day: number;
  month: number;
  year: number;
  date: Date; // Fecha completa para ordenamiento
  isCompleted: boolean;
}

const services: Service[] = [
  { id: 'inspecciones', name: 'Inspecciones', icon: 'clipboard', color: '#3b82f6' },
  { id: 'observaciones', name: 'Observaciones', icon: 'eye', color: '#f59e0b' },
  { id: 'auditoria', name: 'Auditoría', icon: 'document-text', color: '#8b5cf6' },
  { id: 'linea-base', name: 'Línea de Base', icon: 'bar-chart', color: '#10b981' },
  { id: 'monitoreo', name: 'Monitoreo', icon: 'trending-up', color: '#ef4444' },
];

export default function StatisticsScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [selectedService, setSelectedService] = useState<Service>(services[0]);
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('month');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { getResponsesByInspectorId: getClosedResponses } = useClosedInspectionResponses();
  const { getResponsesByInspectorId: getOpenResponses } = useOpenInspectionResponses();
  const { countItemsByTemplateId: countClosedTemplateItems } = useClosedTemplateItems();
  const { countItemsByTemplateId: countOpenTemplateItems } = useOpenTemplateItems();
  const { countItemsByResponseId: countClosedResponseItems } = useClosedInspectionResponseItems();
  const { countItemsByResponseId: countOpenResponseItems } = useOpenInspectionResponseItems();

  const loadStatistics = async () => {
    if (!user?.id) return;

    // Solo cargar estadísticas para el servicio de Inspecciones
    if (selectedService.id !== 'inspecciones') {
      setStatistics(null);
      setChartData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [closedData, openData] = await Promise.all([
        getClosedResponses(user.id),
        getOpenResponses(user.id)
      ]);

      const closedResponses = closedData?.data?.responses || [];
      const openResponses = openData?.data?.responses || [];
      const allResponses = [...closedResponses, ...openResponses];

      // Filtrar por período
      const filteredResponses = filterByTimePeriod(allResponses, selectedFilter, user);

      // Helper para contar de forma segura
      const safeCount = async (fn: () => Promise<number>) => {
        try {
          return await fn();
        } catch (error: any) {
          console.error('Error counting items:', error?.message);
          return 0;
        }
      };

      // Calcular estadísticas usando la misma lógica que historial
      const stats: Statistics = {
        inProgress: 0,
        completed: 0,
        total: filteredResponses.length,
        closedInProgress: 0,
        closedCompleted: 0,
        openInProgress: 0,
        openCompleted: 0,
      };

      // Datos para el gráfico: cada inspección es un punto
      const chartPoints: ChartDataPoint[] = [];
      const now = new Date();

      // Procesar cada respuesta para determinar su estado
      await Promise.all(
        filteredResponses.map(async (response: any) => {
          // Determinar si es cerrada o abierta
          const isClosed = closedResponses.find((r: any) => r.id === response.id);
          
          // Usar la misma lógica que historial: comparar totalQuestions con answeredQuestions
          const totalQuestions = response.template_id
            ? await safeCount(() => 
                isClosed 
                  ? countClosedTemplateItems(response.template_id)
                  : countOpenTemplateItems(response.template_id)
              )
            : 0;
          
          const answeredQuestions = await safeCount(() =>
            isClosed
              ? countClosedResponseItems(response.id)
              : countOpenResponseItems(response.id)
          );

          // Una inspección está completada cuando todas las preguntas tienen respuesta
          const isCompleted = totalQuestions > 0 && totalQuestions === answeredQuestions;

          // Obtener el día del mes de created_at y agregar al gráfico
          const responseDate = new Date(response.created_at);
          chartPoints.push({
            day: responseDate.getDate(),
            month: responseDate.getMonth(),
            year: responseDate.getFullYear(),
            date: responseDate, // Guardar fecha completa para ordenamiento
            isCompleted: isCompleted,
          });

          if (isCompleted) {
            stats.completed++;
            if (isClosed) {
              stats.closedCompleted++;
            } else {
              stats.openCompleted++;
            }
          } else {
            stats.inProgress++;
            if (isClosed) {
              stats.closedInProgress++;
            } else {
              stats.openInProgress++;
            }
          }
        })
      );

      setStatistics(stats);
      // Ordenar datos del gráfico cronológicamente por fecha completa
      setChartData(chartPoints.sort((a, b) => a.date.getTime() - b.date.getTime()));
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByTimePeriod = (responses: any[], filter: TimeFilter, user: any) => {
    const now = new Date();
    let startDate: Date;

    switch (filter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        // Filtrar desde que se creó la cuenta (si tenemos esa info)
        // Por ahora, mostrar todas
        return responses;
      default:
        return responses;
    }

    // Si llegamos aquí, filter no es 'all', así que filtramos por fecha
    return responses.filter((response: any) => {
      const responseDate = new Date(response.created_at);
      return responseDate >= startDate;
    });
  };

  useEffect(() => {
    loadStatistics();
  }, [selectedFilter, selectedService.id, user?.id]);

  const getFilterLabel = (filter: TimeFilter) => {
    switch (filter) {
      case 'week':
        return 'Última Semana';
      case 'month':
        return 'Último Mes';
      case 'year':
        return 'Último Año';
      case 'all':
        return 'Desde el Inicio';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          <Text style={styles.headerSubtitle}>
            Resumen de tu actividad
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Selector */}
        <View style={styles.serviceContainer}>
          <Text style={styles.serviceLabel}>Servicio</Text>
          <View style={styles.serviceButtonsContainer}>
            {services.map((service) => {
              const isSelected = selectedService.id === service.id;
              return (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceButton,
                    isSelected && { backgroundColor: service.color, borderColor: service.color },
                  ]}
                  onPress={() => setSelectedService(service)}
                >
                  <Ionicons
                    name={service.icon as any}
                    size={18}
                    color={isSelected ? '#fff' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.serviceButtonText,
                      isSelected && styles.serviceButtonTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {service.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time Filters - Only show for Inspecciones */}
        {selectedService.id === 'inspecciones' && (
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Período</Text>
            <View style={styles.filterButtonsContainer}>
              {(['week', 'month', 'year', 'all'] as TimeFilter[]).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedFilter === filter && styles.filterTextActive,
                    ]}
                  >
                    {getFilterLabel(filter)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedService.id !== 'inspecciones' ? (
          <View style={styles.comingSoonContainer}>
            <IconSymbol name="chart.bar.fill" size={64} color="#9ca3af" />
            <Text style={styles.comingSoonTitle}>
              Estadísticas de {selectedService.name}
            </Text>
            <Text style={styles.comingSoonText}>
              Las estadísticas para este servicio estarán disponibles próximamente.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </View>
        ) : statistics ? (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, styles.primaryCard]}>
                <IconSymbol name="doc.text.fill" size={32} color="#fff" />
                <Text style={styles.summaryNumber}>{statistics.total}</Text>
                <Text style={styles.summaryLabel}>Total de Inspecciones</Text>
              </View>
            </View>

            {/* Status Cards */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusCard, { backgroundColor: '#fef3c7' }]}>
                <View style={styles.statusHeader}>
                  <IconSymbol name="clock.fill" size={24} color="#f59e0b" />
                  <Text style={[styles.statusTitle, { color: '#92400e' }]}>En Proceso</Text>
                </View>
                <Text style={[styles.statusNumber, { color: '#92400e' }]}>
                  {statistics.inProgress}
                </Text>
                <View style={styles.statusBreakdown}>
                  <Text style={styles.statusBreakdownText}>
                    Abiertas: {statistics.openInProgress}
                  </Text>
                  <Text style={styles.statusBreakdownText}>
                    Cerradas: {statistics.closedInProgress}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusCard, { backgroundColor: '#d1fae5' }]}>
                <View style={styles.statusHeader}>
                  <IconSymbol name="checkmark.circle.fill" size={24} color="#22c55e" />
                  <Text style={[styles.statusTitle, { color: '#166534' }]}>Completadas</Text>
                </View>
                <Text style={[styles.statusNumber, { color: '#166534' }]}>
                  {statistics.completed}
                </Text>
                <View style={styles.statusBreakdown}>
                  <Text style={styles.statusBreakdownText}>
                    Abiertas: {statistics.openCompleted}
                  </Text>
                  <Text style={styles.statusBreakdownText}>
                    Cerradas: {statistics.closedCompleted}
                  </Text>
                </View>
              </View>
            </View>

            {/* Detailed Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Desglose por Tipo</Text>
              
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <IconSymbol name="list.clipboard.fill" size={20} color="#3b82f6" />
                    <Text style={styles.breakdownLabel}>Inspecciones Abiertas</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownValue}>
                      {statistics.openInProgress + statistics.openCompleted}
                    </Text>
                    <Text style={styles.breakdownSubtext}>
                      {statistics.openInProgress} proceso, {statistics.openCompleted} completadas
                    </Text>
                  </View>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <IconSymbol name="document-text" size={20} color="#22c55e" />
                    <Text style={styles.breakdownLabel}>Checklist (Cerradas)</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownValue}>
                      {statistics.closedInProgress + statistics.closedCompleted}
                    </Text>
                    <Text style={styles.breakdownSubtext}>
                      {statistics.closedInProgress} proceso, {statistics.closedCompleted} completadas
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Completion Rate */}
            {statistics.total > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tasa de Finalización</Text>
                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>
                      {Math.round((statistics.completed / statistics.total) * 100)}% Completadas
                    </Text>
                    <Text style={styles.progressValue}>
                      {statistics.completed} / {statistics.total}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${(statistics.completed / statistics.total) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Gráfico de líneas (Line Graph) */}
            {chartData.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inspecciones por Día del Mes</Text>
                <View style={styles.chartContainer}>
                  <View style={styles.chartWrapper}>
                    {(() => {
                      // Agrupar inspecciones por fecha y contar completadas/en proceso
                      const countsByDay: { [key: string]: { completed: number; inProgress: number } } = {};
                      chartData.forEach(point => {
                        const key = `${point.year}-${point.month}-${point.day}`;
                        if (!countsByDay[key]) {
                          countsByDay[key] = { completed: 0, inProgress: 0 };
                        }
                        if (point.isCompleted) {
                          countsByDay[key].completed++;
                        } else {
                          countsByDay[key].inProgress++;
                        }
                      });
                      
                      // Ordenar cronológicamente por fecha completa (año, mes, día)
                      const sortedKeys = Object.keys(countsByDay).sort((a, b) => {
                        const [yearA, monthA, dayA] = a.split('-').map(Number);
                        const [yearB, monthB, dayB] = b.split('-').map(Number);
                        if (yearA !== yearB) return yearA - yearB;
                        if (monthA !== monthB) return monthA - monthB;
                        return dayA - dayB;
                      });
                      
                      // Calcular valores acumulativos
                      let cumulativeCompleted = 0;
                      let cumulativeInProgress = 0;
                      const accumulatedData = sortedKeys.map(key => {
                        cumulativeCompleted += countsByDay[key].completed;
                        cumulativeInProgress += countsByDay[key].inProgress;
                        return {
                          key,
                          completed: cumulativeCompleted,
                          inProgress: cumulativeInProgress,
                        };
                      });
                      
                      const maxValue = Math.max(
                        ...accumulatedData.map(d => Math.max(d.completed, d.inProgress)),
                        1
                      );
                      const maxCount = Math.max(maxValue, 5);
                      const step = Math.ceil(maxCount / 5);
                      const yValues = [];
                      for (let i = 0; i <= maxCount; i += step) {
                        yValues.push(i);
                      }
                      
                      const chartHeight = 180;
                      const chartWidth = width - 100;
                      const maxIndex = Math.max(sortedKeys.length - 1, 1);
                      const paddingLeft = 0;
                      const paddingRight = 0;
                      const paddingTop = 0;
                      const paddingBottom = 0;
                      const svgWidth = chartWidth;
                      const svgHeight = chartHeight;

                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                              // Generar path para línea de completadas (verde)
                              const completedPathData = accumulatedData.map((data, index) => {
                                const x = (index / maxIndex) * chartWidth;
                                const y = chartHeight - (data.completed / maxCount) * chartHeight;
                                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }).join(' ');

                              // Generar path para línea de en proceso (amarillo)
                              const inProgressPathData = accumulatedData.map((data, index) => {
                                const x = (index / maxIndex) * chartWidth;
                                const y = chartHeight - (data.inProgress / maxCount) * chartHeight;
                                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }).join(' ');

                      return (
                        <>
                          {/* Eje Y - Valores */}
                          <View style={styles.chartYAxis}>
                            {yValues.slice().reverse().map((value) => (
                              <Text key={value} style={styles.chartYLabel}>
                                {value}
                              </Text>
                            ))}
                          </View>
                          <View style={styles.chartAreaContainer}>
                            <View style={styles.chartArea}>
                              <Svg width={svgWidth} height={svgHeight} style={styles.chartSvg}>
                                {/* Líneas de referencia horizontales */}
                                {yValues.map((value) => {
                                  const y = chartHeight - (value / maxCount) * chartHeight;
                                  return (
                                    <Line
                                      key={`grid-${value}`}
                                      x1="0"
                                      y1={y}
                                      x2={chartWidth}
                                      y2={y}
                                      stroke="#f3f4f6"
                                      strokeWidth="1"
                                    />
                                  );
                                })}
                                
                                {/* Línea de completadas (verde) */}
                                <Path
                                  d={completedPathData}
                                  fill="none"
                                  stroke="#22c55e"
                                  strokeWidth="2.5"
                                />
                                
                                {/* Línea de en proceso (amarillo) */}
                                <Path
                                  d={inProgressPathData}
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="2.5"
                                />
                              </Svg>
                            </View>
                            
                            {/* Eje X - Mes y día (formato "Jan 1") - Debajo del gráfico */}
                            <View style={styles.chartXAxis}>
                              {(() => {
                                const step = Math.ceil(sortedKeys.length / 8);
                                return sortedKeys.filter((_, index) => index % step === 0).map((key) => {
                                  const originalIndex = sortedKeys.indexOf(key);
                                  const [year, month, day] = key.split('-').map(Number);
                                  // Calcular posición x, asegurándose de que no se salga del contenedor
                                  let xPosition = (originalIndex / maxIndex) * chartWidth;
                                  // Limitar xPosition para que las etiquetas no se salgan
                                  xPosition = Math.max(0, Math.min(xPosition, chartWidth - 30));
                                  return (
                                    <View key={key} style={[styles.chartXLabelContainer, { left: xPosition }]}>
                                      <Text style={styles.chartXLabel}>
                                        {monthNames[month]} {day}
                                      </Text>
                                    </View>
                                  );
                                });
                              })()}
                            </View>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                  {/* Leyenda */}
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotYellow]} />
                      <Text style={styles.legendText}>En Proceso</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotGreen]} />
                      <Text style={styles.legendText}>Completadas</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <IconSymbol name="chart.bar.fill" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No hay datos disponibles</Text>
          </View>
        )}
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
    backgroundColor: '#3b82f6',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#dbeafe',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryCard: {
    backgroundColor: '#3b82f6',
  },
  summaryNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#dbeafe',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBreakdown: {
    gap: 4,
  },
  statusBreakdownText: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  breakdownSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  serviceContainer: {
    marginBottom: 20,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    gap: 6,
    flex: 1,
    minWidth: '30%',
    justifyContent: 'center',
  },
  serviceButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  serviceButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 20,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chartYAxis: {
    width: 30,
    height: 200,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 8,
  },
  chartYLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
  },
  chartAreaContainer: {
    flex: 1,
    position: 'relative',
  },
  chartArea: {
    width: '100%',
    height: 180,
    position: 'relative',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  chartSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    marginTop: 12, // Increased space to prevent cutting
    position: 'relative',
    height: 35, // Increased height to accommodate rotated labels
    overflow: 'hidden', // Prevent labels from escaping
  },
  chartXLabelContainer: {
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
    alignItems: 'flex-start',
    width: 30,
    top: 5, // Add top offset to push labels down
  },
  chartXLabel: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'left',
    width: 40, // Fixed width to prevent overflow
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotYellow: {
    backgroundColor: '#f59e0b',
  },
  legendDotGreen: {
    backgroundColor: '#22c55e',
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

