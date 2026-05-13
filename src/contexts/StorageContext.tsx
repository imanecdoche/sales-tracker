import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, writeBatch, setDoc, query, where } from 'firebase/firestore';
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
  deleteEmployee: (id: string) => Promise<void>;
  getTransaction: (id: string) => Promise<any>;
  bulkImport: (data: { transactions?: any[], summaries?: any[], employees?: any[] }) => Promise<void>;
  appTargets: { daily: number; weekly: number; monthly: number };
  updateAppTargets: (targets: { daily: number; weekly: number; monthly: number }) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useApp();
  const [mode, setMode] = useState<StorageMode>(() => {
    return (localStorage.getItem('jeweltrack_storage_mode') as StorageMode) || 'local';
  });
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionSummaries, setTransactionSummaries] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [appTargets, setAppTargets] = useState<{ daily: number; weekly: number; monthly: number }>({
    daily: 13.33,
    weekly: 100,
    monthly: 400
  });
  const [loading, setLoading] = useState(true);

  // Load data based on mode and user
  useEffect(() => {
    if (mode === 'firestore' && !firebaseUser) {
      setLoading(false);
      setTransactions([]);
      setTransactionSummaries([]);
      setEmployees([]);
      return;
    }

    setLoading(true);
    if (mode === 'local') {
      const loadLocal = () => {
        const localTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
        const localSums = JSON.parse(localStorage.getItem('jeweltrack_local_transaction_summaries') || '[]');
        const localEmps = JSON.parse(localStorage.getItem('jeweltrack_local_employees') || '[]');
        const localTargets = JSON.parse(localStorage.getItem('jeweltrack_local_targets') || 'null');
        setTransactions(localTrxs);
        setTransactionSummaries(localSums);
        setEmployees(localEmps);
        if (localTargets) setAppTargets(localTargets);
        setLoading(false);
      };
      
      loadLocal();
      window.addEventListener('storage', loadLocal);
      return () => window.removeEventListener('storage', loadLocal);
    } else if (firebaseUser) {
      let unsubscribeTrx: (() => void) | undefined;
      let unsubscribeSums: (() => void) | undefined;
      let unsubscribeEmp: (() => void) | undefined;
      let unsubscribeTargets: (() => void) | undefined;

      try {
        const uid = firebaseUser.uid;
        
        // Query transactions owned by user
        const qTrx = query(collection(db, 'transactions'), where('ownerId', '==', uid));
        unsubscribeTrx = onSnapshot(qTrx, (snapshot) => {
          const trxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactions(trxs);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'transactions'));
        
        // Query summaries owned by user
        const qSums = query(collection(db, 'transaction_summaries'), where('ownerId', '==', uid));
        unsubscribeSums = onSnapshot(qSums, (snapshot) => {
          const sums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactionSummaries(sums);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'transaction_summaries'));

        // Query employees owned by user
        const qEmp = query(collection(db, 'users'), where('ownerId', '==', uid));
        unsubscribeEmp = onSnapshot(qEmp, (snapshot) => {
          const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEmployees(emps);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

        // Query targets for user
        unsubscribeTargets = onSnapshot(doc(db, 'settings', `app_targets_${uid}`), (snap) => {
          if (snap.exists()) {
            setAppTargets(snap.data() as any);
          }
          setLoading(false);
        }, (err) => {
          console.error(err);
          setLoading(false);
        });

        return () => {
          if (unsubscribeTrx) unsubscribeTrx();
          if (unsubscribeSums) unsubscribeSums();
          if (unsubscribeEmp) unsubscribeEmp();
          if (unsubscribeTargets) unsubscribeTargets();
        };
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
  }, [mode, firebaseUser]);

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
    if (!firebaseUser && newMode === 'firestore') {
      alert('Please login first to use Cloud Sync.');
      return;
    }

    setLoading(true);
    if (newMode === 'firestore' && syncLocalData && firebaseUser) {
      const uid = firebaseUser.uid;
      const localTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
      const localSums = JSON.parse(localStorage.getItem('jeweltrack_local_transaction_summaries') || '[]');
      const localEmps = JSON.parse(localStorage.getItem('jeweltrack_local_employees') || '[]');
      const localTargets = JSON.parse(localStorage.getItem('jeweltrack_local_targets') || 'null');
      
      const batch = writeBatch(db);

      localEmps.forEach((emp: any) => {
        const { id, ...data } = emp;
        const ref = doc(collection(db, 'users'));
        batch.set(ref, { ...data, ownerId: uid });
      });
      
      localTrxs.forEach((trx: any) => {
        const { id, ...data } = trx;
        const ref = doc(collection(db, 'transactions'));
        batch.set(ref, { ...data, ownerId: uid });
      });
      
      localSums.forEach((sum: any) => {
        const { id, ...data } = sum;
        const ref = doc(collection(db, 'transaction_summaries'));
        batch.set(ref, { ...data, ownerId: uid });
      });

      if (localTargets) {
        const targetRef = doc(db, 'settings', `app_targets_${uid}`);
        batch.set(targetRef, localTargets);
      }
      
      await batch.commit();

      localStorage.removeItem('jeweltrack_local_transactions');
      localStorage.removeItem('jeweltrack_local_transaction_summaries');
      localStorage.removeItem('jeweltrack_local_employees');
      localStorage.setItem('jeweltrack_storage_mode', newMode);
      window.location.reload();
    } else {
      localStorage.setItem('jeweltrack_storage_mode', newMode);
      window.location.reload();
    }
  };

  const addTransaction = async (data: any) => {
    if (mode === 'local') {
      const trxs = [...transactions, { id: crypto.randomUUID(), ...data, timestamp: Date.now() }];
      saveLocalTrxs(trxs);
    } else if (firebaseUser) {
      await addDoc(collection(db, 'transactions'), { ...data, ownerId: firebaseUser.uid, timestamp: Date.now() });
    }
  };

  const addPastDataSummary = async (data: any) => {
    if (mode === 'local') {
      const sums = [...transactionSummaries, { id: crypto.randomUUID(), ...data }];
      saveLocalTransactionSummaries(sums);
    } else if (firebaseUser) {
      await addDoc(collection(db, 'transaction_summaries'), { ...data, ownerId: firebaseUser.uid });
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
    } else if (firebaseUser) {
      await addDoc(collection(db, 'users'), { ...data, ownerId: firebaseUser.uid });
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

  const deleteEmployee = async (id: string) => {
    if (mode === 'local') {
      const emps = employees.filter(e => e.id !== id);
      saveLocalEmps(emps);
    } else {
      await deleteDoc(doc(db, 'users', id));
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

  const bulkImport = async (importData: { transactions?: any[], summaries?: any[], employees?: any[] }) => {
    setLoading(true);
    try {
      if (mode === 'local') {
        if (importData.transactions) {
          const currentTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
          const merged = [...currentTrxs, ...importData.transactions.map(t => ({ ...t, id: t.id || crypto.randomUUID() }))];
          saveLocalTrxs(merged);
        }
        if (importData.summaries) {
          const currentSums = JSON.parse(localStorage.getItem('jeweltrack_local_transaction_summaries') || '[]');
          const merged = [...currentSums, ...importData.summaries.map(s => ({ ...s, id: s.id || crypto.randomUUID() }))];
          saveLocalTransactionSummaries(merged);
        }
        if (importData.employees) {
          const currentEmps = JSON.parse(localStorage.getItem('jeweltrack_local_employees') || '[]');
          const merged = [...currentEmps, ...importData.employees.map(e => ({ ...e, id: e.id || crypto.randomUUID() }))];
          saveLocalEmps(merged);
        }
      } else if (firebaseUser) {
        const uid = firebaseUser.uid;
        const batch = writeBatch(db);
        
        if (importData.transactions) {
          importData.transactions.forEach(t => {
            const { id, ...data } = t;
            const ref = id ? doc(collection(db, 'transactions'), id) : doc(collection(db, 'transactions'));
            batch.set(ref, { ...data, ownerId: uid }, { merge: true });
          });
        }
        
        if (importData.summaries) {
          importData.summaries.forEach(s => {
            const { id, ...data } = s;
            const ref = id ? doc(collection(db, 'transaction_summaries'), id) : doc(collection(db, 'transaction_summaries'));
            batch.set(ref, { ...data, ownerId: uid }, { merge: true });
          });
        }
        
        if (importData.employees) {
          importData.employees.forEach(e => {
            const { id, ...data } = e;
            const ref = id ? doc(collection(db, 'users'), id) : doc(collection(db, 'users'));
            batch.set(ref, { ...data, ownerId: uid }, { merge: true });
          });
        }
        
        await batch.commit();
      }
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAppTargets = async (targets: { daily: number; weekly: number; monthly: number }) => {
    if (mode === 'local') {
      localStorage.setItem('jeweltrack_local_targets', JSON.stringify(targets));
      setAppTargets(targets);
    } else if (firebaseUser) {
      const uid = firebaseUser.uid;
      await setDoc(doc(db, 'settings', `app_targets_${uid}`), { ...targets, ownerId: uid }, { merge: true });
    }
  };

  return (
    <StorageContext.Provider value={{
      mode, setModeWithSync, transactions, transactionSummaries, employees, loading,
      addTransaction, addPastDataSummary, updateTransaction, deleteTransaction,
      addEmployee, updateEmployee, deleteEmployee, getTransaction, bulkImport,
      appTargets, updateAppTargets
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
