import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useApp } from '../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const CATEGORIES = [
  { id: 'sell', label: 'cat_sell', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'buyback', label: 'cat_buyback', color: 'bg-rose-50 text-rose-700' },
  { id: 'trade_in', label: 'cat_trade_in', color: 'bg-blue-50 text-blue-700' },
  { id: 'reviews', label: 'cat_reviews', color: 'bg-purple-50 text-purple-700' },
  { id: 'services', label: 'cat_services', color: 'bg-amber-50 text-amber-700' },
  { id: 'cnn', label: 'cat_cnn', color: 'bg-slate-50 text-slate-700' },
];

export default function Dashboard() {
  const { currentUser } = useApp();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    // We fetch the last 30 days of transactions for this user
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.id),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(trxs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const grouped = transactions.reduce((acc: Record<string, any[]>, curr: any) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {});

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400 font-serif translate-y-1/2 h-full flex flex-col justify-center">{t('loading')}</div>;
  }

  return (
    <div className="p-6 min-h-full">
      <header className="mb-8">
        <h1 className="text-2xl font-serif text-gray-800 tracking-tight">{t('hi')}, {currentUser?.name.split(' ')[0]}!</h1>
        <p className="text-sm text-gray-500 font-medium tracking-wide">{t('readySales')}</p>
      </header>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          <p className="font-serif">{t('noTransactions')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped as Record<string, any[]>).map(([dateStr, trxs]) => {
            const dateObj = parseISO(dateStr);
            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div key={dateStr}>
                <h2 className="text-lg font-serif font-medium text-gray-800 mb-4 border-b border-gray-200/50 pb-2">
                  {isToday ? t('today') : format(dateObj, 'dd MMM yyyy')}
                </h2>
                
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => {
                    const catTrxs = trxs.filter(t => t.type === cat.id);
                    const totalQty = catTrxs.reduce((sum, t) => sum + t.qty, 0);
                    const totalGrams = catTrxs.reduce((sum, t) => sum + t.gram, 0);
                    const totalPrice = catTrxs.reduce((sum, t) => sum + t.price, 0);

                    return (
                      <NavLink 
                        key={cat.id} 
                        to={`/category/${cat.id}?date=${dateStr}`}
                        className={`p-4 rounded-3xl overflow-hidden relative shadow-sm border border-white/50 transition-transform active:scale-95 ${cat.color}`}
                      >
                        <h3 className="font-medium text-sm mb-3 z-10 relative opacity-90">{t(cat.label)}</h3>
                        <div className="z-10 relative">
                          <p className="text-xl font-light mb-1">
                            {formatRupiah(totalPrice)}
                          </p>
                          <div className="flex gap-3 text-xs opacity-75 font-medium tracking-wide border-t border-current/10 pt-2 mt-2">
                            <span>{totalQty} {t('items')}</span>
                            <span>{totalGrams.toFixed(2)}g</span>
                          </div>
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
