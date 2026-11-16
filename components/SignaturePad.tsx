import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

/** Firma serializada como trazos SVG: pesa pocos KB y se puede guardar sin internet. */
export interface SignatureData {
  w: number;
  h: number;
  paths: string[];
}

export function parseSignature(raw: string | null | undefined): SignatureData | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data?.paths) && data.paths.length > 0 && data.w > 0 && data.h > 0) return data;
  } catch {}
  return null;
}

/** viewBox recortado a los trazos, para que la firma ocupe todo el espacio al mostrarla. */
export function signatureViewBox(data: SignatureData, padding = 12): string {
  const nums = data.paths.join(' ').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length < 2) return `0 0 ${data.w} ${data.h}`;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    minX = Math.min(minX, nums[i]);
    maxX = Math.max(maxX, nums[i]);
    minY = Math.min(minY, nums[i + 1]);
    maxY = Math.max(maxY, nums[i + 1]);
  }
  const x = Math.max(0, minX - padding);
  const y = Math.max(0, minY - padding);
  return `${x} ${y} ${maxX + padding - x} ${maxY + padding - y}`;
}

export function SignatureView({ value, height = 120 }: { value: string | null | undefined; height?: number }) {
  const data = parseSignature(value);
  if (!data) return null;
  return (
    <View style={[styles.preview, { height }]}>
      <Svg width="100%" height="100%" viewBox={signatureViewBox(data)} preserveAspectRatio="xMidYMid meet">
        {data.paths.map((d, i) => (
          <Path key={i} d={d} stroke="#111827" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    </View>
  );
}

interface SignaturePadModalProps {
  visible: boolean;
  title?: string;
  onCancel: () => void;
  onSave: (signature: string) => void;
}

const round = (n: number) => Math.round(n * 10) / 10;

export function SignaturePadModal({ visible, title = 'Firma', onCancel, onSave }: SignaturePadModalProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const currentRef = useRef('');
  const sizeRef = useRef({ w: 0, h: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          currentRef.current = `M${round(locationX)} ${round(locationY)}`;
          setCurrent(currentRef.current);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          currentRef.current += ` L${round(locationX)} ${round(locationY)}`;
          setCurrent(currentRef.current);
        },
        onPanResponderRelease: () => {
          let stroke = currentRef.current;
          if (stroke && !stroke.includes('L')) {
            // Un toque sin movimiento se guarda como un punto visible.
            const [, x, y] = stroke.match(/M([\d.]+) ([\d.]+)/) ?? [];
            stroke = `${stroke} L${round(Number(x) + 0.5)} ${round(Number(y) + 0.5)}`;
          }
          if (stroke) setPaths((prev) => [...prev, stroke]);
          currentRef.current = '';
          setCurrent('');
        },
      }),
    []
  );

  const reset = () => {
    setPaths([]);
    setCurrent('');
    currentRef.current = '';
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    sizeRef.current = { w: round(width), h: round(height) };
  };

  const handleSave = () => {
    const { w, h } = sizeRef.current;
    onSave(JSON.stringify({ w, h, paths }));
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={26} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={reset} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Firme con el dedo dentro del recuadro</Text>
        <View style={styles.canvas} onLayout={handleLayout} {...panResponder.panHandlers}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%">
              {[...paths, current].filter(Boolean).map((d, i) => (
                <Path key={i} d={d} stroke="#111827" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </Svg>
          </View>
          <View pointerEvents="none" style={styles.baseline} />
        </View>
        <TouchableOpacity
          style={[styles.saveButton, paths.length === 0 && styles.saveButtonDisabled]}
          disabled={paths.length === 0}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={22} color="#fff" />
          <Text style={styles.saveText}>Guardar firma</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  hint: {
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 8,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  baseline: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: '30%',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  preview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
  },
});
