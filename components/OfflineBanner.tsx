import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const OfflineBanner: React.FC = () => {
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
      <Text style={styles.text}>Modo sin conexión. Los datos se sincronizarán al reconectar.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
  },
});
