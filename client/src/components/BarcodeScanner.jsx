import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { FaCamera, FaSpinner, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const [cameraState, setCameraState] = useState("initializing"); // initializing, active, error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode;
    const scannerId = "barcode-scanner-viewfinder";

    const startScanner = async () => {
      try {
        setCameraState("initializing");
        html5QrCode = new Html5Qrcode(scannerId);

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              // Rectangular qrbox is better suited for barcodes
              const qrWidth = Math.min(width * 0.85, 300);
              const qrHeight = Math.min(height * 0.4, 150);
              return { width: qrWidth, height: qrHeight };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success callback
            onScan(decodedText);
            // Auto close on scan
            if (html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                onClose();
              }).catch(err => {
                console.error("Failed to stop scanner", err);
                onClose();
              });
            } else {
              onClose();
            }
          },
          (error) => {
            // Verbose debug scanning errors, ignore them
          }
        );
        setCameraState("active");
      } catch (err) {
        console.error("Camera startup error:", err);
        setCameraState("error");
        setErrorMessage(
          err.message || "Could not access the camera. Make sure permissions are granted and you are using HTTPS."
        );
      }
    };

    // Tiny delay to ensure DOM element is mounted
    const timer = setTimeout(startScanner, 300);

    return () => {
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Error during scanner cleanup", err));
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-color bg-bg-card shadow-2xl p-6 flex flex-col items-center"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaCamera className="text-blue-500 text-lg" />
            <h3 className="text-lg font-bold text-text-main">Scan Barcode</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-main hover:text-text-main transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {/* Viewfinder Wrapper */}
        <div className="relative w-full aspect-square max-w-[320px] bg-black rounded-xl overflow-hidden border border-border-color/30 flex items-center justify-center">
          <div id="barcode-scanner-viewfinder" className="w-full h-full object-cover"></div>

          {/* Overlay loading state */}
          {cameraState === "initializing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white gap-2">
              <FaSpinner className="animate-spin text-3xl text-blue-500" />
              <p className="text-sm font-medium">Initializing camera...</p>
            </div>
          )}

          {/* Overlay error state */}
          {cameraState === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center text-red-400 gap-3">
              <p className="text-sm font-semibold">Camera Error</p>
              <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Close Scanner
              </button>
            </div>
          )}

          {/* Scan Target Visualizer (Scanner animation) */}
          {cameraState === "active" && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Rectangle box matching qrbox aspect ratio */}
              <div className="w-[85%] h-[40%] border-2 border-dashed border-blue-500/80 rounded-lg relative flex items-center justify-center bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                {/* Scanning line animation */}
                <div className="absolute left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-[scan_2s_infinite_ease-in-out]"></div>
              </div>
              <p className="absolute bottom-4 text-xs text-white/80 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                Align barcode inside the box
              </p>
            </div>
          )}
        </div>

        {/* Info text */}
        {cameraState === "active" && (
          <p className="text-xs text-text-secondary text-center mt-4 leading-relaxed max-w-xs">
            Using your device's back-facing camera. Position the barcode steadily in the center.
          </p>
        )}
      </motion.div>

      {/* Embedded CSS Animation for the Scanning Line */}
      <style>{`
        @keyframes scan {
          0%, 100% {
            top: 5%;
          }
          50% {
            top: 95%;
          }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
