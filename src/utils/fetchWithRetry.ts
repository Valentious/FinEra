/**
 * FinEra - Resilient fetch with retry
 * Used for registration data and other critical API calls.
 */

export const fetchWithRetry = async <T = unknown>(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options, credentials: "include" });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i === retries - 1) throw lastError;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }

  throw lastError ?? new Error("Request failed");
};
