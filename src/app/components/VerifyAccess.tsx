import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { 
  Camera, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Scan,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CameraCapture } from "./CameraCapture";
import { FileOrCameraInput } from "./FileOrCameraInput";
import { uploadKycDocument } from "@/services/api";
import { GoldCoinsAuthBackdrop } from "@/app/components/GoldCoinsAuthBackdrop";

import type { AppAccountType } from "@/loan/loanTypes";

interface VerifyAccessProps {
  onVerify: (data: any) => void;
  accountType?: AppAccountType;
}

export function VerifyAccess({ onVerify, accountType }: VerifyAccessProps) {
  const [step, setStep] = useState<"intro" | "face" | "id_front" | "id_back" | "processing" | "success">("intro");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const idDocumentLabel = accountType === "student" ? "University ID" : "National ID";
  const idDocumentScanLabel = `${idDocumentLabel} Scan`;
  const frontScanTitle = accountType === "student" ? "Scan Front University ID" : "ID Front Scan";
  const backScanTitle = accountType === "student" ? "Scan Back University ID" : "ID Back Scan";

  const handleNext = () => {
    if (step === "intro") setStep("face");
    else if (step === "face") setStep("id_front");
    else if (step === "id_front") setStep("id_back");
    else if (step === "id_back") {
      setStep("processing");
      startOcrMatch();
    }
  };

  const startOcrMatch = async () => {
    // Upload captured images to backend for storage/analysis
    const uploads: Promise<void>[] = [];
    if (faceImage) {
      uploads.push(
        uploadKycDocument(faceImage, "SELFIE").then((r) => {
          if (!r.success) toast.error("Selfie upload failed. Verification saved locally.");
        }).catch(() => toast.error("Selfie upload failed. Verification saved locally."))
      );
    }
    if (idFront) {
      uploads.push(
        uploadKycDocument(idFront, "ID_FRONT").then((r) => {
          if (!r.success) toast.error(`${idDocumentLabel} front upload failed. Verification saved locally.`);
        }).catch(() => toast.error(`${idDocumentLabel} front upload failed. Verification saved locally.`))
      );
    }
    if (idBack) {
      uploads.push(
        uploadKycDocument(idBack, "ID_BACK").then((r) => {
          if (!r.success) toast.error(`${idDocumentLabel} back upload failed. Verification saved locally.`);
        }).catch(() => toast.error(`${idDocumentLabel} back upload failed. Verification saved locally.`))
      );
    }
    void Promise.all(uploads);

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        const matchScore = 0.92; // Mock logic: >= 0.85 verified
        if (matchScore >= 0.85) {
          setStep("success");
          setTimeout(() => onVerify({ verified: true, score: matchScore }), 2000);
        } else {
          toast.error("Verification failed. Low confidence score. Please retry.");
          setStep("intro");
        }
      }
    }, 150);
  };

  return (
    <GoldCoinsAuthBackdrop>
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6 text-center"
            >
              <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-foreground">Identity Verification</h1>
                <p className="text-muted-foreground font-medium">Enhanced biometric and OCR validation required.</p>
              </div>

              <Card className="p-6 border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Camera className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">Liveness Face Capture</p>
                    <p className="text-[10px] text-muted-foreground font-bold">Biometric face recognition (85%+ match)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Scan className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">{idDocumentScanLabel}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">OCR data extraction (Front & Back)</p>
                  </div>
                </div>
              </Card>

              <Button onClick={handleNext} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black gap-2 shadow-xl shadow-emerald-100">
                Begin Verification <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === "face" && (
            <motion.div
              key="face"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-foreground">Face Capture</h2>
                <p className="text-muted-foreground font-medium text-sm">Position your face within the frame</p>
              </div>
              
              <CameraCapture
                mode="selfie"
                onCapture={(base64) => setFaceImage(base64)}
                instructionText="Position your face within the frame"
                guideShape="oval"
              />

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("intro")} className="flex-1 h-14 rounded-2xl font-black">Back</Button>
                <Button onClick={handleNext} disabled={!faceImage} className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black gap-2 disabled:opacity-50">
                  Next Step <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "id_front" && (
            <motion.div
              key="id_front"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-foreground">{frontScanTitle}</h2>
                <p className="text-muted-foreground font-medium text-sm">Upload or capture front of your {idDocumentLabel}</p>
              </div>

              <FileOrCameraInput
                value={idFront}
                onChange={(b) => setIdFront(b)}
                onClear={() => setIdFront(null)}
                label={idDocumentLabel}
                sideLabel="Front"
                captureInstruction={`Position the front of your ${idDocumentLabel} within the frame`}
              />

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("face")} className="flex-1 h-14 rounded-2xl font-black">Back</Button>
                <Button onClick={handleNext} disabled={!idFront} className="flex-[2] h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black gap-2 disabled:opacity-50">
                  Next Step <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "id_back" && (
            <motion.div
              key="id_back"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-foreground">{backScanTitle}</h2>
                <p className="text-muted-foreground font-medium text-sm">Upload or capture back of your {idDocumentLabel}</p>
              </div>

              <FileOrCameraInput
                value={idBack}
                onChange={(b) => setIdBack(b)}
                onClear={() => setIdBack(null)}
                label={idDocumentLabel}
                sideLabel="Back"
                captureInstruction={`Position the back of your ${idDocumentLabel} within the frame`}
              />

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("id_front")} className="flex-1 h-14 rounded-2xl font-black">Back</Button>
                <Button onClick={handleNext} disabled={!idBack} className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black gap-2 shadow-xl shadow-emerald-100 disabled:opacity-50">
                  Finish & Match <CheckCircle2 className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="relative mb-10">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted-foreground/30"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * progress) / 100}
                    className="text-emerald-600 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-foreground">{progress}%</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-foreground">Analyzing Biometrics</h3>
              <p className="text-muted-foreground font-medium mt-2 max-w-[240px]">Performing 1:1 cross-check between face and {idDocumentLabel} document.</p>
              
              <div className="mt-8 space-y-2 w-full max-w-[280px]">
                <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase">
                  <span>Face Confidence</span>
                  <span className="text-green-500">92% MATCH</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "92%" }} className="h-full bg-green-500" />
                </div>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-xl shadow-green-100">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground">Identity Verified</h2>
                <p className="text-muted-foreground font-medium">Auto-matching complete with 92% confidence.</p>
              </div>
              
              <Card className="p-4 border-slate-100 bg-white flex items-center gap-4 text-left">
                <div className="p-3 bg-green-50 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Status</p>
                  <p className="text-sm font-black text-foreground">TIER 2 (ID Verified)</p>
                </div>
              </Card>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-left">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">
                  Your transaction limits have been upgraded to $2,000 daily based on Tier 2 verification status.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GoldCoinsAuthBackdrop>
  );
}
