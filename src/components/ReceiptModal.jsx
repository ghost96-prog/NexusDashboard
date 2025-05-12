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
  const [format, setFormat] = useState("a4");
  const [orientation, setOrientation] = useState("portrait");
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef();
  useEffect(() => {
    const handlePopState = () => {
      onClose();
    };

    window.history.pushState(null, null, window.location.pathname); // Push dummy state
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onClose]);
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

        {/* PDF format controls */}
        <div className="formatControls">
          <label>
            Size:
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
          </label>
          <label>
            Orientation:
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
              disabled={isGenerating}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
        </div>

        {/* Receipt content to be converted to PDF */}
        <div ref={contentRef} className="invoiceContent">
          {/* Header */}
          <div className="invoiceHeader">
            <div className="companyInfo">
              <h1>{store?.storeName}</h1>
              <p>{store?.address}</p>
              <p>{store?.phone}</p>
              <p>{email}</p>
            </div>
            <div className="receiptInfo">
              <p>
                <strong>Receipt #:</strong> {receipt.ticketNumber}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(receipt.dateTime).toLocaleString()}
              </p>
              <p>
                <strong>Cashier:</strong> {receipt.createdBy}
              </p>
            </div>
          </div>

          <span className="refund">{receipt.label}</span>

          {/* Items Table */}
          <table className="itemsTable">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Currency</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>{receipt.selectedCurrency}</td>
                  <td>{(receipt.rate * item.unitPrice).toFixed(2)}</td>
                  <td>{(receipt.rate * item.actualTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="summary">
            <div>
              <strong className="subTotal">
                <span>Subtotal: </span> {receipt.selectedCurrency}{" "}
                {receipt.totalSales.toFixed(2)}
              </strong>
              <p>
                <span>Discount:</span> {receipt.selectedCurrency}{" "}
                {(receipt.rate * receipt.discountApplied).toFixed(2)}
              </p>
              <strong className="grandTotal">
                <span>Total:</span> {receipt.selectedCurrency}{" "}
                {receipt.totalAmount.toFixed(2)}
              </strong>
              <p>
                <span>Received:</span> {receipt.selectedCurrency}{" "}
                {receipt.received.toFixed(2)}
              </p>
              <p>
                <span>Change:</span> {receipt.selectedCurrency}{" "}
                {receipt.change.toFixed(2)}
              </p>
            </div>
          </div>

          {/* QR Code (optional) */}
          {/* <div className="qrSection">
            <QRCode
              value={`https://fdms.zimra.co.zw/validate?invoice=${receipt.ticketNumber}`}
              size={100}
            />
            <p>Scan to verify with ZIMRA</p>
          </div> */}
        </div>

        {/* Action buttons */}
        <div className="invoiceActions">
          <button
            className="btn"
            onClick={() => generateAndHandlePdf("preview")}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Preview PDF"}
          </button>

          {pdfUrl && (
            <>
              <button
                className="btn"
                onClick={handleDownload}
                disabled={isGenerating}
              >
                Download
              </button>
              <button
                className="btn"
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
          <iframe className="pdfPreview" src={pdfUrl} title="PDF Preview" />
        )}
      </div>
    </div>
  );
}

export default ReceiptModal;
