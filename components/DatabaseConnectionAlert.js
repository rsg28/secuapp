import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useDatabaseConnection } from '../hooks';

const DatabaseConnectionNotification = () => {
  const { isConnected, loading, error } = useDatabaseConnection();

  useEffect(() => {
    if (!loading) {
      if (isConnected) {
        // Mostrar alerta de éxito
        Alert.alert(
          '✅ Conexión Exitosa',
          'La base de datos se ha conectado correctamente',
          [
            {
              text: 'OK',
              style: 'default'
            }
          ],
          { cancelable: false }
        );
      } else if (error) {
        // Mostrar alerta de error
        Alert.alert(
          '❌ Error de Conexión',
          'No se pudo conectar con la base de datos. Verifica tu conexión a internet.',
          [
            {
              text: 'Reintentar',
              onPress: () => {
                // Aquí podrías llamar a checkConnection() si lo expones
                console.log('Reintentando conexión...');
              }
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      }
    }
  }, [isConnected, loading, error]);

  // Este componente no renderiza nada visual, solo maneja las alertas
  return null;
};

export default DatabaseConnectionNotification;
