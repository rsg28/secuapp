import SuccessToast from '@/components/SuccessToast';
import GradientHeader from '@/components/ui/GradientHeader';
import { colors, radius, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Href, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type IoniconName = keyof typeof Ionicons.glyphMap;

const SERVICES: { key: string; title: string; description: string; icon: IoniconName; color: string; bg: string; route: Href }[] = [
  {
    key: 'visits',
    title: 'Visitas',
    description: 'Agenda de supervisiones con registro de llegada, salida y firma',
    icon: 'calendar',
    color: colors.primary,
    bg: colors.primarySoft,
    route: '/visits',
  },
  {
    key: 'inspections',
    title: 'Inspecciones',
    description: 'Inspecciones de seguridad en áreas de trabajo',
    icon: 'clipboard',
    color: colors.teal,
    bg: colors.tealSoft,
    route: '/inspection-types',
  },
  {
    key: 'ast',
    title: 'AST',
    description: 'Evaluación del Análisis de Seguridad del Trabajo',
    icon: 'shield-checkmark',
    color: colors.success,
    bg: colors.successSoft,
    route: '/ast-evaluation-form',
  },
  {
    key: 'rals',
    title: 'RALS',
    description: 'Reporte de Actividades de Liderazgo de Seguridad',
    icon: 'people',
    color: colors.warning,
    bg: colors.warningSoft,
    route: '/rals-form',
  },
];

const COMING_SOON: { key: string; title: string; description: string; icon: IoniconName }[] = [
  { key: 'observations', title: 'Observaciones', description: 'Observaciones de comportamiento seguro en el trabajo', icon: 'eye-outline' },
  { key: 'audit', title: 'Auditoría', description: 'Auditorías de cumplimiento de seguridad', icon: 'document-text-outline' },
  { key: 'baseline', title: 'Línea de Base', description: 'Establecimiento de estándares de seguridad', icon: 'bar-chart-outline' },
  { key: 'monitoring', title: 'Monitoreo', description: 'Monitoreo continuo de indicadores de seguridad', icon: 'pulse-outline' },
];

export default function ServiciosScreen() {
  const params = useLocalSearchParams<{ saved?: string }>();
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (params.saved === 'ast' || params.saved === 'rals') {
      setShowSavedToast(true);
    }
  }, [params.saved]);

  const handleToastHide = useCallback(() => {
    setShowSavedToast(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement) {
          (document.activeElement as HTMLElement).blur();
        }
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <SuccessToast
        visible={showSavedToast}
        title="Respuesta guardada"
        message="La respuesta fue guardada correctamente"
        onHide={handleToastHide}
        duration={3500}
      />
      <GradientHeader>
        <Text style={styles.headerTitle}>Servicios</Text>
        <Text style={styles.headerSubtitle}>
          Catálogo de servicios de seguridad y salud en el trabajo
        </Text>
      </GradientHeader>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Disponibles</Text>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.key}
            style={styles.serviceCard}
            onPress={() => router.push(service.route)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconTile, { backgroundColor: service.bg }]}>
              <Ionicons name={service.icon} size={26} color={service.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardDescription}>{service.description}</Text>
            </View>
            <View style={styles.chevron}>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Próximamente</Text>
        <View style={styles.soonCard}>
          {COMING_SOON.map((item, index) => (
            <View
              key={item.key}
              style={[styles.soonRow, index > 0 && styles.soonDivider]}
              accessibilityLabel={`${item.title} próximamente`}
            >
              <View style={styles.soonIcon}>
                <Ionicons name={item.icon} size={20} color={colors.textMuted} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.soonTitle}>{item.title}</Text>
                <Text style={styles.soonDescription}>{item.description}</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>Pronto</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.onPrimaryMuted,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  soonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  soonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  soonDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  soonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  soonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  soonDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  soonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 8,
  },
  soonBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
