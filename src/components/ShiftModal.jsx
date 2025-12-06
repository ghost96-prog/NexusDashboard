import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../Css/ShiftModal.css";

function ShiftModal({ onClose, store, email, selectedShift }) {
  const contentRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsLoading(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = 20;

      // Set default font
      pdf.setFont("helvetica", "normal");

      // Title
      pdf.setFontSize(20);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 91, 123); // #1a5b7b
      pdf.text(`Shift Summary`, pageWidth / 2, y, { align: "center" });
      y += 8;

      // Store name
      pdf.setFontSize(14);
      pdf.setTextColor(102, 102, 102); // #666
      pdf.text(`${store.storeName}`, pageWidth / 2, y, { align: "center" });
      y += 10;

      // Shift number
      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 91, 123); // #1a5b7b
      pdf.text(`Shift #${selectedShift.shiftNumber}`, pageWidth / 2, y, {
        align: "center",
      });
      y += 15;

      // Helper function to add label-value pairs
      const addRow = (label, value, yPos, isBold = false) => {
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(51, 51, 51); // #333
        pdf.text(`${label}:`, margin, yPos);
        pdf.setFont(undefined, isBold ? "bold" : "normal");
        pdf.setTextColor(68, 68, 68); // #444
        pdf.text(value, pageWidth - margin, yPos, { align: "right" });
      };

      // Helper function for currency values
      const formatCurrency = (value) => `$${value?.toFixed(2) || "0.00"}`;

      // Shift details section
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 91, 123); // #1a5b7b
      pdf.text("Shift Details", margin, y);
      y += 10;

      pdf.setFontSize(12);
      addRow("Opened By", selectedShift.createdBy, y);
      y += 7;
      addRow("Opened", new Date(selectedShift.openingDate).toLocaleString(), y);
      y += 7;
      addRow("Closed By", selectedShift.closedBy, y);
      y += 7;
      addRow("Closed", new Date(selectedShift.closingDate).toLocaleString(), y);
      y += 12;

      // Cash Drawer Summary
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 91, 123);
      pdf.text("Cash Drawer Summary", margin, y);
      y += 10;

      pdf.setFontSize(12);
      addRow("Net Sales", formatCurrency(selectedShift.netSales), y);
      y += 7;
      addRow("Starting Cash", formatCurrency(selectedShift.startingCash), y);
      y += 7;
      addRow("Laybye Payments", formatCurrency(selectedShift.laybye), y);
      y += 7;
      addRow("Income", formatCurrency(selectedShift.income), y);
      y += 7;
      addRow("Expenses", `-${formatCurrency(selectedShift.expenses)}`, y);
      y += 7;
      addRow("Total Expected", formatCurrency(selectedShift.expectedCash), y, true);
      y += 7;
      addRow("Actual Amount", formatCurrency(selectedShift.actualAmount), y);
      y += 7;
   // Fix the RGB color syntax
