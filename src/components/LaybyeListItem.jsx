import React, { useMemo } from "react";
import "../Css/LaybyeListItem.css"; // Link to your styles

const LaybyeListItem = ({
  itemName,
  date,
  nextPaymentDate,
  totalBill,
  totalPaid,
  balance,
  latePayment,
  paymentStatus,
  onClick,
}) => {
  const randomColor = useMemo(() => {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
  }, []);

  const statusText = paymentStatus === "Paid" ? "PAID UP" : "PENDING";
  const statusClass = paymentStatus === "Paid" ? "paid" : "pending";

  const renderCircle = (title, amount, borderColor) => (
    <div className="circle-container">
      <div className="circle-title">{title}</div>
      <div className="circle" style={{ borderColor }}>
        <span className="circle-text">${parseFloat(amount).toFixed(2)}</span>
      </div>
    </div>
  );

  const renderBalanceCircle = (balance) => {
    const isPaid = balance === 0;
    return (
      <div className="circle-container">
        <div className="circle-title">Balance</div>
        <div
          className="circle-balance"
          style={{ backgroundColor: isPaid ? "green" : "red" }}
        >
          {isPaid ? (
            <span className="checkmark">✔</span>
          ) : (
            <span className="circle-text white">
              ${parseFloat(balance).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="laybye-list-item" onClick={onClick}>
      <div className="item-header">
        <div className="item-name">{itemName}</div>
        <div className={`status ${statusClass}`}>{statusText}</div>
      </div>
      <div className="dates">
        <div className="date">Date: {date}</div>
        <div className="next-payment">Due On: {nextPaymentDate}</div>
      </div>
      <div className="bill-summary">
        {renderCircle("Total Bill", totalBill, "green")}
        {renderCircle("Total Paid", totalPaid, "indigo")}
        {renderBalanceCircle(balance)}
      </div>
    </div>
  );
};

export default LaybyeListItem;
