import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View, useWindowDimensions, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineBanner } from '../../components/OfflineBanner';
import { useAuth } from '../../contexts/AuthContext';
import { useNetworkContext } from '../../contexts/NetworkContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, focused, color, size }: { name: IoniconName; focused: boolean; color: string; size: number }) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons name={focused ? name : (`${name}-outline` as IoniconName)} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const { isOffline } = useNetworkContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tabMetrics = useMemo(() => {
    const isSmallDevice = width < 360;
    const isLargeDevice = width > 768;
    const paddingBottom = Math.max((insets.bottom || 0) - 8, 10);
    const horizontalMargin = isLargeDevice ? 24 : 0;
    const borderRadius = isLargeDevice ? 24 : 0;
    const iconSize = isSmallDevice ? 20 : 22;
    const tabBarHeight = 64 + paddingBottom;

    const tabBarStyle: ViewStyle = {
      position: 'absolute',
      bottom: 0,
      left: horizontalMargin,
      right: horizontalMargin,
      backgroundColor: colors.surface,
      borderTopWidth: borderRadius ? 0 : StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      height: tabBarHeight,
      paddingBottom,
      paddingTop: 6,
      paddingHorizontal: isLargeDevice ? 18 : 6,
      borderRadius,
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 12,
    };

    return {
      tabBarStyle,
      iconSize,
      tabBarHeight,
    };
  }, [width, insets.bottom]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const renderIcon = (name: IoniconName) =>
    function TabBarIcon({ color, focused }: { color: string; focused: boolean }) {
      return <TabIcon name={name} focused={focused} color={color} size={tabMetrics.iconSize} />;
    };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarShowLabel: true,
        animation: 'none',
        tabBarStyle: tabMetrics.tabBarStyle,
        tabBarIconStyle: styles.iconSlot,
        tabBarLabelStyle: styles.label,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: renderIcon('home'),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Servicios',
          tabBarIcon: renderIcon('grid'),
        }}
      />
      <Tabs.Screen
        name="procedures"
        options={{
          title: 'Empresas',
          tabBarIcon: renderIcon('business'),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: renderIcon('time'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: renderIcon('person'),
        }}
      />
    </Tabs>
      {isOffline && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: tabMetrics.tabBarHeight }}>
          <OfflineBanner />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    width: 56,
    height: 28,
  },
  iconPill: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconPillActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
});
