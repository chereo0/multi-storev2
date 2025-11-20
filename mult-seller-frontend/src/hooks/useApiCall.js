import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for making API calls with duplicate prevention
 * Uses ref to track if fetch has already happened (survives StrictMode remounts)
 *
 * @param {Function} apiFunction - Async function to call
 * @param {Array} dependencies - Dependencies array for useEffect
 * @returns {Object} - { data, loading, error }
 */
export const useApiCall = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // If we've already fetched, skip
    if (hasFetched.current) {
      console.log("🛡️ useApiCall: Skipping duplicate API call");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction();
        setData(result);
      } catch (err) {
        setError(err);
        console.error("❌ useApiCall error:", err);
      } finally {
        setLoading(false);
      }
    };

    hasFetched.current = true;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error };
};

/**
 * Hook for one-time initialization calls (like token setup)
 * Guarantees the function runs exactly once, even in React.StrictMode
 *
 * @param {Function} initFunction - Async initialization function
 */
export const useInitialApiCall = (initFunction) => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      console.log("🛡️ useInitialApiCall: Already initialized, skipping");
      return;
    }

    console.log("🚀 useInitialApiCall: Initializing...");
    hasInitialized.current = true;

    const initialize = async () => {
      try {
        await initFunction();
        console.log("✅ useInitialApiCall: Initialization complete");
      } catch (error) {
        console.error("❌ useInitialApiCall: Initialization failed:", error);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run once on mount
};

/**
 * Hook for preventing duplicate useEffect calls
 * Returns a function that wraps your effect logic with duplicate prevention
 *
 * @returns {Function} - Wrapper function for your effect logic
 */
export const useEffectOnce = (effect, deps = []) => {
  const hasRun = useRef(false);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (hasRun.current) {
      console.log("🛡️ useEffectOnce: Skipping duplicate effect");
      return cleanupRef.current;
    }

    hasRun.current = true;
    console.log("▶️ useEffectOnce: Running effect");
    cleanupRef.current = effect();

    return cleanupRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
