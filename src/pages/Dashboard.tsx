import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';
import { HeaderClock } from '../components/HeaderClock';
import { motion } from 'motion/react';
import { Target, TrendingUp, Trophy, Flame } from 'lucide-react';

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
  const { transactions: allTransactions, transactionSummaries: allSummaries, appTargets, loading } = useStorage();

  const currentStats = useMemo(() => {
    let day = 0;
    let week = 0;
    let month = 0;

    const myTrxs = allTransactions.filter(t => t.userId === currentUser?.id);
    const mySums = allSummaries.filter(s => s.createdBy === currentUser?.id);

    myTrxs.forEach(t => {
      const date = new Date(t.timestamp);
      let grams = 0;
      
      // Only count "Sell" weight (items moving out of store)
      if (t.type === 'sell' || t.type === 'trade_in') {
        grams = t.gram || 0;
      }
      
      if (isToday(date)) day += grams;
      if (isThisWeek(date, { weekStartsOn: 1 })) week += grams;
      if (isThisMonth(date)) month += grams;
    });

    mySums.forEach(s => {
      const d = new Date(`${s.date}T00:00:00`);
      // For summaries, we assume totalGram represents the intended target metric 
      // (usually people track target by sales volume)
      const grams = s.totalGram || 0; 
      
      if (isToday(d)) day += grams;
      if (isThisWeek(d, { weekStartsOn: 1 })) week += grams;
      if (isThisMonth(d)) month += grams;
    });

    return { day, week, month };
  }, [allTransactions, allSummaries, currentUser]);

  const getTagline = (percent: number) => {
    if (percent === 0) return "Let's start the engine!";
    if (percent < 30) return "Keep going! You got this.";
    if (percent < 50) return "Halfway there! Almost home.";
    if (percent < 80) return "You're on fire today!";
    if (percent < 100) return "Almost complete! One more push!";
    return "Target Achieved! Masterpiece!";
  };

  const getWeeklyTagline = (percent: number) => {
     if (percent < 50) return "Step by step, day by day.";
     if (percent < 100) return "Dominating the week!";
     return "Week goal crushed! Amazing!";
  };

  const getMonthlyTagline = (percent: number) => {
    if (percent < 50) return "Consistency is the key to gold.";
    if (percent < 100) return "Legends are made this month!";
    return "GOAT status confirmed! Incredible!";
  };

  const transactions = useMemo(() => {
    if (!currentUser) return [];
    return allTransactions
      .filter(t => t.userId === currentUser.id)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allTransactions, currentUser]);


  const summaries = useMemo(() => {
    if (!currentUser) return [];
    return allSummaries
      .filter(s => s.createdBy === currentUser.id)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allSummaries, currentUser]);

  const grouped = useMemo(() => {
    const acc: Record<string, { details: any[], summary?: any }> = {};
    transactions.forEach((curr: any) => {
      if (!acc[curr.date]) acc[curr.date] = { details: [] };
      acc[curr.date].details.push(curr);
    });

    summaries.forEach((s: any) => {
      const k = s.date;
      if (!acc[k]) acc[k] = { details: [] };
      if (!acc[k].summary) {
        acc[k].summary = s;
      } else {
        const existing = acc[k].summary;
        const combinedCats = { ...existing.categories };
        if (s.categories) {
          Object.keys(s.categories).forEach(cat => {
            combinedCats[cat] = (combinedCats[cat] || 0) + (s.categories[cat] || 0);
          });
        }
        acc[k].summary = {
          ...existing,
          totalTransactions: (existing.totalTransactions || 0) + (s.totalTransactions || 0),
          categories: combinedCats
        };
      }
    });
    return acc;
  }, [transactions, summaries]);

  const sortedDates = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  const formatRupiah = (num: number) => {
    if (!num || num === 0) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400 font-serif translate-y-1/2 h-full flex flex-col justify-center">{t('loading')}</div>;
  }

  return (
    <div className="px-3 py-6 md:px-6 min-h-full">
      <header className="mb-6 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-gray-800 tracking-tight">{t('hi')}, {currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide">{t('readySales')}</p>
        </div>
        <HeaderClock />
      </header>

      {/* Targets Section */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <Target size={16} className="text-[#b68c5b]" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#b68c5b]">Progress &amp; Targets</h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Daily */}
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Daily Goal</p>
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" />
                  <p className="text-lg font-serif font-medium text-gray-800">
                    {currentStats.day.toFixed(2)} 
                    <span className="text-[10px] font-sans text-gray-400 font-bold mx-1">/</span>
                    <span className="text-xs font-sans text-gray-400">{appTargets.daily.toFixed(2)}</span>
                    <span className="text-[10px] font-sans text-orange-500 font-bold ml-2">{(currentStats.day - appTargets.daily).toFixed(2)}g</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#b68c5b] uppercase tracking-widest">Day %</p>
                <p className="text-lg font-serif font-medium text-[#b68c5b]">{Math.min(100, Math.round((currentStats.day / appTargets.daily) * 100))}%</p>
              </div>
            </div>
            
            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (currentStats.day / appTargets.daily) * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 relative"
              >
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg]"
                />
              </motion.div>
            </div>
            <p className="text-[9px] font-medium text-gray-400 mt-2 flex items-center gap-1 italic">
              ✨ {getTagline((currentStats.day / appTargets.daily) * 100)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Weekly */}
            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 overflow-hidden">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weekly</p>
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp size={12} className="text-blue-500" />
                <p className="text-sm font-serif font-medium">
                  {currentStats.week.toFixed(2)}
                  <span className="text-[9px] font-sans text-gray-300 font-bold mx-0.5">/</span>
                  <span className="text-[10px] font-sans text-gray-400">{appTargets.weekly.toFixed(0)}</span>
                  <span className={`text-[9px] font-sans font-bold ml-1.5 ${currentStats.week >= appTargets.weekly ? 'text-blue-600' : 'text-blue-400'}`}>
                    {(currentStats.week - appTargets.weekly).toFixed(2)}g
                  </span>
                </p>
              </div>
              <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden relative">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (currentStats.week / appTargets.weekly) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-blue-500"
                >
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
              <p className="text-[8px] font-medium text-gray-400 mt-2 italic leading-tight">
                {getWeeklyTagline((currentStats.week / appTargets.weekly) * 100)}
              </p>
            </div>

            {/* Monthly */}
            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 overflow-hidden">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Monthly</p>
              <div className="flex items-center gap-1 mb-2">
                <Trophy size={12} className="text-amber-500" />
                <p className="text-sm font-serif font-medium">
                  {currentStats.month.toFixed(2)}
                  <span className="text-[9px] font-sans text-gray-300 font-bold mx-0.5">/</span>
                  <span className="text-[10px] font-sans text-gray-400">{appTargets.monthly.toFixed(0)}</span>
                  <span className={`text-[9px] font-sans font-bold ml-1.5 ${currentStats.month >= appTargets.monthly ? 'text-amber-600' : 'text-[#b68c5b]/70'}`}>
                    {(currentStats.month - appTargets.monthly).toFixed(2)}g
                  </span>
                </p>
              </div>
              <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden relative">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (currentStats.month / appTargets.monthly) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                  className="h-full bg-[#b68c5b]"
                >
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
              <p className="text-[8px] font-medium text-gray-400 mt-2 italic leading-tight">
                {getMonthlyTagline((currentStats.month / appTargets.monthly) * 100)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex justify-end">
        <NavLink 
          to="/add-past"
          className="flex items-center gap-2 bg-white border border-[#b68c5b]/30 text-[#b68c5b] px-4 py-2 rounded-2xl shadow-sm text-xs font-bold uppercase tracking-wider hover:bg-[#FAF9F6] active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><line x1="12" x2="12" y1="14" y2="18"/><line x1="8" x2="16" y1="16" y2="16"/></svg>
          Add Past Data
        </NavLink>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          <p className="font-serif">{t('noTransactions')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateStr) => {
            const dateData = grouped[dateStr];
            const trxs = dateData.details;
            const summaryData = dateData.summary;
            const dateObj = parseISO(dateStr);
            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div key={dateStr}>
                <div className="flex items-center justify-between mb-4 border-b border-gray-200/50 pb-2">
                  <h2 className="text-lg font-serif font-medium text-gray-800">
                    {isToday ? t('today') : format(dateObj, 'dd MMM yyyy')}
                  </h2>
                  {summaryData && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#b68c5b] bg-[#b68c5b]/10 px-2 py-1 rounded-lg">
                      Summary Entry
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => {
                    const catTrxs = trxs.filter((t: any) => t.type === cat.id);
                    let recordCount = catTrxs.length;
                    if (summaryData?.categories?.[cat.id]) {
                      recordCount += summaryData.categories[cat.id];
                    }
                    
                    const isTradeIn = cat.id === 'trade_in';
                    const qtyIn = isTradeIn ? catTrxs.reduce((sum: number, t: any) => sum + (t.sellQty || 0), 0) : 0;
                    const qtyOut = catTrxs.reduce((sum: number, t: any) => sum + (t.qty || 0), 0);
                    const totalQty = isTradeIn ? qtyIn + qtyOut : qtyOut;

                    const totalGrams = catTrxs.reduce((sum: number, t: any) => {
                      if (isTradeIn) {
                        return sum + (t.gram || 0) + (t.sellGram || 0);
                      }
                      return sum + (t.gram || 0);
                    }, 0);
                    const totalPrice = catTrxs.reduce((sum: number, t: any) => {
                      if (isTradeIn) {
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
                            {totalQty > 0 || totalGrams > 0 || totalPrice > 0 ? (
                              <>
                                {totalQty > 0 && <span>{isTradeIn ? `${qtyIn}/${qtyOut}` : totalQty} {t('items')}</span>}
                                {totalQty > 0 && totalGrams > 0 && <span>&bull;</span>}
                                {totalGrams > 0 && <span>{totalGrams.toFixed(2)}g</span>}
                                {(totalQty > 0 || totalGrams > 0) && totalPrice > 0 && <span>&bull;</span>}
                                {totalPrice > 0 && <span>{formatRupiah(totalPrice)}</span>}
                              </>
                            ) : summaryData?.categories?.[cat.id] > 0 ? (
                             <span>N/A</span>
                            ) : (
                              <span>0 {t('items')} &bull; 0.00g &bull; Rp 0</span>
                            )}
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
