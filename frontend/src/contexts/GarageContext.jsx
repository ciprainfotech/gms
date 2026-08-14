import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';

const GarageContext = createContext(null);

export const GarageProvider = ({ children }) => {
  const { isAuthenticated, garage: authGarage, updateGarageState } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.garage || null);
        if (data.garage) {
          updateGarageState(data.garage);
        }
      }
    } catch (err) {
      setError('Failed to load garage profile');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, updateGarageState]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, fetchProfile]);

  const activeGarage = profile || authGarage;
  const isSuspended = activeGarage?.is_active === false;

  const features = {
    stock: activeGarage?.feature_stock === true,
    purchase: activeGarage?.feature_purchase === true,
    analytics: activeGarage?.feature_analytics === true,
    reminders: activeGarage?.feature_reminders === true,
    tasks: activeGarage?.feature_tasks === true,
    whatsapp: activeGarage?.feature_whatsapp === true,
    whatsappUtility: activeGarage?.feature_whatsapp_utility !== false,
    whatsappMarketing: activeGarage?.feature_whatsapp_marketing !== false,
    whatsappCosting: activeGarage?.feature_whatsapp_costing !== false,
    payroll: activeGarage?.feature_payroll !== false,
  };

  return (
    <GarageContext.Provider value={{
      garage: activeGarage,
      profile,
      features,
      isSuspended,
      isLoading,
      error,
      refreshGarage: fetchProfile
    }}>
      {children}
    </GarageContext.Provider>
  );
};

export const useGarage = () => {
  const context = useContext(GarageContext);
  if (!context) {
    throw new Error('useGarage must be used within a GarageProvider');
  }
  return context;
};

export default GarageContext;
