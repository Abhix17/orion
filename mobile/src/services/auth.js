import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const AuthContext = createContext({});

const DEFAULT_DEMO_USER = {
  id: 'usr_orion_demo_01',
  name: 'Alice Sharma',
  email: 'alice@orion.ai',
  role: 'Security Citizen',
  avatarInitials: 'AS',
  joinedDate: 'March 2026',
  twoFactorEnabled: true,
  tier: 'Enterprise Trust',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('orion_session').then(sessionStr => {
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session && session.user) {
            setUser(session.user);
          }
        } catch (e) {
          console.warn('Failed to restore session');
        }
      }
      setLoading(false);
    });
  }, []);

  const signIn = async (email, password) => {
    // Simulated short realistic handshake delay
    await new Promise((r) => setTimeout(r, 650));

    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }
    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }

    // Verify backend is reachable before allowing sign in
    try {
      await api.health();
    } catch (error) {
      if (error.message.includes('unreachable')) {
        throw new Error('ORION intelligence service is unreachable.');
      }
      throw new Error('Something went wrong. Please try again.');
    }

    // Generate or match user profile
    const nameParts = email.split('@')[0].split(/[._-]/);
    const displayName = nameParts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ') || 'ORION User';

    const initials = nameParts
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'OU';

    const newUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: email === 'alice@orion.ai' ? DEFAULT_DEMO_USER.name : displayName,
      email,
      role: 'Security Citizen',
      avatarInitials: email === 'alice@orion.ai' ? DEFAULT_DEMO_USER.avatarInitials : initials,
      joinedDate: 'October 2026',
      twoFactorEnabled: true,
      tier: 'Standard Trust',
    };

    await AsyncStorage.setItem('orion_session', JSON.stringify({
      user: newUser,
      token: `orion_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginTime: new Date().toISOString(),
    }));
    setUser(newUser);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('orion_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
