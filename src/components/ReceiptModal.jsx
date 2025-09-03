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

  return (
    <div className="modalOverlay">
      <div className="modalContent invoiceModal">
        <button className="closeBtn" onClick={onClose}>
          ×
        </button>

        <h2 className="modalTitle">Receipt Details</h2>

        {/* PDF format controls */}
        <div className="formatControls">
          <div className="controlGroup">
            <label>Page Size:</label>
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
          <div className="controlGroup">
            <label>Orientation:</label>
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
        <div ref={contentRef} className="invoiceContent">
          {/* Header with decorative elements */}
          <div className="receiptDecorTop">
            <div className decorLine></div>
            <div className="storeIcon">🛒</div>
            <div className decorLine></div>
          </div>

          {/* Header */}
          <div className="invoiceHeader">
            <div className="companyInfo">
              <h1 className="storeName">{store?.storeName}</h1>
              <p className="storeDetails">{store?.address}</p>
              <p className="storeDetails">{store?.phone}</p>
              <p className="storeEmail">{email}</p>
            </div>
          </div>

          {/* Receipt details */}
          <div className="receiptDetails">
            <div className="detailRow">
              <span className="detailLabel">Receipt #:</span>
              <span className="detailValue">{receipt.ticketNumber}</span>
            </div>
            <div className="detailRow">
              <span className="detailLabel">Date:</span>
              <span className="detailValue">
                {new Date(receipt.dateTime).toLocaleString()}
              </span>
            </div>
            <div className="detailRow">
              <span className="detailLabel">Cashier:</span>
              <span className="detailValue">{receipt.createdBy}</span>
            </div>
          </div>

          {receipt.label && <div className="refundBadge">{receipt.label}</div>}

          {/* Items Table */}
          <div className="itemsSection">
            <div className="tableHeader">
              <div className="colItem">Item</div>
              <div className="colQty">Qty</div>
              <div className="colPrice">Unit Price</div>
              <div className="colTotal">Total</div>
            </div>

            {receipt.items.map((item, i) => (
              <div key={i} className="itemRow">
                <div className="colItem">{item.productName}</div>
                <div className="colQty">{item.quantity}</div>
                <div className="colPrice">
                  {receipt.selectedCurrency}{" "}
                  {(receipt.rate * item.unitPrice).toFixed(2)}
                </div>
                <div className="colTotal">
                  {receipt.selectedCurrency}{" "}
                  {(receipt.rate * item.actualTotal).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="summarySection">
            <div className="summaryRow">
              <span>Subtotal:</span>
              <span>
                {receipt.selectedCurrency} {receipt.totalSales.toFixed(2)}
              </span>
            </div>

            <div className="summaryRow discount">
              <span>Discount:</span>
              <span>
                - {receipt.selectedCurrency}{" "}
                {(receipt.rate * receipt.discountApplied).toFixed(2)}
              </span>
            </div>

            <div className="summaryRow total">
              <span>TOTAL:</span>
              <span>
                {receipt.selectedCurrency} {receipt.totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="paymentDetails">
              <div className="summaryRow">
                <span>Received:</span>
                <span>
                  {receipt.selectedCurrency} {receipt.received.toFixed(2)}
                </span>
              </div>
              <div className="summaryRow">
                <span>Change:</span>
                <span>
                  {receipt.selectedCurrency} {receipt.change.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
        </div>

        {/* Action buttons */}
        <div className="invoiceActions">
          <button
            className="btn btnPrimary"
            onClick={() => generateAndHandlePdf("preview")}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Preview PDF"}
          </button>

          {pdfUrl && (
            <>
              <button
                className="btn btnSecondary"
                onClick={handleDownload}
                disabled={isGenerating}
              >
                Download
              </button>
              <button
                className="btn btnTertiary"
                onClick={() => generateAndHandlePdf("print")}
                disabled={isGenerating}
              >
                Print
              </button>
            </>
          )}
        </div>

        {/* PDF preview */}
        {pdfUrl && (
          <div className="pdfPreviewContainer">
            <iframe className="pdfPreview" src={pdfUrl} title="PDF Preview" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceiptModal;
