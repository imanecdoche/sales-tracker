import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useApp } from '../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, Trash2, Edit3, ArrowRight } from 'lucide-react';

const CATEGORIES: Record<string, { label: string, color: string }> = {
  sell: { label: 'Sell', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  buyback: { label: 'Buyback', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  trade_in: { label: 'Trade In', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  reviews: { label: 'Reviews', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  services: { label: 'Services', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  cnn: { label: 'CNN', color: 'bg-slate-50 text-slate-700 border-slate-100' },
};

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const dateStr = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const category = CATEGORIES[categoryId || ''] || CATEGORIES.sell;

  useEffect(() => {
    if (!currentUser || !categoryId) return;
    
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.id),
      where('type', '==', categoryId),
      where('date', '==', dateStr),
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
  }, [currentUser, categoryId, dateStr]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400 font-serif translate-y-1/2 h-full flex flex-col justify-center">Loading Records...</div>;
  }

  return (
    <div className="min-h-full">
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6 font-medium text-sm">
          <ChevronLeft size={16} /> Back
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-serif text-gray-800 tracking-tight">{category.label}</h1>
          <p className="text-sm text-gray-400 font-medium tracking-wide mt-1">
            {format(parseISO(dateStr), 'EEEE, dd MMMM yyyy')}
          </p>
        </header>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 font-serif italic">No records found for this day.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map(t => (
              <div key={t.id} className={`bg-white rounded-[24px] p-5 shadow-sm border ${category.color.split(' ')[2]} relative overflow-hidden group`}>
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${category.color.split(' ')[0]}`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg mb-1">{t.customerName}</h3>
                    <div className="text-xs font-medium uppercase tracking-wider text-gray-400 inline-block px-2 py-1 bg-gray-50 rounded-md">
                      {format(new Date(t.timestamp), 'HH:mm')}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-light text-[#b68c5b]">{formatRupiah(t.price)}</p>
                  </div>
                </div>

                <div className="flex bg-[#f8f6f3] rounded-2xl p-3 mb-4">
                  <div className="flex-1 text-center border-r border-gray-200/50">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Qty</p>
                    <p className="font-serif text-lg text-gray-700 leading-none">{t.qty}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Weight</p>
                    <p className="font-serif text-lg text-gray-700 leading-none">{t.gram.toFixed(2)}<span className="text-xs text-gray-400 ml-1">g</span></p>
                  </div>
                </div>

                {t.notes && (
                  <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl italic">
                    "{t.notes}"
                  </p>
                )}

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2">
                  <button onClick={() => handleDelete(t.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => navigate(`/edit/${t.id}`)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-[#b68c5b] hover:bg-[#b68c5b]/10 transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
