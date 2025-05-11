import React from "react";
import { format } from "date-fns"; // Import date formatting function from date-fns
import "../Css/ShiftListItem.css";

const ShiftListItem = ({
  shiftNumber,
  openingDate,
  storeName,
  closedBy,
  amount,
  onClick,
  closingDate,
}) => {
  return (
    <div className="ShiftListItem" onClick={onClick}>
      <div className="ShiftDetails">
        <div className="ShiftDetail">{shiftNumber}</div>
        <div className="ShiftDetail">{closedBy}</div>
        <div className="ShiftDetail">{storeName}</div>

        <div className="ShiftDetail">
          {format(openingDate, "MMM d, yyyy - hh:mm:ss a")}
        </div>
        <div className="ShiftDetail">
          {format(closingDate, "MMM d, yyyy - hh:mm:ss a")}
        </div>
        <div className="ShiftDetail">${amount}</div>
      </div>
    </div>
  );
};

export default ShiftListItem;
