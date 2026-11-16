import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { OfflineBanner } from '../components/OfflineBanner';
import { useAuth } from '../contexts/AuthContext';
import { useNetworkContext } from '../contexts/NetworkContext';
import {
  getCachedVisits,
  listVisits,
  sortVisits,
  todayISO,
  Visit,
  VISIT_STATUS_COLORS,
  VISIT_STATUS_LABELS,
} from '../services/visits';
import GradientHeader from '@/components/ui/GradientHeader';
import { colors, radius, shadows } from '@/constants/theme';

type Tab = 'agenda' | 'historial';

function dateParts(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return { weekday: '', day: date, month: '' };
  const value = new Date(y, m - 1, d);
  return {
    weekday: value.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
    day: String(d),
    month: value.toLocaleDateString('es-PE', { month: 'short' }).replace('.', ''),
  };
}

export default function VisitsScreen() {
  const { user, isManager } = useAuth();
  const { isOffline } = useNetworkContext();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('agenda');
  const [onlyMineChoice, setOnlyMineChoice] = useState<boolean | null>(null);
  const onlyMine = onlyMineChoice ?? !isManager;

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { visits: list } = await listVisits(user.id);
    setVisits(list);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getCachedVisits(user.id).then((cached) => {
          if (cached.length > 0) {
            setVisits(cached);
            setLoading(false);
          }
        });
      }
      load().finally(() => setLoading(false));
    }, [load, user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sections = useMemo(() => {
    const today = todayISO();
    const mine = onlyMine ? visits.filter((v) => v.inspector_id === user?.id) : visits;

    if (tab === 'historial') {
      const done = mine.filter((v) => v.status === 'completada' || v.status === 'cancelada');
      const sorted = sortVisits(done).reverse();
      return sorted.length ? [{ title: 'Visitas finalizadas', data: sorted }] : [];
    }

    const open = sortVisits(mine.filter((v) => v.status === 'programada' || v.status === 'en_curso'));
    const groups: { title: string; data: Visit[] }[] = [
      { title: 'En curso', data: open.filter((v) => v.status === 'en_curso') },
      { title: 'Atrasadas', data: open.filter((v) => v.status === 'programada' && v.scheduled_date < today) },
      { title: 'Hoy', data: open.filter((v) => v.status === 'programada' && v.scheduled_date === today) },
      { title: 'Próximas', data: open.filter((v) => v.status === 'programada' && v.scheduled_date > today) },
    ];
    return groups.filter((g) => g.data.length > 0);
  }, [visits, tab, onlyMine, user?.id]);

  const renderItem = ({ item }: { item: Visit }) => {
    const statusColors = VISIT_STATUS_COLORS[item.status] ?? VISIT_STATUS_COLORS.programada;
    const showInspector = isManager && item.inspector_id !== user?.id && item.inspector_name;
    const parts = dateParts(item.scheduled_date);
    const isToday = item.scheduled_date === todayISO();
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/visit-detail', params: { id: item.id } })}
        activeOpacity={0.8}
      >
        <View style={[styles.dateTile, isToday && styles.dateTileToday]}>
          <Text style={[styles.dateWeekday, isToday && styles.dateTextToday]}>{parts.weekday}</Text>
          <Text style={[styles.dateDay, isToday && styles.dateTextToday]}>{parts.day}</Text>
          <Text style={[styles.dateMonth, isToday && styles.dateTextToday]}>{parts.month}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardCompany} numberOfLines={1}>
            {item.company_name || 'Empresa'}
          </Text>
          <Text style={styles.cardPurpose} numberOfLines={2}>
            {item.purpose}
          </Text>
          {item.scheduled_time || showInspector ? (
            <View style={styles.metaRow}>
              {item.scheduled_time ? (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{item.scheduled_time}</Text>
                </View>
              ) : null}
              {showInspector ? (
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaText} numberOfLines={1}>{item.inspector_name}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.badgeText, { color: statusColors.fg }]}>{VISIT_STATUS_LABELS[item.status]}</Text>
            </View>
            {item._pending ? (
              <View style={[styles.badge, styles.pendingBadge]}>
                <Ionicons name="cloud-offline-outline" size={12} color="#b45309" />
                <Text style={[styles.badgeText, { color: '#b45309' }]}>Sin sincronizar</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Visitas</Text>
          <Text style={styles.headerSubtitle}>Agenda de supervisiones a centros de trabajo</Text>
        </View>
      </GradientHeader>
      {isOffline && <OfflineBanner />}

      <View style={styles.tabs}>
        {(['agenda', 'historial'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'agenda' ? 'Agenda' : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isManager ? (
        <TouchableOpacity style={styles.filterChip} onPress={() => setOnlyMineChoice(!onlyMine)}>
          <Ionicons name={onlyMine ? 'person' : 'people'} size={16} color={colors.primary} />
          <Text style={styles.filterChipText}>{onlyMine ? 'Mostrando solo mis visitas' : 'Mostrando todo el equipo'}</Text>
          <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {tab === 'agenda' ? 'No hay visitas pendientes.\nToca + para programar una.' : 'Aún no hay visitas finalizadas.'}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/visit-form')}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#e8ecf4',
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  tabText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  filterChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dateTile: {
    width: 56,
    paddingVertical: 8,
    marginRight: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
  },
  dateTileToday: {
    backgroundColor: colors.primary,
  },
  dateWeekday: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 26,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  dateTextToday: {
    color: '#fff',
  },
  cardBody: {
    flex: 1,
  },
  cardCompany: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardPurpose: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
});
