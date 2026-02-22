import { useState, useCallback, useEffect, useRef } from "react";
import type { PreConsultData } from "./types";
import { INITIAL_DATA } from "./types";

const STORAGE_KEY = "melanis_preconsult_draft";

interface PersistedPayload {
  data: PreConsultData;
  savedAt: number; // timestamp
  subStep: number;
}

/** Save-to-localStorage debounce (ms) */
const SAVE_DEBOUNCE = 400;

/**
 * Hook that wraps PreConsultData with auto-persist to localStorage.
 * Restores last draft on mount (if less than 48 h old).
 */
export function usePersistedPreConsult() {
  const getSavedPayload = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: PersistedPayload = JSON.parse(raw);
      if (Date.now() - parsed.savedAt > 48 * 60 * 60 * 1000) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const [data, setData] = useState<PreConsultData>(() => {
    const parsed = getSavedPayload();
    if (!parsed) return { ...INITIAL_DATA };
    return { ...INITIAL_DATA, ...parsed.data };
  });

  const [restoredStep, setRestoredStep] = useState<number>(() => {
    const parsed = getSavedPayload();
    return parsed?.subStep ?? 0;
  });

  const [hasDraft, setHasDraft] = useState(() => {
    return getSavedPayload() !== null;
  });
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => {
    const parsed = getSavedPayload();
    return parsed?.savedAt ?? null;
  });

  // Debounced save
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subStepRef = useRef(0);

  const persist = useCallback((newData: PreConsultData, subStep?: number) => {
    if (subStep !== undefined) subStepRef.current = subStep;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const savedAt = Date.now();
        const payload: PersistedPayload = {
          data: {
            ...newData,
            // Don't persist photo blobs (they won't survive refresh anyway)
            photos: newData.photos.map((p) => ({
              id: p.id,
              url: "",
              name: p.name,
            })),
          },
          savedAt,
          subStep: subStepRef.current,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setHasDraft(true);
        setLastSavedAt(savedAt);
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    }, SAVE_DEBOUNCE);
  }, []);

  // Update + persist wrapper
  const updateData = useCallback(
    (patch: Partial<PreConsultData>) => {
      setData((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateSubStep = useCallback(
    (step: number) => {
      subStepRef.current = step;
      persist(data, step);
    },
    [data, persist]
  );

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors to avoid blocking the flow.
    }
    setHasDraft(false);
    setLastSavedAt(null);
  }, []);

  const discardAndReset = useCallback(() => {
    clearDraft();
    setData({ ...INITIAL_DATA });
    setRestoredStep(0);
  }, [clearDraft]);

  // Cleanup timer on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  // Auto-persist whenever data changes (covers setData and updateData)
  useEffect(() => {
    persist(data);
  }, [data, persist]);

  return {
    data,
    setData,
    updateData,
    updateSubStep,
    persist,
    hasDraft,
    lastSavedAt,
    restoredStep,
    clearDraft,
    discardAndReset,
  };
}
