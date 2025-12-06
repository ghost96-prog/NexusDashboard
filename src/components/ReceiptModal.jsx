import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "react-qr-code";
import "../Css/ReceiptModal.css";

const PAGE_SIZES = [
  { label: "A4", value: "a4" },
  { label: "Letter", value: "letter" },
  { label: "A5", value: "a5" },
];

function ReceiptModal({ receipt, onClose, store, email }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [format, setFormat] = useState("a5");
  const [orientation, setOrientation] = useState("portrait");
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef();

  // Clear PDF when receipt or settings change
  useEffect(() => {
    setPdfUrl("");
  }, [receipt, format, orientation]);

  // Generate PDF with different actions
  const generateAndHandlePdf = async (action = "preview") => {
    setIsGenerating(true);
    try {
      // Capture the content as canvas
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      // Create PDF document
      const doc = new jsPDF({
        unit: "pt",
        format,
        orientation,
      });

      // Calculate dimensions and add image
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      doc.addImage(imgData, "PNG", margin, margin, pageWidth, imgHeight);

      // Handle different actions
      switch (action) {
        case "download":
          // Direct download
          doc.save(`receipt_${receipt.ticketNumber}.pdf`);
          break;

        case "print":
          // Open in new window for printing
          const printBlob = doc.output("blob");
          const printUrl = URL.createObjectURL(printBlob);
          const printWindow = window.open(printUrl);
          printWindow.onload = () => {
            printWindow.print();
            // Clean up after printing
            setTimeout(() => {
              URL.revokeObjectURL(printUrl);
              printWindow.close();
            }, 1000);
          };
          break;

        default: // preview
          // Set URL for preview
          const previewBlob = doc.output("blob");
          setPdfUrl(URL.createObjectURL(previewBlob));
          break;
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle iOS devices differently
  const handleDownload = () => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // iOS devices need to open in new tab
      window.open(pdfUrl, "_blank");
    } else {
      // Standard download for other devices
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `receipt_${receipt.ticketNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Generate QR code data
  const generateQRData = () => {
    const data = {
      receiptNumber: receipt.ticketNumber,
      date: receipt.dateTime,
      store: store?.storeName,
      total: receipt.totalAmount,
      currency: receipt.selectedCurrency,
    };
    return JSON.stringify(data);
  };

  return (
    <div className="receipt-modal-overlay">
      <div className="receipt-modal-content">
        <button 
          className="receipt-modal-close-btn" 
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="receipt-modal-title">📋 Receipt Details</h2>

        {/* PDF format controls */}
        <div className="receipt-modal-format-controls">
          <div className="receipt-modal-control-group">
            <label>📄 Page Size</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              disabled={isGenerating}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="receipt-modal-control-group">
            <label>🔄 Orientation</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
              disabled={isGenerating}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        {/* Receipt content to be converted to PDF */}
        <div ref={contentRef} className="receipt-modal-invoice-content">
          {/* Header with decorative elements */}
          <div className="receipt-modal-decor-top">
            <div className="receipt-modal-decor-line"></div>
            <div className="receipt-modal-store-icon">🛒</div>
            <div className="receipt-modal-decor-line"></div>
          </div>

          {/* Header */}
          <div className="receipt-modal-header">
            <div className="company-info">
              <h1 className="receipt-modal-store-name">{store?.storeName || "STORE NAME"}</h1>
              <p className="receipt-modal-store-details">{store?.address || "Store Address"}</p>
              <p className="receipt-modal-store-details">📞 {store?.phone || "(000) 000-0000"}</p>
              <p className="receipt-modal-store-email">✉️ {email || "store@example.com"}</p>
            </div>
          </div>

          {/* Receipt details */}
          <div className="receipt-modal-details">
            <div className="receipt-modal-detail-row">
              <span className="receipt-modal-detail-label">Receipt #:</span>
              <span className="receipt-modal-detail-value">#{receipt.ticketNumber}</span>
            </div>
            <div className="receipt-modal-detail-row">
              <span className="receipt-modal-detail-label">Date & Time:</span>
              <span className="receipt-modal-detail-value">
                {new Date(receipt.dateTime).toLocaleString()}
              </span>
            </div>
            <div className="receipt-modal-detail-row">
              <span className="receipt-modal-detail-label">Cashier:</span>
              <span className="receipt-modal-detail-value">👤 {receipt.createdBy}</span>
            </div>
          </div>

          {receipt.label && (
            <div className="receipt-modal-refund-badge">
              ⚠️ {receipt.label}
            </div>
          )}

          {/* Items Table */}
          <div className="receipt-modal-items-section">
            <div className="receipt-modal-table-header">
              <div className="receipt-modal-col-item">Item</div>
              <div className="receipt-modal-col-qty">Qty</div>
              <div className="receipt-modal-col-price">Unit Price</div>
              <div className="receipt-modal-col-total">Total</div>
            </div>

            {receipt.items.map((item, i) => (
              <div key={i} className="receipt-modal-item-row">
                <div className="receipt-modal-col-item">{item.productName}</div>
                <div className="receipt-modal-col-qty">{item.quantity}</div>
                <div className="receipt-modal-col-price">
                  {receipt.selectedCurrency} {formatCurrency(receipt.rate * item.unitPrice)}
                </div>
                <div className="receipt-modal-col-total">
                  {receipt.selectedCurrency} {formatCurrency(receipt.rate * item.actualTotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="receipt-modal-summary-section">
            <div className="receipt-modal-summary-row">
              <span>Subtotal:</span>
              <span>
                {receipt.selectedCurrency} {formatCurrency(receipt.totalSales)}
              </span>
            </div>

            <div className="receipt-modal-summary-row discount">
              <span>Discount:</span>
              <span>
                - {receipt.selectedCurrency} {formatCurrency(receipt.rate * receipt.discountApplied)}
              </span>
            </div>

            <div className="receipt-modal-summary-row total">
              <span>💰 TOTAL:</span>
              <span>
                {receipt.selectedCurrency} {formatCurrency(receipt.totalAmount)}
              </span>
            </div>

            <div className="receipt-modal-payment-details">
              <div className="receipt-modal-summary-row">
                <span>💵 Received:</span>
                <span>
                  {receipt.selectedCurrency} {formatCurrency(receipt.received)}
                </span>
              </div>
              <div className="receipt-modal-summary-row">
                <span>🪙 Change:</span>
                <span>
                  {receipt.selectedCurrency} {formatCurrency(receipt.change)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Action buttons */}
        <div className="receipt-modal-actions">
          <button
            className="receipt-modal-btn receipt-modal-btn-primary"
            onClick={() => generateAndHandlePdf("preview")}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="receipt-modal-spinner"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                👁️ <span>Preview PDF</span>
              </>
            )}
          </button>

          {pdfUrl && (
            <>
              <button
                className="receipt-modal-btn receipt-modal-btn-secondary"
                onClick={handleDownload}
                disabled={isGenerating}
              >
                📥 <span>Download</span>
              </button>
              <button
                className="receipt-modal-btn receipt-modal-btn-tertiary"
                onClick={() => generateAndHandlePdf("print")}
                disabled={isGenerating}
              >
                🖨️ <span>Print</span>
              </button>
            </>
          )}
        </div>

        {/* PDF preview */}
        {pdfUrl && (
          <div className="receipt-modal-pdf-preview-container">
            <iframe 
              className="receipt-modal-pdf-preview" 
              src={pdfUrl} 
              title="PDF Preview" 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceiptModal;