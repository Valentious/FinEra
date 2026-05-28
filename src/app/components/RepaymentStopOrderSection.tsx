import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import {
  downloadStopOrderTemplate,
  getStopOrderDocumentStatus,
  uploadStopOrderDocument,
  type StopOrderDocumentStatus,
} from "@/services/api";
import { USE_MOCK_DATA } from "@/services/index";
import { CheckCircle2, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

const ACCEPT = "application/pdf,image/png,image/jpeg";
const MAX_BYTES = 10 * 1024 * 1024;

function StatusBadge({ status }: { status: StopOrderDocumentStatus }) {
  const styles =
    status === "approved"
      ? "border-emerald-600/40 bg-emerald-100 text-emerald-900"
      : status === "rejected"
        ? "border-red-500/50 bg-red-100 text-red-900"
        : status === "submitted"
          ? "border-blue-500/50 bg-blue-100 text-blue-900"
          : "border-slate-300 bg-slate-100 text-slate-700";
  const label =
    status === "approved"
      ? "Approved"
      : status === "rejected"
        ? "Rejected"
        : status === "submitted"
          ? "Submitted for Review"
          : "Pending upload";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles}`}>
      {label}
    </span>
  );
}

interface RepaymentStopOrderSectionProps {
  visible: boolean;
}

export function RepaymentStopOrderSection({ visible }: RepaymentStopOrderSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [showSection, setShowSection] = useState(visible);
  const [status, setStatus] = useState<StopOrderDocumentStatus>("pending");
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const refresh = useCallback(async () => {
    if (!visible && !showSection) {
      setLoading(false);
      return;
    }
    if (USE_MOCK_DATA) {
      setShowSection(visible);
      setLoading(false);
      return;
    }
    try {
      const res = await getStopOrderDocumentStatus();
      setShowSection(visible || res.data.documentType === "LOAN_REPAYMENT_STOP_ORDER");
      setStatus(res.data.status);
      setFileName(res.data.fileName);
    } catch {
      if (visible) toast.error("Could not load stop order status.");
      setShowSection(visible);
    } finally {
      setLoading(false);
    }
  }, [visible, showSection]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const onDownload = async () => {
    try {
      if (USE_MOCK_DATA) {
        toast.message("Mock mode: upload template in Admin when using the live API.");
        return;
      }
      await downloadStopOrderTemplate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  };

  const processFile = async (file: File) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type) || file.size > MAX_BYTES) {
      toast.error("Use PDF, PNG, or JPEG under 10 MB.");
      return;
    }
    setUploading(true);
    setUploadProgress(15);
    const tick = window.setInterval(() => setUploadProgress((p) => Math.min(p + 10, 90)), 100);
    try {
      if (USE_MOCK_DATA) {
        setStatus("submitted");
        setFileName(file.name);
        toast.success("Submitted for review (mock)");
        return;
      }
      const res = await uploadStopOrderDocument(file);
      setStatus(res.data.status);
      setFileName(file.name);
      toast.success("Submitted for review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      window.clearInterval(tick);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!showSection) return null;

  return (
    <Card className="border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-xl font-black text-black dark:text-zinc-100">Loan repayment stop order</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Download, sign, and upload your LOAN REPAYMENT STOP ORDER for payroll (SSB) repayment.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-4 space-y-4">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => void onDownload()} disabled={uploading}>
            <Download className="mr-2 h-4 w-4" />
            Download LOAN REPAYMENT STOP ORDER
          </Button>

          <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void processFile(f);
          }} />

          {uploading ? (
            <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-bold">Uploading…</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          ) : (
            <div
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files[0];
                if (f) void processFile(f);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => inputRef.current?.click()}
              className={[
                "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center",
                dragActive ? "border-primary bg-primary/5" : "border-slate-300 bg-slate-50",
              ].join(" ")}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-bold">Drag & drop signed file</p>
              <p className="text-xs text-muted-foreground">PDF, PNG, JPEG · max 10 MB</p>
            </div>
          )}

          {(status === "submitted" || status === "approved") && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">{fileName ?? "Document uploaded"}</span>
              <StatusBadge status={status} />
            </div>
          )}
          {status === "rejected" && (
            <p className="text-sm font-medium text-red-700">Upload rejected — please submit a corrected file.</p>
          )}
        </div>
      )}
    </Card>
  );
}
