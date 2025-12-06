import React from "react";
import ListItem, { EmptyListItem, LoadingListItem } from "./ListItem";

const ReceiptList = ({ items, isLoading, onItemSelect, selectedItemId }) => {
  if (isLoading) {
    return (
      <>
        <div className="receiptHeader">
          <div className="headerItem">Item Name</div>
          <div className="headerItem">Category</div>
          <div className="headerItem">Price</div>
          <div className="headerItem">Cost</div>
          <div className="headerItem">Stock</div>
          <div className="headerItem">Margin</div>
          <div className="headerItem">Availability</div>
        </div>
        {[...Array(5)].map((_, index) => (
          <LoadingListItem key={index} />
        ))}
      </>
    );
  }

  if (!items || items.length === 0) {
    return <EmptyListItem message="No items found" icon="📋" />;
  }

  return (
    <>
      <div className="receiptHeader">
        <div className="headerItem">Item Name</div>
        <div className="headerItem">Category</div>
        <div className="headerItem">Price</div>
        <div className="headerItem">Cost</div>
        <div className="headerItem">Stock</div>
        <div className="headerItem">Margin</div>
        <div className="headerItem">Availability</div>
      </div>
      {items.map((item, index) => (
        <ListItem
          key={item.id || index}
          itemName={item.name}
          category={item.category}
          price={item.price}
          cost={item.cost}
          stock={item.stock}
          margin={item.margin}
          availability={item.availability}
          isSelected={selectedItemId === item.id}
          onClick={() => onItemSelect(item)}
          hasRefund={item.hasRefund}
        />
      ))}
    </>
  );
};

export default ReceiptList;