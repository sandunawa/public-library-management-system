import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Upload, AlertCircle, Check } from 'lucide-react';

export interface PhotoCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Jpeg: string) => void;
  title?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Capture Patron Photo',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);
    setCapturedImage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser or insecure HTTP origin.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('WebCam access note:', err);
      setCameraError(err.message || 'Unable to access web camera. Please upload an image file instead.');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCapturedImage(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen]);

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Crop to 3:4 portrait ratio
    const targetWidth = 480;
    const targetHeight = 640;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate center crop
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = targetWidth / targetHeight;

    let sx = 0, sy = 0, sWidth = video.videoWidth, sHeight = video.videoHeight;
    if (videoAspect > targetAspect) {
      sWidth = video.videoHeight * targetAspect;
      sx = (video.videoWidth - sWidth) / 2;
    } else {
      sHeight = video.videoWidth / targetAspect;
      sy = (video.videoHeight - sHeight) / 2;
    }

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopStream();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = 480;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw and center crop to 3:4
        const imgAspect = img.width / img.height;
        const targetAspect = 480 / 640;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgAspect > targetAspect) {
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 480, 640);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        stopStream();
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#7654D7]" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Position patron within frame or upload a photo from local files (3:4 ratio).
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[3/4] max-h-[360px] bg-black/90 rounded-2xl overflow-hidden mx-auto w-full flex items-center justify-center border border-border">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover" />
          ) : cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-[#B91C1C] mx-auto" />
              <p className="text-xs text-white/80">{cameraError}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Photo File
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Guide overlay */}
          {!capturedImage && !cameraError && (
            <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-[10px] text-white/60 tracking-wider font-semibold uppercase">
                Align face inside box
              </span>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
          {capturedImage ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="gap-1.5 text-xs rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="gap-1.5 text-xs bg-[#15803D] hover:bg-[#15803D]/90 text-white rounded-xl font-semibold"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs rounded-xl"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload file
              </Button>
              <Button
                size="sm"
                disabled={Boolean(cameraError) || isInitializing}
                onClick={handleCapturePhoto}
                className="gap-1.5 text-xs bg-[#7654D7] hover:bg-[#6542C6] text-white rounded-xl font-semibold"
              >
                <Camera className="w-4 h-4" />
                Snap Photo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
