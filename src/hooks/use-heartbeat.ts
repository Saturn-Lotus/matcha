'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api';

const HEARTBEAT_URL = '/api/users/heartbeat';
const HEARTBEAT_INTERVAL_MS = 60_000;

function sendOnline() {
  try {
    apiClient.post(HEARTBEAT_URL, { online: true });
  } catch {
    // Silently ignore errors — heartbeat is best-effort and should not disrupt user experience
  }
}

function sendOffline() {
  const blob = new Blob([JSON.stringify({ online: false })], {
    type: 'application/json',
  });
  navigator.sendBeacon(HEARTBEAT_URL, blob);
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
