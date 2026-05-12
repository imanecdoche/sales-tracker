import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { User, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';

export default function LoginScreen() {
  const { setCurrentUser } = useApp();
  const { t } = useLanguage();
  const { employees, loading, addEmployee } = useStorage();
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addEmployee({
        name: newName.trim(),
        active: true,
        role: 'staff'
      });
      setIsAdding(false);
      setNewName('');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-serif text-gray-500">{t('loading')}</div>;
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-gray-800">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-[#b68c5b] tracking-tight mb-2">JewelTrack</h1>
          <p className="text-sm font-medium tracking-widest text-gray-400 uppercase">Sales Performance</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif mb-6 text-center">{t('selectEmployee')}</h2>
          
          <div className="space-y-3 mb-6">
            {employees.length === 0 && !isAdding && (
              <p className="text-center text-sm text-gray-400 italic">No employees found. Add one below.</p>
            )}
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => setCurrentUser({ id: emp.id, name: emp.name, role: emp.role })}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-[#b68c5b] hover:text-white transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center border border-gray-200/50">
                    <User size={18} />
                  </div>
                  <span className="font-medium text-lg">{emp.name}</span>
                </div>
              </button>
            ))}
          </div>

          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-4 text-sm font-medium text-[#b68c5b] flex items-center justify-center gap-2 hover:bg-[#b68c5b]/5 rounded-xl transition-colors"
            >
              <Plus size={16} /> {t('addNew')}
            </button>
          ) : (
            <form onSubmit={handleAddEmployee} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Employee Name"
                className="flex-1 min-w-0 bg-gray-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#b68c5b]/20 transition-shadow"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <button type="submit" className="bg-[#b68c5b] text-white px-5 rounded-xl font-medium">Add</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
