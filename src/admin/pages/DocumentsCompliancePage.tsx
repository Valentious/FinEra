import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminDocumentTemplates,
  uploadAdminDocumentTemplate,
  fetchAdminMemberDocumentSubmissions,
  patchAdminMemberDocuments,
  recordAdminMissedInstallment,
} from "../services/adminApi";
function Badge({ status }: { status: string | null | undefined }) {
  if (status == null)
    return <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">n/a</span>;
  const cls =
    status === "VERIFIED"
      ? "bg-emerald-600/25 text-emerald-400 border border-emerald-500/40"
      : status === "REJECTED"
        ? "bg-red-600/25 text-red-400 border border-red-500/40"
        : "bg-amber-500/20 text-amber-300 border border-amber-500/35";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{status}</span>;
}

export function DocumentsCompliancePage() {
  const [templates, setTemplates] = useState<{ documentType: string; fileName: string | null; uploadedAt: string }[]>([]);
  const [submissions, setSubmissions] = useState<
    {
      id: string;
      user: { id: string; email: string; fullName: string; accountType: string };
      loanProductType: string;
      agreementStatus: string;
      consentStatus: string | null;
      adminNotes: string | null;
      employment: {
        employerName: string;
        employerContact: string;
        jobTitle: string;
        salaryEstimate: number;
        verified: boolean;
      } | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loanIdInput, setLoanIdInput] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [t, s] = await Promise.all([fetchAdminDocumentTemplates(), fetchAdminMemberDocumentSubmissions()]);
      setTemplates(t.data ?? []);
      setSubmissions(s.data?.submissions ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pickTemplate = (docType: "AGREEMENT" | "PAYROLL_CONSENT") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,application/pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await uploadAdminDocumentTemplate(docType, file);
        await load();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Upload failed");
      }
    };
    input.click();
  };

  return (
    <div className="min-h-full bg-black pb-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Agreements &amp; consent</h1>
          <p className="mt-1 text-sm text-muted-foreground">Templates, member uploads, verification, and delinquency tools.</p>
        </div>

        {err && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{err}</div>
        )}

        <section className="rounded-2xl border border-emerald-500/20 bg-zinc-950 p-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">Templates</h2>
          <p className="mt-2 text-sm text-muted-foreground">Upload or replace downloadable templates for members.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
              onClick={() => pickTemplate("AGREEMENT")}
            >
              Upload member agreement template
            </button>
            <button
              type="button"
              className="rounded-xl border border-emerald-600/50 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-950/50"
              onClick={() => pickTemplate("PAYROLL_CONSENT")}
            >
              Upload payroll consent template
            </button>
            <button
              type="button"
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-zinc-900"
              onClick={() => void load()}
            >
              Refresh
            </button>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {templates.length === 0 && <li className="text-muted-foreground">No templates uploaded yet.</li>}
            {templates.map((t) => (
              <li key={t.documentType} className="flex flex-wrap gap-2 border-b border-zinc-800 py-2">
                <span className="font-mono text-xs text-emerald-400">{t.documentType}</span>
                <span className="text-muted-foreground">{t.fileName ?? "-"}</span>
                <span className="text-muted-foreground">{new Date(t.uploadedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">Delinquency (missed installments)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Increments loan <code className="text-emerald-400">delinquencyStage</code>. When it reaches the configured threshold, the member is flagged and
            notifications are created (employer path for salary-backed only).
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Loan ID</label>
              <input
                className="min-w-[280px] rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-sm text-white"
                placeholder="uuid"
                value={loanIdInput}
                onChange={(e) => setLoanIdInput(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-black hover:bg-amber-500"
              onClick={async () => {
                const id = loanIdInput.trim();
                if (!id) return;
                try {
                  await recordAdminMissedInstallment(id);
                  setLoanIdInput("");
                  await load();
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Failed");
                }
              }}
            >
              Record missed installment
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">Member submissions</h2>
          {loading ? (
            <p className="mt-4 text-muted-foreground">Loading…</p>
          ) : submissions.length === 0 ? (
            <p className="mt-4 text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="mt-4 space-y-6">
              {submissions.map((row) => (
                <div key={row.id} className="rounded-xl border border-zinc-800 bg-black p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{row.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{row.user.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.user.accountType} · {row.loanProductType}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Agreement</p>
                        <Badge status={row.agreementStatus} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Consent</p>
                        <Badge status={row.consentStatus} />
                      </div>
                    </div>
                  </div>

                  {row.employment && (
                    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-muted-foreground">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Employment</p>
                      <p>
                        {row.employment.employerName} - {row.employment.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">{row.employment.employerContact}</p>
                      <p className="text-xs">Est. salary: {row.employment.salaryEstimate}</p>
                      <p className="text-xs text-emerald-500">{row.employment.verified ? "Verified" : "Not verified"}</p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["VERIFIED", "REJECTED", "PENDING"] as const).map((st) => (
                      <button
                        key={`a-${st}`}
                        type="button"
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-zinc-900"
                        onClick={async () => {
                          try {
                            await patchAdminMemberDocuments(row.user.id, { agreementStatus: st });
                            await load();
                          } catch (e) {
                            setErr(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                      >
                        Agreement: {st}
                      </button>
                    ))}
                    {row.loanProductType === "SALARY_BACKED" &&
                      (["VERIFIED", "REJECTED", "PENDING"] as const).map((st) => (
                        <button
                          key={`c-${st}`}
                          type="button"
                          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-zinc-900"
                          onClick={async () => {
                            try {
                              await patchAdminMemberDocuments(row.user.id, { consentStatus: st });
                              await load();
                            } catch (e) {
                              setErr(e instanceof Error ? e.message : "Failed");
                            }
                          }}
                        >
                          Consent: {st}
                        </button>
                      ))}
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                      onClick={async () => {
                        try {
                          await patchAdminMemberDocuments(row.user.id, { employmentVerified: true });
                          await load();
                        } catch (e) {
                          setErr(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Verify employment
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Admin notes</label>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
                      rows={2}
                      value={notesDraft[row.user.id] ?? row.adminNotes ?? ""}
                      onChange={(e) => setNotesDraft((d) => ({ ...d, [row.user.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="mt-2 rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-zinc-900"
                      onClick={async () => {
                        try {
                          await patchAdminMemberDocuments(row.user.id, {
                            adminNotes: notesDraft[row.user.id] ?? row.adminNotes ?? "",
                          });
                          await load();
                        } catch (e) {
                          setErr(e instanceof Error ? e.message : "Failed");
                        }
                      }}
                    >
                      Save notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
