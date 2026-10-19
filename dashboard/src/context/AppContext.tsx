// PawSense360 — App Context (global state)

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TelemetrySnapshot, Alert, AppSettings, HealthHistory, ActivityHistory } from '../types';
import {
  fetchTelemetry, fetchAlerts, fetchHealthHistory, fetchActivityHistory,
  loadSettings, saveSettings,
} from '../services/telemetryService';

interface AppContextValue {
  telemetry: TelemetrySnapshot | null;
  alerts: Alert[];
  healthHistory: HealthHistory;
  activityHistory: ActivityHistory;
  settings: AppSettings;
  isLoading: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  refresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [healthHistory, setHealthHistory] = useState<HealthHistory>({ heartRate: [], spo2: [] });
  const [activityHistory, setActivityHistory] = useState<ActivityHistory>({ events: [] });
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings());
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [snap, alertData] = await Promise.all([
        fetchTelemetry(settings),
        fetchAlerts(settings),
      ]);
      setTelemetry(snap);
      setAlerts(alertData);
    } catch (e) {
      console.error('[AppContext] Refresh error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  const refreshHistorical = useCallback(async () => {
    const [hh, ah] = await Promise.all([
      fetchHealthHistory(settings),
      fetchActivityHistory(settings),
    ]);
    setHealthHistory(hh);
    setActivityHistory(ah);
  }, [settings]);

  useEffect(() => {
    setIsLoading(true);
    refresh();
    refreshHistorical();
  }, [settings.demoMode]); // Re-fetch when mode switches

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(refresh, settings.refreshIntervalMs);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh, settings.refreshIntervalMs]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      telemetry, alerts, healthHistory, activityHistory,
      settings, isLoading, sidebarOpen, setSidebarOpen,
      updateSettings, refresh,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
