import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { FaCamera, FaSpinner, FaTimes, FaCloudUploadAlt, FaQrcode, FaBarcode } from "react-icons/fa";
import { motion } from "framer-motion";

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const [cameraState, setCameraState] = useState("initializing"); // initializing, active, error
  const [errorMessage, setErrorMessage] = useState("");
  const [scanMode, setScanMode] = useState("qr"); // "qr" (square 250x250) or "barcode" (wide 280x140)
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode;
    const scannerId = "barcode-scanner-viewfinder";

    const startScanner = async () => {
      try {
        setCameraState("initializing");
        html5QrCode = new Html5Qrcode(scannerId);

        const qrboxCalc = (viewfinderWidth, viewfinderHeight) => {
          if (scanMode === "qr") {
            const minDim = Math.min(viewfinderWidth * 0.8, viewfinderHeight * 0.8, 260);
            return { width: minDim, height: minDim };
          } else {
            const qrWidth = Math.min(viewfinderWidth * 0.85, 300);
            const qrHeight = Math.min(viewfinderHeight * 0.45, 150);
            return { width: qrWidth, height: qrHeight };
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: qrboxCalc,
            aspectRatio: 1.0,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          },
          (decodedText) => {
            // Success callback
            onScan(decodedText);
            if (html5QrCode && html5QrCode.isScanning) {
              html5QrCode
                .stop()
                .then(() => onClose())
                .catch((err) => {
                  console.error("Failed to stop scanner", err);
                  onClose();
                });
            } else {
              onClose();
            }
          },
          () => {
            // Quiet frame scan errors
          }
        );
        setCameraState("active");
      } catch (err) {
        console.error("Camera startup error:", err);
        setCameraState("error");
        setErrorMessage(
          err.message ||
            "Could not access the camera. Make sure camera permissions are granted in your browser settings."
        );
      }
    };

    const timer = setTimeout(startScanner, 250);

    return () => {
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((err) => console.error("Error during scanner cleanup", err));
      }
    };
  }, [isOpen, scanMode]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setCameraState("initializing");
      const html5QrCode = new Html5Qrcode("barcode-scanner-viewfinder");
      const decodedText = await html5QrCode.scanFile(file, true);
      onScan(decodedText);
      onClose();
    } catch (err) {
      console.error("File scanning error:", err);
      alert("Could not detect a valid QR Code or Barcode in the uploaded image. Please try another image.");
      setCameraState("active");
    }
  };

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
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaCamera className="text-indigo-500 text-lg" />
            <h3 className="text-lg font-bold text-text-main">Camera & File Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-main hover:text-text-main transition-all cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex w-full bg-bg-main p-1 rounded-xl mb-4 border border-border-color/60">
          <button
            type="button"
            onClick={() => setScanMode("qr")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scanMode === "qr"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-text-secondary hover:text-text-main"
            }`}
          >
            <FaQrcode className="text-xs" /> 2D QR Code Mode
          </button>
          <button
            type="button"
            onClick={() => setScanMode("barcode")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              scanMode === "barcode"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-text-secondary hover:text-text-main"
            }`}
          >
            <FaBarcode className="text-xs" /> 1D Barcode Mode
          </button>
        </div>

        {/* Viewfinder Wrapper */}
        <div className="relative w-full aspect-square max-w-[320px] bg-black rounded-2xl overflow-hidden border border-border-color/30 flex items-center justify-center">
          <div id="barcode-scanner-viewfinder" className="w-full h-full object-cover"></div>

          {/* Overlay loading state */}
          {cameraState === "initializing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white gap-2">
              <FaSpinner className="animate-spin text-3xl text-indigo-500" />
              <p className="text-xs font-semibold">Opening camera viewfinder...</p>
            </div>
          )}

          {/* Overlay error state */}
          {cameraState === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center text-rose-400 gap-3">
              <p className="text-sm font-semibold">Camera Access Error</p>
              <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center gap-2"
              >
                <FaCloudUploadAlt /> Upload QR Image File
              </button>
            </div>
          )}

          {/* Scan Target Visualizer */}
          {cameraState === "active" && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Box matching current mode */}
              <div
                className={`border-2 border-dashed border-indigo-500/90 rounded-xl relative flex items-center justify-center bg-indigo-500/10 shadow-[0_0_25px_rgba(99,102,241,0.25)] transition-all duration-300 ${
                  scanMode === "qr" ? "w-[78%] h-[78%]" : "w-[88%] h-[42%]"
                }`}
              >
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-400 rounded-tl-sm"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-400 rounded-tr-sm"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-400 rounded-bl-sm"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-400 rounded-br-sm"></div>

                {/* Scanning line animation */}
                <div className="absolute left-0 w-full h-[2px] bg-indigo-400 shadow-[0_0_12px_#818cf8] animate-[scan_2s_infinite_ease-in-out]"></div>
              </div>
              <p className="absolute bottom-3 text-[10px] text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full font-semibold">
                {scanMode === "qr" ? "Center the full 2D QR Code inside box" : "Align barcode horizontally inside box"}
              </p>
            </div>
          )}
        </div>

        {/* Footer controls: File Upload Fallback */}
        <div className="w-full flex items-center justify-between mt-4 pt-3 border-t border-border-color/60">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-400 font-bold transition-all cursor-pointer"
          >
            <FaCloudUploadAlt className="text-sm" />
            Upload Image File instead
          </button>
          <span className="text-[10px] text-text-secondary">Instant AI Scan</span>
        </div>
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
