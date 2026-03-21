/**
 * FinEra - Health check script
 * Usage: node scripts/check-health.js [url]
 * Exits 0 if healthy, 1 otherwise
 */
const url = process.argv[2] || "http://localhost:4000/health";

fetch(url)
  .then((r) => (r.ok ? process.exit(0) : process.exit(1)))
  .catch(() => process.exit(1));
