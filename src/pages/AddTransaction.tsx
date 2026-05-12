import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';

export default function AddTransaction() {
  const { currentUser } = useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    type: 'sell',
    qty: '',
    gram: '',
    price: '',
    customerName: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      setFetching(true);
      const fetchTransaction = async () => {
        try {
          const docRef = doc(db, 'transactions', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              type: data.type,
              qty: data.qty.toString(),
              gram: data.gram.toString(),
              price: data.price.toString(),
              customerName: data.customerName,
              notes: data.notes || '',
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `transactions/${id}`);
        } finally {
          setFetching(false);
        }
      };
      fetchTransaction();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const commonData = {
        type: formData.type,
        qty: parseInt(formData.qty) || 1,
        gram: parseFloat(formData.gram) || 0,
        price: parseFloat(formData.price) || 0,
        customerName: formData.customerName || 'Walk-in',
        notes: formData.notes,
      };

      if (id) {
        const docRef = doc(db, 'transactions', id);
        await updateDoc(docRef, {
          ...commonData,
          updatedAt: Date.now(),
        });
      } else {
        const now = new Date();
        await addDoc(collection(db, 'transactions'), {
          ...commonData,
          userId: currentUser.id,
          date: format(now, 'yyyy-MM-dd'),
          timestamp: now.getTime(),
        });
      }
      navigate(-1); // Go back to previous screen
    } catch (error) {
      const type = id ? OperationType.UPDATE : OperationType.CREATE;
      handleFirestoreError(error, type, 'transactions');
      setLoading(false);
    }
  };

  const TYPES = [
    { id: 'sell', label: 'Sell' },
    { id: 'buyback', label: 'Buyback' },
    { id: 'trade_in', label: 'Trade In' },
    { id: 'reviews', label: 'Review' },
    { id: 'services', label: 'Service' },
    { id: 'cnn', label: 'CNN' },
  ];

  return (
    <div className="min-h-full">
      <div className="p-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-[#b68c5b] tracking-tight">
            {id ? 'Edit Record' : 'Add Record'}
          </h1>
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
            <X size={20} />
          </button>
        </div>

        {fetching ? (
          <div className="text-center p-12 text-gray-400 font-serif">Loading data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 flex overflow-x-auto gap-2 hide-scrollbar">
              {TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`py-3 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    formData.type === type.id 
                      ? 'bg-[#b68c5b] text-white shadow-md' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Quantity</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.qty}
                    onChange={e => setFormData({ ...formData, qty: e.target.value })}
                    placeholder="1"
                    className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Weight (g)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={formData.gram}
                    onChange={e => setFormData({ ...formData, gram: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Total Price (Rp)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                  className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-xl font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-[#b68c5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Walk-in"
                  className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requests or details..."
                  rows={2}
                  className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20 resize-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2c2a29] text-white py-5 rounded-full font-medium text-lg tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 shadow-lg"
              >
                {loading ? 'Saving...' : <><Check size={20} /> {id ? 'Update Record' : 'Save Record'}</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
