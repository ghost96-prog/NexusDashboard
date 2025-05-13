// src/components/RemainingTimeFooter.js
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import "../Css/RemainingTimeFooter.css";

const RemainingTimeFooter = () => {
  const [remainingTimeData, setRemainingTimeData] = useState(null);
  const [latestPayment, setLatestPayment] = useState(null);
  const [latestPaymentStatus, setLatestPaymentStatus] = useState(null);

  const fetchRemainingTime = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Authentication token is missing.");
        return;
      }

      const decodedToken = jwtDecode(token);
      const userEmail = decodedToken.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/paymentRouter/payments?email=${encodeURIComponent(
          userEmail
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();
      const sortedPayments = data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const mostRecentPayment = sortedPayments[0];

      setLatestPayment(mostRecentPayment);
      setLatestPaymentStatus(mostRecentPayment?.status);

      if (mostRecentPayment) {
        setRemainingTimeData(mostRecentPayment.remainingTime);
      }
    } catch (error) {
      console.error("Error fetching remaining time:", error);
    }
  };

  useEffect(() => {
    fetchRemainingTime();
    const interval = setInterval(fetchRemainingTime, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    remainingTimeData && (
      <div className="remaining-time-footer">
        {latestPaymentStatus === "Active" ? (
          <span className="remaining-time">
            ⚠️ Your Nexus POS Subscription Expires In –{" "}
            {`${remainingTimeData.days}d ${remainingTimeData.hours}h ${remainingTimeData.minutes}m ${remainingTimeData.seconds}s`}
          </span>
        ) : (
          <span className="expired">
            ⚠️ Subscription Expired{" "}
            {new Date(latestPayment?.expirationDate).toLocaleString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            })}
          </span>
        )}
      </div>
    )
  );
};

export default RemainingTimeFooter;
