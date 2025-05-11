import React from "react";
import { format } from "date-fns"; // Import date formatting function from date-fns
import "../Css/ProductsListItem.css";

const ProductsListItem = ({
  itemName,
  category,
  price,
  cost,
  stock,
  onClick,
}) => {
  return (
    <div className="productListItem" onClick={onClick}>
      <div className="productDetails">
        <div className="productDetail">{itemName}</div>
        <div className="productDetail">{category}</div>
        <div className="productDetail">${price}</div>
        <div className="productDetail">${cost}</div>
        <div className="productDetail">{stock}</div>
      </div>
    </div>
  );
};

export default ProductsListItem;
