import { useCallback, useEffect, useState } from "react";
import type { LoanType } from "@/loan/loanTypes";
import { getLoanProductLabel, isLoanTypeAllowedForAccount, LOAN_TYPES } from "@/loan/loanTypes";
import {
  downloadMemberTemplate,
  getMemberDocumentsStatus,
  patchAssetDocumentationNote,
  putEmploymentDetails,
  putMemberDocumentsContext,
  uploadMemberSignedDocument,
  type MemberDocVerificationStatus,
} from "@/services/api";
import { USE_MOCK_DATA } from "@/services/index";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Download, FileUp, ShieldCheck, ArrowLeft, Briefcase, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  onDisciplineGradientButtonOutline,
  onDisciplineGradientGlass,
  onDisciplineGradientIcon,
  onDisciplineGradientMuted,
  onDisciplineGradientPill,
  onDisciplineGradientText,
} from "@/lib/disciplineGradient";
import { FineraGradientBackdrop } from "@/app/components/FineraGradientBackdrop";

function StatusBadge({ status }: { status: MemberDocVerificationStatus | null | undefined }) {
  if (status == null) {
    return (
      <span
        className={`rounded-full border border-white/45 bg-white/16 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide dark:border-white/14 dark:bg-white/[0.10] ${onDisciplineGradientText}`}
      >
        N/A
      </span>
    );
  }
  const styles =
    status === "VERIFIED"
      ? "border border-emerald-600/40 bg-emerald-100 text-emerald-900 dark:border-emerald-200/50 dark:bg-emerald-500/25 dark:text-emerald-50"
      : status === "REJECTED"
        ? "border border-red-500/50 bg-red-100 text-red-900 dark:border-red-300/45 dark:bg-red-600/30 dark:text-red-50"
        : "border border-amber-500/50 bg-amber-100 text-amber-950 dark:border-amber-200/40 dark:bg-amber-500/20 dark:text-amber-50";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles}`}>
      {status === "VERIFIED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Pending"}
    </span>
  );
}

function accountLabel(accountType: "student" | "staff" | "alumni"): string {
  if (accountType === "staff") return "Professional Account";
  if (accountType === "alumni") return "Business Account";
  return "Student Account";
}

interface AgreementsConsentScreenProps {
  loanType: LoanType;
  accountType: "student" | "staff" | "alumni";
  /** Drives the same TrustScore gradient shell as the dashboard (0–100). */
  disciplineScore?: number;
  onContinue: () => void;
  onBack: () => void;
  /** When true, member can switch product (e.g. opened from Account settings). */
  showLoanTypeSelector?: boolean;
  onLoanTypeChange?: (lt: LoanType) => void;
}

export function AgreementsConsentScreen({
  loanType,
  accountType,
  disciplineScore: disciplineScoreProp,
  onContinue,
  onBack,
  showLoanTypeSelector,
  onLoanTypeChange,
}: AgreementsConsentScreenProps) {
  const safeDisciplineScore = Number.isFinite(Number(disciplineScoreProp)) ? Number(disciplineScoreProp) : 50;
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agreementStatus, setAgreementStatus] = useState<MemberDocVerificationStatus | null>(null);
  const [consentStatus, setConsentStatus] = useState<MemberDocVerificationStatus | null>(null);
  const [hasAgreement, setHasAgreement] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [assetNote, setAssetNote] = useState("");
  const [emp, setEmp] = useState({
    employerName: "",
    employerContact: "",
    jobTitle: "",
    salaryEstimate: "",
  });
  const [compliance, setCompliance] = useState<{
    defaultFlagged: boolean;
    payrollEnforcementEligible: boolean;
  } | null>(null);

  const isSalary = loanType === "SALARY_BACKED";
  const isAsset = loanType === "ASSET_BACKED";

  const refresh = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setLoading(false);
      setAgreementStatus("PENDING");
      setConsentStatus(isSalary ? "PENDING" : null);
      setHasAgreement(false);
      setHasConsent(false);
      return;
    }
    try {
      const res = await getMemberDocumentsStatus();
      const md = res.data.memberDocument;
      setAgreementStatus(md?.agreementStatus ?? null);
      setConsentStatus(md?.consentStatus ?? null);
      setHasAgreement(Boolean(md?.hasAgreementUpload));
      setHasConsent(Boolean(md?.hasConsentUpload));
      if (md?.assetDocumentationNote) setAssetNote(md.assetDocumentationNote);
      if (res.data.employment) {
        setEmp({
          employerName: res.data.employment.employerName,
          employerContact: res.data.employment.employerContact,
          jobTitle: res.data.employment.jobTitle,
          salaryEstimate: String(res.data.employment.salaryEstimate),
        });
      }
      if (res.data.compliance) {
        setCompliance({
          defaultFlagged: res.data.compliance.defaultFlagged,
          payrollEnforcementEligible: res.data.compliance.payrollEnforcementEligible,
        });
      }
    } catch {
      toast.error("Could not load document status.");
    } finally {
      setLoading(false);
    }
  }, [isSalary]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    putMemberDocumentsContext(loanType).catch(() => {
      /* non-fatal */
    });
  }, [loanType]);

  const allowedProducts = LOAN_TYPES.filter((lt) => isLoanTypeAllowedForAccount(lt, accountType));

  const onDownloadAgreement = async () => {
    try {
      if (USE_MOCK_DATA) {
        toast.message("Mock mode: upload a template in Admin when using the live API.");
        return;
      }
      await downloadMemberTemplate("AGREEMENT", "member-agreement-template.pdf");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  };

  const onDownloadConsent = async () => {
    try {
      if (USE_MOCK_DATA) {
        toast.message("Mock mode: connect backend and upload payroll template in Admin.");
        return;
      }
      await downloadMemberTemplate("PAYROLL_CONSENT", "payroll-consent-template.pdf");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  };

  const onPickUpload = (kind: "agreement" | "consent") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,image/jpeg,image/png";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        if (USE_MOCK_DATA) {
          toast.success("Mock mode: file not sent. Disable USE_MOCK_DATA to upload.");
          if (kind === "agreement") {
            setHasAgreement(true);
            setAgreementStatus("PENDING");
          } else {
            setHasConsent(true);
            setConsentStatus("PENDING");
          }
          return;
        }
        await uploadMemberSignedDocument({ kind, loanProductType: loanType, file });
        toast.success(kind === "agreement" ? "Agreement uploaded" : "Consent uploaded");
        await refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      }
    };
    input.click();
  };

  const saveEmployment = async () => {
    const salary = Number(emp.salaryEstimate);
    if (!emp.employerName.trim() || !emp.employerContact.trim() || !emp.jobTitle.trim() || !Number.isFinite(salary) || salary <= 0) {
      toast.error("Fill all employment fields with a valid salary estimate.");
      return;
    }
    try {
      if (USE_MOCK_DATA) {
        toast.success("Mock mode: employment saved locally only.");
        return;
      }
      await putEmploymentDetails({
        employerName: emp.employerName.trim(),
        employerContact: emp.employerContact.trim(),
        jobTitle: emp.jobTitle.trim(),
        salaryEstimate: salary,
      });
      toast.success("Employment details saved");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const saveAssetNote = async () => {
    try {
      if (USE_MOCK_DATA) {
        toast.success("Mock mode: note not persisted.");
        return;
      }
      await patchAssetDocumentationNote(assetNote, loanType);
      toast.success("Asset documentation note saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const canContinue =
    agreed &&
    hasAgreement &&
    (!isSalary || (hasConsent && emp.employerName && emp.employerContact && emp.jobTitle && Number(emp.salaryEstimate) > 0));

  const glassPanel = `rounded-2xl border p-5 shadow-md shadow-primary/12 backdrop-blur-md dark:shadow-primary/10 ${onDisciplineGradientGlass} ${onDisciplineGradientText}`;
  const innerRow = `flex flex-col gap-2 rounded-xl border border-white/40 bg-white/55 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between dark:border-white/12 dark:bg-white/10 ${onDisciplineGradientText}`;
  const fieldClass = `rounded-lg border px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2 border-zinc-200/90 bg-white/92 text-zinc-800 placeholder:text-zinc-500 dark:border-white/18 dark:bg-white/12 dark:text-zinc-100 dark:placeholder:text-zinc-400`;

  return (
    <div
      className={[
        "relative isolate -mx-4 w-[calc(100%+2rem)] max-w-[100vw] overflow-x-hidden md:-mx-8 md:w-[calc(100%+4rem)]",
        "min-h-[min(100%,calc(100dvh-5rem))] pb-10 pt-2",
        "animate-in slide-in-from-bottom-4 duration-500",
      ].join(" ")}
    >
      <FineraGradientBackdrop />
      <div className="relative z-10 mx-auto max-w-lg space-y-5 px-4 md:px-0">
        <div className={`${glassPanel} relative overflow-hidden`}>
          <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-white/30 blur-2xl dark:bg-white/10" aria-hidden />
          <div className="relative flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md ${onDisciplineGradientGlass}`}>
              <ShieldCheck className={`h-6 w-6 ${onDisciplineGradientIcon}`} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${onDisciplineGradientMuted}`}>Agreements &amp; consent</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${onDisciplineGradientPill}`}>
                  TrustScore · {safeDisciplineScore}
                </span>
              </div>
              <h1 className={`mt-1 text-xl font-semibold tracking-tight ${onDisciplineGradientText}`}>{getLoanProductLabel(loanType)}</h1>
              {showLoanTypeSelector && onLoanTypeChange && (
                <select
                  className={`${fieldClass} mt-3 w-full font-semibold`}
                  value={loanType}
                  onChange={(e) => onLoanTypeChange(e.target.value as LoanType)}
                >
                  {allowedProducts.map((lt) => (
                    <option key={lt} value={lt} className="bg-slate-900 text-white">
                      {getLoanProductLabel(lt)}
                    </option>
                  ))}
                </select>
              )}
              <p className={`mt-2 flex items-center gap-2 text-xs ${onDisciplineGradientMuted}`}>
                <Building2 className={`h-3.5 w-3.5 shrink-0 ${onDisciplineGradientIcon}`} aria-hidden />
                {accountLabel(accountType)}
              </p>
            </div>
          </div>
        </div>

        {compliance?.defaultFlagged && (
          <div className="rounded-2xl border border-red-300/50 bg-red-950/55 p-4 text-sm text-red-50 shadow-lg backdrop-blur-md">
            <p className="font-bold">Default flag active</p>
            <p className="mt-1 text-xs text-red-100/95">
              {compliance.payrollEnforcementEligible
                ? "Payroll enforcement may be eligible - your employer may be contacted for coordination (no automatic deduction)."
                : "Please contact support to arrange repayment."}
            </p>
          </div>
        )}

        <div className={glassPanel}>
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${onDisciplineGradientMuted}`}>Download templates</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className={`flex-1 border font-semibold ${onDisciplineGradientButtonOutline} ${onDisciplineGradientText}`}
              onClick={() => void onDownloadAgreement()}
            >
              <Download className="mr-2 h-4 w-4" />
              Member agreement
            </Button>
            {isSalary && (
              <Button
                type="button"
                variant="outline"
                className={`flex-1 border font-semibold ${onDisciplineGradientButtonOutline} ${onDisciplineGradientText}`}
                onClick={() => void onDownloadConsent()}
              >
                <Download className="mr-2 h-4 w-4" />
                Payroll consent
              </Button>
            )}
          </div>
        </div>

        <div className={glassPanel}>
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${onDisciplineGradientMuted}`}>Upload signed documents</p>
          {loading ? (
            <p className="mt-4 text-sm">Loading status…</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className={innerRow}>
                <div>
                  <p className="text-sm font-bold">Signed member agreement</p>
                  <p className="text-xs opacity-90">Required for all loan types</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={agreementStatus} />
                  <Button
                    type="button"
                    size="sm"
                    className="bg-white font-semibold text-primary hover:bg-white/90"
                    onClick={() => onPickUpload("agreement")}
                  >
                    <FileUp className="mr-1.5 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>

              {isSalary && (
                <div className={innerRow}>
                  <div>
                    <p className="text-sm font-bold">Payroll consent form</p>
                    <p className="text-xs opacity-90">Required for salary-backed loans</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={consentStatus} />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-white font-semibold text-primary hover:bg-white/90"
                      onClick={() => onPickUpload("consent")}
                    >
                      <FileUp className="mr-1.5 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </div>
              )}

              {isAsset && (
                <div className="rounded-xl border border-white/40 bg-white/50 p-4 backdrop-blur-sm dark:border-white/12 dark:bg-white/10">
                  <p className="text-sm font-bold">Asset documentation</p>
                  <p className="text-xs opacity-90">Optional - describe collateral or notes for the credit team.</p>
                  <textarea
                    className={`${fieldClass} mt-3 w-full resize-y`}
                    rows={3}
                    placeholder="e.g. Vehicle reg. / asset ID / valuation reference"
                    value={assetNote}
                    onChange={(e) => setAssetNote(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className={`mt-2 border font-semibold ${onDisciplineGradientButtonOutline} ${onDisciplineGradientText}`}
                    onClick={() => void saveAssetNote()}
                  >
                    Save note
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {isSalary && (
          <div className={glassPanel}>
            <p className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest ${onDisciplineGradientMuted}`}>
              <Briefcase className={`h-3.5 w-3.5 ${onDisciplineGradientIcon}`} aria-hidden />
              Employment details
            </p>
            <div className="mt-4 grid gap-3">
              <input
                className={fieldClass}
                placeholder="Employer name"
                value={emp.employerName}
                onChange={(e) => setEmp((s) => ({ ...s, employerName: e.target.value }))}
              />
              <input
                className={fieldClass}
                placeholder="Employer contact (email or phone)"
                value={emp.employerContact}
                onChange={(e) => setEmp((s) => ({ ...s, employerContact: e.target.value }))}
              />
              <input
                className={fieldClass}
                placeholder="Job title"
                value={emp.jobTitle}
                onChange={(e) => setEmp((s) => ({ ...s, jobTitle: e.target.value }))}
              />
              <input
                className={fieldClass}
                placeholder="Estimated monthly salary"
                type="number"
                min={0}
                value={emp.salaryEstimate}
                onChange={(e) => setEmp((s) => ({ ...s, salaryEstimate: e.target.value }))}
              />
              <Button
                type="button"
                className="bg-white font-semibold text-primary hover:bg-white/90"
                onClick={() => void saveEmployment()}
              >
                Save employment details
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-bold text-black">Acknowledgment</p>
          <p className="mt-2 text-xs leading-relaxed text-black">
            You understand that repayment compliance is monitored and that repeated missed repayments may trigger default handling and, for payroll-linked
            products, employer coordination (without automatic payroll deduction by FinEra).
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Checkbox
              id="agree-consent-flow"
              checked={agreed}
              onCheckedChange={(c) => setAgreed(Boolean(c))}
              className="border-2 border-slate-400 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <label htmlFor="agree-consent-flow" className="cursor-pointer text-sm font-semibold text-black">
              I understand and agree
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            className={`flex-1 border font-semibold ${onDisciplineGradientButtonOutline} ${onDisciplineGradientText}`}
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            className="flex-[2] bg-white font-semibold text-primary hover:bg-white/90 disabled:opacity-40"
            disabled={!canContinue}
            onClick={() => onContinue()}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
