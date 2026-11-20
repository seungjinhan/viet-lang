import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { settleDay } from "./lib/course";
import { toDay } from "./lib/date";
import { saveJson } from "./lib/platform";
import type { Progress } from "./lib/progress";

interface Store {
  p: Progress;
  today: string;
  /** 기록을 바꾸고 바로 기기에 저장해요. */
  update: (fn: (p: Progress) => Progress) => void;
  saveFailed: boolean;
  retrySave: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ initial, children }: { initial: Progress; children: ReactNode }) {
  const [p, setP] = useState(initial);
  const [saveFailed, setSaveFailed] = useState(false);
  const latest = useRef(initial);

  const persist = useCallback((next: Progress) => {
    void saveJson("progress", next).then((ok) => setSaveFailed(!ok));
  }, []);

  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      // 할 일을 하나 끝낼 때마다 오늘 Day가 다 끝났는지 확인해요.
      const next = settleDay(fn(latest.current), toDay());
      latest.current = next;
      setP(next);
      persist(next);
    },
    [persist],
  );

  const retrySave = useCallback(() => persist(latest.current), [persist]);
  const value = useMemo(() => ({ p, today: toDay(), update, saveFailed, retrySave }), [p, update, saveFailed, retrySave]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("StoreProvider가 없어요");
  return store;
}
