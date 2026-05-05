'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useChatStore } from './chat-store';

const SocketContext = createContext<WebSocket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode, isAuthenticated: boolean }> = ({ children, isAuthenticated }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const { addMessage, markAsRead } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}/api/ws`);

    socket.onopen = () => {
      console.log('WebSocket Connected');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message.created') {
        addMessage(data.payload.conversationId, data.payload);
      } else if (data.type === 'message.read') {
        // Handle message read update
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [addMessage, markAsRead]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
