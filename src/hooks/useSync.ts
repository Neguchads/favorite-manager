import { useState, useEffect, useCallback } from 'react';
import {
  crossBrowserSyncService,
  SyncStatus,
  SyncPeer,
  generateSyncKey,
  detectBrowserName,
} from '../services/sync';

export function useSync() {
  const [syncKey, setSyncKey] = useState<string | null>(crossBrowserSyncService.getSyncKey());
  const [status, setStatus] = useState<SyncStatus>(crossBrowserSyncService.getStatus());
  const [peers, setPeers] = useState<SyncPeer[]>(crossBrowserSyncService.getActivePeers());
  const [autoSync, setAutoSyncState] = useState<boolean>(crossBrowserSyncService.isAutoSyncEnabled());
  const myBrowser = detectBrowserName();

  useEffect(() => {
    const unsubscribe = crossBrowserSyncService.subscribe(() => {
      setSyncKey(crossBrowserSyncService.getSyncKey());
      setStatus(crossBrowserSyncService.getStatus());
      setPeers(crossBrowserSyncService.getActivePeers());
      setAutoSyncState(crossBrowserSyncService.isAutoSyncEnabled());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback((key: string) => {
    crossBrowserSyncService.connect(key);
  }, []);

  const disconnect = useCallback(() => {
    crossBrowserSyncService.disconnect();
  }, []);

  const clearKey = useCallback(() => {
    crossBrowserSyncService.clearSyncKey();
  }, []);

  const generateNewKey = useCallback(() => {
    const newKey = generateSyncKey();
    crossBrowserSyncService.connect(newKey);
    return newKey;
  }, []);

  const setAutoSync = useCallback((enabled: boolean) => {
    crossBrowserSyncService.setAutoSyncEnabled(enabled);
  }, []);

  const triggerMerge = useCallback(async () => {
    await crossBrowserSyncService.triggerTwoWayMerge();
  }, []);

  return {
    syncKey,
    status,
    peers,
    autoSync,
    myBrowser,
    connect,
    disconnect,
    clearKey,
    generateNewKey,
    setAutoSync,
    triggerMerge,
  };
}
