/**
 * Graceful fallback UI when backend is unavailable.
 * Only shown when USE_MOCK_DATA=false and backend health check fails.
 */

export function BackendUnavailableBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 text-amber-950 px-4 py-2 text-center text-sm font-medium"
      role="alert"
    >
      Backend temporarily unavailable. Some features may not work. Please check your connection and try again.
    </div>
  );
}
