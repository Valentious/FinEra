import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  User, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  Scan,
  Smartphone,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface VerifyAccessProps {
  onVerify: (data: any) => void;
}

export function VerifyAccess({ onVerify }: VerifyAccessProps) {
  const [step, setStep] = useState<"intro" | "face" | "id_front" | "id_back" | "processing" | "success">("intro");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleNext = () => {
    if (step === "intro") setStep("face");
    else if (step === "face") setStep("id_front");
    else if (step === "id_front") setStep("id_back");
    else if (step === "id_back") {
      setStep("processing");
      startOcrMatch();
    }
  };

  const startOcrMatch = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
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
              <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900">Identity Verification</h1>
                <p className="text-slate-500 font-medium">Enhanced biometric and OCR validation required for academic credit access.</p>
              </div>

              <Card className="p-6 border-slate-100 shadow-sm text-left space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Camera className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Liveness Face Capture</p>
                    <p className="text-[10px] text-slate-500 font-bold">Biometric face recognition (85%+ match)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Scan className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">National ID Scan</p>
                    <p className="text-[10px] text-slate-500 font-bold">OCR data extraction (Front & Back)</p>
                  </div>
                </div>
              </Card>

              <Button onClick={handleNext} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black gap-2 shadow-xl shadow-indigo-100">
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
                <h2 className="text-2xl font-black text-slate-900">Face Capture</h2>
                <p className="text-slate-500 font-medium text-sm">Position your face within the frame</p>
              </div>
              
              <div className="aspect-square bg-slate-900 rounded-[3rem] border-8 border-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-32 h-32 text-slate-800" />
                </div>
                {/* Simulated Camera Feed Overlay */}
                <div className="absolute inset-0 border-[3px] border-indigo-500/50 rounded-[2.5rem] m-8 animate-pulse" />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    Liveness Check Active
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("intro")} className="flex-1 h-14 rounded-2xl font-black">Back</Button>
                <Button onClick={handleNext} className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black gap-2">
                  Capture Photo <Camera className="w-5 h-5" />
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
                <h2 className="text-2xl font-black text-slate-900">ID Front Scan</h2>
                <p className="text-slate-500 font-medium text-sm">Upload front of your National ID</p>
              </div>

              <div className="aspect-[1.6/1] bg-white rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center group hover:border-indigo-600 transition-all cursor-pointer">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-black text-slate-900">Click to Upload</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">SUPPORTED: PNG, JPG (MAX 5MB)</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("face")} className="flex-1 h-14 rounded-2xl font-black">Back</Button>
                <Button onClick={handleNext} className="flex-[2] h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black gap-2">
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
                <h2 className="text-2xl font-black text-slate-900">ID Back Scan</h2>
                <p className="text-slate-500 font-medium text-sm">Upload back of your National ID</p>
              </div>

              <div className="aspect-[1.6/1] bg-white rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center group hover:border-indigo-600 transition-all cursor-pointer">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-black text-slate-900">Click to Upload</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">EXTRACTING: EXPIRY, SERIAL</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("id_front")} className="flex-1 h-14 rounded-2xl font-black">Back</Button>
                <Button onClick={handleNext} className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black gap-2 shadow-xl shadow-indigo-100">
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
                    className="text-slate-100"
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
                    className="text-indigo-600 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-900">{progress}%</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900">Analyzing Biometrics</h3>
              <p className="text-slate-500 font-medium mt-2 max-w-[240px]">Performing 1:1 cross-check between face and ID document.</p>
              
              <div className="mt-8 space-y-2 w-full max-w-[280px]">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase">
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
                <h2 className="text-3xl font-black text-slate-900">Identity Verified</h2>
                <p className="text-slate-500 font-medium">Auto-matching complete with 92% confidence.</p>
              </div>
              
              <Card className="p-4 border-slate-100 bg-white flex items-center gap-4 text-left">
                <div className="p-3 bg-green-50 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Status</p>
                  <p className="text-sm font-black text-slate-900">TIER 2 (ID Verified)</p>
                </div>
              </Card>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-left">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  Your transaction limits have been upgraded to $2,000 daily based on Tier 2 verification status.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
