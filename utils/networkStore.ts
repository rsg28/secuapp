/**
 * Module-level store for network status.
 * Updated by useNetworkStatus hook; read by offline utilities.
 */
let _isOffline = false;

export const setNetworkStatus = (isOffline: boolean) => {
  _isOffline = isOffline;
};

export const getIsOffline = (): boolean => _isOffline;
