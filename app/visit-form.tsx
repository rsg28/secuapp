import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimeField } from '../components/DateTimeField';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import {
  getVisit,
  newVisitId,
  saveVisit,
  todayISO,
  VisitDisplayFields,
  VisitPatch,
} from '../services/visits';
import { offlineCache } from '../utils/offlineCache';
import { getIsOffline } from '../utils/networkStore';
import GradientHeader from '@/components/ui/GradientHeader';

const PURPOSES = [
  'Supervisión de condiciones de trabajo',
  'Seguimiento de recomendaciones',
  'Monitoreo de agentes ocupacionales',
  'Evaluación médica ocupacional',
  'Capacitación',
];
const OTHER = 'Otro';

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

function PickerModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Option[];
  onSelect: (option: Option) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color="#374151" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar..."
          placeholderTextColor="#9ca3af"
        />
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                onSelect(item);
                setQuery('');
              }}
            >
              <Text style={styles.pickerItemText}>{item.label}</Text>
              {item.sublabel ? <Text style={styles.pickerItemSub}>{item.sublabel}</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.pickerEmpty}>Sin resultados</Text>}
        />
      </SafeAreaView>
    </Modal>
  );
}

export default function VisitFormScreen() {
  const { user, isManager, userCompanies } = useAuth();
  const { getAllUsers } = useUsers();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id;

  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(todayISO());
  const [time, setTime] = useState<string | null>(null);
  const [purposeChoice, setPurposeChoice] = useState<string>(PURPOSES[0]);
  const [purposeOther, setPurposeOther] = useState('');
  const [notes, setNotes] = useState('');
  const [inspectorId, setInspectorId] = useState<string | null>(user?.id ?? null);
  const [team, setTeam] = useState<Option[]>([]);
  const [picker, setPicker] = useState<'company' | 'inspector' | null>(null);

  const companyOptions: Option[] = useMemo(
    () =>
      (userCompanies || []).map((c: any) => ({
        id: c.id,
        label: c.name,
        sublabel: c.address || c.industry || undefined,
      })),
    [userCompanies]
  );
  const selectedCompany = (userCompanies || []).find((c: any) => c.id === companyId);
  const selectedInspector = team.find((u) => u.id === inspectorId);

  useEffect(() => {
    if (!isManager) return;
    const CACHE_KEY = 'visit-assignable-users';
    const toOptions = (users: any[]): Option[] =>
      users
        .filter((u) => u.is_active !== 0)
        .map((u) => ({
          id: u.id,
          label: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email,
          sublabel: u.id === user?.id ? 'Yo' : u.email,
        }));

    (async () => {
      const cached = await offlineCache.get<any[]>(CACHE_KEY);
      if (cached) setTeam(toOptions(cached));
      if (getIsOffline()) return;
      try {
        const res = await getAllUsers({ page: 1, limit: 200 });
        const users = res?.data?.users ?? [];
        await offlineCache.set(CACHE_KEY, users);
        setTeam(toOptions(users));
      } catch {}
    })();
  }, [isManager, getAllUsers, user?.id]);

  useEffect(() => {
    if (!editingId || !user?.id) return;
    getVisit(user.id, editingId)
      .then((visit) => {
        if (!visit) {
          Alert.alert('Error', 'No se encontró la visita');
          router.back();
          return;
        }
        setCompanyId(visit.company_id);
        setDate(visit.scheduled_date);
        setTime(visit.scheduled_time);
        if (PURPOSES.includes(visit.purpose)) {
          setPurposeChoice(visit.purpose);
        } else {
          setPurposeChoice(OTHER);
          setPurposeOther(visit.purpose);
        }
        setNotes(visit.notes ?? '');
        setInspectorId(visit.inspector_id);
      })
      .finally(() => setLoading(false));
  }, [editingId, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    const purpose = purposeChoice === OTHER ? purposeOther.trim() : purposeChoice;
    if (!companyId) {
      Alert.alert('Campo requerido', 'Selecciona la empresa o centro de trabajo.');
      return;
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Campo requerido', 'Selecciona la fecha de la visita (AAAA-MM-DD).');
      return;
    }
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      Alert.alert('Hora inválida', 'Usa el formato HH:MM, por ejemplo 09:30.');
      return;
    }
    if (!purpose) {
      Alert.alert('Campo requerido', 'Escribe el motivo de la visita.');
      return;
    }

    const patch: VisitPatch = {
      company_id: companyId,
      scheduled_date: date,
      scheduled_time: time,
      purpose,
      notes: notes.trim() || null,
    };
    if (!editingId) patch.status = 'programada';
    if (isManager && inspectorId) patch.inspector_id = inspectorId;
    if (!editingId && !patch.inspector_id) patch.inspector_id = user.id;

    const display: VisitDisplayFields = {};
    if (selectedCompany) {
      display.company_name = selectedCompany.name;
      display.company_address = selectedCompany.address ?? null;
    }
    const inspectorName = inspectorId === user.id ? user.fullName : selectedInspector?.label;
    if (inspectorName) display.inspector_name = inspectorName;

    try {
      setSaving(true);
      const id = editingId ?? newVisitId();
      const saved = await saveVisit(user.id, id, patch, display);
      if (saved._pending) {
        Alert.alert(
          'Guardado en el teléfono',
          'La visita se sincronizará automáticamente cuando haya conexión.'
        );
      }
      if (editingId) {
        router.back();
      } else {
        router.replace({ pathname: '/visit-detail', params: { id } });
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar la visita');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GradientHeader style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingId ? 'Editar visita' : 'Programar visita'}</Text>
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Empresa / centro de trabajo *</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setPicker('company')}>
          <Ionicons name="business-outline" size={20} color="#6b7280" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.selectorText, !selectedCompany && styles.placeholder]}>
              {selectedCompany?.name ?? 'Seleccionar empresa'}
            </Text>
            {selectedCompany?.address ? <Text style={styles.selectorSub}>{selectedCompany.address}</Text> : null}
          </View>
          <Ionicons name="chevron-down" size={20} color="#9ca3af" />
        </TouchableOpacity>
        {companyOptions.length === 0 ? (
          <Text style={styles.help}>No hay empresas registradas. Créalas primero desde el Dashboard.</Text>
        ) : null}

        <Text style={styles.label}>Fecha *</Text>
        <DateTimeField mode="date" value={date} onChange={setDate} placeholder="Seleccionar fecha" />

        <Text style={styles.label}>Hora (opcional)</Text>
        <DateTimeField mode="time" value={time} onChange={setTime} placeholder="Sin hora fija" clearable />

        <Text style={styles.label}>Motivo *</Text>
        <View style={styles.chips}>
          {[...PURPOSES, OTHER].map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, purposeChoice === p && styles.chipActive]}
              onPress={() => setPurposeChoice(p)}
            >
              <Text style={[styles.chipText, purposeChoice === p && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {purposeChoice === OTHER ? (
          <TextInput
            style={styles.input}
            value={purposeOther}
            onChangeText={setPurposeOther}
            placeholder="Describe el motivo"
            placeholderTextColor="#9ca3af"
          />
        ) : null}

        {isManager ? (
          <>
            <Text style={styles.label}>Asignar a</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setPicker('inspector')}>
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <Text style={[styles.selectorText, { flex: 1 }]}>
                {inspectorId === user?.id ? `${user?.fullName} (yo)` : selectedInspector?.label ?? 'Seleccionar'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </>
        ) : null}

        <Text style={styles.label}>Indicaciones / notas</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ej.: revisar área de producción, llevar sonómetro, contacto en portería..."
          placeholderTextColor="#9ca3af"
          multiline
        />

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.saveText}>{editingId ? 'Guardar cambios' : 'Programar visita'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <PickerModal
        visible={picker === 'company'}
        title="Seleccionar empresa"
        options={companyOptions}
        onClose={() => setPicker(null)}
        onSelect={(o) => {
          setCompanyId(o.id);
          setPicker(null);
        }}
      />
      <PickerModal
        visible={picker === 'inspector'}
        title="Asignar visita a"
        options={team}
        onClose={() => setPicker(null)}
        onSelect={(o) => {
          setInspectorId(o.id);
          setPicker(null);
        }}
      />
    </KeyboardAvoidingView>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 18,
    marginBottom: 8,
  },
  help: {
    fontSize: 13,
    color: '#b45309',
    marginTop: 6,
  },
  selector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectorSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  placeholder: {
    color: '#9ca3af',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    marginTop: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 28,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  pickerItemSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  pickerEmpty: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 30,
  },
});
