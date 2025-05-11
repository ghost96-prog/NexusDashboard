import React from "react";
import { format } from "date-fns"; // Import date formatting function from date-fns
import "../Css/ReceiptListItem.css";

const ListItem = ({
  itemName,
  category,
  price,
  cost,
  stock,
  margin,
  availability,
  onClick,
}) => {
  return (
    <div className="receiptListItem" onClick={onClick}>
      <div className="receiptDetails">
        <div className="receiptDetail">{itemName}</div>
        <div className="receiptDetail">{category}</div>
        <div className="receiptDetail">{price}</div>
        <div className="receiptDetail">{cost}</div>
        <div className="receiptDetail">{stock}</div>
        <div className="receiptDetail">{margin}</div>
        <div className="receiptDetail">{availability}</div>
      </div>
    </div>
  );
};

export default ListItem;
