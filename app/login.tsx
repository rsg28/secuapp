import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Welcome, 2 = Login Form, 3 = Register Form
  const [slideAnimation] = useState(new Animated.Value(0));
  const [registerAnimation] = useState(new Animated.Value(0));
  
  const { login } = useAuth();

  const handleNext = () => {
    setCurrentStep(2);
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleShowRegister = () => {
    setCurrentStep(3);
    Animated.timing(registerAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    
    // Simulamos registro (por ahora sin backend)
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Éxito', 'Cuenta creada exitosamente', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    }, 1000);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        // Verificar si es manager para mostrar mensaje especial
        if (email === 'raul.gomero.c@gmail.com') {
          Alert.alert('Bienvenido Manager', 'Acceso completo a la aplicación', [
            { text: 'Continuar', onPress: () => router.replace('/(tabs)') }
          ]);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Error', 'Credenciales inválidas');
      }
    } catch (error) {
      Alert.alert('Error', 'Error durante el inicio de sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Background with organic shapes */}
      <View style={styles.backgroundContainer}>
        <Svg height={height} width={width} style={styles.backgroundSvg}>
          {/* Fondo azul principal que cubre más área */}
          <Path
            d={`M0,0 L${width},0 L${width},${height * 0.7} 
                Q${width * 0.8},${height * 0.65} ${width * 0.5},${height * 0.75}
                Q${width * 0.2},${height * 0.85} 0,${height * 0.8} Z`}
            fill="#7dd3fc"
          />
          {/* Capa azul más clara encima */}
          <Path
            d={`M0,${height * 0.1} 
                Q${width * 0.4},${height * 0.05} ${width * 0.7},${height * 0.15}
                Q${width * 0.9},${height * 0.25} ${width},${height * 0.3}
                L${width},0 L0,0 Z`}
            fill="#bae6fd"
          />
        </Svg>
      </View>

      {/* Welcome Screen */}
      <Animated.View 
        style={[
          styles.welcomeScreenContainer,
          {
            transform: [{
              translateX: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -width]
              })
            }],
            opacity: slideAnimation.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [1, 0.3, 0]
            })
          }
        ]}
      >
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeMainTitle}>Bienvenido</Text>
          <Text style={styles.welcomeMainSubtitle}>
            Seguridad de Salud{'\n'}en el Trabajo
          </Text>
        </View>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Ionicons name="arrow-forward" size={28} color="#0ea5e9" />
        </TouchableOpacity>
      </Animated.View>

      {/* Login Form Screen */}
      <Animated.View 
        style={[
          styles.loginScreenContainer,
          {
            transform: [{
              translateX: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [width, 0]
              })
            }],
            opacity: slideAnimation.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 0.3, 1]
            })
          }
        ]}
      >
        {/* Sticky Back Button */}
        <TouchableOpacity 
          style={styles.stickyBackButtonLogin} 
          onPress={() => {
            if (currentStep === 2) {
              Animated.timing(slideAnimation, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
              }).start(() => {
                setCurrentStep(1);
              });
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#0ea5e9" />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >

            {/* Login Form */}
            <View style={styles.formContainerFullScreen}>
              <Text style={styles.formTitle}>Iniciar Sesión</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@ejemplo.com"
                  placeholderTextColor="#a0a0a0"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Tu contraseña"
                  placeholderTextColor="#a0a0a0"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.rememberForgotContainer}>
                <TouchableOpacity style={styles.rememberContainer}>
                  <View style={styles.checkbox} />
                  <Text style={styles.rememberText}>Recordarme</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </Text>
              </TouchableOpacity>

              <View style={styles.registerPrompt}>
                <Text style={styles.registerPromptText}>¿No tienes cuenta?</Text>
                <TouchableOpacity onPress={handleShowRegister}>
                  <Text style={styles.registerLink}>Regístrate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>

      {/* Register Form Screen */}
      <Animated.View 
        style={[
          styles.registerScreenContainer,
          {
            transform: [{
              translateY: registerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [height, 0]
              })
            }],
            opacity: registerAnimation.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 0.3, 1]
            })
          }
        ]}
      >
        {/* Sticky Back Button */}
        <TouchableOpacity 
          style={styles.stickyBackButtonLogin} 
          onPress={() => {
            Animated.timing(registerAnimation, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }).start(() => {
              setCurrentStep(2);
            });
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#0ea5e9" />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* Register Form */}
          <View style={styles.formContainerFullScreen}>
            <Text style={styles.formTitle}>Crear Cuenta</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Tu nombre completo"
                placeholderTextColor="#a0a0a0"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@ejemplo.com"
                placeholderTextColor="#a0a0a0"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#a0a0a0"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#a0a0a0"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backToLoginButton}
              onPress={() => {
                Animated.timing(registerAnimation, {
                  toValue: 0,
                  duration: 600,
                  useNativeDriver: true,
                }).start(() => {
                  setCurrentStep(2);
                });
              }}
            >
              <Text style={styles.backToLoginText}>← Volver al Login</Text>
            </TouchableOpacity>

            <View style={styles.registerPrompt}>
              <Text style={styles.registerPromptText}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => {
                Animated.timing(registerAnimation, {
                  toValue: 0,
                  duration: 600,
                  useNativeDriver: true,
                }).start(() => {
                  setCurrentStep(2);
                });
              }}>
                <Text style={styles.registerLink}>Inicia Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundSvg: {
    position: 'absolute',
  },
  welcomeScreenContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 60,
  },
  loginScreenContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  welcomeContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  welcomeMainTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  welcomeMainSubtitle: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 26,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 32,
  },

  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  stickyBackButtonLogin: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#0ea5e9',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },

  formContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    marginHorizontal: -24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  formContainerFullScreen: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    marginHorizontal: -24,
    marginTop: 120,
    marginBottom: 60,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    marginRight: 8,
  },
  rememberText: {
    fontSize: 14,
    color: '#666666',
  },
  forgotText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerPromptText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 4,
  },
  registerLink: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  registerScreenContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  backToLoginButton: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '500',
  },
});