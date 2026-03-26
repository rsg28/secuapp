import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { setNetworkStatus } from '../utils/networkStore';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      setIsInternetReachable(state.isInternetReachable ?? null);
      setNetworkStatus(!connected);
    });

    return () => unsubscribe();
  }, []);

  const isOffline = isConnected === false;
  const hasConnection = isConnected === true;

  return {
    isConnected,
    isInternetReachable,
    isOffline,
    hasConnection,
  };
};
