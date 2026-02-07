import { useState } from "react";
import jsPDF from "jspdf";
import "../Css/ShiftModal.css";

function ShiftModal({ onClose, store, email, selectedShift }) {
  const [isLoading, setIsLoading] = useState(false);
  const formatCurrencyForPDF = (value) => {
    const formattedNumber = value?.toFixed(2) || "0.00";
    
    if (selectedShift.baseCurrency === "USD") {
      return `$${formattedNumber}`;
    } else {
      // Use the actual currency code/symbol
      return `${selectedShift.baseCurrency}${formattedNumber}`;
    }
  };

  // Helper function for sales breakdown items (they have their own currency field)
  const formatSalesBreakdownAmount = (currency, amount) => {
    const formattedNumber = amount?.toFixed(2) || "0.00";
    
    if (currency === "USD") {
      return `$${formattedNumber}`;
    } else {
      return `${currency}${formattedNumber}`;
    }
  };

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
      pdf.setTextColor(26, 91, 123);
      pdf.text(`Shift Summary`, pageWidth / 2, y, { align: "center" });
      y += 8;

      // Store name
      pdf.setFontSize(14);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`${store.storeName}`, pageWidth / 2, y, { align: "center" });
      y += 10;

      // Shift number
      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 91, 123);
      pdf.text(`Shift #${selectedShift.shiftNumber}`, pageWidth / 2, y, {
        align: "center",
      });
      y += 15;

      // Currency display
      pdf.setFontSize(11);
      pdf.setFont(undefined, "italic");
      pdf.setTextColor(102, 102, 102);
      pdf.text(`All amounts in ${selectedShift.baseCurrency} unless specified`, pageWidth / 2, y, {
        align: "center",
      });
      y += 10;

      // Helper function to add label-value pairs
      const addRow = (label, value, yPos, isBold = false) => {
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(51, 51, 51);
        pdf.text(`${label}:`, margin, yPos);
        pdf.setFont(undefined, isBold ? "bold" : "normal");
        pdf.setTextColor(68, 68, 68);
        pdf.text(value, pageWidth - margin, yPos, { align: "right" });
      };

      // Shift details section
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 91, 123);
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
      addRow("Net Sales", formatCurrencyForPDF(selectedShift.netSales), y);
      y += 7;
      addRow("Starting Cash", formatCurrencyForPDF(selectedShift.startingCash), y);
      y += 7;
      addRow("Laybye Payments", formatCurrencyForPDF(selectedShift.laybye), y);
      y += 7;
      addRow("Income", formatCurrencyForPDF(selectedShift.income), y);
      y += 7;
      addRow("Expenses", `-${formatCurrencyForPDF(selectedShift.expenses)}`, y);
      y += 7;
      addRow("Total Expected", formatCurrencyForPDF(selectedShift.expectedCash), y, true);
      y += 7;
      addRow("Actual Amount", formatCurrencyForPDF(selectedShift.actualAmount), y);
      y += 7;
      
      pdf.setFont(undefined, "bold");
      if (selectedShift.variance >= 0) {
        pdf.setTextColor(40, 167, 69);
      } else {
        pdf.setTextColor(220, 53, 69);
      }
      addRow("Variance", formatCurrencyForPDF(selectedShift.variance), y);
      pdf.setTextColor(68, 68, 68);
      y += 12;

      // Sales Summary
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(26, 91, 123);
      pdf.text("Sales Summary", margin, y);
      y += 10;

      pdf.setFontSize(12);
      
      // For USD-specific fields, keep USD notation
      if (selectedShift.totalGrossSalesUSD !== undefined) {
        addRow("Gross Sales (USD)", `$${selectedShift.totalGrossSalesUSD?.toFixed(2) || "0.00"}`, y);
        y += 7;
      }
      
      addRow("Refunds", formatCurrencyForPDF(selectedShift.totalRefunds), y);
      y += 7;
      addRow("Discounts", formatCurrencyForPDF(selectedShift.totalDiscounts), y);
      y += 7;
      addRow("Net Sales", formatCurrencyForPDF(selectedShift.netSales), y, true);
      y += 7;
      addRow("Cost of Goods Sold", formatCurrencyForPDF(selectedShift.totalCOGS), y);
      y += 7;
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(40, 167, 69);
      addRow("Net Profit", formatCurrencyForPDF(selectedShift.profit), y, true);
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
          addRow(currency, formatSalesBreakdownAmount(currency, totalAmount), y);
          y += 7;
        });
      }

      // Cash Management Activities
      if (selectedShift.cashManagementActivities?.length > 0) {
        y += 12;
        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold");
        pdf.setTextColor(26, 91, 123);
        pdf.text("Cash Management Activities", margin, y);
        y += 10;

        pdf.setFontSize(12);
        
        const totalPayIn = selectedShift.income || 0;
        const totalPayOut = selectedShift.expenses || 0;

        addRow("Total Pay In", formatCurrencyForPDF(totalPayIn), y);
        y += 7;
        addRow("Total Pay Out", formatCurrencyForPDF(totalPayOut), y);
        y += 10;

        // Add individual activities
        pdf.setFontSize(11);
        pdf.setTextColor(102, 102, 102);
        pdf.text("Individual Activities:", margin, y);
        y += 7;

        selectedShift.cashManagementActivities.forEach((activity, index) => {
          if (y > 250) {
            pdf.addPage();
            y = 20;
          }
          
          const amount = parseFloat(activity.amountString) || 0;
          const currency = activity.currency || selectedShift.baseCurrency;
          const amountStr = currency === "USD" ? `$${amount.toFixed(2)}` : `${currency}${amount.toFixed(2)}`;
          
          pdf.setFont(undefined, "normal");
          pdf.setTextColor(68, 68, 68);
          pdf.text(`${index + 1}. ${activity.type}:`, margin, y);
          pdf.text(`${amountStr}`, pageWidth - margin, y, { align: "right" });
          y += 5;
          
          if (activity.comment) {
            pdf.setFontSize(10);
            pdf.setTextColor(102, 102, 102);
            pdf.text(`   "${activity.comment}"`, margin, y);
            y += 5;
            pdf.setFontSize(11);
          }
          
          pdf.setFontSize(9);
          pdf.setTextColor(136, 136, 136);
          pdf.text(`   By: ${activity.createdBy} at ${new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, margin, y);
          y += 8;
          pdf.setFontSize(11);
        });
      }

      // Timestamp
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
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
    const formattedNumber = value?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    if (selectedShift.baseCurrency === "USD") {
      return `$${formattedNumber}`;
    } else {
      return `${selectedShift.baseCurrency}${formattedNumber}`;
    }
  };

  // Calculate cash management totals - USE amountString (original amount)
// Calculate cash management totals - USE shift's income and expenses fields
const calculateCashManagementTotals = () => {
  const totalPayIn = selectedShift.income || 0;
  const totalPayOut = selectedShift.expenses || 0;
  const activities = selectedShift.cashManagementActivities || [];
  
  return { totalPayIn, totalPayOut, activities };
};

  const { totalPayIn, totalPayOut, activities } = calculateCashManagementTotals();

  return (
    <div className="modal-overlay shift-modal-overlay" onClick={onClose}>
      <div className="shift-modal-receipt" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-store">📊 {store.storeName}</div>
          <div className="receipt-title">SHIFT SUMMARY</div>
          <div className="receipt-number"># {selectedShift.shiftNumber}</div>
        </div>

        <div className="receipt-divider"></div>

        {/* Shift Details */}
        <div className="receipt-section">
          <div className="section-title">SHIFT DETAILS</div>
          <div className="receipt-row">
            <span>Opened By:</span>
            <span>{selectedShift.createdBy}</span>
          </div>
          <div className="receipt-row">
            <span>Opened:</span>
            <span>{new Date(selectedShift.openingDate).toLocaleString()}</span>
          </div>
          <div className="receipt-row">
            <span>Closed By:</span>
            <span>{selectedShift.closedBy}</span>
          </div>
          <div className="receipt-row">
            <span>Closed:</span>
            <span>{new Date(selectedShift.closingDate).toLocaleString()}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Cash Drawer */}
        <div className="receipt-section">
          <div className="section-title">CASH DRAWER SUMMARY</div>
          <div className="receipt-row">
            <span>Net Sales:</span>
            <span>{formatCurrency(selectedShift.netSales)}</span>
          </div>
          <div className="receipt-row">
            <span>Starting Cash:</span>
            <span>{formatCurrency(selectedShift.startingCash)}</span>
          </div>
          <div className="receipt-row">
            <span>Laybye Payments:</span>
            <span className="positive">{formatCurrency(selectedShift.laybye)}</span>
          </div>
          <div className="receipt-row">
            <span>Income:</span>
            <span className="positive">{formatCurrency(selectedShift.income)}</span>
          </div>
          <div className="receipt-row">
            <span>Expenses:</span>
            <span className="negative">-{formatCurrency(selectedShift.expenses)}</span>
          </div>
          <div className="receipt-row total">
            <span>Total Expected:</span>
            <span>{formatCurrency(selectedShift.expectedCash)}</span>
          </div>
          <div className="receipt-row">
            <span>Actual Amount:</span>
            <span>{formatCurrency(selectedShift.actualAmount)}</span>
          </div>
          <div className={`receipt-row ${selectedShift.variance >= 0 ? 'positive' : 'negative'}`}>
            <span>Variance:</span>
            <span>{selectedShift.variance >= 0 ? '+' : ''}{formatCurrency(selectedShift.variance)}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Sales Summary */}
        <div className="receipt-section">
          <div className="section-title">SALES SUMMARY</div>
          <div className="receipt-row">
            <span>Gross Sales (USD):</span>
            <span>{formatCurrency(selectedShift.totalGrossSalesUSD)}</span>
          </div>
          <div className="receipt-row">
            <span>Refunds:</span>
            <span className="negative">-{formatCurrency(selectedShift.totalRefunds)}</span>
          </div>
          <div className="receipt-row">
            <span>Discounts:</span>
            <span className="negative">-{formatCurrency(selectedShift.totalDiscounts)}</span>
          </div>
          <div className="receipt-row total">
            <span>Net Sales (USD):</span>
            <span>{formatCurrency(selectedShift.netSales)}</span>
          </div>
          <div className="receipt-row">
            <span>Cost of Goods Sold:</span>
            <span className="negative">-{formatCurrency(selectedShift.totalCOGS)}</span>
          </div>
          <div className="receipt-row profit">
            <span>Net Profit:</span>
            <span>{formatCurrency(selectedShift.profit)}</span>
          </div>
        </div>

        {/* Sales Breakdown */}
        {selectedShift.salesBreakdown?.length > 0 && (
          <>
            <div className="receipt-divider"></div>
            <div className="receipt-section">
              <div className="section-title">SALES BREAKDOWN</div>
              <div className="currency-grid">
                {selectedShift.salesBreakdown.map(({ currency, totalAmount }) => (
                  <div className="receipt-row" key={currency}>
                    <span>{currency}:</span>
                    <span>
                      {currency === "USD" ? "$" : ""}{totalAmount?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Cash Management Activities */}
        {activities.length > 0 && (
          <>
            <div className="receipt-divider"></div>
            <div className="receipt-section">
              <div className="section-title">CASH MANAGEMENT ACTIVITIES</div>
              
              {/* Totals Summary */}
          {/* Totals Summary */}
<div className="cash-management-totals">
  <div className="cash-total-card pay-in">
    <div className="cash-total-header">
      <span className="cash-total-icon">⬇️</span>
      <span className="cash-total-label">TOTAL PAY IN</span>
    </div>
    <div className="cash-total-amount positive">
      {formatCurrency(selectedShift.income || 0)}
    </div>
  </div>
  <div className="cash-total-card pay-out">
    <div className="cash-total-header">
      <span className="cash-total-icon">⬆️</span>
      <span className="cash-total-label">TOTAL PAY OUT</span>
    </div>
    <div className="cash-total-amount negative">
      {formatCurrency(selectedShift.expenses || 0)}
    </div>
  </div>
</div>

              {/* Activities List */}
              <div className="activities-list">
                <div className="activities-list-title">Individual Activities:</div>
                <div className="activities-container">
                  {activities.map((activity, index) => {
                    const amount = parseFloat(activity.amountString) || 0; // Use amountString
                    const currency = activity.currency || "USD";
                    const currencySymbol = currency === "USD" ? "$" : currency;
                    
                    return (
                      <div key={index} className="activity-item">
                        <div className="activity-header">
                          <div className={`activity-type-badge ${activity.type === "PAY IN" ? 'pay-in' : 'pay-out'}`}>
                            {activity.type === "PAY IN" ? "⬇️ PAY IN" : "⬆️ PAY OUT"}
                          </div>
                          <div className={`activity-amount ${activity.type === "PAY IN" ? 'positive' : 'negative'}`}>
                            {currencySymbol}
                            {amount.toFixed(2)}
                          </div>
                        </div>
                        
                        {activity.comment && (
                          <div className="activity-comment">
                            Reason: "{activity.comment}"
                          </div>
                        )}
                        
                        <div className="activity-footer">
                          <div className="activity-time">
                            {new Date(activity.date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className="activity-editor">
                            By: {activity.createdBy}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="receipt-divider"></div>

        {/* Actions */}
        <div className="receipt-actions">
          <button 
            className="receipt-btn download"
            onClick={handleDownloadPdf}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Download PDF</span>
              </>
            )}
          </button>
          <button 
            className="receipt-btn close"
            onClick={onClose}
          >
            <span>✕</span>
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShiftModal;