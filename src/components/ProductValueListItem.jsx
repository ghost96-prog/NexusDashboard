import React from "react";
import "../Css/ProductValueListItem.css";

const ProductsValueListItem = ({
  itemName,
  quantity,
  retailValue,
  costValue,
  margin,
  onClick,
  isSelected = false,
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

  const getMarginColor = (margin) => {
    const marginValue = parseFloat(margin.replace('%', ''));
    if (marginValue >= 50) return "high";
    if (marginValue >= 25) return "medium";
    if (marginValue >= 0) return "low";
    return "neutral";
  };

  const getMarginBadgeClass = () => {
    const marginValue = parseFloat(margin.replace('%', ''));
    const status = getMarginColor(margin);
    return `margin-${status}-badge`;
  };

  const getMarginTrend = () => {
    const marginValue = parseFloat(margin.replace('%', ''));
    if (marginValue > 0) return "up";
    if (marginValue < 0) return "down";
    return "neutral";
  };

  const getTrendIcon = () => {
    const trend = getMarginTrend();
    switch (trend) {
      case "up": return "↗";
      case "down": return "↘";
      default: return "→";
    }
  };

  return (
    <div 
      className={`product-value-list-item ${isSelected ? "selected" : ""}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && onClick()}
    >
      <div className="product-value-details">
        <div 
          className="product-value-detail"
          data-label="Product"
          title={itemName}
        >
          {itemName}
        </div>
        
        <div 
          className="product-value-detail"
          data-label="Quantity"
          title={`Quantity: ${formatNumber(quantity)}`}
        >
          {formatNumber(quantity)}
        </div>
        
        <div 
          className="product-value-detail"
          data-label="Retail Value"
          title={`Retail Value: $${formatCurrency(retailValue)}`}
        >
          ${formatCurrency(retailValue)}
        </div>
        
        <div 
          className="product-value-detail"
          data-label="Cost Value"
          title={`Cost Value: $${formatCurrency(costValue)}`}
        >
          ${formatCurrency(costValue)}
        </div>
        
        <div 
          className="product-value-detail"
          data-label="Margin"
          title={`Margin: ${margin}`}
        >
          {margin}
          <span className={`product-value-margin-badge ${getMarginBadgeClass()}`}>
            {getMarginColor(margin).toUpperCase()} MARGIN
            <span className={`margin-trend margin-trend-${getMarginTrend()}`}>
              {getTrendIcon()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Optional: Empty state component
export const EmptyProductsValueListItem = ({ message = "No value data found" }) => (
  <div className="product-value-empty-state">
    <div className="product-value-empty-icon">💰</div>
    <p className="product-value-empty-text">{message}</p>
  </div>
);

// Optional: Loading skeleton component
export const LoadingProductsValueListItem = () => (
  <div className="product-value-list-item loading">
    <div className="product-value-details">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="product-value-detail">
          <div className="skeleton" style={{ width: "80%", height: "12px" }}></div>
        </div>
      ))}
    </div>
  </div>
);

// Header component
export const ProductsValueListHeader = () => (
  <div className="product-value-list-header">
    <div className="product-value-list-header-item">Product Name</div>
    <div className="product-value-list-header-item">Quantity</div>
    <div className="product-value-list-header-item">Retail Value</div>
    <div className="product-value-list-header-item">Cost Value</div>
    <div className="product-value-list-header-item">Margin</div>
  </div>
);

export default ProductsValueListItem;