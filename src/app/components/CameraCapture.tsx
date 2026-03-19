/**
 * FinEra - Universal Camera Capture
 * Uses browser MediaDevices API: getUserMedia -> video.srcObject -> canvas capture.
 * Supports: selfie (liveness), document (ID front/back), collateral.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Camera, Loader2, VideoOff, RotateCcw } from "lucide-react";

export type CaptureMode = "selfie" | "document" | "collateral";

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onError?: (message: string) => void;
  instructionText?: string;
  guideShape?: "circle" | "oval" | "rect";
  rawBase64?: boolean;
  mode?: CaptureMode;
}

function getCameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Camera permission denied. Please allow camera access in your browser settings.";
      case "NotFoundError":
        return "No camera found on this device.";
      case "NotReadableError":
      case "TrackStartError":
        return "Camera is in use by another app. Please close other apps using the camera.";
      case "SecurityError":
        return "Camera requires HTTPS. localhost is allowed.";
      case "OverconstrainedError":
        return "Camera doesn't support requested settings.";
      default:
        return err.message || "Camera access failed.";
    }
  }
  return err instanceof Error ? err.message : "Camera access denied.";
}

export function CameraCapture({
  onCapture,
  onError,
  instructionText = "Position within the frame",
  guideShape = "oval",
  rawBase64 = false,
  mode = "selfie",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const mirror = mode === "selfie";

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (useFallback = false) => {
      const constraints: MediaStreamConstraints = {
        video: useFallback ? true : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not supported. Use a modern browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) {
          stopStream();
          throw new Error("Video element not ready");
        }

        video.srcObject = stream;
        await video.play();

        setLoading(false);
        setError(null);
      } catch (err) {
        const msg = getCameraErrorMessage(err);
        setError(msg);
        setLoading(false);
        onError?.(msg);
        stopStream();

        if (!useFallback && err instanceof DOMException && err.name === "OverconstrainedError") {
          setTimeout(() => startCamera(true), 300);
        }
      }
    },
    [onError, stopStream]
  );

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return;

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/png");
    const base64 = rawBase64 ? dataUrl.replace(/^data:image\/\w+;base64,/, "") : dataUrl;

    setCaptured(true);
    setCapturedPreview(dataUrl);
    onCapture(base64);
  }, [onCapture, rawBase64]);

  const handleRetake = useCallback(() => {
    setCaptured(false);
    setCapturedPreview(null);
    setLoading(true);
    stopStream();
    startCamera();
  }, [stopStream, startCamera]);

  const guideClass =
    guideShape === "circle"
      ? "rounded-full w-48 h-48 sm:w-56 sm:h-56"
      : guideShape === "oval"
      ? "rounded-[50%] w-56 h-44 sm:w-64 sm:h-52"
      : "rounded-2xl w-52 h-40 sm:w-60 sm:h-48";

  return (
    <div className="space-y-4 w-full">
      <div className="relative aspect-[4/3] max-h-[70vh] min-h-[240px] rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
        {/* Video must exist in DOM for srcObject - always render when not in error (for retry) */}
        {!error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              display: captured ? "none" : "block",
              visibility: loading ? "hidden" : "visible",
              transform: mirror ? "scaleX(-1)" : "none",
            }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Starting camera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
            <VideoOff className="w-16 h-16 text-amber-500 mb-4" />
            <p className="text-white font-semibold mb-2">Camera access required</p>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setLoading(true);
                setTimeout(() => startCamera(), 0);
              }}
              className="text-white border-white/30 hover:bg-white/10"
            >
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {captured && capturedPreview ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-2">
                <img
                  src={capturedPreview}
                  alt="Captured"
                  className="max-w-full max-h-full object-contain rounded-2xl"
                  style={{ transform: mirror ? "scaleX(-1)" : "none" }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={`border-2 border-emerald-500/60 ${guideClass}`} />
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-center text-slate-500 text-sm font-medium">{instructionText}</p>

      {!loading && !error && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleRetake}
            className="flex-1 h-14 rounded-2xl font-black min-w-0"
          >
            <RotateCcw className="w-5 h-5 shrink-0 mr-2" />
            {captured ? "Retake" : "Restart camera"}
          </Button>
          <Button
            onClick={capturePhoto}
            disabled={captured}
            className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black gap-2 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-5 h-5 shrink-0" />
            {captured ? "Photo captured" : "Capture Photo"}
          </Button>
        </div>
      )}
    </div>
  );
}
