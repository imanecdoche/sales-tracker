import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useApp } from './AppContext';

type StorageMode = 'local' | 'firestore';

interface StorageContextType {
  mode: StorageMode;
  setModeWithSync: (mode: StorageMode, syncLocalData?: boolean) => Promise<void>;
  transactions: any[];
  transactionSummaries: any[];
  employees: any[];
  loading: boolean;
  addTransaction: (data: any) => Promise<void>;
  addPastDataSummary: (data: any) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addEmployee: (data: any) => Promise<void>;
  updateEmployee: (id: string, data: any) => Promise<void>;
  getTransaction: (id: string) => Promise<any>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<StorageMode>(() => {
    return (localStorage.getItem('jeweltrack_storage_mode') as StorageMode) || 'local';
  });
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionSummaries, setTransactionSummaries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data based on mode
  useEffect(() => {
    setLoading(true);
    if (mode === 'local') {
      const loadLocal = () => {
        const localTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
        const localSums = JSON.parse(localStorage.getItem('jeweltrack_local_transaction_summaries') || '[]');
        const localEmps = JSON.parse(localStorage.getItem('jeweltrack_local_employees') || '[]');
        setTransactions(localTrxs);
        setTransactionSummaries(localSums);
        setEmployees(localEmps);
        setLoading(false);
      };
      
      loadLocal();
      
      // Simple event listener strictly for UI updates if needed
      window.addEventListener('storage', loadLocal);
      return () => window.removeEventListener('storage', loadLocal);
    } else {
      let unsubscribeTrx: (() => void) | undefined;
      let unsubscribeSums: (() => void) | undefined;
      let unsubscribeEmp: (() => void) | undefined;

      try {
        unsubscribeTrx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
          const trxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactions(trxs);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'transactions'));
        
        unsubscribeSums = onSnapshot(collection(db, 'transaction_summaries'), (snapshot) => {
          const sums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactionSummaries(sums);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'transaction_summaries'));

        unsubscribeEmp = onSnapshot(collection(db, 'users'), (snapshot) => {
          const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEmployees(emps);
          setLoading(false); // Wait for both ideally, but this is okay
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, 'users');
          setLoading(false);
        });

      } catch (err) {
        console.error(err);
        setLoading(false);
      }

      return () => {
        if (unsubscribeTrx) unsubscribeTrx();
        if (unsubscribeSums) unsubscribeSums();
        if (unsubscribeEmp) unsubscribeEmp();
      };
    }
  }, [mode]);

  const saveLocalTrxs = (trxs: any[]) => {
    localStorage.setItem('jeweltrack_local_transactions', JSON.stringify(trxs));
    setTransactions(trxs);
  };

  const saveLocalTransactionSummaries = (sums: any[]) => {
    localStorage.setItem('jeweltrack_local_transaction_summaries', JSON.stringify(sums));
    setTransactionSummaries(sums);
  };

  const saveLocalEmps = (emps: any[]) => {
    localStorage.setItem('jeweltrack_local_employees', JSON.stringify(emps));
    setEmployees(emps);
  };

  const setModeWithSync = async (newMode: StorageMode, syncLocalData: boolean = false) => {
    setLoading(true);
    if (newMode === 'firestore' && syncLocalData) {
      // Sync local data to firestore
      const localTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
      const localSums = JSON.parse(localStorage.getItem('jeweltrack_local_transaction_summaries') || '[]');
      const localEmps = JSON.parse(localStorage.getItem('jeweltrack_local_employees') || '[]');
      
      const idMap = new Map<string, string>();

      for (const emp of localEmps) {
        const docRef = collection(db, 'users');
        const { id, ...data } = emp;
        const newDoc = await addDoc(docRef, data);
        idMap.set(id, newDoc.id);
      }
      
      for (const trx of localTrxs) {
        const docRef = collection(db, 'transactions');
        const { id, ...data } = trx;
        if (data.userId && idMap.has(data.userId)) {
          data.userId = idMap.get(data.userId);
        }
        await addDoc(docRef, data);
      }
      
      for (const sum of localSums) {
        const docRef = collection(db, 'transaction_summaries');
        const { id, ...data } = sum;
        if (data.createdBy && idMap.has(data.createdBy)) {
            data.createdBy = idMap.get(data.createdBy);
        }
        await addDoc(docRef, data);
      }
      
      // Clear local
      localStorage.removeItem('jeweltrack_local_transactions');
      localStorage.removeItem('jeweltrack_local_transaction_summaries');
      localStorage.removeItem('jeweltrack_local_employees');
      localStorage.removeItem('jeweltrack_user'); // force relogin
      
      localStorage.setItem('jeweltrack_storage_mode', newMode);
      window.location.reload();
    } else if (newMode === 'firestore' && !syncLocalData) {
      // User opted to delete local
      localStorage.removeItem('jeweltrack_local_transactions');
      localStorage.removeItem('jeweltrack_local_transaction_summaries');
      localStorage.removeItem('jeweltrack_local_employees');
      localStorage.removeItem('jeweltrack_user'); // force relogin
      localStorage.setItem('jeweltrack_storage_mode', newMode);
      window.location.reload();
    } else {
      localStorage.setItem('jeweltrack_storage_mode', newMode);
      localStorage.removeItem('jeweltrack_user'); // force relogin
      window.location.reload();
    }
  };

  const addTransaction = async (data: any) => {
    if (mode === 'local') {
      const trxs = [...transactions, { id: crypto.randomUUID(), ...data, timestamp: Date.now() }];
      saveLocalTrxs(trxs);
    } else {
      await addDoc(collection(db, 'transactions'), data);
    }
  };

  const addPastDataSummary = async (data: any) => {
    if (mode === 'local') {
      const sums = [...transactionSummaries, { id: crypto.randomUUID(), ...data }];
      saveLocalTransactionSummaries(sums);
    } else {
      await addDoc(collection(db, 'transaction_summaries'), data);
    }
  };

  const updateTransaction = async (id: string, data: any) => {
    if (mode === 'local') {
      const trxs = transactions.map(t => t.id === id ? { ...t, ...data } : t);
      saveLocalTrxs(trxs);
    } else {
      await updateDoc(doc(db, 'transactions', id), data);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (mode === 'local') {
      const trxs = transactions.filter(t => t.id !== id);
      saveLocalTrxs(trxs);
    } else {
      await deleteDoc(doc(db, 'transactions', id));
    }
  };

  const addEmployee = async (data: any) => {
    if (mode === 'local') {
      const emps = [...employees, { id: crypto.randomUUID(), ...data }];
      saveLocalEmps(emps);
    } else {
      await addDoc(collection(db, 'users'), data);
    }
  };

  const updateEmployee = async (id: string, data: any) => {
    if (mode === 'local') {
      const emps = employees.map(e => e.id === id ? { ...e, ...data } : e);
      saveLocalEmps(emps);
    } else {
      await updateDoc(doc(db, 'users', id), data);
    }
  };

  const getTransaction = async (id: string) => {
    if (mode === 'local') {
      return transactions.find(t => t.id === id) || null;
    } else {
      const snap = await getDoc(doc(db, 'transactions', id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
  };

  return (
    <StorageContext.Provider value={{
      mode, setModeWithSync, transactions, transactionSummaries, employees, loading,
      addTransaction, addPastDataSummary, updateTransaction, deleteTransaction,
      addEmployee, updateEmployee, getTransaction
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used inside StorageProvider');
  return ctx;
}
