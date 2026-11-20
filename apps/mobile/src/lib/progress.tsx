import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { applyResult, emptyStore, parseStore, type Outcome, type Result, type Store } from './progressCore';

const KEY = 'spir-games-progress';

type ProgressState = {
  store: Store;
  ready: boolean;
  record: (r: Result) => Outcome;
  setSound: (on: boolean) => void;
};

const ProgressContext = createContext<ProgressState>({ store: emptyStore(), ready: false, record: () => ({ store: emptyStore(), coins: 0, newBest: false, firstWin: false }), setSound: () => {} });

/** تقدّم اللاعب محفوظ على الجهاز (AsyncStorage) — يشتغل بدون نت */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(emptyStore);
  const [ready, setReady] = useState(false);
  const ref = useRef(store);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const s = parseStore(raw);
        ref.current = s;
        setStore(s);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const save = useCallback((s: Store) => {
    ref.current = s;
    setStore(s);
    AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});
  }, []);

  const record = useCallback(
    (r: Result) => {
      const out = applyResult(ref.current, r);
      save(out.store);
      return out;
    },
    [save],
  );

  const setSound = useCallback((on: boolean) => save({ ...ref.current, sound: on }), [save]);

  const value = useMemo(() => ({ store, ready, record, setSound }), [store, ready, record, setSound]);
  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export const useProgress = () => use(ProgressContext);
