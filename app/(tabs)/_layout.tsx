import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, View, useWindowDimensions, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tabMetrics = useMemo(() => {
    const isSmallDevice = width < 360;
    const isLargeDevice = width > 768;
    const baseHeight = Math.min(80, Math.max(58, width * 0.18));
    const paddingBottom = Math.max(insets.bottom || 0, isSmallDevice ? 10 : 14);
    const paddingTop = isSmallDevice ? 6 : 10;
    const horizontalMargin = isLargeDevice ? 24 : 0;
    const borderRadius = isLargeDevice ? 24 : 0;
    const paddingHorizontal = isLargeDevice ? Math.max(18, width * 0.04) : Math.max(12, width * 0.03);
    const iconSize = isSmallDevice ? 20 : Math.min(28, Math.max(22, width * 0.06));

    const tabBarStyle: ViewStyle = {
      position: 'absolute',
      bottom: 0,
      left: horizontalMargin,
      right: horizontalMargin,
      backgroundColor: '#f3f4f6',
      borderTopWidth: 0,
      height: baseHeight + paddingBottom,
      paddingBottom,
      paddingTop,
      paddingHorizontal,
      borderRadius,
      shadowColor: '#00000020',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: borderRadius ? 4 : 0,
    };

    return {
      tabBarStyle,
      iconSize
    };
  }, [width, insets.bottom]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af', // Azul profesional
        tabBarInactiveTintColor: '#6b7280', // Gris más oscuro
        headerShown: false,
        tabBarShowLabel: false,
        animation: 'none',
        tabBarStyle: tabMetrics.tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={tabMetrics.iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid" size={tabMetrics.iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="procedures"
        options={{
          title: 'Procedimientos',
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text" size={tabMetrics.iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => (
            <Ionicons name="time" size={tabMetrics.iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={tabMetrics.iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
