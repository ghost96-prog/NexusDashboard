import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaMoneyBillAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa"; // You can adjust icons as needed
import LaybyePaymentsListItem from "../components/LaybyePaymentListItem";
import PaymentsListItemDeposit from "../components/PaymentsListItemDeposit";
// import CustomBackButton from "../components/CustomBackButton";
import "../Css/PaymentsScreen.css"; // Assume you extract styles here
import RemainingTimeFooter from "../components/RemainingTimeFooter";

const PaymentsScreen = ({ laybyeData, paymentsData, onBack }) => {
  const [customerName, setCustomerName] = useState(
    laybyeData.customerName || ""
  );
  const [phone, setPhone] = useState(laybyeData.phone || "");
  const [laybyeId, setLaybyeId] = useState(laybyeData.id || "");
  const [address, setAddress] = useState(laybyeData.address || "");
  const [deposit, setDeposit] = useState(laybyeData.deposit || 0);
  const [selectedProducts, setSelectedProducts] = useState(
    laybyeData.selectedProducts || []
  );
  const [selectedLaybyeOption, setSelectedLaybyeOption] = useState(
    laybyeData.selectedLaybyeOption || ""
  );
  const [laybyePeriod, setLaybyePeriod] = useState(
    laybyeData.laybyePeriod || ""
  );
  const [totalBill, setTotalBill] = useState(laybyeData.totalBill || 0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [paymentData, setPaymentsData] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, [laybyeId]);

  const fetchPayments = () => {
    console.log("====================================");
    console.log("laybyeData", laybyeData);
    console.log("====================================");
    try {
      const payments = paymentsData.filter(
        (payment) =>
          payment.laybyeId === laybyeData.id && payment.type === "Payment"
      );

      const formattedPayments = payments
        .map((payment) => ({
          ...payment,
          paymentDate: new Date(payment.date).toISOString(),
          time: new Date(payment.date).toISOString(),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ascending order

      const totalPaid =
        parseFloat(laybyeData.deposit) +
        payments
          .filter((payment) => payment.refunded !== "REFUNDED")
          .reduce((sum, payment) => sum + payment.amount, 0);

      setPaymentsData(formattedPayments);
      setTotalPaid(totalPaid);
    } catch (error) {
      console.error("Error processing payments:", error);
    }
  };

  const formatTime = (date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
    const timeString = dateObj.toTimeString().split(" ")[0];
    const [hour, minute, second] = timeString.split(":");
    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute}:${second} ${suffix}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toDateString();
  };

  const laybyeBalance = totalBill - totalPaid;

  const renderCircle = (title, amount, borderColor) => (
    <div className="circle-container-payments">
      <div className="circle-title-payments">{title}</div>
      <div className="circle-payments" style={{ borderColor }}>
        ${parseFloat(amount).toFixed(2)}
      </div>
    </div>
  );

  return (
    <div className="payments-screen">
      <div className="header">
        {/* <CustomBackButton onClick={onBack} /> */}
        <h2>Laybye Payments</h2>
      </div>

      <div className="customer-details">
        <h3>{customerName}</h3>
        <div className="bill-summary">
          {renderCircle("Total Bill", totalBill, "red")}
          {renderCircle("Total Paid", totalPaid, "green")}
          {renderCircle("Balance", laybyeBalance, "orange")}
        </div>
        <div className="customer-meta">
          <div>
            <p>
              PHONE NUMBER: <span>{phone}</span>
            </p>
            <p>
              ADDRESS: <span>{address}</span>
            </p>
          </div>
          <div>
            <p>
              Selected Period: <span>{selectedLaybyeOption}</span>
            </p>
            <p>
              Full Payment In:{" "}
              <span>
                {laybyePeriod}{" "}
                {selectedLaybyeOption === "Daily"
                  ? "Days"
                  : selectedLaybyeOption === "Weekly"
                  ? "Weeks"
                  : selectedLaybyeOption === "Monthly"
                  ? "Months"
                  : ""}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="selected-products">
        <div className="product-item header">
          <span>Item</span>
          <span>Total</span>
        </div>
        {selectedProducts.map((product, index) => (
          <div key={index} className="product-item">
            <span>
              {product.productName.length > 18
                ? `${product.productName.substring(0, 18)}...`
                : product.productName}{" "}
              x{product.quantity}
            </span>
            <span>
              ${parseFloat(product.price * product.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="payments-list">
        <h3>PAYMENTS LIST</h3>
        <PaymentsListItemDeposit
          paymentDate={formatDate(laybyeData.date)}
          time={formatTime(laybyeData.date)}
          amount={laybyeData.deposit}
          balance={laybyeData.balance}
          refunded={laybyeData.refunded}
          ticketNumber={laybyeData.ticketNumber}
          currency={laybyeData.currency}
          deposit={"DEPOSIT"}
        />
        {paymentData.map((item, index) => (
          <LaybyePaymentsListItem
            key={index}
            paymentDate={formatDate(item.paymentDate)}
            time={formatTime(item.paymentDate)}
            balance={item.balance}
            currency={item.currency}
            ticketNumber={item.ticketNumber}
            refunded={item.refunded}
            deposit="LAYBYE"
            amount={item.amount}
          />
        ))}
      </div>
      <RemainingTimeFooter />
    </div>
  );
};

export default PaymentsScreen;
