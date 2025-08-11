import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <>
      {/* Línea blanca superior */}
      <View style={{
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#ffffff',
        zIndex: 1000,
      }} />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e40af', // Azul profesional
        tabBarInactiveTintColor: '#6b7280', // Gris más oscuro
        headerShown: false,
        tabBarShowLabel: false,
        animation: 'none',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#f3f4f6',
          borderTopWidth: 0,
          height: 100,
          paddingBottom: 15,
          paddingTop: 8,
        },
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
            <Ionicons name="stats-chart" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Formularios',
          tabBarIcon: ({ color }) => (
            <Ionicons name="clipboard" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => (
            <Ionicons name="time" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
    </>
  );
}
