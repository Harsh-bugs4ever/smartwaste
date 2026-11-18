import { useCallback, useEffect, useRef, useState } from "react";
export interface AsyncState<T> { data: T | null; loading: boolean; error: Error | null; reload: () => void; setData: (d: T) => void }
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn); fnRef.current = fn;
  useEffect(() => {
    let live = true; setLoading(true); setError(null);
    fnRef.current().then((d) => live && setData(d)).catch((e: unknown) => live && setError(e instanceof Error ? e : new Error(String(e)))).finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);
  return { data, loading, error, reload: useCallback(() => setTick((t) => t + 1), []), setData };
}
