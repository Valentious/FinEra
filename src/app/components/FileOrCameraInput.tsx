/**
 * FinEra - Dual-mode document capture
 * Option A: Upload file (PNG, JPG, PDF)
 * Option B: Capture live with camera
 */

import { useState, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Upload, Camera } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

const ACCEPT = "image/png,image/jpeg,image/jpg,application/pdf";
const MAX_SIZE_MB = 5;

interface FileOrCameraInputProps {
  value: string | null;
  onChange: (base64: string) => void;
  onClear?: () => void;
  label: string;
  /** e.g. "Front" or "Back" for ID */
  sideLabel?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function FileOrCameraInput({
  value,
  onChange,
  onClear,
  label,
  sideLabel,
}: FileOrCameraInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"choose" | "upload" | "capture">("choose");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_SIZE_MB}MB`);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "jpg", "jpeg", "pdf"].includes(ext || "")) {
      setUploadError("Only PNG, JPG, PDF allowed");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
    } catch {
      setUploadError("Failed to read file");
    }
    e.target.value = "";
  };

  const handleCapture = (base64: string) => {
    onChange(base64);
    setMode("choose"); // Switch to value preview after capture
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-foreground">
        {label}
        {sideLabel && <span className="text-emerald-600 ml-1">({sideLabel})</span>}
      </p>

      {mode === "choose" && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-14 rounded-2xl font-bold gap-2"
            onClick={() => setMode("upload")}
          >
            <Upload className="w-5 h-5" />
            Upload File
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 rounded-2xl font-bold gap-2"
            onClick={() => setMode("capture")}
          >
            <Camera className="w-5 h-5" />
            Capture Live
          </Button>
        </div>
      )}

      {mode === "upload" && (
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={() => inputRef.current?.click()}
            className="aspect-[1.6/1] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all bg-slate-50"
          >
            <Upload className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="font-bold text-foreground">Click to upload</p>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">PNG, JPG, PDF (max {MAX_SIZE_MB}MB)</p>
          </div>
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          <Button variant="ghost" size="sm" onClick={() => setMode("choose")}>
            Back
          </Button>
        </div>
      )}

      {mode === "capture" && (
        <div className="space-y-2">
          <CameraCapture
            mode="document"
            onCapture={handleCapture}
            instructionText="Position document within the frame"
            guideShape="rect"
          />
          <Button variant="ghost" size="sm" onClick={() => setMode("choose")}>
            Back
          </Button>
        </div>
      )}

      {value && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            {value.startsWith("data:image") ? (
              <img
                src={value}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-[10px] font-bold text-muted-foreground">PDF</span>
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">File uploaded</p>
              <p className="text-[10px] text-emerald-600">Ready for verification</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMode("choose");
                onClear?.();
              }}
              className="rounded-xl"
            >
              Retake / Reupload
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