pdf.setFont(undefined, "bold");
if (selectedShift.variance >= 0) {
  pdf.setTextColor(40, 167, 69); // Green
} else {
  pdf.setTextColor(220, 53, 69); // Red
}
addRow("Variance", formatCurrency(selectedShift.variance), y);
pdf.setTextColor(68, 68, 68); // Reset color
y += 12;

      // Sales Summary
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 91, 123);
      pdf.text("Sales Summary", margin, y);
      y += 10;

      pdf.setFontSize(12);
      addRow("Gross Sales (USD)", formatCurrency(selectedShift.totalGrossSalesUSD), y);
      y += 7;
      addRow("Refunds", formatCurrency(selectedShift.totalRefunds), y);
      y += 7;
      addRow("Discounts", formatCurrency(selectedShift.totalDiscounts), y);
      y += 7;
      addRow("Net Sales (USD)", formatCurrency(selectedShift.netSales), y, true);
      y += 7;
      addRow("Cost of Goods Sold", formatCurrency(selectedShift.totalCOGS), y);
      y += 7;
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(40, 167, 69); // Green for profit
      addRow("Net Profit", formatCurrency(selectedShift.profit), y, true);
      y += 12;

      // Sales Breakdown
      if (selectedShift.salesBreakdown?.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(26, 91, 123);
        pdf.text("Sales Breakdown", margin, y);
        y += 10;

        pdf.setFontSize(12);
        pdf.setTextColor(68, 68, 68);
        selectedShift.salesBreakdown.forEach(({ currency, totalAmount }) => {
          const formattedAmount = `${currency === "USD" ? "$" : ""}${totalAmount?.toFixed(2)}`;
          addRow(currency, formattedAmount, y);
          y += 7;
        });
      }

      // Timestamp
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102); // #666
      pdf.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        280,
        {
          align: "center",
        }
      );

      pdf.save(
        `shift-summary-${store.storeName}-${selectedShift.shiftNumber}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedShift) return null;

  const formatCurrency = (value) => {
    return `$${value?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="modal-overlay shift-modal-overlay">
      <div className="shift-modal" ref={contentRef}>
        <div className="shift-modal-header">
          <span className="shift-modal-icon">📊</span>
          <h2 className="shift-modal-title">Shift Summary</h2>
          <div className="shift-modal-subtitle">
            <span className="store-name">{store.storeName}</span>
            <span className="shift-number">Shift #{selectedShift.shiftNumber}</span>
          </div>
        </div>

        <button className="shift-modal-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <div className="shift-modal-content">
          {/* Shift Details Card */}
          <div className="shift-section-card">
            <div className="section-header">
              <i className="fas fa-clock section-icon"></i>
              <h3>Shift Details</h3>
            </div>
            <div className="section-content">
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Opened By</span>
                  <span className="data-value highlight">{selectedShift.createdBy}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Opened</span>
                  <span className="data-value">{new Date(selectedShift.openingDate).toLocaleString()}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Closed By</span>
                  <span className="data-value highlight">{selectedShift.closedBy}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Closed</span>
                  <span className="data-value">{new Date(selectedShift.closingDate).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Drawer Card */}
          <div className="shift-section-card">
            <div className="section-header">
              <i className="fas fa-cash-register section-icon"></i>
              <h3>Cash Drawer Summary</h3>
            </div>
            <div className="section-content">
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Net Sales</span>
                  <span className="data-value">{formatCurrency(selectedShift.netSales)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Starting Cash</span>
                  <span className="data-value">{formatCurrency(selectedShift.startingCash)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Laybye Payments</span>
                  <span className="data-value positive">{formatCurrency(selectedShift.laybye)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Income</span>
                  <span className="data-value positive">{formatCurrency(selectedShift.income)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Expenses</span>
                  <span className="data-value negative">-{formatCurrency(selectedShift.expenses)}</span>
                </div>
                <div className="data-item total">
                  <span className="data-label">Total Expected Cash</span>
                  <span className="data-value total-amount">{formatCurrency(selectedShift.expectedCash)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Actual Amount</span>
                  <span className="data-value">{formatCurrency(selectedShift.actualAmount)}</span>
                </div>
                <div className={`data-item variance ${selectedShift.variance >= 0 ? 'positive' : 'negative'}`}>
                  <span className="data-label">Variance</span>
                  <span className="data-value">
                    {selectedShift.variance >= 0 ? '+' : ''}{formatCurrency(selectedShift.variance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Summary Card */}
          <div className="shift-section-card">
            <div className="section-header">
              <i className="fas fa-chart-line section-icon"></i>
              <h3>Sales Summary</h3>
            </div>
            <div className="section-content">
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Gross Sales (USD)</span>
                  <span className="data-value">{formatCurrency(selectedShift.totalGrossSalesUSD)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Refunds</span>
                  <span className="data-value negative">-{formatCurrency(selectedShift.totalRefunds)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Discounts</span>
                  <span className="data-value negative">-{formatCurrency(selectedShift.totalDiscounts)}</span>
                </div>
                <div className="data-item total">
                  <span className="data-label">Net Sales (USD)</span>
                  <span className="data-value total-amount">{formatCurrency(selectedShift.netSales)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Cost of Goods Sold</span>
                  <span className="data-value negative">-{formatCurrency(selectedShift.totalCOGS)}</span>
                </div>
                <div className="data-item profit">
                  <span className="data-label">Net Profit</span>
                  <span className="data-value profit-amount">{formatCurrency(selectedShift.profit)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Breakdown Card */}
          {selectedShift.salesBreakdown?.length > 0 && (
            <div className="shift-section-card">
              <div className="section-header">
                <i className="fas fa-globe section-icon"></i>
                <h3>Sales Breakdown</h3>
              </div>
              <div className="section-content">
                <div className="currency-grid">
                  {selectedShift.salesBreakdown.map(({ currency, totalAmount }) => (
                    <div className="currency-item" key={currency}>
                      <span className="currency-label">{currency}</span>
                      <span className="currency-value">
                        {currency === "USD" ? "$" : ""}{totalAmount?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="shift-modal-actions">
          <button 
            className="shift-modal-download"
            onClick={handleDownloadPdf}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <i className="fas fa-download"></i>
                <span>Download PDF</span>
              </>
            )}
          </button>
          <button 
            className="shift-modal-close"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
            <span>Close</span>
          </button>
        </div>

        
      </div>
    </div>
  );
}

export default ShiftModal;