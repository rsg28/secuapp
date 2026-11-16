import GradientHeader from '@/components/ui/GradientHeader';
import { colors, radius, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Href, router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClosedInspectionTemplates } from '../../hooks/useClosedInspectionTemplates';
import { useOpenInspectionTemplates } from '../../hooks/useOpenInspectionTemplates';
import {
    getCachedVisits,
    listVisits,
    todayISO,
    Visit,
    VISIT_STATUS_COLORS,
    VISIT_STATUS_LABELS,
} from '../../services/visits';

type IoniconName = keyof typeof Ionicons.glyphMap;

const QUICK_ACTIONS: { key: string; title: string; subtitle: string; icon: IoniconName; color: string; bg: string; route: Href }[] = [
  { key: 'visit', title: 'Nueva visita', subtitle: 'Programar supervisión', icon: 'add-circle', color: colors.primary, bg: colors.primarySoft, route: '/visit-form' },
  { key: 'inspections', title: 'Inspecciones', subtitle: 'Abiertas y checklist', icon: 'clipboard', color: colors.teal, bg: colors.tealSoft, route: '/inspection-types' },
  { key: 'ast', title: 'AST', subtitle: 'Análisis de seguridad', icon: 'shield-checkmark', color: colors.success, bg: colors.successSoft, route: '/ast-evaluation-form' },
  { key: 'rals', title: 'RALS', subtitle: 'Liderazgo en seguridad', icon: 'people', color: colors.warning, bg: colors.warningSoft, route: '/rals-form' },
];

const COMING_SOON: { label: string; icon: IoniconName }[] = [
  { label: 'Observaciones', icon: 'eye-outline' },
  { label: 'Auditorías', icon: 'document-text-outline' },
  { label: 'Línea base', icon: 'bar-chart-outline' },
  { label: 'Monitoreo', icon: 'pulse-outline' },
  { label: 'Reportar incidente', icon: 'warning-outline' },
];

const VISITS_REFRESH_MS = 60_000;
const TITLE_RE = /^(dr|dra|ing|lic|sr|sra)\.?$/i;

