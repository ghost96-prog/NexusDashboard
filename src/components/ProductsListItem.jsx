import React from "react";
import "../Css/ProductsListItem.css";

const ProductsListItem = ({
  itemName,
  category,
  price,
  cost,
  stock,
  lowStockNotification,
  onClick,
  isSelected = false,
}) => {
  const getStockStatus = () => {
    if (stock <= 0) return "out";
    if (stock <= lowStockNotification) return "low";
    return "normal";
  };

  const getStockColorClass = () => {
    const status = getStockStatus();
    return `product-list-item-stock-${status}`;
  };

  const getStockBadgeClass = () => {
    const status = getStockStatus();
    return `product-list-item-stock-${status}-badge`;
  };

  const getStockLabel = () => {
    const status = getStockStatus();
    switch (status) {
      case "out": return "Out of stock";
      case "low": return "Low stock";
      default: return "In stock";
    }
  };

  const formatCurrency = (value) => {
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div 
      className={`product-list-item-productListItem ${isSelected ? "selected" : ""}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && onClick()}
    >
      <div className="product-list-item-productDetails">
        <div 
          className="product-list-item-productDetail"
          data-label="Product"
          title={itemName}
        >
          {itemName}
        </div>
        
        <div 
          className="product-list-item-productDetail"
          data-label="Category"
          title={`Category: ${category}`}
        >
          {category}
        </div>
        
        <div 
          className="product-list-item-productDetail"
          data-label="Price"
          title={`Price: $${formatCurrency(price)}`}
        >
          ${formatCurrency(price)}
        </div>
        
        <div 
          className="product-list-item-productDetail"
          data-label="Cost"
          title={`Cost: $${formatCurrency(cost)}`}
        >
          ${formatCurrency(cost)}
        </div>
        
        <div 
          className={`product-list-item-productDetail ${getStockColorClass()}`}
          data-label="Stock"
          title={`Stock: ${stock} (${getStockLabel()})`}
        >
          {stock}
          <span className={`product-list-item-stock-badge ${getStockBadgeClass()}`}>
            {getStockLabel()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Optional: Empty state component
export const EmptyProductsListItem = ({ message = "No products found" }) => (
  <div className="product-list-item-empty-products">
    <div className="product-list-item-empty-products-icon">📦</div>
    <p className="product-list-item-empty-products-text">{message}</p>
  </div>
);

// Optional: Loading skeleton component
export const LoadingProductsListItem = () => (
  <div className="product-list-item-productListItem loading">
    <div className="product-list-item-productDetails">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="product-list-item-productDetail">
          <div className="skeleton" style={{ width: "80%", height: "12px" }}></div>
        </div>
      ))}
    </div>
  </div>
);

// Header component
export const ProductsListHeader = () => (
  <div className="product-list-item-receiptHeader">
    <div className="product-list-item-headerItem">Product Name</div>
    <div className="product-list-item-headerItem">Category</div>
    <div className="product-list-item-headerItem">Price</div>
    <div className="product-list-item-headerItem">Cost</div>
    <div className="product-list-item-headerItem">Stock</div>
  </div>
);

export default ProductsListItem;