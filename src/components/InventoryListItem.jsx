import React from "react";
import { format } from "date-fns";
import "../Css/InventoryListItem.css";

const InventoryListItem = ({
  itemName,
  date,
  typeofedit,
  storeName,
  productType,
  stockBefore,
  stockAfter,
  difference,
  createdBy,
  roleofeditor,
  editedBy,
  differenceColor,
  onClick,
}) => {
  // Format the difference with + for positives, - for negatives
  const formattedDifference =
    productType === "Weight"
      ? difference > 0
        ? `+${difference.toFixed(2)}`
        : difference.toFixed(2)
      : difference > 0
      ? `+${difference}`
      : difference.toString();

  return (
    <div className="inventoryListItem" onClick={onClick}>
      <div className="InventoryDetails">
        <div className="InventoryDetail">
          {format(new Date(date), "MMM d, yyyy : hh:mm:ss a")}
        </div>
        <div className="InventoryDetail">{itemName}</div>
        <div className="InventoryDetail" style={{ whiteSpace: "pre-line" }}>
          {createdBy}
          {"\n"}({roleofeditor})
          {editedBy && (
            <>
              {"\n"}
              <span style={{ color: "orange" }}>{editedBy}</span>
            </>
          )}
        </div>
        <div className="InventoryDetail">{typeofedit}</div>
        <div className="InventoryDetail">{stockBefore}</div>
        <div className="InventoryDetail" style={{ color: differenceColor }}>
          {formattedDifference}
        </div>
        <div className="InventoryDetail">{stockAfter}</div>
      </div>
    </div>
  );
};

export default InventoryListItem;
