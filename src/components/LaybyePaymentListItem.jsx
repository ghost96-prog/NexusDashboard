import React, { memo, useCallback, useMemo } from "react";
import "../Css/LayByePaymentsListItem.css"; // Import the CSS file
import { FaCircle, FaReceipt } from "react-icons/fa"; // Use react-icons for the icon

const LaybyePaymentsListItem = memo(function LaybyePaymentsListItem({
  icon,
  amount,
  deposit,
  balance,
  paymentDate,
  luggage,
  time,
  onPress,
  currency,
  ticketNumber,
  refunded,
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
    <div className="list-item-container-payments" onClick={onPress}>
      <div className="item-container-payments">
        <div
          className="icon-container-payments"
          style={{ backgroundColor: randomColor, borderRadius: radius }}
        >
          <FaReceipt size={15} color="white" />
        </div>
        <span className="ticket-number">{ticketNumber}: </span>
        <span className="payment-date">{paymentDate}</span>
        <span className="deposit">{deposit}</span>
        <span className="balance">Bal: ${parseFloat(balance).toFixed(2)}</span>
        <span className="time">{time}</span>
        <span className="currency">
          <span className="paid-with"> </span> {currency}
        </span>
        <span className="refunded">{refunded}</span>
        <span
          className="amountpayments"
          style={{ fontSize: calculateFontSize(amount) }}
        >
          ${parseFloat(amount).toFixed(2)}
        </span>
      </div>
    </div>
  );
});

export default LaybyePaymentsListItem;
