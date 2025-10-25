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
      
      console.log('🔍 Verificando conexión a la base de datos...');
      console.log('🌐 URL:', `${API_BASE_URL}/health`);
      
      // Hacer una llamada simple al endpoint de health para verificar conexión
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000, // 15 segundos de timeout
      });

      console.log('📡 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conexión exitosa:', data);
        setIsConnected(true);
        setConnectionMessage('Base de datos conectada correctamente');
        setError(null);
      } else {
        console.log('❌ Error de respuesta:', response.status);
        const errorText = await response.text();
        console.log('❌ Error body:', errorText);
        setIsConnected(false);
        setConnectionMessage(`Error ${response.status}: ${response.statusText}`);
        setError(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.log('❌ Error de conexión:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
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
