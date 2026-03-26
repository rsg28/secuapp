import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNetworkContext } from '../contexts/NetworkContext';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

export default function ForgotPasswordScreen() {
  const { isOffline } = useNetworkContext();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    if (isOffline) {
      Alert.alert('Sin conexión', 'Se requiere internet para recuperar tu contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'No se pudo enviar el código.');
      }
      setStep(2);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e?.message || 'Error al enviar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    if (!trimmedEmail || !trimmedCode) {
      setError('Ingresa el correo y el código que te enviamos.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (isOffline) {
      Alert.alert('Sin conexión', 'Se requiere internet.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          code: trimmedCode,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'No se pudo restablecer la contraseña.');
      }
      Alert.alert('Listo', 'Contraseña actualizada. Ya puedes iniciar sesión.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (e: any) {
      setError(e?.message || 'Error. Verifica el código e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recuperar contraseña</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <>
            <Text style={styles.instruction}>
              Ingresa el correo con el que te registraste. Te enviaremos un código para restablecer tu contraseña.
            </Text>
            <Text style={styles.validityNote}>El código que recibirás será válido por 1 hora.</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="tu@ejemplo.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Enviar código</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.instruction}>
              Revisa tu correo e ingresa el código de 6 dígitos que te enviamos y tu nueva contraseña.
            </Text>
            <Text style={styles.validityNote}>El código es válido por 1 hora.</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                style={styles.input}
                value={email}
                editable={false}
                placeholder="tu@ejemplo.com"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Código</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(t) => { setCode(t); setError(null); }}
                placeholder="123456"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); setError(null); }}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(null); }}
                placeholder="Repite la contraseña"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Restablecer contraseña</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => { setStep(1); setError(null); }}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Usar otro correo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#0ea5e9',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  headerSpacer: { width: 40 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  instruction: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 8,
  },
  validityNote: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 12 },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { fontSize: 15, color: '#0ea5e9', fontWeight: '600' },
});
