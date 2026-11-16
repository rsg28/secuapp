import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const OfflineBanner: React.FC = () => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.banner}>
        <Ionicons name="cloud-offline" size={16} color="#fbbf24" />
        <Text style={styles.text}>Sin conexión · se sincronizará al reconectar</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    pointerEvents: 'none',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  text: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
