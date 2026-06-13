import { FaTimes, FaPrint, FaCertificate } from "react-icons/fa";
import QRCodeCanvas from "./QRCodeCanvas";

const ProductPassportModal = ({ isOpen, onClose, productData }) => {
  if (!isOpen || !productData) return null;

  const {
    name,
    sku,
    price,
    quantity,
    unit,
    invoiceNo,
    date,
    customerName,
  } = productData;

  const formattedDate = new Date(date).toLocaleString();

  // Construct text payload for the QR Code
  const qrText = `SmartStore LK Product Passport
Product: ${name}
SKU/Barcode: ${sku || "N/A"}
Sale Price: Rs. ${Number(price).toLocaleString()}
Quantity: ${quantity} ${unit}
Purchase Date: ${formattedDate}
Invoice #: ${invoiceNo}
Customer: ${customerName}
Status: Verified Purchase`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>SmartStore LK - Product Passport</title>
          <style>
            body {
              font-family: monospace;
              padding: 40px;
              text-align: center;
              color: #000;
              background: #fff;
            }
            .passport-card {
              border: 2px dashed #000;
              padding: 24px;
              display: inline-block;
              max-width: 320px;
              margin: 0 auto;
            }
            h1 {
              font-size: 18px;
              margin: 0 0 4px 0;
              text-transform: uppercase;
            }
            p {
              font-size: 11px;
              margin: 4px 0;
            }
            .qr-placeholder {
              margin: 20px 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 12px 0;
            }
            .verified {
              font-weight: bold;
              font-size: 12px;
              border: 1px solid #000;
              padding: 4px 8px;
              display: inline-block;
              margin-top: 8px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="passport-card">
            <h1>Product Passport</h1>
            <p>SmartStore LK Supermarket</p>
            <div class="qr-placeholder" id="qr-target"></div>
            <div class="divider"></div>
            <p><strong>PRODUCT:</strong> ${name}</p>
            <p><strong>SKU:</strong> ${sku || "N/A"}</p>
            <p><strong>PRICE:</strong> Rs. ${Number(price).toLocaleString()}</p>
            <p><strong>QTY:</strong> ${quantity} ${unit}</p>
            <p><strong>DATE:</strong> ${formattedDate}</p>
            <p><strong>INVOICE:</strong> #${invoiceNo}</p>
            <div class="divider"></div>
            <div class="verified">✓ Verified Purchase</div>
          </div>
          <script>
            // Clone the canvas into the print window
            const originCanvas = window.opener.document.getElementById("passport-qr-canvas");
            if (originCanvas) {
              const img = document.createElement("img");
              img.src = originCanvas.toDataURL();
              img.style.width = "150px";
              img.style.height = "150px";
              document.getElementById("qr-target").appendChild(img);
            }
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-bg-card border border-border-color rounded-3xl overflow-hidden shadow-2xl p-6 w-full max-w-sm flex flex-col items-center relative text-text-main">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-main p-1.5 rounded-lg hover:bg-bg-main transition-colors cursor-pointer"
        >
          <FaTimes className="text-sm" />
        </button>

        {/* Badge & Title */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-3 shadow-inner">
          <FaCertificate className="text-xl animate-pulse" />
        </div>
        <h3 className="font-bold text-base tracking-tight mb-0.5">Product Passport</h3>
        <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-5">SmartStore LK Verified Item</p>

        {/* Hidden canvas helper for printing, renders standard size */}
        <div className="hidden">
          <QRCodeCanvas text={qrText} size={150} showDownload={false} />
          {/* We'll intercept the canvas ref dynamically or create a secondary element with id */}
          <div className="hidden-qr-wrapper">
            <canvas id="passport-qr-canvas" width="150" height="150"></canvas>
          </div>
        </div>

        {/* Visible Canvas container */}
        <div className="mb-5">
          <QRCodeCanvas text={qrText} size={160} filename={`passport-${sku || "item"}`} />
        </div>

        {/* Info card */}
        <div className="w-full bg-bg-main/45 border border-border-color/60 rounded-2xl p-4 text-left text-xs space-y-2 mb-6">
          <div>
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Product Name</span>
            <span className="font-bold text-text-main block truncate">{name}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">SKU / Barcode</span>
              <span className="font-bold text-text-main block">{sku || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Price</span>
              <span className="font-black text-indigo-500 block">Rs. {Number(price).toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border-color/40 pt-2">
            <div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Invoice ID</span>
              <span className="font-bold text-text-main block">#{invoiceNo}</span>
            </div>
            <div>
              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Purchase Qty</span>
              <span className="font-bold text-text-main block">{quantity} {unit}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-indigo-650 bg-indigo-600 hover:bg-indigo-550 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <FaPrint className="text-xs" /> Print Label
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-bg-main hover:bg-border-color border border-border-color text-text-main py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>

      {/* Quick helper script initialization to draw the QR code on our hidden canvas for cloning */}
      <script dangerouslySetInnerHTML={{
        __html: `
          setTimeout(() => {
            const sourceCanvas = document.querySelector(".bg-white canvas");
            const targetCanvas = document.getElementById("passport-qr-canvas");
            if (sourceCanvas && targetCanvas) {
              const ctx = targetCanvas.getContext("2d");
              ctx.drawImage(sourceCanvas, 0, 0, 150, 150);
            }
          }, 500);
        `
      }} />
    </div>
  );
};

export default ProductPassportModal;
