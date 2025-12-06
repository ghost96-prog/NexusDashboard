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
  isSelected = false,
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
    <div 
      className={`InventoryListItem ${isSelected ? "selected" : ""}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && onClick()}
    >
      <div className="InventoryDetails">
        {/* DATE COLUMN - ADDED date-column class */}
        <div 
          className="InventoryDetail date-column" 
          data-label="Date"
          title={`Date: ${format(new Date(date), "MMM d, yyyy : hh:mm:ss a")}`}
        >
          {format(new Date(date), "MMM d, yyyy : hh:mm:ss a")}
        </div>
        
        <div 
          className="InventoryDetail" 
          data-label="Item"
          title={`Item: ${itemName}`}
        >
          {itemName}
        </div>
        
        <div 
          className="InventoryDetail" 
          data-label="Editor"
          title={`Editor: ${createdBy} (${roleofeditor})`}
          style={{ whiteSpace: "pre-line" }}
        >
          {createdBy}
          {"\n"}({roleofeditor})
          {editedBy && (
            <>
              {"\n"}
              <span style={{ color: "orange" }}>{editedBy}</span>
            </>
          )}
        </div>
        
        <div 
          className="InventoryDetail" 
          data-label="Edit Type"
          title={`Edit Type: ${typeofedit}`}
        >
          <span className={`edit-type-badge ${typeofedit?.toLowerCase().includes('add') ? 'edit-type-addition' : typeofedit?.toLowerCase().includes('remove') ? 'edit-type-removal' : 'edit-type-correction'}`}>
            {typeofedit}
          </span>
        </div>
        
        <div 
          className="InventoryDetail" 
          data-label="Before"
          title={`Before: ${stockBefore}`}
        >
          {stockBefore}
        </div>
        
        <div 
          className="InventoryDetail" 
          data-label="Difference"
          title={`Difference: ${formattedDifference}`}
        >
          <span className={`difference-value ${difference > 0 ? '' : difference < 0 ? 'difference-negative' : 'difference-neutral'}`}>
            {formattedDifference}
          </span>
        </div>
        
        <div 
          className="InventoryDetail" 
          data-label="After"
          title={`After: ${stockAfter}`}
        >
          {stockAfter}
        </div>
      </div>
    </div>
  );
};

export default InventoryListItem;