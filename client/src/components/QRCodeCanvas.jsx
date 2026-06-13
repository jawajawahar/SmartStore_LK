import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { FaDownload } from "react-icons/fa";

const QRCodeCanvas = ({ text, size = 150, showDownload = true, filename = "qrcode" }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;

    QRCode.toCanvas(
      canvasRef.current,
      text,
      {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      },
      (err) => {
        if (err) {
          console.error("QR Code Generation Error:", err);
          setError("Failed to generate QR");
        } else {
          setError(null);
        }
      }
    );
  }, [text, size]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Failed to download QR code image:", err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {error ? (
        <div className="text-rose-500 text-xs font-semibold py-4">{error}</div>
      ) : (
        <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
          <canvas ref={canvasRef} style={{ width: size, height: size }} />
        </div>
      )}
      
      {showDownload && !error && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider mt-1 cursor-pointer"
          type="button"
        >
          <FaDownload className="text-[9px]" /> Download QR
        </button>
      )}
    </div>
  );
};

export default QRCodeCanvas;
