import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';
import { HeaderClock } from '../components/HeaderClock';

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
  const { transactions: allTransactions, loading } = useStorage();

  const transactions = useMemo(() => {
    if (!currentUser) return [];
    return allTransactions
      .filter(t => t.userId === currentUser.id)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allTransactions, currentUser]);


  const grouped = transactions.reduce((acc: Record<string, any[]>, curr: any) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {});

  const formatRupiah = (num: number) => {
    if (!num || num === 0) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400 font-serif translate-y-1/2 h-full flex flex-col justify-center">{t('loading')}</div>;
  }

  return (
    <div className="px-3 py-6 md:px-6 min-h-full">
      <header className="mb-8 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-gray-800 tracking-tight">{t('hi')}, {currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide">{t('readySales')}</p>
        </div>
        <HeaderClock />
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
                    const recordCount = catTrxs.length;
                    const totalQty = catTrxs.reduce((sum, t) => {
                      if (t.type === 'trade_in') {
                        return sum + (t.qty || 0) + (t.sellQty || 0);
                      }
                      return sum + (t.qty || 0);
                    }, 0);
                    const totalGrams = catTrxs.reduce((sum, t) => {
                      if (t.type === 'trade_in') {
                        return sum + (t.gram || 0) + (t.sellGram || 0);
                      }
                      return sum + (t.gram || 0);
                    }, 0);
                    const totalPrice = catTrxs.reduce((sum, t) => {
                      if (t.type === 'trade_in') {
                        return sum + Math.abs((t.price || 0) - (t.sellPrice || 0));
                      }
                      return sum + (t.price || 0);
                    }, 0);

                    return (
                      <NavLink 
                        key={cat.id} 
                        to={`/category/${cat.id}?date=${dateStr}`}
                        className={`p-4 rounded-3xl overflow-hidden relative shadow-sm border border-white/50 transition-transform active:scale-95 flex flex-col justify-between ${cat.color} min-h-[120px]`}
                      >
                        <h3 className="font-medium text-sm mb-1 z-10 relative opacity-90 uppercase tracking-widest">{t(cat.label)}</h3>
                        <div className="z-10 relative mt-auto">
                          <p className="text-4xl font-serif font-medium mb-2 leading-none">
                            {recordCount} <span className="text-xs font-sans tracking-widest uppercase opacity-75 inline-block -ml-1">TRX</span>
                          </p>
                          <div className="flex gap-2 text-[10px] opacity-75 font-bold tracking-wide uppercase border-t border-current/10 pt-2 flex-wrap">
                            <span>{totalQty} {t('items')}</span>
                            <span>&bull;</span>
                            <span>{totalGrams.toFixed(2)}g</span>
                            <span>&bull;</span>
                            <span>{formatRupiah(totalPrice)}</span>
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
