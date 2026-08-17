import React, { createContext, useState, useContext, useEffect } from 'react';

const GlobalDateContext = createContext();

export const GlobalDateProvider = ({ children }) => {
    const getTodayString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const today = getTodayString();

    // This initializer runs once when the app loads
    const [workingDate, setWorkingDate] = useState(() => {
        return localStorage.getItem('masterWorkingDate') || today;
    });

    // Sync changes to localStorage so they persist during refreshes
    useEffect(() => {
        localStorage.setItem('masterWorkingDate', workingDate);
    }, [workingDate]);

    return (
        <GlobalDateContext.Provider value={{ workingDate, setWorkingDate, today }}>
            {children}
        </GlobalDateContext.Provider>
    );
};

export const useGlobalDate = () => useContext(GlobalDateContext);