import React from "react";
import { format } from "date-fns"; // Not used here but fine to keep
import "../Css/ProductsListItem.css";

const ProductsListItem = ({
  itemName,
  category,
  price,
  cost,
  stock,
  lowStockNotification,
  onClick,
}) => {
  const getStockColor = () => {
    if (stock <= 0) return "red";
    if (stock <= lowStockNotification) return "orange"; // includes equality check
    return "black";
  };

  const getStockLabel = () => {
    if (stock <= 0) return "(Out of stock)";
    if (stock <= lowStockNotification) return "(Low stock)"; // includes equality check
    return "";
  };

  return (
    <div className="productListItem" onClick={onClick}>
      <div className="productDetails">
        <div className="productDetail">{itemName}</div>
        <div className="productDetail">{category}</div>
        <div className="productDetail">${price}</div>
        <div className="productDetail">${cost}</div>
        <div className="productDetail" style={{ color: getStockColor() }}>
          {stock}
          {"   "} <span>{getStockLabel()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductsListItem;
