import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDatabaseConnection } from '../hooks';

const DatabaseConnectionDebug = () => {
  const { isConnected, loading, error, connectionMessage } = useDatabaseConnection();

  // Mostrar estado en pantalla para debug
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>
        Estado: {loading ? 'Cargando...' : isConnected ? '✅ Conectado' : '❌ Error'}
      </Text>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 9999,
  },
  debugText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
  },
});

export default DatabaseConnectionDebug;
