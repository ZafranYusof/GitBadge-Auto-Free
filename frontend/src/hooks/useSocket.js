import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useSocket(username) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [farmProgress, setFarmProgress] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const [badgeUnlocks, setBadgeUnlocks] = useState([]);

  const dismissBadgeUnlock = useCallback((timestamp) => {
    setBadgeUnlocks(prev => prev.filter(b => b.timestamp !== timestamp));
  }, []);

  useEffect(() => {
    if (!username) return;

    const socket = io('/', {
      withCredentials: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', username);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('farm:progress', (data) => {
      setFarmProgress(data);
    });

    socket.on('farm:ratelimit', (data) => {
      setRateLimit(data);
    });

    socket.on('farm:repo-deleted', (data) => {
      // Could trigger a notification
    });

    socket.on('badge:unlocked', (data) => {
      setBadgeUnlocks(prev => [data, ...prev].slice(0, 10));
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  return { connected, farmProgress, rateLimit, badgeUnlocks, dismissBadgeUnlock, socket: socketRef.current };
}
