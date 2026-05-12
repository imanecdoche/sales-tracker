import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function BottomNav() {
  const { setCurrentUser } = useApp();
  const location = useLocation();

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#b68c5b]' : 'text-gray-400 hover:text-gray-600'}`
        }
      >
        <Home size={24} strokeWidth={isActive("/add") ? 2 : (location.pathname === '/' ? 2.5 : 2)} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Home</span>
      </NavLink>

      <NavLink 
        to="/add" 
        className="relative -top-6 bg-[#b68c5b] text-white p-4 rounded-full shadow-lg shadow-[#b68c5b]/30 transform transition-transform active:scale-95"
      >
        <Plus size={28} strokeWidth={2.5} />
      </NavLink>

      <NavLink 
        to="/settings" 
        className={({ isActive }) => 
          `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-[#b68c5b]' : 'text-gray-400 hover:text-gray-600'}`
        }
      >
        <User size={24} strokeWidth={2} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
      </NavLink>
    </div>
  );
}

function isActive(path: string) {
  return window.location.pathname === path;
}
