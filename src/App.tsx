import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginScreen from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import CategoryDetail from './pages/CategoryDetail';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser, isReady } = useApp();
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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-bg-warm shadow-xl overflow-hidden relative">
      <div className={`flex-1 overflow-y-auto ${!shouldHideNavbar ? 'pb-32' : ''}`}>
        {children}
      </div>
      {!shouldHideNavbar && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AuthWrapper>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/edit/:id" element={<AddTransaction />} />
            <Route path="/category/:categoryId" element={<CategoryDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthWrapper>
      </Router>
    </AppProvider>
  );
}
