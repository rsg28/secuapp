import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsers } from '../hooks/useUsers';

const STORAGE_KEY = 'generate_report_employee_selection';

export interface Employee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export type StoredEmployeeSelection = {
  ids: string[];
  namesById: Record<string, string>;
};

export async function loadReportEmployeeSelection(): Promise<StoredEmployeeSelection> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ids: [], namesById: {} };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { ids: parsed, namesById: {} };
    }
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
      namesById: parsed.namesById && typeof parsed.namesById === 'object' ? parsed.namesById : {},
    };
  } catch {
    return { ids: [], namesById: {} };
  }
}

export async function saveReportEmployeeSelection(selection: StoredEmployeeSelection) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

const PAGE_SIZE = 50;

export default function SelectReportEmployeesScreen() {
  const insets = useSafeAreaInsets();
  const { getNonManagerUsers } = useUsers();

  const [searchDraft, setSearchDraft] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [users, setUsers] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [pagesTotal, setPagesTotal] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [namesById, setNamesById] = useState<Record<string, string>>({});

  const loadSelection = useCallback(async () => {
    const sel = await loadReportEmployeeSelection();
    setSelectedIds(new Set(sel.ids));
    setNamesById(sel.namesById);
  }, []);

  const fetchPage = useCallback(
    async (pageNum: number, search: string, append: boolean) => {
      const isFirst = pageNum === 1 && !append;
      if (isFirst) setLoading(true);
      else setLoadingMore(true);
      try {
        const data = await getNonManagerUsers({
          page: pageNum,
          limit: PAGE_SIZE,
          search: search || undefined,
        });
        const list = (data?.data?.users || []) as Employee[];
        const pag = data?.data?.pagination;
        if (append) {
          setUsers((prev) => [...prev, ...list]);
        } else {
          setUsers(list);
        }
        setPage(pageNum);
        setPagesTotal(pag?.pages ?? 1);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'No se pudieron cargar los empleados');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [getNonManagerUsers]
  );

  useEffect(() => {
    (async () => {
      await loadSelection();
      await fetchPage(1, '', false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial única
  }, []);

  const handleSearchPress = useCallback(() => {
    Keyboard.dismiss();
    const term = searchDraft.trim();
    setActiveSearch(term);
    fetchPage(1, term, false);
  }, [searchDraft, fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore) return;
    if (page >= pagesTotal) return;
    fetchPage(page + 1, activeSearch, true);
  }, [loading, loadingMore, page, pagesTotal, activeSearch, fetchPage]);

  const toggleEmployee = (employee: Employee) => {
    const label = `${employee.first_name} ${employee.last_name}`.trim();
    setSelectedIds((prev) => {
      const wasSelected = prev.has(employee.id);
      const next = new Set(prev);
      if (wasSelected) {
        next.delete(employee.id);
      } else {
        next.add(employee.id);
      }
      setNamesById((prevNames) => {
        const n = { ...prevNames };
        if (wasSelected) {
          delete n[employee.id];
        } else {
          n[employee.id] = label;
        }
        return n;
      });
      return next;
    });
  };

  const selectAllOnPage = () => {
    const next = new Set(selectedIds);
    const nextNames = { ...namesById };
    users.forEach((u) => {
      const label = `${u.first_name} ${u.last_name}`.trim();
      next.add(u.id);
      nextNames[u.id] = label;
    });
    setSelectedIds(next);
    setNamesById(nextNames);
  };

  const deselectAllOnPage = () => {
    const next = new Set(selectedIds);
    users.forEach((u) => {
      next.delete(u.id);
    });
    setNamesById((prev) => {
      const n = { ...prev };
      users.forEach((u) => delete n[u.id]);
      return n;
    });
    setSelectedIds(next);
  };

  const allOnPageSelected =
    users.length > 0 && users.every((u) => selectedIds.has(u.id));

  const handleDone = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('Selección', 'Elige al menos un empleado o cancela con la flecha atrás.');
      return;
    }
    const ids = Array.from(selectedIds);
    const names: Record<string, string> = {};
    ids.forEach((id) => {
      if (namesById[id]) names[id] = namesById[id];
    });
    await saveReportEmployeeSelection({ ids, namesById: names });
    router.back();
  };

  const renderItem = ({ item }: { item: Employee }) => {
    const checked = selectedIds.has(item.id);
    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => toggleEmployee(item)}
        android_ripple={{ color: '#e0e7ff' }}
      >
        <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
          {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <View style={styles.rowText}>
          <Text style={styles.name}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderListHeader = () => (
    <View style={styles.headerBlock}>
      <View style={styles.panelCard}>
        <Text style={styles.panelKicker}>Buscar</Text>
        <View style={styles.searchCard}>
          <Ionicons name="search-outline" size={20} color="#64748b" style={styles.searchLeadingIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nombre o correo"
            placeholderTextColor="#94a3b8"
            value={searchDraft}
            onChangeText={setSearchDraft}
            onSubmitEditing={handleSearchPress}
            returnKeyType="search"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSearchPress}
            style={({ pressed }) => [styles.searchActionBtn, pressed && styles.searchActionBtnPressed]}
            hitSlop={12}
            accessibilityLabel="Buscar empleados"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.hint}>Toca la flecha para buscar (no automático al escribir).</Text>
      </View>
      {activeSearch ? (
        <View style={styles.activeFilterRow}>
          <Text style={styles.activeFilterLabel}>Filtro</Text>
          <Text style={styles.activeFilterText} numberOfLines={1}>
            “{activeSearch}”
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchDraft('');
              setActiveSearch('');
              Keyboard.dismiss();
              fetchPage(1, '', false);
            }}
            hitSlop={8}
          >
            <Text style={styles.clearFilter}>Quitar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {users.length > 0 ? (
        <View style={styles.toolbar}>
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>
              Página {page} de {pagesTotal}
            </Text>
          </View>
          <TouchableOpacity
            onPress={allOnPageSelected ? deselectAllOnPage : selectAllOnPage}
            style={styles.toolbarBtn}
            activeOpacity={0.75}
          >
            <Ionicons
              name={allOnPageSelected ? 'close-circle-outline' : 'checkbox-outline'}
              size={18}
              color="#2563eb"
              style={styles.pageActionIcon}
            />
            <Text style={styles.toolbarBtnText}>
              {allOnPageSelected ? 'Quitar todos en pantalla' : 'Seleccionar todos en pantalla'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Empleados</Text>
            <Text style={styles.headerSubtitle}>
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.doneButton} onPress={handleDone} hitSlop={8}>
            <Text style={styles.doneButtonText}>Listo</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          ItemSeparatorComponent={() => <View style={styles.rowSep} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerLoader} color="#2563eb" />
            ) : (
              <View style={styles.footerSpacer} />
            )
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyWrap}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.emptySub}>Cargando empleados…</Text>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptySub}>
                  Prueba otra búsqueda o quita el filtro.
                </Text>
              </View>
            )
          }
          contentContainerStyle={styles.listContent}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  flex: {
    flex: 1,
  },
  headerStatusFill: {
    backgroundColor: '#2563eb',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#dbeafe',
    marginTop: 2,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 16,
  },
  headerBlock: {
    paddingBottom: 4,
  },
  panelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  panelKicker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchLeadingIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#0f172a',
    minHeight: 46,
  },
  searchActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  searchActionBtnPressed: {
    opacity: 0.88,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 10,
    lineHeight: 17,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  activeFilterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    marginRight: 8,
  },
  activeFilterText: {
    flex: 1,
    fontSize: 13,
    color: '#1e3a8a',
  },
  clearFilter: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '700',
  },
  toolbar: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  toolbarBtnText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  pageActionIcon: {
    marginRight: 8,
  },
  pageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 28,
    flexGrow: 1,
  },
  rowSep: {
    height: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  rowPressed: {
    backgroundColor: '#f8fafc',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  email: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  footerLoader: {
    marginVertical: 20,
  },
  footerSpacer: {
    height: 8,
  },
});
