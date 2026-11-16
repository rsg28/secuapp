import { Alert, Platform } from 'react-native';

/** Confirmación Sí/No que también funciona en web (Alert.alert con botones no hace nada ahí). */
export function confirmAction(
  title: string,
  message: string,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  destructive = false
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: false }
    )
  );
}
