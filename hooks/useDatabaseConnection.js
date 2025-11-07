/**
 * Hook para verificar la conexión a la base de datos
 * 
 * Este hook se encarga de verificar que la aplicación pueda conectarse
 * correctamente al backend en EC2. Hace una llamada al endpoint de health
 * para confirmar que el servidor y la base de datos están funcionando.
 * 
 * Funciones incluidas:
 * - checkConnection: Verifica la conexión al backend
 * - Estados: isConnected, loading, error, connectionMessage
 * 
 * Uso: Se usa automáticamente en DatabaseConnectionDebug para mostrar
 * el estado de conexión en la interfaz de usuario.
 * 
 * @returns {object} Objeto con estado de conexión y función de verificación
 */
import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para verificar la conexión a la base de datos
export const useDatabaseConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState('');

  // Verificar conexión a la base de datos
  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Hacer una llamada simple al endpoint de health para verificar conexión
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000, // 15 segundos de timeout
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setConnectionMessage('Base de datos conectada correctamente');
        setError(null);
      } else {
        const errorText = await response.text();
        setIsConnected(false);
        setConnectionMessage(`Error ${response.status}: ${response.statusText}`);
        setError(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      setIsConnected(false);
      setConnectionMessage(`Error de red: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar conexión automáticamente al montar el componente
  useEffect(() => {
    checkConnection();
  }, []);

  return {
    isConnected,
    loading,
    error,
    connectionMessage,
    checkConnection
  };
};
