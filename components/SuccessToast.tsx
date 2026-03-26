import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface SuccessToastProps {
  visible: boolean;
  title?: string;
  message?: string;
  onHide?: () => void;
  duration?: number;
}

export default function SuccessToast({
  visible,
  title = 'Guardado',
  message = 'La respuesta fue guardada correctamente',
  onHide,
  duration = 3500,
}: SuccessToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -80,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShow(false);
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.notification}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✓</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notification: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 20,
    color: '#22c55e',
    fontWeight: 'bold',
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
  },
});
