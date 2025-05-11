import React from "react";
import { format } from "date-fns"; // Import date formatting function from date-fns
import "../Css/ProductValueListItem.css";

const ProductsValueListItem = ({
  itemName,
  quantity,
  retailValue,
  costValue,
  margin,
  onClick,
}) => {
  return (
    <div className="valueListItem" onClick={onClick}>
      <div className="valuetDetails">
        <div className="valuetDetail">{itemName}</div>
        <div className="valuetDetail">{quantity}</div>
        <div className="valuetDetail">${retailValue}</div>
        <div className="valuetDetail">${costValue}</div>
        <div className="valuetDetail">{margin}</div>
      </div>
    </div>
  );
};

export default ProductsValueListItem;
