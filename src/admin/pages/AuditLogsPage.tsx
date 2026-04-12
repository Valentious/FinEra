import { useEffect, useState } from "react";
import { fetchAuditLogs } from "../services/adminApi";
import { adminColors } from "../design-system/tokens";

export function AuditLogsPage() {
  const [data, setData] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const j = await fetchAuditLogs(80);
        setData(j);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed");
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-foreground">Audit trail</h1>
      <p className="text-sm text-muted-foreground">Court-grade append-only log - who did what, when, on which entity.</p>
      {err && <p className="text-red-600">{err}</p>}
      <div className="overflow-auto rounded-2xl border bg-white" style={{ borderColor: adminColors.border }}>
        <pre className="max-h-[480px] p-4 text-xs text-foreground">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
