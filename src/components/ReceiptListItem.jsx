import React from "react";
import { format } from "date-fns"; // Import date formatting function from date-fns
import "../Css/ReceiptListItem.css";

const ReceiptListItem = ({
  receiptNumber,
  date,
  storeName,
  type,
  totalSales,
  onClick,
  label,
}) => {
  return (
    <div className="ReceiptListItem" onClick={onClick}>
      <div className="ReceiptDetails">
        <div className="ReceiptDetail">{receiptNumber}</div>
        <div className="ReceiptDetail">
          {format(date, "MMM d, yyyy - hh:mm:ss a")}
        </div>
        <div className="ReceiptDetail">{storeName}</div>
        <div className="ReceiptDetail">{type}</div>
        <div className="ReceiptDetail">{totalSales}</div>
        <span className="refundlabel">{label}</span>
      </div>
    </div>
  );
};

export default ReceiptListItem;
