import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Mode = 'date' | 'time';

interface DateTimeFieldProps {
  mode: Mode;
  /** 'YYYY-MM-DD' para fechas, 'HH:MM' para horas. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  clearable?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

const toDate = (mode: Mode, value: string | null): Date => {
  const now = new Date();
  if (!value) return now;
  if (mode === 'date') {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const [h, min] = value.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, min, 0, 0);
  return d;
};

const fromDate = (mode: Mode, date: Date): string =>
  mode === 'date'
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const display = (mode: Mode, value: string) =>
  mode === 'date'
    ? toDate('date', value).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : value;

export function DateTimeField({ mode, value, onChange, placeholder, clearable }: DateTimeFieldProps) {
  const [iosVisible, setIosVisible] = useState(false);
  const [temp, setTemp] = useState<Date>(toDate(mode, value));

  if (Platform.OS === 'web') {
    return (
      <TextInput
        style={styles.field}
        value={value ?? ''}
        onChangeText={(t) => onChange(t.trim() || null)}
        placeholder={mode === 'date' ? 'AAAA-MM-DD' : 'HH:MM'}
        placeholderTextColor="#9ca3af"
      />
    );
  }

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(mode, value),
        mode,
        is24Hour: true,
        onChange: (event: any, selected?: Date) => {
          if (event?.type === 'set' && selected) onChange(fromDate(mode, selected));
        },
      });
      return;
    }
    setTemp(toDate(mode, value));
    setIosVisible(true);
  };

  return (
    <>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.field, styles.flex]} onPress={open}>
          <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={20} color="#6b7280" />
          <Text style={[styles.text, !value && styles.placeholder]}>{value ? display(mode, value) : placeholder}</Text>
        </TouchableOpacity>
        {clearable && value ? (
          <TouchableOpacity style={styles.clear} onPress={() => onChange(null)}>
            <Ionicons name="close-circle" size={22} color="#9ca3af" />
          </TouchableOpacity>
        ) : null}
      </View>
      <Modal visible={iosVisible} transparent animationType="fade" onRequestClose={() => setIosVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <DateTimePicker
              value={temp}
              mode={mode}
              display="spinner"
              locale="es-ES"
              onChange={(_: any, selected?: Date) => selected && setTemp(selected)}
            />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel} onPress={() => setIosVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirm}
                onPress={() => {
                  onChange(fromDate(mode, temp));
                  setIosVisible(false);
                }}
              >
                <Text style={styles.confirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  field: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  text: {
    fontSize: 16,
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  placeholder: {
    color: '#9ca3af',
    textTransform: 'none',
  },
  clear: {
    padding: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  confirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
