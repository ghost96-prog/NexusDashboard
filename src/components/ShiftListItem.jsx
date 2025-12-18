import React from "react";
import { format } from "date-fns";
import "../Css/ShiftListItem.css";

const ShiftListItem = ({
  shiftNumber,
  openingDate,
  storeName,
  closedBy,
  amount,
  onClick,
  closingDate,
  isSelected = false,
  baseCurrency = "USD", // Add default value
  status = "closed",
  hasRefund = false,
}) => {
  const formatDate = (date) => {
    try {
      return format(new Date(date), "MMM d, yyyy - hh:mm a");
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Move formatCurrency inside the component but as a const function
  const formatCurrency = (value) => {
    const formattedNumber = Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    // Match the React Native logic
    if (baseCurrency === "USD") {
      return `$${formattedNumber}`;
    } else {
      // For non-USD, show the currency code
      return `${baseCurrency}${formattedNumber}`;
    }
  };

  return (
    <div 
      className={`ShiftListItem ${isSelected ? "selected" : ""}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && onClick()}
    >
      {hasRefund && <div className="refundlabel">Refund</div>}
     
      
      <div className="ShiftDetails">
        <div 
          className="ShiftDetail" 
          data-label="Shift #"
          title={`Shift #${shiftNumber}`}
        >
          #{shiftNumber}
        </div>
        
        <div 
          className="ShiftDetail closed-by-item" 
          data-label="Closed By"
          title={`Closed by: ${closedBy}`}
        >
          {closedBy}
        </div>
        
        <div 
          className="ShiftDetail" 
          data-label="Store"
          title={`Store: ${storeName}`}
        >
          {storeName}
        </div>
        
        <div 
          className="ShiftDetail date-item" 
          data-label="Opened"
          title={`Opened: ${formatDate(openingDate)}`}
        >
          {formatDate(openingDate)}
        </div>
        
        <div 
          className="ShiftDetail date-item" 
          data-label="Closed"
          title={`Closed: ${formatDate(closingDate)}`}
        >
          {formatDate(closingDate)}
        </div>
        
        <div 
          className="ShiftDetail" 
          data-label="Amount"
          title={`Amount: ${formatCurrency(amount)}`}
        >
          <div className="amount-container">
            <span className="amount-value">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Optional: Empty state component
export const EmptyShiftListItem = ({ message = "No shifts found" }) => (
  <div className="empty-shift">
    <div className="empty-shift-icon">📊</div>
    <p className="empty-shift-text">{message}</p>
  </div>
);

// Optional: Loading skeleton component
export const LoadingShiftListItem = () => (
  <div className="ShiftListItem loading">
    <div className="ShiftDetails">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="ShiftDetail">
          <div className="skeleton" style={{ width: "80%", height: "12px" }}></div>
        </div>
      ))}
    </div>
  </div>
);

export default ShiftListItem;