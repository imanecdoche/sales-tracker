import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';

interface Employee {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export type AdaptMode = 'auto' | 'portrait' | 'landscape';

interface AppContextType {
  currentUser: Employee | null;
  setCurrentUser: (user: Employee | null) => void;
  firebaseUser: FirebaseUser | null;
  isReady: boolean;
  adaptMode: AdaptMode;
  setAdaptMode: (mode: AdaptMode) => void;
  isLandscapeLayout: boolean;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [adaptMode, setAdaptModeState] = useState<AdaptMode>(
    (localStorage.getItem('jeweltrack_adapt_mode') as AdaptMode) || 'auto'
  );
  const [isClientLandscape, setIsClientLandscape] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // We still keep the employee profile logic but link it to the firebase user
        const stored = localStorage.getItem(`jeweltrack_user_${user.uid}`);
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        } else {
          setCurrentUser({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'owner',
            email: user.email || ''
          });
        }
      } else {
        setCurrentUser(null);
      }
      setIsReady(true);
    });

    return () => unsubscribe();
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
    if (user && firebaseUser) {
      localStorage.setItem(`jeweltrack_user_${firebaseUser.uid}`, JSON.stringify(user));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const handleSetAdaptMode = (mode: AdaptMode) => {
    localStorage.setItem('jeweltrack_adapt_mode', mode);
    setAdaptModeState(mode);
  };

  const isLandscapeLayout = adaptMode === 'landscape' ? true : (adaptMode === 'portrait' ? false : isClientLandscape);

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser: handleSetUser, firebaseUser, isReady, 
      adaptMode, setAdaptMode: handleSetAdaptMode, isLandscapeLayout,
      logout
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
