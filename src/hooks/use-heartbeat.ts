'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api';

const HEARTBEAT_INTERVAL_MS = 60_000;

function sendHeartbeat() {
  apiClient.post('/users/heartbeat').catch(() => {});
}

export function useHeartbeat() {
  useEffect(() => {
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    function handleVisibilityChange() {
      if (!document.hidden) sendHeartbeat();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
