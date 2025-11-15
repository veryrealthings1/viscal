import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from './common/Icon';

// --- Type definitions for experimental Browser APIs ---
// This allows us to use the BarcodeDetector API and torch controls in a type-safe way.
declare global {
  interface Window {
    BarcodeDetector: {
      new(options?: BarcodeDetectorOptions): BarcodeDetector;
      getSupportedFormats(): Promise<string[]>;
    };
  }
  interface BarcodeDetector {
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
  }
  interface BarcodeDetectorOptions {
    formats?: string[];
  }
  interface DetectedBarcode {
    boundingBox: DOMRectReadOnly;
    cornerPoints: readonly { x: number; y: number }[];
    format: string;
    rawValue: string;
  }
  // Extend MediaTrackCapabilities for torch support
  interface MediaTrackCapabilities {
    torch?: boolean;
  }
  // Extend MediaTrackConstraintSet for torch support
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
}
// Make this file a module
export {};


interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onError: (error: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const stopScanner = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleToggleTorch = useCallback(async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn }],
          });
          setTorchOn(!torchOn);
        } catch (err) {
          console.error("Failed to toggle torch:", err);
          onError("Could not control flashlight.");
        }
      } else {
        onError("Flashlight not available on this device.");
      }
    }
  }, [torchOn, onError]);

  useEffect(() => {
    let detector: BarcodeDetector | null = null;

    const detectBarcode = async () => {
      if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            stopScanner();
            onScanSuccess(barcodes[0].rawValue);
            return; // Stop the loop
          }
        } catch (err) {
          console.error("Barcode detection failed:", err);
          // Don't stop the loop on a single failed detection
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(detectBarcode);
    };
    
    const startScanner = async () => {
      if (!('BarcodeDetector' in window)) {
        setIsSupported(false);
        onError("Barcode scanning is not supported by your browser.");
        return;
      }
      setIsSupported(true);
      
      try {
        // Expanded formats for world-class scanning capability
        detector = new window.BarcodeDetector({ 
            formats: [
                'ean_13', 'ean_8', 'upc_a', 'upc_e', // Standard retail
                'itf', 'code_128', 'code_39', // Other common formats
                'qr_code' // QR codes are increasingly used on packaging
            ]
        });
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
          animationFrameIdRef.current = requestAnimationFrame(detectBarcode);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        onError("Could not access camera. Please check permissions.");
      }
    };

    startScanner();

    return () => stopScanner();
  }, [onScanSuccess, onError, stopScanner]);

  if (!isSupported) {
    return (
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center rounded-lg my-4 text-center">
            <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" className="w-10 h-10 text-red-500 mb-2"/>
            <p className="font-semibold">Barcode Scanner Not Supported</p>
            <p className="text-sm text-gray-500">Your browser doesn't support this feature.</p>
        </div>
    );
  }

  return (
    <div className="w-full aspect-square bg-gray-900 flex flex-col items-center justify-center rounded-lg my-4 relative overflow-hidden">
        <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover" playsInline muted />
        
        <div className="absolute inset-0 z-10" style={{ boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)' }}>
            <div className="absolute top-[15%] left-[10%] right-[10%] bottom-[15%]" style={{ boxShadow: 'inset 0 0 0 2000px black' }}>
                <div className="relative w-full h-full overflow-hidden">
                    {/* Corner Brackets */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    {/* Scan Line */}
                    <div className="scan-line absolute top-0 left-0 right-0 h-1 bg-teal-400/80 shadow-[0_0_10px_2px_#2dd4bf] rounded-full"></div>
                </div>
            </div>
        </div>

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4">
            <div className="w-full flex justify-end">
                <button
                    onClick={handleToggleTorch}
                    title={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
                    className="p-2 bg-black/40 rounded-full text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                    <Icon path={"M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"} className="w-6 h-6"/>
                </button>
            </div>
            <p className="text-white font-medium bg-black/50 px-3 py-1 rounded-md">Point camera at a barcode</p>
        </div>

        <style>{`
            @keyframes scan-line-anim {
                0% { top: 0%; }
                100% { top: 100%; }
            }
            .scan-line {
                animation: scan-line-anim 2.5s ease-in-out infinite alternate;
            }
        `}</style>
    </div>
  );
};

export default BarcodeScanner;
