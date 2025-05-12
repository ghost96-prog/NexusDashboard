import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../Css/ShiftModal.css";

function ShiftModal({ onClose, store, email, selectedShift }) {
  const contentRef = useRef();

  const handleDownloadPdf = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Set default font
    pdf.setFont("helvetica", "normal");

    // Title
    pdf.setFontSize(20);
    pdf.setFont(undefined, "bold");
    pdf.text(`Shift Summary`, pageWidth / 2, y, { align: "center" });
    y += 8;

    // Store name
    pdf.setFontSize(14);
    pdf.setFont(undefined, "normal");
    pdf.text(`${store.storeName}`, pageWidth / 2, y, { align: "center" });
    y += 10;

    // Shift number
    pdf.setFontSize(16);
    pdf.setFont(undefined, "bold");
    pdf.text(`Shift #${selectedShift.shiftNumber}`, pageWidth / 2, y, {
      align: "center",
    });
    y += 15;

    // Shift details section header
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("Shift Details", margin, y);
    y += 10;

    // Helper function to add label-value pairs
    const addRow = (label, value, yPos) => {
      pdf.setFont(undefined, "bold");
      pdf.text(`${label}:`, margin, yPos);
      pdf.setFont(undefined, "normal");
      pdf.text(value, pageWidth - margin, yPos, { align: "right" });
    };

    // Shift details
    pdf.setFontSize(12);
    addRow("Opened By", selectedShift.createdBy, y);
    y += 7;
    addRow("Opened", new Date(selectedShift.openingDate).toLocaleString(), y);
    y += 7;
    addRow("Closed By", selectedShift.closedBy, y);
    y += 7;
    addRow("Closed", new Date(selectedShift.closingDate).toLocaleString(), y);
    y += 12;

    // Financial summary
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("Cash Drawer Summary", margin, y);
    y += 10;

    pdf.setFontSize(12);
    const formatCurrency = (value) => `$${value?.toFixed(2) || "0.00"}`;
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
    addRow("Total Expected", formatCurrency(selectedShift.expectedCash), y);
    y += 7;
    addRow("Actual Amount", formatCurrency(selectedShift.actualAmount), y);
    y += 7;
    addRow("Variance", formatCurrency(selectedShift.variance), y);
    y += 12;

    // Sales Summary
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("Sales Summary", margin, y);
    y += 10;

    pdf.setFontSize(12);
    addRow(
      "Gross Sales (USD)",
      formatCurrency(selectedShift.totalGrossSalesUSD),
      y
    );
    y += 7;
    addRow("Refunds", formatCurrency(selectedShift.totalRefunds), y);
    y += 7;
    addRow("Discounts", formatCurrency(selectedShift.totalDiscounts), y);
    y += 7;
    addRow("Net Sales (USD)", formatCurrency(selectedShift.netSales), y);
    y += 7;
    addRow("Cost of Goods Sold", formatCurrency(selectedShift.totalCOGS), y);
    y += 7;
    addRow("Net Profit", formatCurrency(selectedShift.profit), y);
    y += 12;

    // Sales Breakdown
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("Sales Breakdown", margin, y);
    y += 10;

    pdf.setFontSize(12);
    selectedShift.salesBreakdown?.forEach(({ currency, totalAmount }) => {
      const formattedAmount = `${
        currency === "USD" ? "$" : ""
      }${totalAmount?.toFixed(2)}`;
      addRow(currency, formattedAmount, y);
      y += 7;
    });

    // Timestamp
    pdf.setFontSize(10);
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
  };

  if (!selectedShift) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={contentRef}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <h2>Shift Summary</h2>

        <div className="section">
          <div className="data-row">
            <span className="labelShift">Shift Number:</span>
            <span className="value">{selectedShift.shiftNumber}</span>
          </div>
          <div className="data-row">
            <span className="labelShift">Opened By:</span>
            <span className="value">{selectedShift.createdBy}</span>
          </div>
          <div className="data-row">
            <span className="labelShift">Opened:</span>
            <span className="value">
              {new Date(selectedShift.openingDate).toLocaleString()}
            </span>
          </div>
          <div className="data-row">
            <span className="labelShift">Closed By:</span>
            <span className="value">{selectedShift.closedBy}</span>
          </div>
          <div className="data-row">
            <span className="labelShift">Closed:</span>
            <span className="value">
              {new Date(selectedShift.closingDate).toLocaleString()}
            </span>
          </div>
        </div>
        <hr />
        <div className="section">
          <div className="section-header">CASH DRAWER</div>

          <div className="data-row">
            <span className="labelShift">Net Sales:</span>
            <span className="value">${selectedShift.netSales?.toFixed(2)}</span>
          </div>
          <div className="data-row">
            <span className="labelShift">Starting Cash:</span>
            <span className="value">
              ${selectedShift.startingCash?.toFixed(2)}
            </span>
          </div>
          <div className="data-row">
            <span className="labelShift">Laybye Payments:</span>
            <span className="value">${selectedShift.laybye?.toFixed(2)}</span>
          </div>
          <div className="data-row">
            <span className="labelShift">Income:</span>
            <span className="value">${selectedShift.income?.toFixed(2)}</span>
          </div>
          <div className="data-row">
            <span className="labelShift">Expenses:</span>
            <span className="value">
              -${selectedShift.expenses?.toFixed(2)}
            </span>
          </div>
          <div className="data-row">
            <span className="labelShift">TOTAL EXPECTED CASH:</span>
            <span className="value">
              ${selectedShift.expectedCash?.toFixed(2)}
            </span>
          </div>
          <div className="data-row">
            <span className="labelShift">Actual Amount:</span>
            <span className="value">
              ${selectedShift.actualAmount?.toFixed(2)}
            </span>
          </div>
          <div className="data-row">
            <span className="labelShift">Variance:</span>
            <span className="value">${selectedShift.variance?.toFixed(2)}</span>
          </div>
        </div>
        <hr />

        <div className="section">
          <div className="section-header">SALES SUMMARY</div>

          <div className="data-row">
            <span className="labelShift bold">GROSS SALES (In USD):</span>
            <span className="value">
              $
              {selectedShift?.totalGrossSalesUSD?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="data-row">
            <span className="labelShift">Refunds:</span>
            <span className="value">
              $
              {selectedShift?.totalRefunds?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="data-row">
            <span className="labelShift">Discounts:</span>
            <span className="value">
              $
              {selectedShift?.totalDiscounts?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="data-row">
            <span className="labelShift bold">NET SALES (In USD):</span>
            <span className="value">
              $
              {selectedShift?.netSales?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="data-row">
            <span className="labelShift">Cost of Goods Sold:</span>
            <span className="value">
              $
              {selectedShift?.totalCOGS?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="data-row separator"></div>

          <div className="data-row">
            <span className="labelShift bold profit">NET PROFIT:</span>
            <span className="value profit">
              $
              {selectedShift?.profit?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <hr />
        <div className="section">
          <h3>Sales Breakdown</h3>
          {selectedShift.salesBreakdown?.map(({ currency, totalAmount }) => (
            <div className="data-row" key={currency}>
              <span className="labelShift">{currency}:</span>
              <span className="value">
                {currency === "USD" ? "$" : ""}
                {totalAmount?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button onClick={handleDownloadPdf}>Download PDF</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ShiftModal;
