import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, LogOut, ShieldCheck, ShieldAlert, Plus, X, MonitorSmartphone, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { currentUser, setCurrentUser } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(users);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'users', id), { active: !active });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await addDoc(collection(db, 'users'), {
        name: newName.trim(),
        active: true,
        role: 'staff'
      });
      setNewName('');
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  const handleLogout = () => {
    if (window.confirm(t('switchAccount'))) {
      setCurrentUser(null);
      navigate('/');
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
    <div className="p-6 min-h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-gray-800 tracking-tight">{t('settings')}</h1>
        <p className="text-sm text-gray-500 font-medium">{t('manageEmployees')}</p>
      </header>

      <div className="space-y-6">
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('screenAdaptation')}</h2>
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MonitorSmartphone size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{t('screenAdaptation')}</p>
                <p className="text-xs text-gray-400">{t('responsiveActive')}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
              {t('enabled')}
            </div>
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
