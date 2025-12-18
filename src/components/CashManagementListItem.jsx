import React from "react";
import "../Css/CashManagementListItem.css";

const CashManagementListItem = ({
  icon = "analytics-outline",
  comment,
  currency,
  type,
  amount,
  date,
}) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      return `${day} ${month} ${year}, ${time}`;
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatAmount = (amount, currency, type) => {
    const numAmount = parseFloat(amount);
    const formattedNumber = numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    // Check if it's pay out (should be negative)
    const isPayout = type && (
      type.toLowerCase().includes('payout') || 
      type.toLowerCase().includes('pay out') || 
      type.toLowerCase().includes('expense') || 
      type.toLowerCase().includes('withdrawal')
    );
    
    // For pay out, show as negative
    const sign = isPayout ? '-' : '';
    
    if (currency === "USD") {
      return `${sign}$${formattedNumber}`;
    } else {
      return `${sign}${formattedNumber}`;
    }
  };

  // Normalize type for CSS class
  const normalizeType = (type) => {
    if (!type) return "unknown";
    
    const lowerType = type.toLowerCase().trim();
    
    // Map variations to standard types
    if (lowerType.includes('payin') || lowerType.includes('pay in') || lowerType.includes('income') || lowerType.includes('deposit')) {
      return 'payin';
    }
    if (lowerType.includes('payout') || lowerType.includes('pay out') || lowerType.includes('expense') || lowerType.includes('withdrawal')) {
      return 'payout';
    }
    if (lowerType.includes('payment')) {
      return 'payment';
    }
    if (lowerType.includes('transfer')) {
      return 'transfer';
    }
    if (lowerType.includes('adjustment')) {
      return 'adjustment';
    }
    if (lowerType.includes('refund')) {
      return 'refund';
    }
    
    return lowerType;
  };

  // Format type display
  const formatTypeDisplay = (type) => {
    if (!type) return "Unknown";
    
    const lowerType = type.toLowerCase().trim();
    
    // Convert to readable format
    if (lowerType.includes('payin') || lowerType.includes('pay in')) {
      return 'Pay In';
    }
    if (lowerType.includes('payout') || lowerType.includes('pay out')) {
      return 'Pay Out';
    }
    if (lowerType.includes('income')) {
      return 'Income';
    }
    if (lowerType.includes('expense')) {
      return 'Expense';
    }
    if (lowerType.includes('payment')) {
      return 'Payment';
    }
    if (lowerType.includes('transfer')) {
      return 'Transfer';
    }
    if (lowerType.includes('adjustment')) {
      return 'Adjustment';
    }
    if (lowerType.includes('refund')) {
      return 'Refund';
    }
    if (lowerType.includes('deposit')) {
      return 'Deposit';
    }
    if (lowerType.includes('withdrawal')) {
      return 'Withdrawal';
    }
    
    // Capitalize first letter of each word
    return type.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const normalizedType = normalizeType(type);
  const displayType = formatTypeDisplay(type);
  
  // Check if amount should be red (payout) or green (payin)
  const isPayout = normalizedType === 'payout' || 
                  normalizedType === 'expense' || 
                  normalizedType === 'withdrawal';
  
  const isPayin = normalizedType === 'payin' || 
                  normalizedType === 'income' || 
                  normalizedType === 'deposit';

  return (
    <div className="cash-mgt-list-row">
      <div className="cash-mgt-row-item" style={{ flex: 2 }}>
        <span className="cash-mgt-item-comment">{comment || "No comment"}</span>
      </div>
      <div className="cash-mgt-row-item">
        <span className={`cash-mgt-item-type ${normalizedType}`}>
          {displayType}
        </span>
      </div>
      <div className="cash-mgt-row-item">
        <span className="cash-mgt-item-currency">
          {currency || "USD"}
        </span>
      </div>
      <div className="cash-mgt-row-item">
        <span className={`cash-mgt-item-amount ${isPayout ? 'negative' : isPayin ? 'positive' : ''}`}>
          {formatAmount(amount, currency, type)}
        </span>
      </div>
      <div className="cash-mgt-row-item" style={{ flex: 2 }}>
        <span className="cash-mgt-item-date">
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
};

// Optional: Empty state component
export const EmptyCashManagementListItem = ({ message = "No transactions" }) => (
  <div className="no-items-container">
    <div className="icon-container">
      <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <div className="no-items-text">{message}</div>
  </div>
);

export default CashManagementListItem;