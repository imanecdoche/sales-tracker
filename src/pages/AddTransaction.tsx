import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';

export default function AddTransaction() {
  const { currentUser, isLandscapeLayout } = useApp();
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const { getTransaction, addTransaction, updateTransaction } = useStorage();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'sell',
    qty: '',
    gram: '',
    price: '',
    customerName: '',
    notes: '',
    sellQty: '',
    sellGram: '',
    sellPrice: '',
  });

  useEffect(() => {
    if (!window.visualViewport) return;
    const viewport = window.visualViewport;
    let initialHeight = viewport.height;
    
    const handleResize = () => {
      if (viewport.height > initialHeight) {
        initialHeight = viewport.height;
      }
      if (viewport.height < initialHeight * 0.80) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };
    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (id) {
      setFetching(true);
      const fetchTransaction = async () => {
        try {
          const data = await getTransaction(id);
          if (data) {
            setFormData({
              type: data.type,
              qty: data.qty.toString(),
              gram: data.gram.toString(),
              price: data.price ? parseInt(data.price.toString().replace(/\D/g, '')).toLocaleString('en-US') : '',
              customerName: data.customerName,
              notes: data.notes || '',
              sellQty: data.sellQty?.toString() || '',
              sellGram: data.sellGram?.toString() || '',
              sellPrice: data.sellPrice ? parseInt(data.sellPrice.toString().replace(/\D/g, '')).toLocaleString('en-US') : '',
            });
          }
        } catch (error) {
          console.error(error);
        } finally {
          setFetching(false);
        }
      };
      fetchTransaction();
    }
  }, [id, getTransaction]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, isSell = false) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      if (isSell) setFormData({ ...formData, sellPrice: '' });
      else setFormData({ ...formData, price: '' });
      return;
    }
    const formattedValue = parseInt(rawValue, 10).toLocaleString('en-US');
    if (isSell) setFormData({ ...formData, sellPrice: formattedValue });
    else setFormData({ ...formData, price: formattedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const commonData = {
        type: formData.type,
        qty: parseInt(formData.qty) || (formData.type === 'reviews' ? 0 : 1),
        gram: parseFloat(formData.gram) || 0,
        price: parseFloat(formData.price.replace(/\D/g, '')) || 0,
        customerName: formData.customerName || 'Walk-in',
        notes: formData.notes,
        ...(formData.type === 'trade_in' ? {
          sellQty: parseInt(formData.sellQty) || 1,
          sellGram: parseFloat(formData.sellGram) || 0,
          sellPrice: parseFloat(formData.sellPrice.replace(/\D/g, '')) || 0,
        } : {}),
      };

      if (id) {
        await updateTransaction(id, {
          ...commonData,
          updatedAt: Date.now(),
        });
      } else {
        const now = new Date();
        await addTransaction({
          ...commonData,
          userId: currentUser.id,
          date: format(now, 'yyyy-MM-dd'),
          timestamp: now.getTime(),
        });
      }
      navigate(-1); // Go back to previous screen
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const isFormValid = formData.type === 'reviews' 
    ? formData.customerName.trim() !== '' 
    : formData.type === 'trade_in'
      ? formData.qty.trim() !== '' && formData.gram.trim() !== '' && formData.sellQty.trim() !== '' && formData.sellGram.trim() !== ''
      : formData.qty.trim() !== '' && formData.gram.trim() !== '';

  const TYPES = [
    { id: 'sell', label: 'cat_sell' },
    { id: 'buyback', label: 'cat_buyback' },
    { id: 'trade_in', label: 'cat_trade_in' },
    { id: 'reviews', label: 'cat_reviews' },
    { id: 'services', label: 'cat_services' },
    { id: 'cnn', label: 'cat_cnn' },
  ];

  return (
    <div className="min-h-full relative">
      <div className="px-4 py-6 md:px-6 pb-24 md:pb-32">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-[#b68c5b] tracking-tight">
            {id ? t('editRecord') : t('addRecord')}
          </h1>
          <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all">
            <X size={24} />
          </button>
        </div>

        {fetching ? (
          <div className="text-center p-12 text-gray-400 font-serif">{t('loading')}</div>
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
                  {t(type.label)}
                </button>
              ))}
            </div>

            {formData.type === 'services' || formData.type === 'cnn' ? (
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-[#b68c5b]/10 rounded-full flex items-center justify-center">
                  <div className="animate-[spin_4s_linear_infinite]">
                    <svg className="w-10 h-10 text-[#b68c5b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-serif text-xl text-gray-800 mb-2">Feature Currently Under Development</h3>
                  <p className="text-sm text-gray-500">This module is being built and will be available soon.</p>
                </div>
              </div>
            ) : formData.type === 'reviews' ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('customerName')} *</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder={t('walkIn')}
                    required
                    className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>
              </div>
            ) : formData.type === 'trade_in' ? (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3">Customer Buys (New Item)</h3>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Item / Customer Desc</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Kalung Emas / Mrs. Jane"
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('quantity')} *</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formData.qty}
                        onChange={e => setFormData({ ...formData, qty: e.target.value })}
                        placeholder="1"
                        required
                        className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('weight')} *</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={formData.gram}
                        onChange={e => setFormData({ ...formData, gram: e.target.value })}
                        placeholder="0.00"
                        required
                        className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('totalPrice')} *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.price}
                      onChange={(e) => handlePriceChange(e, false)}
                      placeholder="0"
                      required
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-xl font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-[#b68c5b]"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3">Customer Sells (Old Item)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('quantity')} *</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formData.sellQty}
                        onChange={e => setFormData({ ...formData, sellQty: e.target.value })}
                        placeholder="1"
                        required
                        className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('weight')} *</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={formData.sellGram}
                        onChange={e => setFormData({ ...formData, sellGram: e.target.value })}
                        placeholder="0.00"
                        required
                        className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Trade-in Value *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.sellPrice}
                      onChange={(e) => handlePriceChange(e, true)}
                      placeholder="0"
                      required
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-xl font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-[#b68c5b]"
                    />
                  </div>
                </div>

                <div className="bg-[#b68c5b]/10 rounded-3xl p-6 border border-[#b68c5b]/20">
                  {(() => {
                    const buyPrice = parseFloat(formData.price.replace(/\D/g, '')) || 0;
                    const sellPrice = parseFloat(formData.sellPrice.replace(/\D/g, '')) || 0;
                    const diff = buyPrice - sellPrice;
                    
                    return (
                      <div className="flex flex-col items-center text-center">
                        <span className="text-sm font-medium text-gray-600 mb-1">
                          {diff >= 0 ? "Customer Adds" : "Customer Receives Change"}
                        </span>
                        <span className="text-3xl font-serif text-[#b68c5b]">
                          Rp {Math.abs(diff).toLocaleString('id-ID')}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('quantity')} *</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={formData.qty}
                      onChange={e => setFormData({ ...formData, qty: e.target.value })}
                      placeholder="1"
                      required
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('weight')} *</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={formData.gram}
                      onChange={e => setFormData({ ...formData, gram: e.target.value })}
                      placeholder="0.00"
                      required
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('totalPrice')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.price}
                    onChange={(e) => handlePriceChange(e, false)}
                    placeholder="0"
                    className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-xl font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-[#b68c5b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('customerName')}</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder={t('walkIn')}
                    className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('notes')}</label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('notesPlaceholder')}
                      rows={2}
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20 resize-none"
                    />
                </div>
              </div>
            )}

            {(formData.type !== 'services' && formData.type !== 'cnn') && (
              <div className={`pt-4 ${isLandscapeLayout ? 'pt-0' : ''}`}>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={isLandscapeLayout || isKeyboardOpen ? `
                  fixed bottom-8 right-8 w-16 h-16 bg-[#2c2a29] text-white p-0 rounded-full shadow-2xl z-50 flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-70 disabled:bg-gray-400
                ` : `
                  w-full bg-[#2c2a29] text-white py-5 rounded-full font-medium text-lg tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 shadow-lg disabled:bg-gray-400
                `}
              >
                {loading ? (
                  (!isLandscapeLayout && !isKeyboardOpen) && <span>{t('loading')}</span>
                ) : (
                  <>
                    {(!isLandscapeLayout && !isKeyboardOpen) && <span className="flex items-center gap-2">
                      <Check size={20} /> {id ? t('update') : t('save')}
                    </span>}
                    {(isLandscapeLayout || isKeyboardOpen) && <span>
                      <Save size={28} />
                    </span>}
                  </>
                )}
              </button>
            </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
