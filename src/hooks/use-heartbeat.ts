'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api';

const HEARTBEAT_INTERVAL_MS = 60_000;
const OFFLINE_URL = '/api/users/heartbeat?online=false';

function sendOnline() {
  apiClient.post('/users/heartbeat?online=true').catch(() => {});
}

function sendOffline() {
  navigator.sendBeacon(OFFLINE_URL);
}

export function useHeartbeat() {
  useEffect(() => {
    sendOnline();

    const interval = setInterval(sendOnline, HEARTBEAT_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.hidden) {
        sendOffline();
      } else {
        sendOnline();
      }
    }

    function handlePageHide() {
      sendOffline();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);
}
