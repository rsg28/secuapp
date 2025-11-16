import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Welcome, 2 = Login Form, 3 = Register Form
  const [slideAnimation] = useState(new Animated.Value(0));
  const [registerAnimation] = useState(new Animated.Value(0));
  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  
  const { login, register } = useAuth();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();

  const responsive = useMemo(() => {
    const welcomePaddingHorizontal = Math.max(24, viewportWidth * 0.08);
    const welcomePaddingTop = Math.max(60, viewportHeight * 0.12);
    const welcomePaddingBottom = Math.max(48, viewportHeight * 0.08);
    const welcomeTitleSize = Math.max(34, Math.min(48, viewportWidth * 0.12));
    const welcomeSubtitleSize = Math.max(16, Math.min(22, viewportWidth * 0.055));
    const welcomeSpacing = Math.max(20, viewportHeight * 0.04);
    const nextButtonSize = Math.max(56, Math.min(78, viewportWidth * 0.18));
    const stickyButtonSize = Math.max(46, viewportWidth * 0.12);

    return {
      welcomePaddingHorizontal,
      welcomePaddingTop,
      welcomePaddingBottom,
      welcomeTitleSize,
      welcomeSubtitleSize,
      welcomeSpacing,
      nextButtonSize,
      nextButtonIconSize: Math.max(22, Math.min(30, viewportWidth * 0.075)),
      stickyButtonSize,
      stickyButtonTop: Math.max(48, viewportHeight * 0.08),
      stickyButtonLeft: Math.max(20, viewportWidth * 0.06),
      scrollPaddingHorizontal: Math.max(24, viewportWidth * 0.07),
      scrollPaddingTop: Math.max(60, viewportHeight * 0.1),
      formPaddingHorizontal: Math.max(24, viewportWidth * 0.07),
      formPaddingVertical: Math.max(28, viewportHeight * 0.045),
      formMarginTop: Math.max(100, viewportHeight * 0.13),
      formMarginBottom: Math.max(48, viewportHeight * 0.1),
      formTitleSize: Math.max(26, Math.min(32, viewportWidth * 0.08)),
      inputPadding: Math.max(14, viewportHeight * 0.018),
      inputFontSize: Math.max(15, viewportWidth * 0.04),
      labelFontSize: Math.max(13, viewportWidth * 0.035),
      buttonPaddingVertical: Math.max(14, viewportHeight * 0.02),
      buttonFontSize: Math.max(16, viewportWidth * 0.045),
      smallTextSize: Math.max(13, viewportWidth * 0.035),
    };
  }, [viewportWidth, viewportHeight]);

  const handleNext = () => {
    setCurrentStep(2);
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleShowRegister = () => {
    setPhone('');
    setCurrentStep(3);
    Animated.timing(registerAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !phone.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const success = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim()
      });
      if (success) {
        setPhone('');
        Alert.alert('Éxito', 'Cuenta creada exitosamente', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Error', 'No se pudo crear la cuenta. Inténtalo nuevamente.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo crear la cuenta. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos Requeridos', 'Por favor ingresa tu email y contraseña para continuar');
      return;
    }

    setLoginError(null);
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
        setLoginError('El usuario o contraseña son incorrectos.');
      }
    } catch (error: any) {
      // Manejar diferentes tipos de errores
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setLoginError('El usuario o contraseña son incorrectos.');
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        Alert.alert(
          'Error de Conexión', 
          'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta de nuevo.',
          [
            { text: 'Reintentar', style: 'default' }
          ]
        );
      } else if (error.message?.includes('500')) {
        setLoginError('El servidor está experimentando problemas. Intenta más tarde.');
      } else {
        setLoginError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
      }
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
        <Svg height={viewportHeight} width={viewportWidth} style={styles.backgroundSvg}>
          {/* Fondo azul principal que cubre más área */}
          <Path
            d={`M0,0 L${viewportWidth},0 L${viewportWidth},${viewportHeight * 0.7} 
                Q${viewportWidth * 0.8},${viewportHeight * 0.65} ${viewportWidth * 0.5},${viewportHeight * 0.75}
                Q${viewportWidth * 0.2},${viewportHeight * 0.85} 0,${viewportHeight * 0.8} Z`}
            fill="#7dd3fc"
          />
          {/* Capa azul más clara encima */}
          <Path
            d={`M0,${viewportHeight * 0.1} 
                Q${viewportWidth * 0.4},${viewportHeight * 0.05} ${viewportWidth * 0.7},${viewportHeight * 0.15}
                Q${viewportWidth * 0.9},${viewportHeight * 0.25} ${viewportWidth},${viewportHeight * 0.3}
                L${viewportWidth},0 L0,0 Z`}
            fill="#bae6fd"
          />
        </Svg>
      </View>

      {/* Welcome Screen */}
      <Animated.View 
        style={[
          styles.welcomeScreenContainer,
          {
            paddingHorizontal: responsive.welcomePaddingHorizontal,
            paddingTop: responsive.welcomePaddingTop,
            paddingBottom: responsive.welcomePaddingBottom,
            transform: [{
              translateX: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -viewportWidth]
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
          <Text style={[styles.welcomeMainTitle, { fontSize: responsive.welcomeTitleSize, marginBottom: responsive.welcomeSpacing }]} >
            Bienvenido
          </Text>
          <Text style={[styles.welcomeMainSubtitle, { fontSize: responsive.welcomeSubtitleSize, lineHeight: responsive.welcomeSubtitleSize * 1.35, marginBottom: responsive.welcomeSpacing * 0.9 }]}>
            Seguridad de Salud{'\n'}en el Trabajo
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              width: responsive.nextButtonSize,
              height: responsive.nextButtonSize,
              borderRadius: responsive.nextButtonSize / 2,
              shadowRadius: responsive.nextButtonSize * 0.18,
              shadowOffset: { width: 0, height: responsive.nextButtonSize * 0.15 },
            }
          ]}
          onPress={handleNext}
        >
          <Ionicons name="arrow-forward" size={responsive.nextButtonIconSize} color="#0ea5e9" />
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
                outputRange: [viewportWidth, 0]
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
          style={[
            styles.stickyBackButtonLogin,
            {
              top: responsive.stickyButtonTop,
              left: responsive.stickyButtonLeft,
              width: responsive.stickyButtonSize,
              height: responsive.stickyButtonSize,
              borderRadius: responsive.stickyButtonSize / 2,
            }
          ]} 
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
          <Ionicons name="arrow-back" size={responsive.nextButtonIconSize} color="#0ea5e9" />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            {
              paddingHorizontal: responsive.scrollPaddingHorizontal,
              paddingTop: responsive.scrollPaddingTop,
              paddingBottom: responsive.formMarginBottom
            }
          ]}
          showsVerticalScrollIndicator={false}
        >

            {/* Login Form */}
            <View style={[
              styles.formContainerFullScreen,
              {
                paddingHorizontal: responsive.formPaddingHorizontal,
                paddingTop: responsive.formPaddingVertical,
                paddingBottom: responsive.formPaddingVertical,
                marginTop: responsive.formMarginTop,
                marginBottom: responsive.formMarginBottom
              }
            ]}>
              <Text style={[styles.formTitle, { fontSize: responsive.formTitleSize }]}>Iniciar Sesión</Text>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { fontSize: responsive.labelFontSize, marginBottom: responsive.inputPadding * 0.4 }]}>Email</Text>
                <TextInput
                  style={[styles.input, { padding: responsive.inputPadding, fontSize: responsive.inputFontSize }]}
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
                <Text style={[styles.inputLabel, { fontSize: responsive.labelFontSize, marginBottom: responsive.inputPadding * 0.4 }]}>Contraseña</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[styles.passwordInput, { padding: responsive.inputPadding, fontSize: responsive.inputFontSize }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Tu contraseña"
                    placeholderTextColor="#a0a0a0"
                    secureTextEntry={!showLoginPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowLoginPassword(prev => !prev)}
                  >
                    <Ionicons name={showLoginPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {loginError && (
                <Text style={styles.loginErrorText}>{loginError}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  {
                    paddingVertical: responsive.buttonPaddingVertical,
                    paddingHorizontal: responsive.formPaddingHorizontal * 0.8
                  },
                  isLoading && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={[styles.loginButtonText, { fontSize: responsive.buttonFontSize }]}>
                  {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </Text>
              </TouchableOpacity>

              <View style={[styles.registerPrompt, { marginTop: responsive.welcomeSpacing * 0.6 }]}>
                <Text style={[styles.registerPromptText, { fontSize: responsive.smallTextSize }]}>¿No tienes cuenta?</Text>
                <TouchableOpacity onPress={handleShowRegister}>
                  <Text style={[styles.registerLink, { fontSize: responsive.smallTextSize }]}>Regístrate</Text>
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
                outputRange: [viewportHeight, 0]
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
          style={[
            styles.stickyBackButtonLogin,
            {
              top: responsive.stickyButtonTop,
              left: responsive.stickyButtonLeft,
              width: responsive.stickyButtonSize,
              height: responsive.stickyButtonSize,
              borderRadius: responsive.stickyButtonSize / 2,
            }
          ]} 
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
          <Ionicons name="arrow-back" size={responsive.nextButtonIconSize} color="#0ea5e9" />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            {
              paddingHorizontal: responsive.scrollPaddingHorizontal,
              paddingTop: responsive.scrollPaddingTop,
              paddingBottom: responsive.formMarginBottom
            }
          ]}
          showsVerticalScrollIndicator={false}
        >

          {/* Register Form */}
          <View style={[
              styles.formContainerFullScreen,
              {
                paddingHorizontal: responsive.formPaddingHorizontal,
                paddingTop: responsive.formPaddingVertical,
                paddingBottom: responsive.formPaddingVertical,
                marginTop: responsive.formMarginTop,
                marginBottom: responsive.formMarginBottom
              }
            ]}>
            <Text style={[styles.formTitle, { fontSize: responsive.formTitleSize }]}>Crear Cuenta</Text>
            
            <View style={styles.nameRow}>
              <View style={styles.nameInputWrapper}>
                <Text style={[styles.inputLabel, { fontSize: responsive.labelFontSize, marginBottom: responsive.inputPadding * 0.4 }]}>Nombre</Text>
                <TextInput
                  style={[styles.input, { padding: responsive.inputPadding, fontSize: responsive.inputFontSize }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nombre"
                  placeholderTextColor="#a0a0a0"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.nameInputWrapperRight}>
                <Text style={[styles.inputLabel, { fontSize: responsive.labelFontSize, marginBottom: responsive.inputPadding * 0.4 }]}>Apellido</Text>
                <TextInput
                  style={[styles.input, { padding: responsive.inputPadding, fontSize: responsive.inputFontSize }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Apellido"
                  placeholderTextColor="#a0a0a0"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { fontSize: responsive.labelFontSize, marginBottom: responsive.inputPadding * 0.4 }]}>Teléfono</Text>
              <TextInput
                style={[styles.input, { padding: responsive.inputPadding, fontSize: responsive.inputFontSize }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Ej. +51 999 999 999"
                placeholderTextColor="#a0a0a0"
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { fontSize: responsive.labelFontSize, marginBottom: responsive.inputPadding * 0.4 }]}>Email</Text>
              <TextInput
                style={[styles.input, { padding: responsive.inputPadding, fontSize: responsive.inputFontSize }]}
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
              <Text style={[styles.inputLabel, { fontSize: responsive.labelFontSize, marginBottom: responsive.inputPadding * 0.4 }]}>Contraseña</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.passwordInput, { padding: responsive.inputPadding, fontSize: responsive.inputFontSize }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#a0a0a0"
                  secureTextEntry={!showRegisterPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowRegisterPassword(prev => !prev)}
                >
                  <Ionicons name={showRegisterPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { fontSize: responsive.labelFontSize, marginBottom: responsive.inputPadding * 0.4 }]}>Confirmar Contraseña</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.passwordInput, { padding: responsive.inputPadding, fontSize: responsive.inputFontSize }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#a0a0a0"
                  secureTextEntry={!showRegisterConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowRegisterConfirmPassword(prev => !prev)}
                >
                  <Ionicons name={showRegisterConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                {
                  paddingVertical: responsive.buttonPaddingVertical,
                  paddingHorizontal: responsive.formPaddingHorizontal * 0.8
                },
                isLoading && styles.loginButtonDisabled
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={[styles.loginButtonText, { fontSize: responsive.buttonFontSize }]}>
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
              <Text style={[styles.backToLoginText, { fontSize: responsive.buttonFontSize * 0.9 }]}>← Volver al Login</Text>
            </TouchableOpacity>

            <View style={styles.registerPrompt}>
              <Text style={[styles.registerPromptText, { fontSize: responsive.smallTextSize }]}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity onPress={() => {
                Animated.timing(registerAnimation, {
                  toValue: 0,
                  duration: 600,
                  useNativeDriver: true,
                }).start(() => {
                  setCurrentStep(2);
                });
              }}>
                <Text style={[styles.registerLink, { fontSize: responsive.smallTextSize }]}>Inicia Sesión</Text>
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
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  passwordInput: {
    flex: 1,
    color: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  passwordToggle: {
    paddingHorizontal: 12,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
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
  loginErrorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
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
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  nameInputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  nameInputWrapperRight: {
    flex: 1,
    marginLeft: 8,
  },
});