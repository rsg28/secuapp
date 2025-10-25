import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../contexts/AuthContext';
import DatabaseConnectionDebug from '../components/DatabaseConnectionDebug';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="create-form" options={{ headerShown: false }} />
          <Stack.Screen name="create-company" options={{ headerShown: false }} />
          <Stack.Screen name="inspection-types" options={{ headerShown: false }} />
          <Stack.Screen name="open-inspections" options={{ headerShown: false }} />
          <Stack.Screen name="closed-inspections" options={{ headerShown: false }} />
          <Stack.Screen name="create-open-inspection" options={{ headerShown: false }} />
        <Stack.Screen name="ccm2l-inspection" options={{ headerShown: false }} />
        <Stack.Screen name="monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="sonometria-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="material-particulado-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="ergonomia-postural-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="estres-termico-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="polvo-respiratorio-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="gases-toxicos-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="iluminacion-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="vibraciones-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="dosimetria-ruido-monitoring" options={{ headerShown: false }} />
        <Stack.Screen name="employees" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <DatabaseConnectionDebug />
      </ThemeProvider>
    </AuthProvider>
  );
}
