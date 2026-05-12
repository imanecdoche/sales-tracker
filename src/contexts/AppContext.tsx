import React, { createContext, useContext, useEffect, useState } from 'react';

interface Employee {
  id: string;
  name: string;
  role: string;
}

export type AdaptMode = 'auto' | 'portrait' | 'landscape';

interface AppContextType {
  currentUser: Employee | null;
  setCurrentUser: (user: Employee | null) => void;
  isReady: boolean;
  adaptMode: AdaptMode;
  setAdaptMode: (mode: AdaptMode) => void;
  isLandscapeLayout: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [adaptMode, setAdaptModeState] = useState<AdaptMode>(
    (localStorage.getItem('jeweltrack_adapt_mode') as AdaptMode) || 'auto'
  );
  const [isClientLandscape, setIsClientLandscape] = useState(false);

  useEffect(() => {
    const initUser = () => {
      const stored = localStorage.getItem('jeweltrack_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
      setIsReady(true);
    };

    initUser();
  }, []);

  useEffect(() => {
    const checkLandscape = () => {
      setIsClientLandscape(window.innerWidth > window.innerHeight || window.innerWidth >= 768);
    };
    checkLandscape();
    window.addEventListener('resize', checkLandscape);
    return () => window.removeEventListener('resize', checkLandscape);
  }, []);

  const handleSetUser = (user: Employee | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('jeweltrack_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('jeweltrack_user');
    }
  };

  const handleSetAdaptMode = (mode: AdaptMode) => {
    localStorage.setItem('jeweltrack_adapt_mode', mode);
    setAdaptModeState(mode);
  };

  const isLandscapeLayout = adaptMode === 'landscape' ? true : (adaptMode === 'portrait' ? false : isClientLandscape);

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser: handleSetUser, isReady, 
      adaptMode, setAdaptMode: handleSetAdaptMode, isLandscapeLayout 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
