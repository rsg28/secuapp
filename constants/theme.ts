export const colors = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  primarySoft: '#eff6ff',
  primaryMuted: '#dbeafe',
  navy: '#172554',

  background: '#f4f6fb',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  border: '#e5e9f2',

  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',

  success: '#16a34a',
  successSoft: '#dcfce7',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  teal: '#0d9488',
  tealSoft: '#ccfbf1',
  violet: '#7c3aed',
  violetSoft: '#ede9fe',

  onPrimary: '#ffffff',
  onPrimaryMuted: 'rgba(255,255,255,0.78)',
  glass: 'rgba(255,255,255,0.16)',
};

export const gradients = {
  header: ['#172554', '#1e40af', '#2563eb'] as const,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
};
