import React from "react";
import { format } from "date-fns"; // Import date formatting function from date-fns
import "../Css/SoldProductListItem.css";

const SoldItemsListItem = ({
  productName,
  storeName,
  quantity,
  profit,
  cost,
  totalSales,
}) => {
  return (
    <div className="soldListItem">
      <div className="soldDetails">
        <div className="soldDetail">{productName}</div>
        <div className="soldDetail">{storeName}</div>
        <div className="soldDetail">{quantity}</div>
        <div className="soldDetail">${totalSales}</div>
        <div className="soldDetail">${cost}</div>
        <div className="soldDetail">${profit}</div>
      </div>
    </div>
  );
};

export default SoldItemsListItem;
