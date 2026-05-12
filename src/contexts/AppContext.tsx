import React, { createContext, useContext, useEffect, useState } from 'react';

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface AppContextType {
  currentUser: Employee | null;
  setCurrentUser: (user: Employee | null) => void;
  isReady: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isReady, setIsReady] = useState(false);

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

  const handleSetUser = (user: Employee | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('jeweltrack_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('jeweltrack_user');
    }
  };

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser: handleSetUser, isReady }}>
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
