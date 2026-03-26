import SuccessToast from '../components/SuccessToast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OtrosTypesScreen() {
  const params = useLocalSearchParams<{ saved?: string }>();
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (params.saved === 'ast' || params.saved === 'rals') {
      setShowSavedToast(true);
    }
  }, [params.saved]);

  const handleToastHide = useCallback(() => {
    setShowSavedToast(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement) {
          (document.activeElement as HTMLElement).blur();
        }
      };
    }, [])
  );

  const handleAST = () => {
    router.push('/ast-evaluation-form');
  };

  const handleLiderazgo = () => {
    router.push('/rals-form');
  };

  const handleBack = () => {
    router.replace('/(tabs)/explore');
  };

  return (
    <View style={styles.container}>
      <SuccessToast
        visible={showSavedToast}
        title="Respuesta guardada"
        message="La respuesta fue guardada correctamente"
        onHide={handleToastHide}
        duration={3500}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Otros</Text>
          <Text style={styles.headerSubtitle}>
            Selecciona la opción que deseas utilizar
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.inspectionCard} onPress={handleAST}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color="#3b82f6" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>AST</Text>
              <Text style={styles.cardDescription}>
                Evaluación del Análisis de Seguridad del Trabajo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inspectionCard} onPress={handleLiderazgo}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="people" size={32} color="#22c55e" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>RALS</Text>
              <Text style={styles.cardDescription}>
                Reporte de Actividades de Liderazgo de Seguridad
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#7dd3fc',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 20,
  },
  inspectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});
