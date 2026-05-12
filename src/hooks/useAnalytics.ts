import { useState, useMemo } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { useApp } from '../contexts/AppContext';
import { isToday, isThisWeek, isThisMonth, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

export type TimeFilter = 'today' | 'week' | 'month' | 'custom';

export function useAnalytics() {
  const { transactions: allTransactions, employees } = useStorage();
  const { currentUser } = useApp();
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions.filter(t => t.type !== 'services' && t.type !== 'cnn');
    
    // Admin sees all, normal user sees their own
    if (currentUser?.role !== 'admin') {
      filtered = filtered.filter(t => t.userId === currentUser?.id);
    }

    filtered = filtered.filter(t => {
      const date = new Date(t.timestamp);
      
      switch (timeFilter) {
        case 'today':
          return isToday(date);
        case 'week':
          return isThisWeek(date, { weekStartsOn: 1 });
        case 'month':
          return isThisMonth(date);
        case 'custom':
          if (startDate && endDate) {
            return isWithinInterval(date, {
              start: startOfDay(parseISO(startDate)),
              end: endOfDay(parseISO(endDate))
            });
          }
          return true; // If dates not selected yet, show all or could be empty.
        default:
          return true;
      }
    });

    return filtered;
  }, [allTransactions, timeFilter, currentUser, startDate, endDate]);

  const summary = useMemo(() => {
    let totalQty = 0;
    let totalGram = 0;
    let totalRevenue = 0; // considering as money moving in or out
    let tradeAdds = 0;
    let tradeRefunds = 0;

    filteredTransactions.forEach(t => {
      // qty/items are not transaction count, but we report them as secondary detail
      const qty = t.type === 'trade_in' ? ((t.qty || 0) + (t.sellQty || 0)) : (t.qty || 0);
      const gram = t.type === 'trade_in' ? ((t.gram || 0) + (t.sellGram || 0)) : (t.gram || 0);
      
      totalQty += qty;
      totalGram += gram;

      if (t.type === 'trade_in') {
        const diff = (t.price || 0) - (t.sellPrice || 0);
        if (diff >= 0) tradeAdds += diff;
        else tradeRefunds += Math.abs(diff);
        totalRevenue += Math.abs(diff); // Or just sum the flow
      } else {
        totalRevenue += t.price || 0;
      }
    });

    return {
      transactionCount: filteredTransactions.length,
      totalQty,
      totalGram,
      totalRevenue,
      tradeAdds,
      tradeRefunds
    };
  }, [filteredTransactions]);

  const categoryDistribution = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      acc[t.type] = (acc[t.type] || 0) + 1;
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);
  
  const employeePerformance = useMemo(() => {
    const acc: Record<string, { count: number, revenue: number, grams: number }> = {};
    filteredTransactions.forEach(t => {
      if (!acc[t.userId]) {
        acc[t.userId] = { count: 0, revenue: 0, grams: 0 };
      }
      acc[t.userId].count += 1;
      
      const gram = t.type === 'trade_in' ? ((t.gram || 0) + (t.sellGram || 0)) : (t.gram || 0);
      acc[t.userId].grams += gram;

      if (t.type === 'trade_in') {
          acc[t.userId].revenue += Math.abs((t.price || 0) - (t.sellPrice || 0));
      } else {
          acc[t.userId].revenue += t.price || 0;
      }
    });

    const perfArray = Object.entries(acc).map(([userId, stats]) => {
      const emp = employees.find(e => e.id === userId);
      return {
        id: userId,
        name: emp?.name || 'Unknown',
        ...stats
      };
    });

    return perfArray.sort((a, b) => b.count - a.count);
  }, [filteredTransactions, employees]);

  const trendData = useMemo(() => {
    const acc: Record<string, { count: number, revenue: number }> = {};
    filteredTransactions.forEach(t => {
      // Grouping by yyyy-MM-dd
      const d = new Date(t.timestamp);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!acc[k]) acc[k] = { count: 0, revenue: 0 };
      acc[k].count += 1;
      if (t.type === 'trade_in') {
        acc[k].revenue += Math.abs((t.price || 0) - (t.sellPrice || 0));
      } else {
        acc[k].revenue += t.price || 0;
      }
    });
    return Object.entries(acc).map(([date, stats]) => ({ date, ...stats })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  return {
    timeFilter,
    setTimeFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredTransactions,
    summary,
    categoryDistribution,
    employeePerformance,
    trendData
  };
}
