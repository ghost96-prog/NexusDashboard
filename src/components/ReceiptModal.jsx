import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../Css/ReceiptModal.css";

const PAGE_SIZES = [
  { label: "A5", value: "a5" },
  { label: "80mm", value: [226, 1000] },
  { label: "58mm", value: [226, 800] },
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
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      let doc;
      if (Array.isArray(format)) {
        // Custom size for thermal paper
        doc = new jsPDF({
          unit: "mm",
          format: format,
          orientation: "portrait",
        });
      } else {
        doc = new jsPDF({
          unit: "pt",
          format,
          orientation,
        });
      }

      const margin = 5;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      doc.addImage(imgData, "PNG", margin, margin, pageWidth, imgHeight);

      switch (action) {
        case "download":
          doc.save(`receipt_${receipt.ticketNumber}.pdf`);
          break;
        case "print":
          const printBlob = doc.output("blob");
          const printUrl = URL.createObjectURL(printBlob);
          const printWindow = window.open(printUrl);
          printWindow.onload = () => {
            printWindow.print();
            setTimeout(() => {
              URL.revokeObjectURL(printUrl);
              printWindow.close();
            }, 1000);
          };
          break;
        default:
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

  const handleDownload = () => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      window.open(pdfUrl, "_blank");
    } else {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `receipt_${receipt.ticketNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="receipt-modal-close-btn" onClick={onClose}>
          ×
        </button>


        {/* Compact receipt content */}
        <div ref={contentRef} className="receipt-modal-invoice-content">
          {/* Store header */}
          <div className="receipt-modal-store-header">
            <div className="receipt-modal-store-name">{store?.storeName || "STORE NAME"}</div>
            <div className="receipt-modal-store-address">{store?.address || "Store Address"}</div>
            <div className="receipt-modal-store-contact">
              📞 {store?.phone || "(000) 000-0000"}
            </div>
            <div className="receipt-modal-store-email">✉️ {email || "store@example.com"}</div>
          </div>

          <hr className="receipt-divider" />

          {/* Receipt info */}
          <div className="receipt-info">
            <div className="receipt-info-row">
              <span>Receipt #:</span>
              <span><strong>#{receipt.ticketNumber}</strong></span>
            </div>
            <div className="receipt-info-row">
              <span>Date:</span>
              <span>{new Date(receipt.dateTime).toLocaleDateString()}</span>
            </div>
            <div className="receipt-info-row">
              <span>Time:</span>
              <span>{new Date(receipt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="receipt-info-row">
              <span>Cashier:</span>
              <span>{receipt.createdBy}</span>
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Items table - compact */}
          <table className="receipt-items-table">
            <thead>
              <tr>
                <th className="item-name">Item</th>
                <th className="item-qty">Qty</th>
                <th className="item-price">Price</th>
                <th className="item-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => (
                <tr key={i}>
                  <td className="item-name">{item.productName}</td>
                  <td className="item-qty">{item.quantity}</td>
                  <td className="item-price">
                    {receipt.selectedCurrency} {formatCurrency(receipt.rate * item.unitPrice)}
                  </td>
                  <td className="item-total">
                    {receipt.selectedCurrency} {formatCurrency(receipt.rate * item.actualTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="receipt-divider" />

          {/* Totals section */}
          <div className="receipt-totals">
            <div className="receipt-total-row">
              <span>Subtotal:</span>
              <span>{receipt.selectedCurrency} {formatCurrency(receipt.totalSales)}</span>
            </div>
            
            {receipt.discountApplied > 0 && (
              <div className="receipt-total-row discount">
                <span>Discount:</span>
                <span>- {receipt.selectedCurrency} {formatCurrency(receipt.rate * receipt.discountApplied)}</span>
              </div>
            )}

            <div className="receipt-total-row grand-total">
              <span>TOTAL:</span>
              <span><strong>{receipt.selectedCurrency} {formatCurrency(receipt.totalAmount)}</strong></span>
            </div>

            <div className="receipt-payment-details">
              <div className="receipt-total-row">
                <span>Received:</span>
                <span>{receipt.selectedCurrency} {formatCurrency(receipt.received)}</span>
              </div>
              <div className="receipt-total-row">
                <span>Change:</span>
                <span>{receipt.selectedCurrency} {formatCurrency(receipt.change)}</span>
              </div>
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Footer */}
          <div className="receipt-footer">
           
            <div className="receipt-date-print">
              Date: {new Date(receipt.dateTime).toLocaleDateString()}: {new Date(receipt.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
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
                👁️ <span>Preview</span>
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

        {/* PDF preview - only if needed */}
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