// client/src/net/AuthContext.jsx — Authentication Context with guest tokens & P1/P2 switcher
import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setToken, getToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePlayer, setActivePlayer] = useState(0); // 0 = Player 1, 1 = Player 2 (for local pass-and-play)

  // Initialize or fetch guest/user on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.user);
          setLoading(false);
          return;
        } catch (err) {
          console.warn('[auth] Token expired or invalid, generating guest:', err.message);
          setToken(null);
        }
      }

      // Automatically create a device-bound guest if no session
      let guestToken = localStorage.getItem('ra_guest_device_token');
      if (!guestToken) {
        guestToken = 'gst_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem('ra_guest_device_token', guestToken);
      }

      try {
        const guestName = localStorage.getItem('ra_guest_name') || `Rival_${guestToken.slice(-4)}`;
        const res = await api.post('/auth/guest', {
          username: guestName,
          guestToken,
        });
        setToken(res.token);
        setUser(res.user);
      } catch (err) {
        // Fallback offline mock user if server/database is offline
        const offlineGuest = {
          _id: 'guest_local_' + guestToken.slice(-6),
          username: 'Challenger',
          isGuest: true,
          wins: 0,
          losses: 0,
        };
        setUser(offlineGuest);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (username, password) => {
    const res = await api.post('/auth/register', { username, password });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('ra_token');
    const guestToken = localStorage.getItem('ra_guest_device_token') || 'gst_local';
    setUser({
      _id: 'guest_' + guestToken.slice(-4),
      username: 'Guest',
      isGuest: true,
      wins: 0,
      losses: 0,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        activePlayer,
        setActivePlayer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
