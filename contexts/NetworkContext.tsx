import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { processOfflineQueue } from '../services/offlineSync';
import { setNetworkStatus } from '../utils/networkStore';

interface NetworkContextType {
  isOffline: boolean;
  isConnected: boolean | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetworkContext = () => {
  const ctx = useContext(NetworkContext);
  if (ctx === undefined) throw new Error('useNetworkContext must be used within NetworkProvider');
  return ctx;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let wasOffline = false;
    const appStateRef = { current: AppState.currentState };

    const resolveOnline = (state: NetInfoState): boolean => {
      // isConnected: enlazado a red (wifi/datos)
      // isInternetReachable: valida salida real a internet
      const connected = state.isConnected ?? false;
      const internetReachable = state.isInternetReachable;
      return connected && internetReachable !== false;
    };

    const runSync = () => {
      processOfflineQueue((result) => {
        if (result.count > 0) {
          console.log(`[NetworkProvider] Sincronizados ${result.count} items offline`);
        }
        if (result.errors.length > 0) {
          console.warn('[NetworkProvider] Errores al sincronizar:', result.errors);
        }
      });
    };

    // Al iniciar: si ya hay internet, sincronizar pendientes (ej: app abierta con conexión tras guardar offline)
    NetInfo.fetch().then((state: NetInfoState) => {
      const online = resolveOnline(state);
      const offline = !online;
      setIsConnected(online);
      setNetworkStatus(offline);
      wasOffline = offline;
      if (online) runSync();
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = resolveOnline(state);
      const offline = !online;
      setIsConnected(online);
      setNetworkStatus(offline);

      if (wasOffline && online) {
        runSync();
      }
      wasOffline = offline;
    });

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // Al volver al foreground refrescamos estado real de internet
        NetInfo.fetch().then((state: NetInfoState) => {
          const online = resolveOnline(state);
          const offline = !online;
          setIsConnected(online);
          setNetworkStatus(offline);
          if (wasOffline && online) {
            runSync();
          }
          wasOffline = offline;
        });
      }
      appStateRef.current = nextState;
    });

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, []);

  const value: NetworkContextType = {
    isOffline: isConnected === false,
    isConnected,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
