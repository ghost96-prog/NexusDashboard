import React from "react";
import "../Css/SoldProductListItem.css";

const SoldItemsListItem = ({
  productName,
  storeName,
  quantity,
  profit,
  cost,
  totalSales,
  onClick,
  isSelected = false,
  status = "sold", // "sold", "returned", or "cancelled"
}) => {
  
  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (value) => {
    return parseFloat(value).toLocaleString('en-US');
  };

  const getProfitColor = (profitValue) => {
    const profitNum = parseFloat(profitValue);
    if (profitNum < 0) return "loss";
    if (profitNum >= 100) return "high";
    if (profitNum >= 50) return "medium";
    return "low";
  };

  const getProfitBadgeClass = () => {
    const profitNum = parseFloat(profit);
    const status = getProfitColor(profit);
    return `profit-${status}-badge`;
  };

  const getProfitLabel = () => {
    const profitNum = parseFloat(profit);
    if (profitNum < 0) return "LOSS";
    if (profitNum >= 100) return "HIGH PROFIT";
    if (profitNum >= 50) return "GOOD PROFIT";
    return "PROFIT";
  };

  const getProfitTrend = () => {
    const profitNum = parseFloat(profit);
    if (profitNum > 0) return "up";
    if (profitNum < 0) return "down";
    return "neutral";
  };

  const getTrendIcon = () => {
    const trend = getProfitTrend();
    switch (trend) {
      case "up": return "↗";
      case "down": return "↘";
      default: return "→";
    }
  };

  const getStatusIndicatorClass = () => {
    return `sold-status-indicator status-${status}`;
  };

  const getStatusLabel = () => {
    switch (status) {
      case "sold": return "Sold";
      case "returned": return "Returned";
      case "cancelled": return "Cancelled";
      default: return "Sold";
    }
  };

  return (
    <div 
      className={`sold-list-item ${isSelected ? "selected" : ""}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && onClick()}
    >
      <div className="sold-details">
        <div 
          className="sold-detail"
          data-label="Product"
          title={productName}
        >
          <span className={getStatusIndicatorClass()}></span>
          {productName}
        </div>
        
        <div 
          className="sold-detail"
          data-label="Store"
          title={`Store: ${storeName}`}
        >
          {storeName}
        </div>
        
        <div 
          className="sold-detail"
          data-label="Quantity"
          title={`Quantity Sold: ${formatNumber(quantity)}`}
        >
          {formatNumber(quantity)}
        </div>
        
        <div 
          className="sold-detail"
          data-label="Total Sales"
          title={`Total Sales: $${formatCurrency(totalSales)}`}
        >
          ${formatCurrency(totalSales)}
        </div>
        
        <div 
          className="sold-detail"
          data-label="Cost"
          title={`Cost: $${formatCurrency(cost)}`}
        >
          ${formatCurrency(cost)}
        </div>
        
        <div 
          className="sold-detail"
          data-label="Profit"
          title={`Profit: $${formatCurrency(profit)} (${getStatusLabel()})`}
        >
          ${formatCurrency(profit)}
         
        </div>
      </div>
    </div>
  );
};

// Optional: Empty state component
export const EmptySoldItemsListItem = ({ message = "No sold items found" }) => (
  <div className="sold-empty-state">
    <div className="sold-empty-icon">🛒</div>
    <p className="sold-empty-text">{message}</p>
  </div>
);

// Optional: Loading skeleton component
export const LoadingSoldItemsListItem = () => (
  <div className="sold-list-item loading">
    <div className="sold-details">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="sold-detail">
          <div className="skeleton" style={{ width: "80%", height: "12px" }}></div>
        </div>
      ))}
    </div>
  </div>
);

// Header component
export const SoldItemsListHeader = () => (
  <div className="sold-list-header">
    <div className="sold-list-header-item">Product Name</div>
    <div className="sold-list-header-item">Store</div>
    <div className="sold-list-header-item">Quantity</div>
    <div className="sold-list-header-item">Total Sales</div>
    <div className="sold-list-header-item">Cost</div>
    <div className="sold-list-header-item">Profit</div>
  </div>
);

export default SoldItemsListItem;