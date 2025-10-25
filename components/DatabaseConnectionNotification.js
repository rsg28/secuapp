import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Alert } from 'react-native';
import { useDatabaseConnection } from '../hooks';

const { width, height } = Dimensions.get('window');

const DatabaseConnectionNotification = () => {
  const { isConnected, loading, connectionMessage, error } = useDatabaseConnection();
  const [showNotification, setShowNotification] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-150))[0];

  useEffect(() => {
    if (!loading) {
      if (isConnected) {
        setShowNotification(true);
        
        // Animación de entrada
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();

        // Ocultar después de 4 segundos
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -150,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowNotification(false);
          });
        }, 4000);
      } else if (error) {
        // Mostrar error como alerta
        Alert.alert(
          'Error de Conexión',
          'No se pudo conectar con la base de datos. Verifica tu conexión a internet.',
          [{ text: 'OK' }]
        );
      }
    }
  }, [isConnected, loading, error]);

  if (!showNotification) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.notification}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✅</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Conexión Exitosa</Text>
          <Text style={styles.message}>Base de datos conectada correctamente</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 15,
    right: 15,
    zIndex: 9999,
  },
  notification: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  iconContainer: {
    marginRight: 15,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DatabaseConnectionNotification;
