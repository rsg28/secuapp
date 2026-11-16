import { IconSymbol } from '@/components/ui/IconSymbol';
import PasstProgressSlide from '@/components/PasstProgressSlide';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  TextInput,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { useClosedInspectionResponses } from '../hooks/useClosedInspectionResponses';
import { useOpenInspectionResponses } from '../hooks/useOpenInspectionResponses';
import { useClosedTemplateItems } from '../hooks/useClosedTemplateItems';
import { useOpenTemplateItems } from '../hooks/useOpenTemplateItems';
import { useClosedInspectionResponseItems } from '../hooks/useClosedInspectionResponseItems';
import { useOpenInspectionResponseItems } from '../hooks/useOpenInspectionResponseItems';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GradientHeader from '@/components/ui/GradientHeader';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

type TimeFilter = 'week' | 'month' | 'year' | 'all';
type ViewMode = 'summary' | 'checklist-progress';

interface ChecklistProgressData {
  year: number;
  monthlyCounts: number[];
  companiesWithChecklist: number;
  totalCompanies: number;
  totalInspections: number;
  scope: 'organization' | 'personal';
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

export default function StatisticsScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('month');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressYear, setProgressYear] = useState(new Date().getFullYear());
  const [progressData, setProgressData] = useState<ChecklistProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [goal, setGoal] = useState<string>('');
  const [goalInitialized, setGoalInitialized] = useState(false);
  const [capturingSlide, setCapturingSlide] = useState(false);
  const passtSlideRef = useRef<View>(null);
  const { getResponsesByInspectorId: getClosedResponses } = useClosedInspectionResponses();
  const { getResponsesByInspectorId: getOpenResponses } = useOpenInspectionResponses();
  const { countItemsByTemplateId: countClosedTemplateItems } = useClosedTemplateItems();
  const { countItemsByTemplateId: countOpenTemplateItems } = useOpenTemplateItems();
  const { countItemsByResponseId: countClosedResponseItems } = useClosedInspectionResponseItems();
  const { countItemsByResponseId: countOpenResponseItems } = useOpenInspectionResponseItems();

  const loadChecklistProgress = async (year: number) => {
    try {
      setProgressLoading(true);
      setProgressError(null);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No autenticado');

      const response = await fetch(
        `${API_BASE_URL}/reports/checklist-progress?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al cargar avance');
      }

      const payload = data.data as ChecklistProgressData;
      setProgressData(payload);
      if (!goalInitialized) {
        setGoal(String(payload.totalCompanies || 0));
        setGoalInitialized(true);
      }
    } catch (error: any) {
      console.error('Error loading checklist progress:', error);
      setProgressError(error.message || 'Error al cargar avance');
      setProgressData(null);
    } finally {
      setProgressLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!user?.id) return;

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
    if (viewMode === 'summary') {
      loadStatistics();
    }
  }, [selectedFilter, user?.id, viewMode]);

  useEffect(() => {
    if (viewMode === 'checklist-progress') {
      loadChecklistProgress(progressYear);
    }
  }, [viewMode, progressYear, user?.id]);

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

  const goalNumber = Math.max(parseInt(goal, 10) || 0, 1);
  const progressPercent = progressData
    ? Math.round((progressData.companiesWithChecklist / goalNumber) * 1000) / 10
    : 0;
  const yearOptions = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  const handleDownloadPasstSlide = async () => {
    if (!progressData || !passtSlideRef.current) {
      Alert.alert('Aviso', 'Espera a que cargue el slide para descargarlo.');
      return;
    }
    try {
      setCapturingSlide(true);
      const uri = await captureRef(passtSlideRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Descargar avance',
      });
    } catch (error: any) {
      console.error('Checklist progress capture error:', error);
      Alert.alert(
        'No se pudo capturar',
        'La descarga de imagen necesita el APK preview. En Expo Go puede no funcionar.'
      );
    } finally {
      setCapturingSlide(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <GradientHeader style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          <Text style={styles.headerSubtitle}>
            {viewMode === 'summary' ? 'Tu actividad' : 'Avance de checklists'}
          </Text>
        </View>
      </GradientHeader>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, viewMode === 'summary' && styles.tabButtonActive]}
            onPress={() => setViewMode('summary')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, viewMode === 'summary' && styles.tabTextActive]}>
              Mi resumen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, viewMode === 'checklist-progress' && styles.tabButtonActive]}
            onPress={() => setViewMode('checklist-progress')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, viewMode === 'checklist-progress' && styles.tabTextActive]}>
              Avance
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'checklist-progress' ? (
          <View style={styles.passtSection}>
            <Text style={styles.pageSectionTitle}>Avance de checklists</Text>
            <Text style={styles.pageSectionDesc}>
              Cantidad por mes y cuántas empresas ya tienen al menos un checklist.
            </Text>

            <View style={styles.controlCard}>
              <View style={styles.passtControls}>
                <Text style={styles.passtYearLabel}>Año</Text>
                <View style={styles.passtYearButtons}>
                  {yearOptions.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.passtYearBtn, progressYear === y && styles.passtYearBtnActive]}
                      onPress={() => setProgressYear(y)}
                    >
                      <Text
                        style={[
                          styles.passtYearBtnText,
                          progressYear === y && styles.passtYearBtnTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {progressData?.scope === 'organization' ? (
                <>
                  <View style={styles.controlDivider} />
                  <View style={styles.passtGoalRow}>
                    <View style={styles.passtGoalTextCol}>
                      <Text style={styles.passtGoalLabel}>Meta</Text>
                      <Text style={styles.passtGoalHint}>Empresas objetivo del año</Text>
                    </View>
                    <TextInput
                      style={styles.passtGoalInput}
                      value={goal}
                      onChangeText={setGoal}
                      keyboardType="number-pad"
                      placeholder="30"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </>
              ) : null}
            </View>

            {progressLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1d4ed8" />
                <Text style={styles.loadingText}>Cargando avance...</Text>
              </View>
            ) : progressError ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
                <Text style={styles.emptyText}>{progressError}</Text>
              </View>
            ) : progressData ? (
              <>
                <PasstProgressSlide
                  ref={passtSlideRef}
                  year={progressData.year}
                  monthlyCounts={progressData.monthlyCounts}
                  totalInspections={progressData.totalInspections}
                  progressPercent={progressPercent}
                  numerator={progressData.companiesWithChecklist}
                  denominator={goalNumber}
                  scope={progressData.scope}
                  kpiLabel="Empresas"
                />

                <TouchableOpacity
                  style={[styles.downloadBtn, capturingSlide && styles.downloadBtnDisabled]}
                  onPress={handleDownloadPasstSlide}
                  disabled={capturingSlide}
                  activeOpacity={0.85}
                >
                  {capturingSlide ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="download-outline" size={20} color="#fff" />
                  )}
                  <Text style={styles.downloadBtnText}>
                    {capturingSlide ? 'Generando…' : 'Descargar imagen'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        ) : (
          <>
        <Text style={styles.pageSectionTitle}>Mis inspecciones</Text>
        <Text style={styles.pageSectionDesc}>
          Resumen de tu actividad en el período elegido.
        </Text>

        <View style={styles.controlCard}>
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </View>
        ) : statistics ? (
          <>
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, styles.primaryCard]}>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryNumber}>{statistics.total}</Text>
                <Text style={styles.summarySubLabel}>inspecciones en el período</Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              <View style={[styles.statusCard, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.statusTitle, { color: '#92400e' }]}>En proceso</Text>
                <Text style={[styles.statusNumber, { color: '#92400e' }]}>
                  {statistics.inProgress}
                </Text>
                <Text style={styles.statusBreakdownText}>
                  Abiertas {statistics.openInProgress} · Checklist {statistics.closedInProgress}
                </Text>
              </View>

              <View style={[styles.statusCard, { backgroundColor: '#d1fae5' }]}>
                <Text style={[styles.statusTitle, { color: '#166534' }]}>Completadas</Text>
                <Text style={[styles.statusNumber, { color: '#166534' }]}>
                  {statistics.completed}
                </Text>
                <Text style={styles.statusBreakdownText}>
                  Abiertas {statistics.openCompleted} · Checklist {statistics.closedCompleted}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Por tipo</Text>
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Abiertas</Text>
                  <Text style={styles.breakdownValue}>
                    {statistics.openInProgress + statistics.openCompleted}
                  </Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Checklist (cerradas)</Text>
                  <Text style={styles.breakdownValue}>
                    {statistics.closedInProgress + statistics.closedCompleted}
                  </Text>
                </View>
              </View>
            </View>

            {statistics.total > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Finalización</Text>
                <View style={styles.progressCard}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>
                      {Math.round((statistics.completed / statistics.total) * 100)}%
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

            {chartData.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Acumulado en el tiempo</Text>
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
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
    color: 'rgba(255,255,255,0.78)',
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
    fontSize: 44,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#dbeafe',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summarySubLabel: {
    fontSize: 13,
    color: '#bfdbfe',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 14,
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
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
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
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
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
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#1d4ed8',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
  },
  pageSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  pageSectionDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  controlCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  controlDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  passtSection: {
    marginBottom: 8,
  },
  passtControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passtYearLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  passtYearButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  passtYearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  passtYearBtnActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  passtYearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  passtYearBtnTextActive: {
    color: '#fff',
  },
  passtGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passtGoalTextCol: {
    flex: 1,
  },
  passtGoalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  passtGoalHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 15,
  },
  passtGoalInput: {
    minWidth: 64,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
  },
  downloadBtn: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadBtnDisabled: {
    opacity: 0.7,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

