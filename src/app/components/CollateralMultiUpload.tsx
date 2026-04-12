/**
 * FinEra - Multi-image collateral upload
 * Drag-and-drop, file picker, or live camera capture. PNG, JPG, PDF.
 */

import { useState, useRef } from "react";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { CameraCapture } from "./CameraCapture";

const ACCEPT = "image/png,image/jpeg,image/jpg,application/pdf";
const MAX_SIZE_MB = 5;
const MAX_FILES = 10;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface CollateralMultiUploadProps {
  files: string[];
  onChange: (files: string[]) => void;
  maxFiles?: number;
}

export function CollateralMultiUpload({
  files,
  onChange,
  maxFiles = MAX_FILES,
}: CollateralMultiUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [captureMode, setCaptureMode] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;

    const toAdd: string[] = [];
    for (let i = 0; i < selected.length && files.length + toAdd.length < maxFiles; i++) {
      const file = selected[i];
      if (file.size > MAX_SIZE_MB * 1024 * 1024) continue;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["png", "jpg", "jpeg", "pdf"].includes(ext || "")) continue;
      try {
        const base64 = await fileToBase64(file);
        toAdd.push(base64);
      } catch {
        /* skip */
      }
    }
    if (toAdd.length) onChange([...files, ...toAdd]);
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer.files;
    if (!items?.length) return;
    const fileList = Array.from(items);
    handleFiles(fileList);
  };

  const handleFiles = async (fileList: File[]) => {
    const toAdd: string[] = [];
    for (const file of fileList) {
      if (files.length + toAdd.length >= maxFiles) break;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) continue;
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["png", "jpg", "jpeg", "pdf"].includes(ext || "")) continue;
      try {
        const base64 = await fileToBase64(file);
        toAdd.push(base64);
      } catch {
        /* skip */
      }
    }
    if (toAdd.length) onChange([...files, ...toAdd]);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleCapture = (base64: string) => {
    const dataUrl = base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`;
    if (files.length < maxFiles) onChange([...files, dataUrl]);
    setCaptureMode(false);
  };

  if (captureMode) {
    return (
      <div className="space-y-4">
        <CameraCapture
          mode="collateral"
          onCapture={handleCapture}
          instructionText="Position the collateral item within the frame"
          guideShape="rect"
        />
        <Button variant="ghost" size="sm" onClick={() => setCaptureMode(false)}>
          Back to upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-slate-200 p-6 cursor-pointer hover:border-emerald-500 transition-all bg-slate-50/50 text-center min-h-[120px] flex flex-col items-center justify-center"
        >
          <Upload className="w-10 h-10 text-muted-foreground mb-2" />
          <p className="font-bold text-foreground text-sm">Drag & drop or click</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">PNG, JPG, PDF (max {MAX_SIZE_MB}MB)</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-[120px] rounded-2xl font-bold gap-2 flex flex-col py-6"
          onClick={() => setCaptureMode(true)}
          disabled={files.length >= maxFiles}
        >
          <Camera className="w-10 h-10 text-emerald-600" />
          <span>Capture with camera</span>
          <span className="text-[10px] font-normal text-muted-foreground">Up to {maxFiles} files</span>
        </Button>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((f, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
              {f.startsWith("data:image") ? (
                <img src={f} alt={`Preview ${i + 1}`} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-slate-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">PDF</span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
