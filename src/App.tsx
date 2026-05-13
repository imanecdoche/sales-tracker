import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { StorageProvider } from './contexts/StorageContext';
import { DialogProvider } from './contexts/DialogContext';
import LoginScreen from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import CategoryDetail from './pages/CategoryDetail';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import AddPastData from './pages/AddPastData';
import BottomNav from './components/BottomNav';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser, isReady, isLandscapeLayout } = useApp();
  const location = useLocation();
  
  if (!isReady) {
    return null; // Or a nice splash screen
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const hideNavbarPaths = ['/add', '/edit'];
  const shouldHideNavbar = hideNavbarPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className={`flex h-screen bg-bg-warm shadow-xl overflow-hidden relative ${isLandscapeLayout ? 'flex-row' : 'flex-col'}`}>
      <div className={`flex-1 overflow-y-auto ${!shouldHideNavbar ? (isLandscapeLayout ? 'pb-0 pl-24' : 'pb-32') : ''}`}>
        <div className={`h-full mx-auto ${isLandscapeLayout ? 'w-full max-w-7xl' : 'w-full sm:max-w-[480px] md:max-w-xl'}`}>
          {children}
        </div>
      </div>
      {!shouldHideNavbar && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <LanguageProvider>
        <StorageProvider>
          <DialogProvider>
            <Router>
              <AuthWrapper>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/add" element={<AddTransaction />} />
                  <Route path="/edit/:id" element={<AddTransaction />} />
                  <Route path="/add-past" element={<AddPastData />} />
                  <Route path="/category/:categoryId" element={<CategoryDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AuthWrapper>
            </Router>
          </DialogProvider>
        </StorageProvider>
      </LanguageProvider>
    </AppProvider>
  );
}