function nameParts(fullName?: string) {
  return (fullName ?? '').trim().split(/\s+/).filter((p) => p && !TITLE_RE.test(p));
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function todayLabel() {
  const label = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shortDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }).replace('.', '');
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoText, setPhotoText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Hooks para templates
  const { getTemplatesByUserId: getClosedTemplatesByUserId } = useClosedInspectionTemplates();
  const { getTemplatesByUserId: getOpenTemplatesByUserId } = useOpenInspectionTemplates();
  
  // State para el total de templates
  const [totalTemplates, setTotalTemplates] = useState<number>(0);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);

  const [visits, setVisits] = useState<Visit[]>([]);
  const lastVisitsFetch = useRef(0);

  const handleTakePhoto = async () => {
    try {
      // Solicitar permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos de cámara para tomar fotos');
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setShowPhotoModal(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleSendWhatsApp = () => {
    if (!photoUri || !phoneNumber.trim()) {
      Alert.alert('Error', 'Por favor toma una foto e ingresa un número de teléfono');
      return;
    }

    // Formatear número de teléfono (eliminar espacios, guiones, etc.)
    const cleanPhone = phoneNumber.replace(/\s|-|\(|\)/g, '');
    
    // Crear mensaje para WhatsApp
    const message = photoText.trim() || 'Mensaje desde la app de seguridad';
    
    // Crear URL de WhatsApp
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    // Mostrar instrucciones para el usuario
    Alert.alert(
      'Enviar por WhatsApp',
      'Para incluir la foto en WhatsApp:\n\n1. Se abrirá WhatsApp con el mensaje\n2. Toca el clip 📎 para adjuntar\n3. Selecciona "Galería" y busca la foto\n\n¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Abrir WhatsApp', 
          onPress: () => {
            Linking.canOpenURL(whatsappUrl).then((supported) => {
              if (supported) {
                Linking.openURL(whatsappUrl);
                // Limpiar estado y cerrar modal
                setPhotoUri(null);
                setPhotoText('');
                setPhoneNumber('');
                setShowPhotoModal(false);
              } else {
                Alert.alert('Error', 'WhatsApp no está instalado en este dispositivo');
              }
            });
          }
        }
      ]
    );
  };

  const handleResetPhoto = () => {
    setPhotoUri(null);
    setPhotoText('');
    setPhoneNumber('');
    setShowPhotoModal(false);
  };

  // useEffect para obtener el total de templates (solo user_id === 'ALL' o user_id === user.id)
  useEffect(() => {
    if (!user?.id) {
      setTotalTemplates(0);
      setLoadingTemplates(false);
      return;
    }

    let isMounted = true;

    const fetchTemplatesCount = async () => {
      try {
        setLoadingTemplates(true);
        
        // Obtener templates cerrados filtrados por user_id
        const closedData = await getClosedTemplatesByUserId(user.id, 1, 100);
        const closedTemplates = closedData?.data?.templates || [];
        const closedCount = closedTemplates.length;
        
        // Obtener templates abiertos filtrados por user_id
        const openData = await getOpenTemplatesByUserId(user.id, 1, 100);
        const openTemplates = openData?.data?.templates || [];
        const openCount = openTemplates.length;
        
        // Sumar totales solo si el componente sigue montado
        if (isMounted) {
          const total = closedCount + openCount;
          setTotalTemplates(total);
          setLoadingTemplates(false);
        }
      } catch (error) {
        // Silently fail - no mostrar error al usuario
        if (isMounted) {
          setTotalTemplates(0);
          setLoadingTemplates(false);
        }
      }
    };

    fetchTemplatesCount();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      const userId = user.id;
      let active = true;

      getCachedVisits(userId)
        .then((cached) => {
          if (active) setVisits(cached);
        })
        .catch(() => {});

      if (Date.now() - lastVisitsFetch.current > VISITS_REFRESH_MS) {
        lastVisitsFetch.current = Date.now();
        listVisits(userId)
          .then(({ visits: fresh }) => {
            if (active) setVisits(fresh);
          })
          .catch(() => {});
      }

      return () => {
        active = false;
      };
    }, [user?.id])
  );

  const summary = useMemo(() => {
    const today = todayISO();
    const month = today.slice(0, 7);
    const mine = visits.filter((v) => v.inspector_id === user?.id);
    const open = mine.filter((v) => v.status === 'programada' || v.status === 'en_curso');
    const next =
      open.find((v) => v.status === 'en_curso') ??
      open.find((v) => v.status === 'programada' && v.scheduled_date >= today) ??
      null;
    return {
      todayCount: open.filter((v) => v.scheduled_date === today).length,
      pending: open.length,
      completedThisMonth: mine.filter((v) => v.status === 'completada' && v.scheduled_date.startsWith(month)).length,
      next,
      nextIsToday: next?.scheduled_date === today,
    };
  }, [visits, user?.id]);

  const names = nameParts(user?.fullName);
  const firstName = names[0] ?? 'Supervisor';
  const initials = ((names[0]?.[0] ?? '') + (names[1]?.[0] ?? '')).toUpperCase() || 'S';
  const next = summary.next;

  return (
    <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <GradientHeader style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.dateText}>{todayLabel()}</Text>
            <Text style={styles.welcomeText}>
              {greeting()}, {firstName}
            </Text>
            <Text style={styles.headerSubtitle}>Seguridad y Salud en el Trabajo</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityLabel="Ver perfil"
          >
            {user?.profile_image_url ? (
              <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </TouchableOpacity>
        </View>
      </GradientHeader>

      {/* Agenda del día */}
      <View style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <View style={[styles.iconTile, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Visitas de hoy</Text>
            <Text style={styles.cardSubtitle}>
              {summary.todayCount === 0
                ? 'No tienes visitas para hoy'
                : `${summary.todayCount} visita${summary.todayCount === 1 ? '' : 's'} en tu agenda`}
            </Text>
          </View>
          <Text style={styles.todayCount}>{summary.todayCount}</Text>
        </View>

        {next ? (
          <TouchableOpacity
            style={styles.nextVisit}
            onPress={() => router.push({ pathname: '/visit-detail', params: { id: next.id } })}
            activeOpacity={0.8}
          >
            <View style={styles.nextWhen}>
              <Text style={styles.nextWhenTop}>
                {next.status === 'en_curso' ? 'Ahora' : summary.nextIsToday ? 'Hoy' : shortDate(next.scheduled_date)}
              </Text>
              <Text style={styles.nextWhenBottom}>{next.scheduled_time ?? '—'}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.nextCompany} numberOfLines={1}>
                {next.company_name || 'Empresa'}
              </Text>
              <Text style={styles.nextPurpose} numberOfLines={1}>
                {next.purpose}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: VISIT_STATUS_COLORS[next.status].bg }]}>
              <Text style={[styles.statusPillText, { color: VISIT_STATUS_COLORS[next.status].fg }]}>
                {VISIT_STATUS_LABELS[next.status]}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/visits')} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Ver agenda</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Resumen */}
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <View style={[styles.statIcon, { backgroundColor: colors.warningSoft }]}>
            <Ionicons name="time" size={16} color={colors.warning} />
          </View>
          <Text style={styles.statValue}>{summary.pending}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statTile}>
          <View style={[styles.statIcon, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="checkmark-done" size={16} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{summary.completedThisMonth}</Text>
          <Text style={styles.statLabel}>Hechas este mes</Text>
        </View>
        <TouchableOpacity style={styles.statTile} onPress={() => router.push('/inspection-types')} activeOpacity={0.8}>
          <View style={[styles.statIcon, { backgroundColor: colors.violetSoft }]}>
            <Ionicons name="clipboard" size={16} color={colors.violet} />
          </View>
          <Text style={styles.statValue}>{loadingTemplates ? '…' : totalTemplates}</Text>
          <Text style={styles.statLabel}>Plantillas</Text>
        </TouchableOpacity>
      </View>

      {/* Accesos rápidos */}
      <Text style={styles.sectionTitle}>Accesos rápidos</Text>
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={styles.actionTile}
            onPress={() => router.push(action.route)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconTile, { backgroundColor: action.bg }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Próximamente */}
      <Text style={styles.sectionTitle}>Próximamente</Text>
      <View style={styles.soonWrap}>
        {COMING_SOON.map((item) => (
          <View key={item.label} style={styles.soonChip} accessibilityLabel={`${item.label} próximamente`}>
            <Ionicons name={item.icon} size={14} color={colors.textMuted} />
            <Text style={styles.soonText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Modal para foto y envío por WhatsApp */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleResetPhoto}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Enviar Foto por WhatsApp</Text>
              
              {/* Vista previa de la foto */}
              {photoUri && (
                <View style={styles.photoPreview}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoViewer}
                    resizeMode="contain"
                  />
                </View>
              )}

              {/* Campo para número de teléfono */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número de Teléfono *</Text>
                <TextInput
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Ej: +56 9 1234 5678"
                  keyboardType="phone-pad"
                  autoFocus={true}
                />
              </View>

              {/* Campo para texto del mensaje */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mensaje (opcional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={photoText}
                  onChangeText={setPhotoText}
                  placeholder="Añade un mensaje a la foto..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Botones de acción */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalButtonCancel}
                  onPress={handleResetPhoto}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButtonSend}
                  onPress={handleSendWhatsApp}
                  disabled={!phoneNumber.trim()}
                >
                  <Text style={styles.modalButtonTextSend}>Enviar por WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: 64,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onPrimaryMuted,
    marginBottom: 6,
  },
  welcomeText: {
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
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginLeft: 16,
    backgroundColor: colors.glass,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  todayCard: {
    marginTop: -44,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 18,
    ...shadows.raised,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  todayCount: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  nextVisit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextWhen: {
    width: 60,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  nextWhenTop: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimaryMuted,
    textTransform: 'capitalize',
  },
  nextWhenBottom: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginTop: 1,
  },
  nextCompany: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  nextPurpose: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 16,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginTop: 10,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 20,
  },
  actionTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  soonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 20,
  },
  soonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  soonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 8,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    ...shadows.raised,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoViewer: {
    width: 200,
    height: 150,
    borderRadius: radius.md,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalButtonSend: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalButtonTextSend: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
