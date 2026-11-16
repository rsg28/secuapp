import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import GradientHeader from '@/components/ui/GradientHeader';

const { width } = Dimensions.get('window');

export default function InspectionTypesScreen() {
  const navigation = useNavigation();

  const handleOpenInspections = () => {
    router.push('/open-inspections');
  };

  const handleClosedInspections = () => {
    router.push('/closed-inspections');
  };

  const handleBack = () => {
    router.push('/(tabs)/explore');
  };

  // Intercept back button to always go to services page
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent default behavior
      e.preventDefault();
      // Always redirect to services page
      router.push('/(tabs)/explore');
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <GradientHeader style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tipos de Inspección</Text>
          <Text style={styles.headerSubtitle}>
            Selecciona el tipo de inspección que deseas revisar
          </Text>
        </View>
      </GradientHeader>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Open Inspections Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleOpenInspections}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#eff6ff' }]}>
              <IconSymbol name="list.clipboard.fill" size={28} color="#2563eb" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Inspecciones Abiertas</Text>
              <Text style={styles.cardDescription}>
                Inspecciones en curso y pendientes de completar
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Closed Inspections Card */}
        <TouchableOpacity style={styles.inspectionCard} onPress={handleClosedInspections}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="document-text" size={28} color="#16a34a" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Checklist</Text>
              <Text style={styles.cardDescription}>
                Inspecciones completadas y archivadas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Espacio para el bottom tab */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 20,
  },
  inspectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e9f2',
    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 100,
  },
});
