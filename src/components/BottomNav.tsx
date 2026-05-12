import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function BottomNav() {
  const { setCurrentUser } = useApp();
  const location = useLocation();

  return (
    <div className="
      fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.03)]
      landscape:fixed landscape:left-0 landscape:top-0 landscape:bottom-0 landscape:w-24 landscape:h-full landscape:flex-col landscape:justify-center landscape:gap-12 landscape:px-0 landscape:border-t-0 landscape:border-r landscape:rounded-none landscape:rounded-r-3xl
      md:fixed md:left-0 md:top-0 md:bottom-0 md:w-24 md:h-full md:flex-col md:justify-center md:gap-12 md:px-0 md:border-t-0 md:border-r md:rounded-none md:rounded-r-3xl
    ">
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#b68c5b]' : 'text-gray-400 hover:text-gray-600'}`
        }
      >
        <Home size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
      </NavLink>

      <NavLink 
        to="/add" 
        className="
          relative -top-6 bg-[#b68c5b] text-white p-4 rounded-full shadow-lg shadow-[#b68c5b]/30 transform transition-transform active:scale-95
          landscape:relative landscape:top-0 landscape:mx-auto
          md:relative md:top-0 md:mx-auto
        "
      >
        <Plus size={28} strokeWidth={2.5} />
      </NavLink>

      <NavLink 
        to="/settings" 
        className={({ isActive }) => 
          `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#b68c5b]' : 'text-gray-400 hover:text-gray-600'}`
        }
      >
        <User size={24} strokeWidth={location.pathname === '/settings' ? 2.5 : 2} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
      </NavLink>
    </div>
  );
}

function isActive(path: string) {
  return window.location.pathname === path;
}
