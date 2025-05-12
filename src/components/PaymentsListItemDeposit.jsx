import React, { memo, useCallback, useMemo } from "react";
import { FaCircle, FaReceipt } from "react-icons/fa"; // Using react-icons for the icon
import "../Css/PaymentsListItemDeposit.css"; // Import the CSS styles

const PaymentsListItemDeposit = memo(function PaymentsListItemDeposit({
  icon,
  amount,
  deposit,
  balance,
  paymentDate,
  refunded,
  time,
  currency,
  onPress,
  ticketNumber,
}) {
  const randomColor = useMemo(() => {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
  }, []);

  const radius = useMemo(() => {
    return Math.floor(Math.random() * 15) + 15; // Random radius between 15 and 30
  }, []);

  const calculateFontSize = useCallback((amount) => {
    return amount > 1000 ? 12 : 18; // Font size logic
  }, []);

  return (
    <div className="list-item-container" onClick={onPress}>
      <div className="item-container">
        <div
          className="icon-container"
          style={{ backgroundColor: randomColor, borderRadius: radius }}
        >
          <FaReceipt size={15} color="white" />
        </div>
        <span className="payment-date">{paymentDate}</span>
        <span className="ticket-number">{ticketNumber}: </span>
        <span className="deposit">{deposit}</span>
        <span className="balance">Bal: ${parseFloat(balance).toFixed(2)}</span>
        <span className="time">{time}</span>
        <span className="currency">
          <span className="paidwith"> </span> {currency}
        </span>
        <span className="refunded">{refunded}</span>
        <span
          className="amountdeposit"
          style={{ fontSize: calculateFontSize(amount) }}
        >
          ${parseFloat(amount).toFixed(2)}
        </span>
      </div>
      <hr />
    </div>
  );
});

export default PaymentsListItemDeposit;
