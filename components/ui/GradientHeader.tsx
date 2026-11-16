import { gradients } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GradientHeader({ style, children, ...rest }: ViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradients.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      {...rest}
      style={[styles.base, style, { paddingTop: Math.max(insets.top, 24) + 16 }]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
});
