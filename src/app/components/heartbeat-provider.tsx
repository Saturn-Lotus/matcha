'use client';

import { useHeartbeat } from '@/hooks/use-heartbeat';

export function HeartbeatProvider() {
  useHeartbeat();
  return null;
}
