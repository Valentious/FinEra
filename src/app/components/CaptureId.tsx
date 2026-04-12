/**
 * FinEra - ID Document Capture (Front/Back)
 * Live camera preview, capture, permission handling.
 * Uses CameraCapture for document mode with ID-specific framing.
 */

import { useState, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { CameraCapture } from "./CameraCapture";
import { Camera, RotateCcw } from "lucide-react";

export type IdSide = "front" | "back";

interface CaptureIdProps {
  side: IdSide;
  onCapture: (base64Image: string) => void;
  onComplete?: () => void;
  onBack?: () => void;
}

export function CaptureId({ side, onCapture, onComplete, onBack }: CaptureIdProps) {
  const [captured, setCaptured] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const handleCapture = useCallback(
    (base64: string) => {
      setCaptured(true);
      setCapturedPreview(base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}`);
      onCapture(base64);
    },
    [onCapture]
  );

  const handleRetake = useCallback(() => {
    setCaptured(false);
    setCapturedPreview(null);
  }, []);

  const handleProceed = useCallback(() => {
    if (side === "front" && onComplete) {
      onComplete();
    } else if (side === "back" && onComplete) {
      onComplete();
    }
  }, [side, onComplete]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          Capture {side === "front" ? "Front" : "Back"} of ID
        </h2>
        <p className="text-muted-foreground text-sm">
          Position your ID clearly within the frame. Ensure good lighting and all corners are visible.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
        {captured && capturedPreview ? (
          <div className="relative aspect-[4/3] flex flex-col items-center justify-center p-6 bg-slate-900">
            <img
              src={capturedPreview}
              alt={`${side} of ID`}
              className="max-w-full max-h-[60vh] object-contain rounded-xl"
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="rounded-xl gap-2 text-white border-white/30 hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
                Retake Photo
              </Button>
              <Button
                onClick={handleProceed}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <Camera className="w-4 h-4" />
                {side === "front" ? "Capture Back" : "Complete"}
              </Button>
            </div>
          </div>
        ) : (
          <CameraCapture
            mode="document"
            onCapture={handleCapture}
            instructionText="Align ID within frame. Avoid glare."
            guideShape="rect"
          />
        )}
      </div>

      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
        <h4 className="font-semibold text-foreground mb-2">Tips for best results</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Ensure good lighting</li>
          <li>• Hold camera steady</li>
          <li>• Make sure all 4 corners are visible</li>
          <li>• Avoid glare and reflections</li>
        </ul>
      </div>

      {onBack && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
            Back to Registration
          </Button>
        </div>
      )}
    </div>
  );
}
