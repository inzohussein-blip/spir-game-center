import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { HOUSE_ITEMS, STICKERS } from '../games/catalog.generated';
import {
  activeProfile,
  activeStore,
  addPlayTime,
  addProfile,
  applyResult,
  awardSticker,
  buyItem,
  FEATURED,
  wearHat,
  emptyFamily,
  hashPin,
  parseFamily,
  removeProfile,
  setActiveStore,
  toggleFavorite,
  updateProfile,
  type Family,
  type Outcome,
  type Profile,
  type Result,
  type Store,
} from './progressCore';

const KEY = 'spir-games-family';
/** مفتاح النسخة الأولى (لاعب واحد) — ينقرا مرة وحدة وينتقل لأول ملف */
const LEGACY_KEY = 'spir-games-progress';

type ProgressState = {
  ready: boolean;
  family: Family;
  /** الملف اللي يلعب هسه */
  profile: Profile | null;
  /** تقدّم الملف اللي يلعب هسه */
  store: Store;
  /** اختار لاعب بهاي الجلسة؟ (إذا أكو أكثر من ملف نسأل «منو يلعب؟» عند الفتح) */
  chosen: boolean;
  record: (r: Result) => Outcome & { sticker: string | null };
  /** شراء غرض للبيت (التحقق من السعر هنا، مو باللعبة) */
  buy: (id: string) => boolean;
  wear: (id: string | null) => void;
  setSound: (on: boolean) => void;
  addMinutes: (min: number) => void;
  toggleFav: (id: string) => void;
  choose: (id: string) => void;
  createProfile: (p: { name: string; age: number; avatar: number }) => string;
  editProfile: (id: string, patch: Partial<Omit<Profile, 'id'>>) => void;
  deleteProfile: (id: string) => void;
  setPin: (pin: string) => void;
};

const noop = () => {};
const ProgressContext = createContext<ProgressState>({
  ready: false,
  family: emptyFamily(),
  profile: null,
  store: activeStore(emptyFamily()),
  chosen: false,
  record: () => ({ store: activeStore(emptyFamily()), coins: 0, newBest: false, firstWin: false, dailyBonus: false, sticker: null }),
  buy: () => false,
  wear: noop,
  setSound: noop,
  addMinutes: noop,
  toggleFav: noop,
  choose: noop,
  createProfile: () => '',
  editProfile: noop,
  deleteProfile: noop,
  setPin: noop,
});

/** ملفات العائلة وتقدّم كل واحد، محفوظة على الجهاز (AsyncStorage) — تشتغل بدون نت */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [family, setFamily] = useState<Family>(emptyFamily);
  const [ready, setReady] = useState(false);
  const [chosen, setChosen] = useState(false);
  const ref = useRef(family);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(LEGACY_KEY)])
      .then(([raw, legacy]) => {
        const f = parseFamily(raw, legacy);
        ref.current = f;
        setFamily(f);
        // ملف واحد بس: ما نسأل «منو يلعب؟»
        if (f.profiles.length === 1) setChosen(true);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const save = useCallback((f: Family) => {
    ref.current = f;
    setFamily(f);
    AsyncStorage.setItem(KEY, JSON.stringify(f)).catch(() => {});
  }, []);

  const updateStore = useCallback((fn: (s: Store) => Store) => save(setActiveStore(ref.current, fn(activeStore(ref.current)))), [save]);

  const record = useCallback(
    (r: Result) => {
      const out = applyResult(activeStore(ref.current), r);
      let next = out.store;
      let sticker: string | null = null;
      if (r.won && FEATURED.includes(r.gameId)) {
        const a = awardSticker(next, STICKERS.map((x) => x.id), Math.random);
        next = a.store;
        sticker = a.sticker;
      }
      save(setActiveStore(ref.current, next));
      return { ...out, store: next, sticker };
    },
    [save],
  );
  const buy = useCallback(
    (id: string) => {
      const item = HOUSE_ITEMS.find((x) => x.id === id);
      const next = item ? buyItem(activeStore(ref.current), item) : null;
      if (next) save(setActiveStore(ref.current, next));
      return !!next;
    },
    [save],
  );
  const wear = useCallback((id: string | null) => updateStore((s) => wearHat(s, id)), [updateStore]);
  const setSound = useCallback((on: boolean) => updateStore((s) => ({ ...s, sound: on })), [updateStore]);
  const addMinutes = useCallback((min: number) => updateStore((s) => addPlayTime(s, min, new Date())), [updateStore]);
  const toggleFav = useCallback((id: string) => updateStore((s) => toggleFavorite(s, id)), [updateStore]);
  const choose = useCallback(
    (id: string) => {
      save({ ...ref.current, activeId: id });
      setChosen(true);
    },
    [save],
  );
  const createProfile = useCallback(
    (p: { name: string; age: number; avatar: number }) => {
      const id = `p${Date.now().toString(36)}`;
      const f = addProfile(ref.current, p, id);
      save({ ...f, activeId: id });
      setChosen(true);
      return id;
    },
    [save],
  );
  const editProfile = useCallback((id: string, patch: Partial<Omit<Profile, 'id'>>) => save(updateProfile(ref.current, id, patch)), [save]);
  const deleteProfile = useCallback((id: string) => save(removeProfile(ref.current, id)), [save]);
  const setPin = useCallback((pin: string) => save({ ...ref.current, pinHash: pin ? hashPin(pin) : '' }), [save]);

  const value = useMemo(
    () => ({
      ready,
      family,
      profile: activeProfile(family),
      store: activeStore(family),
      chosen,
      record,
      buy,
      wear,
      setSound,
      addMinutes,
      toggleFav,
      choose,
      createProfile,
      editProfile,
      deleteProfile,
      setPin,
    }),
    [ready, family, chosen, record, buy, wear, setSound, addMinutes, toggleFav, choose, createProfile, editProfile, deleteProfile, setPin],
  );
  return <ProgressContext value={value}>{children}</ProgressContext>;
}

export const useProgress = () => use(ProgressContext);
