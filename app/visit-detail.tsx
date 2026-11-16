import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SignaturePadModal, SignatureView } from '../components/SignaturePad';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteVisit,
  formatDateTime,
  formatVisitDate,
  getVisit,
  mapsUrl,
  saveVisit,
  toNumber,
  Visit,
  VISIT_STATUS_COLORS,
  VISIT_STATUS_LABELS,
  VisitPatch,
} from '../services/visits';
import { confirmAction } from '../utils/confirm';
import { Coords, getCurrentCoords } from '../utils/location';
import { shareVisitPdf } from '../utils/visitPdf';
import GradientHeader from '@/components/ui/GradientHeader';

type Busy = 'checkin' | 'checkout' | 'draft' | 'pdf' | 'cancel' | 'delete' | null;

/** undefined = el usuario canceló; null = registrar sin ubicación. */
async function captureCoords(): Promise<Coords | null | undefined> {
  try {
    return await getCurrentCoords();
  } catch (error: any) {
    const proceed = await confirmAction(
      'Ubicación no disponible',
      `${error?.message ?? 'No se pudo obtener la ubicación.'}\n\n¿Deseas registrar sin ubicación?`,
      'Registrar sin ubicación'
    );
    return proceed ? null : undefined;
  }
}

function LocationRow({ label, at, lat, lng, accuracy }: { label: string; at: string | null; lat: any; lng: any; accuracy: any }) {
  const url = mapsUrl(lat, lng);
  const acc = toNumber(accuracy);
  return (
    <View style={styles.locationRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{formatDateTime(at)}</Text>
      {url ? (
        <TouchableOpacity onPress={() => Linking.openURL(url)} style={styles.mapLink}>
          <Ionicons name="location" size={16} color="#2563eb" />
          <Text style={styles.mapLinkText}>
            Ver en mapa{acc !== null ? ` (±${Math.round(acc)} m)` : ''}
          </Text>
        </TouchableOpacity>
      ) : at ? (
        <Text style={styles.muted}>Sin ubicación registrada</Text>
      ) : null}
    </View>
  );
}

export default function VisitDetailScreen() {
  const { user, isManager, userCompanies, changeCurrentCompany } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Busy>(null);

  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsiblePosition, setResponsiblePosition] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const formInitialized = useRef(false);

  const load = useCallback(async () => {
    if (!user?.id || !id) return;
    const v = await getVisit(user.id, id);
    setVisit(v);
    // Solo la primera vez: al volver de una inspección no se pierde lo que se estaba escribiendo.
    if (v && !formInitialized.current) {
      formInitialized.current = true;
      setFindings(v.findings ?? '');
      setRecommendations(v.recommendations ?? '');
      setResponsibleName(v.responsible_name ?? '');
      setResponsiblePosition(v.responsible_position ?? '');
      setSignature(v.responsible_signature ?? null);
    }
  }, [user?.id, id]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const persist = async (patch: VisitPatch) => {
    if (!user?.id || !visit) return null;
    const updated = await saveVisit(user.id, visit.id, patch);
    setVisit(updated);
    return updated;
  };

  const closingFields = (): VisitPatch => ({
    findings: findings.trim() || null,
    recommendations: recommendations.trim() || null,
    responsible_name: responsibleName.trim() || null,
    responsible_position: responsiblePosition.trim() || null,
    responsible_signature: signature,
  });

  const handleCheckIn = async () => {
    setBusy('checkin');
    try {
      const coords = await captureCoords();
      if (coords === undefined) return;
      await persist({
        status: 'en_curso',
        check_in_at: new Date().toISOString(),
        check_in_lat: coords?.lat ?? null,
        check_in_lng: coords?.lng ?? null,
        check_in_accuracy: coords?.accuracy ?? null,
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo registrar la llegada');
    } finally {
      setBusy(null);
    }
  };

  const handleSaveDraft = async () => {
    setBusy('draft');
    try {
      const updated = await persist(closingFields());
      Alert.alert(
        'Guardado',
        updated?._pending ? 'Guardado en el teléfono. Se sincronizará al haber conexión.' : 'Avance guardado.'
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar');
    } finally {
      setBusy(null);
    }
  };

  const finishVisit = async () => {
    setBusy('checkout');
    try {
      const coords = await captureCoords();
      if (coords === undefined) return;
      const updated = await persist({
        ...closingFields(),
        status: 'completada',
        check_out_at: new Date().toISOString(),
        check_out_lat: coords?.lat ?? null,
        check_out_lng: coords?.lng ?? null,
        check_out_accuracy: coords?.accuracy ?? null,
      });
      if (updated) {
        const wantsPdf = await confirmAction(
          'Visita finalizada',
          updated._pending
            ? 'Quedó guardada en el teléfono y se sincronizará al haber conexión. ¿Deseas generar el informe PDF?'
            : '¿Deseas generar el informe PDF para enviarlo a la empresa?',
          'Generar PDF',
          'Ahora no'
        );
        if (wantsPdf) await handlePdf(updated);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo finalizar la visita');
    } finally {
      setBusy(null);
    }
  };

  const handleCheckOut = async () => {
    if (!responsibleName.trim()) {
      Alert.alert('Falta información', 'Escribe el nombre del responsable de la empresa que firma.');
      return;
    }
    if (!signature) {
      Alert.alert('Falta la firma', 'Pide al responsable de la empresa que firme en el teléfono.');
      return;
    }
    if (await confirmAction('Finalizar visita', 'Se registrará la hora y ubicación de salida. ¿Continuar?', 'Finalizar')) {
      await finishVisit();
    }
  };

  const handlePdf = async (v: Visit | null = visit) => {
    if (!v) return;
    setBusy('pdf');
    try {
      await shareVisitPdf({ ...v, responsible_signature: v.responsible_signature ?? signature });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo generar el PDF');
    } finally {
      setBusy(null);
    }
  };

  const handleCancelVisit = async () => {
    if (!(await confirmAction('Cancelar visita', '¿Seguro que deseas cancelar esta visita?', 'Sí, cancelar', 'No', true))) {
      return;
    }
    setBusy('cancel');
    try {
      await persist({ status: 'cancelada' });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo cancelar la visita');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !visit) return;
    if (!(await confirmAction('Eliminar visita', 'Esta acción no se puede deshacer.', 'Eliminar', 'Cancelar', true))) {
      return;
    }
    setBusy('delete');
    try {
      await deleteVisit(user.id, visit.id);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo eliminar la visita');
      setBusy(null);
    }
  };

  const openService = (path: '/inspection-types' | '/rals-form') => {
    const company = (userCompanies || []).find((c: any) => c.id === visit?.company_id);
    if (company) changeCurrentCompany(company);
    router.push(path);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!visit) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Text style={styles.muted}>No se encontró la visita.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.mapLinkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colors = VISIT_STATUS_COLORS[visit.status] ?? VISIT_STATUS_COLORS.programada;
  const canDelete = isManager || (visit.inspector_id === user?.id && visit.status === 'programada');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GradientHeader style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {visit.company_name || 'Visita'}
          </Text>
          <Text style={styles.headerSubtitle}>{formatVisitDate(visit.scheduled_date)}{visit.scheduled_time ? ` · ${visit.scheduled_time}` : ''}</Text>
        </View>
        {visit.status === 'programada' ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push({ pathname: '/visit-form', params: { id: visit.id } })}
          >
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.fg }]}>{VISIT_STATUS_LABELS[visit.status]}</Text>
          </View>
          {visit._pending ? (
            <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="cloud-offline-outline" size={13} color="#b45309" />
              <Text style={[styles.badgeText, { color: '#b45309' }]}>Pendiente de sincronizar</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.infoLabel}>Motivo</Text>
          <Text style={styles.infoValue}>{visit.purpose}</Text>
          {visit.company_address ? (
            <>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>{visit.company_address}</Text>
            </>
          ) : null}
          {visit.inspector_name ? (
            <>
              <Text style={styles.infoLabel}>Asignada a</Text>
              <Text style={styles.infoValue}>{visit.inspector_name}</Text>
            </>
          ) : null}
          {visit.notes ? (
            <>
              <Text style={styles.infoLabel}>Indicaciones</Text>
              <Text style={styles.infoValue}>{visit.notes}</Text>
            </>
          ) : null}
        </View>

        {visit.status === 'programada' ? (
          <>
            <TouchableOpacity style={[styles.primaryButton, styles.checkIn]} onPress={handleCheckIn} disabled={!!busy}>
              {busy === 'checkin' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={24} color="#fff" />
                  <Text style={styles.primaryText}>Registrar llegada</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.help}>Se guardará la hora y tu ubicación GPS como constancia de la visita.</Text>
          </>
        ) : null}

        {visit.status !== 'programada' && visit.check_in_at ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Asistencia</Text>
            <LocationRow label="Llegada" at={visit.check_in_at} lat={visit.check_in_lat} lng={visit.check_in_lng} accuracy={visit.check_in_accuracy} />
            {visit.check_out_at ? (
              <LocationRow label="Salida" at={visit.check_out_at} lat={visit.check_out_lat} lng={visit.check_out_lng} accuracy={visit.check_out_accuracy} />
            ) : null}
          </View>
        ) : null}

        {visit.status === 'en_curso' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Durante la visita</Text>
              <Text style={styles.help}>Registra formularios de SecuApp para esta empresa:</Text>
              <View style={styles.shortcutRow}>
                <TouchableOpacity style={styles.shortcut} onPress={() => openService('/inspection-types')}>
                  <Ionicons name="clipboard-outline" size={22} color="#2563eb" />
                  <Text style={styles.shortcutText}>Inspección</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shortcut} onPress={() => openService('/rals-form')}>
                  <Ionicons name="people-outline" size={22} color="#2563eb" />
                  <Text style={styles.shortcutText}>RALS</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cierre de la visita</Text>
              <Text style={styles.inputLabel}>Observaciones / hallazgos</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={findings}
                onChangeText={setFindings}
                placeholder="Qué se observó durante la supervisión"
                placeholderTextColor="#9ca3af"
                multiline
              />
              <Text style={styles.inputLabel}>Recomendaciones</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={recommendations}
                onChangeText={setRecommendations}
                placeholder="Acciones sugeridas a la empresa"
                placeholderTextColor="#9ca3af"
                multiline
              />
              <Text style={styles.inputLabel}>Responsable de la empresa *</Text>
              <TextInput
                style={styles.input}
                value={responsibleName}
                onChangeText={setResponsibleName}
                placeholder="Nombre completo"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.input}
                value={responsiblePosition}
                onChangeText={setResponsiblePosition}
                placeholder="Cargo (ej.: Jefe de SST)"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.inputLabel}>Firma del responsable *</Text>
              {signature ? (
                <>
                  <SignatureView value={signature} />
                  <TouchableOpacity onPress={() => setSignatureOpen(true)} style={styles.linkButton}>
                    <Text style={styles.mapLinkText}>Volver a firmar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.signButton} onPress={() => setSignatureOpen(true)}>
                  <Ionicons name="create-outline" size={22} color="#2563eb" />
                  <Text style={styles.signButtonText}>Tocar para firmar</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveDraft} disabled={!!busy}>
              {busy === 'draft' ? <ActivityIndicator color="#2563eb" /> : <Text style={styles.secondaryText}>Guardar avance</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, styles.checkOut]} onPress={handleCheckOut} disabled={!!busy}>
              {busy === 'checkout' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={24} color="#fff" />
                  <Text style={styles.primaryText}>Registrar salida y finalizar</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : null}

        {visit.status === 'completada' ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resultado</Text>
              <Text style={styles.infoLabel}>Observaciones / hallazgos</Text>
              <Text style={styles.infoValue}>{visit.findings || '—'}</Text>
              <Text style={styles.infoLabel}>Recomendaciones</Text>
              <Text style={styles.infoValue}>{visit.recommendations || '—'}</Text>
              <Text style={styles.infoLabel}>Conformidad</Text>
              <SignatureView value={visit.responsible_signature ?? signature} />
              <Text style={styles.infoValue}>{visit.responsible_name}</Text>
              {visit.responsible_position ? <Text style={styles.muted}>{visit.responsible_position}</Text> : null}
            </View>
            <TouchableOpacity style={[styles.primaryButton, styles.checkIn]} onPress={() => handlePdf()} disabled={!!busy}>
              {busy === 'pdf' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={24} color="#fff" />
                  <Text style={styles.primaryText}>Compartir informe PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : null}

        {visit.status === 'cancelada' ? (
          <View style={styles.card}>
            <Text style={styles.muted}>Esta visita fue cancelada.</Text>
          </View>
        ) : null}

        <View style={styles.footerActions}>
          {visit.status === 'programada' || visit.status === 'en_curso' ? (
            <TouchableOpacity onPress={handleCancelVisit} disabled={!!busy}>
              <Text style={styles.dangerText}>Cancelar visita</Text>
            </TouchableOpacity>
          ) : null}
          {canDelete ? (
            <TouchableOpacity onPress={handleDelete} disabled={!!busy}>
              <Text style={styles.dangerText}>Eliminar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <SignaturePadModal
        visible={signatureOpen}
        title={responsibleName.trim() ? `Firma de ${responsibleName.trim()}` : 'Firma del responsable'}
        onCancel={() => setSignatureOpen(false)}
        onSave={(sig) => {
          setSignature(sig);
          setSignatureOpen(false);
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
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 12,
  },
  infoValue: {
    fontSize: 15,
    color: '#1f2937',
    marginTop: 2,
    lineHeight: 21,
  },
  muted: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  help: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  locationRow: {
    marginBottom: 4,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  mapLinkText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  checkIn: {
    backgroundColor: '#2563eb',
  },
  checkOut: {
    backgroundColor: '#16a34a',
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },
  secondaryText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  shortcut: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
  },
  shortcutText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  signButton: {
    height: 110,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 15,
  },
  linkButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 28,
  },
  dangerText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 15,
    padding: 8,
  },
});
