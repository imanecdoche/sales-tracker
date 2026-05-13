import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';
import { useDialog } from '../contexts/DialogContext';
import { User, LogOut, ShieldCheck, ShieldAlert, Plus, X, MonitorSmartphone, Database, Cloud, Tablet, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { currentUser, setCurrentUser, adaptMode, setAdaptMode } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const { mode, setModeWithSync, employees, loading, addEmployee, updateEmployee } = useStorage();
  const { confirm } = useDialog();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      await updateEmployee(id, { active: !active });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addEmployee({
        name: newName.trim(),
        active: true,
        role: 'staff'
      });
      setNewName('');
      setIsAdding(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      message: t('switchAccount'),
      confirmText: 'Logout',
    });
    if (isConfirmed) {
      setCurrentUser(null);
      navigate('/');
    }
  };

  const handleToggleStorage = async (newMode: 'local' | 'firestore') => {
    if (mode === newMode) return;

    if (newMode === 'firestore') {
      const localTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
      const localEmps = JSON.parse(localStorage.getItem('jeweltrack_local_employees') || '[]');
      if (localTrxs.length > 0 || localEmps.length > 0) {
        const syncConfirmed = await confirm({
          message: t('syncPrompt'),
          confirmText: 'Sync to Cloud'
        });
        if (syncConfirmed) {
          await setModeWithSync('firestore', true);
        } else {
          const deleteConfirmed = await confirm({
            message: t('deleteLocalPrompt'),
            confirmText: 'Switch Anyway'
          });
          if (deleteConfirmed) {
            await setModeWithSync('firestore', false);
          }
        }
      } else {
        await setModeWithSync('firestore', false);
      }
    } else {
      await setModeWithSync('local');
    }
  };

  const languages = [
    { code: 'id', name: '🇮🇩 Indonesia' },
    { code: 'en', name: '🇺🇸 English' },
    { code: 'es', name: '🇪🇸 Español' },
    { code: 'zh', name: '🇨🇳 Mandarin' },
    { code: 'tl', name: '🇵🇭 Tagalog' },
  ];

  if (loading) {
    return <div className="p-12 text-center text-gray-400 font-serif">{t('loading')}</div>;
  }

  return (
    <div className="px-4 py-6 md:p-6 min-h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-gray-800 tracking-tight">{t('settings')}</h1>
        <p className="text-sm text-gray-500 font-medium">{t('manageEmployees')}</p>
      </header>

      <div className="space-y-6 pb-20">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('currentAccount')}</h2>
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#b68c5b]/10 flex items-center justify-center text-[#b68c5b]">
                <User size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{currentUser?.name}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{currentUser?.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-50"
            >
              <LogOut size={20} />
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 ml-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('employeeList')}</h2>
            <button 
              onClick={() => setIsAdding(true)}
              className="text-xs font-bold text-[#b68c5b] uppercase tracking-wider flex items-center gap-1"
            >
              <Plus size={14} /> {t('addNew')}
            </button>
          </div>
          
          <div className="space-y-3">
            {isAdding && (
              <form onSubmit={handleAddEmployee} className="bg-white rounded-[20px] p-4 shadow-md border border-[#b68c5b]/20 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  autoFocus
                  type="text"
                  placeholder="Employee Name"
                  className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
                <button type="submit" className="bg-[#b68c5b] text-white px-4 rounded-xl text-sm font-medium">Add</button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-2 text-gray-400"><X size={18} /></button>
              </form>
            )}
            
            {employees.map(emp => (
              <div key={emp.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${emp.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300'}`} />
                  <span className={`font-medium ${!emp.active ? 'text-gray-400' : 'text-gray-700'}`}>{emp.name}</span>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => toggleStatus(emp.id, emp.active)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      emp.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {emp.active ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('storageMode')}</h2>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex gap-2">
            <button
              onClick={() => handleToggleStorage('local')}
              className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                mode === 'local'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Database size={24} />
              <div className="text-center">
                <p className="text-sm font-bold mb-1">Local</p>
                <p className="text-[10px] font-medium opacity-80 leading-tight">{t('localDesc')}</p>
              </div>
            </button>
            <button
              onClick={() => handleToggleStorage('firestore')}
              className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                mode === 'firestore'
                  ? 'bg-[#b68c5b] text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Cloud size={24} />
              <div className="text-center">
                <p className="text-sm font-bold mb-1">Cloud</p>
                <p className="text-[10px] font-medium opacity-80 leading-tight">{t('firestoreDesc')}</p>
              </div>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('language')}</h2>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`flex-1 min-w-[100px] py-3 px-4 rounded-2xl text-sm font-medium transition-all ${
                  language === lang.code 
                    ? 'bg-[#b68c5b] text-white shadow-md scale-105' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">Data Management</h2>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex flex-col gap-2">
            <button
              onClick={() => navigate('/add-past')}
              className="flex items-center gap-4 py-3 px-4 rounded-2xl transition-all bg-gray-50 text-gray-600 hover:bg-gray-100 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#b68c5b]/10 flex items-center justify-center text-[#b68c5b]">
                <Plus size={16} />
              </div>
              <div>
                <span className="text-sm font-bold block mb-0.5">Add Past Data</span>
                <span className="text-[10px] text-gray-500 font-medium">Input historical transaction totals manually</span>
              </div>
            </button>
            
            <button
              onClick={async () => {
                const isConfirmed = await confirm({
                  message: "Upload current local data to Firestore? This will switch your storage mode to Cloud.",
                  confirmText: "Upload & Sync"
                });
                if (isConfirmed) {
                  await setModeWithSync('firestore', true);
                }
              }}
              className="flex items-center gap-4 py-3 px-4 rounded-2xl transition-all bg-gray-50 text-gray-600 hover:bg-gray-100 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Cloud size={16} />
              </div>
              <div>
                <span className="text-sm font-bold block mb-0.5">Update &amp; Sync Data</span>
                <span className="text-[10px] text-gray-500 font-medium">Upload local data to Cloud and switch mode</span>
              </div>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('screenAdaptation')}</h2>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex flex-col gap-2">
            {[
              { id: 'auto', label: 'adaptAuto', icon: MonitorSmartphone },
              { id: 'portrait', label: 'adaptPortrait', icon: Smartphone },
              { id: 'landscape', label: 'adaptLandscape', icon: Tablet }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setAdaptMode(option.id as any)}
                className={`flex items-center gap-4 py-3 px-4 rounded-2xl transition-all ${
                  adaptMode === option.id 
                    ? 'bg-[#b68c5b] text-white shadow-md' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <option.icon size={20} className={adaptMode === option.id ? 'text-white' : 'text-gray-400'} />
                <span className="text-sm font-medium">{t(option.label)}</span>
                {adaptMode === option.id && <div className="ml-auto px-2 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">{t('enabled')}</div>}
              </button>
            ))}
          </div>
        </section>

        <section className="pt-4">
          <div className="bg-[#b68c5b]/5 rounded-[24px] p-6 border border-[#b68c5b]/10 text-center">
            <p className="text-xs text-[#b68c5b] font-medium leading-relaxed italic">
              "Excellence is not a skill, it's an attitude. Keep tracking, keep growing."
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
