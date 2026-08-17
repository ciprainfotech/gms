import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [garage, setGarage] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setGarage(data.activeGarage || null);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setGarage(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      setUser(null);
      setGarage(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setGarage(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session_expired', handleSessionExpired);
    };
  }, [checkAuth]);

  const login = useCallback(async (userData, garageData) => {
    setUser(userData);
    setGarage(garageData || null);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('masterWorkingDate');
      setUser(null);
      setGarage(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateGarageState = useCallback((updatedGarage) => {
    setGarage(prev => ({ ...prev, ...updatedGarage }));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      garage,
      isAuthenticated,
      isLoading,
      checkAuth,
      login,
      logout,
      updateGarageState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
