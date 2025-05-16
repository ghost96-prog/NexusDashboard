import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import "../Css/RemainingTimeFooter.css";
import { toast } from "react-toastify";

const RemainingTimeFooter = () => {
  const [remainingTimeData, setRemainingTimeData] = useState(null);
  const [latestPayment, setLatestPayment] = useState(null);
  const [latestPaymentStatus, setLatestPaymentStatus] = useState(null);

  const getTodayKey = () => {
    const today = new Date();
    return `toastCounter_${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;
  };

  const canShowToast = () => {
    const key = getTodayKey();
    const counter = parseInt(localStorage.getItem(key) || "0", 10);
    return counter < 2;
  };

  const incrementToastCounter = () => {
    const key = getTodayKey();
    const current = parseInt(localStorage.getItem(key) || "0", 10);
    localStorage.setItem(key, current + 1);
  };

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
        const remaining = mostRecentPayment.remainingTime;
        setRemainingTimeData(remaining);

        if (remaining.days <= 7 && canShowToast()) {
          // Trigger the toast if the remaining days are 7 or less
          if (mostRecentPayment.status !== "Active") {
            toast.warn(
              `⚠️ Subscription expired on ${new Date(
                mostRecentPayment.expirationDate
              ).toLocaleString()}`
            );
            incrementToastCounter();
          } else if (remaining.days <= 3 && remaining.days >= 0) {
            toast.warn(
              `⚠️ Your subscription will expire in ${remaining.days}d ${remaining.hours}h ${remaining.minutes}m ${remaining.seconds}s`
            );
            incrementToastCounter();
          }
        }
      }
    } catch (error) {
      console.error("Error fetching remaining time:", error);
    }
  };

  useEffect(() => {
    fetchRemainingTime();
  }, []);

  // Only render the footer if remaining time is 7 days or less
  return (
    remainingTimeData &&
    remainingTimeData.days <= 7 && (
      <div className="remaining-time-footer">
        {latestPaymentStatus === "Active" ? (
          <span className="remaining-time">
            ⚠️ Your Nexus POS Subscription Expires In –{" "}
            {`${remainingTimeData.days} days ${remainingTimeData.hours} hours ${remainingTimeData.minutes}m ${remainingTimeData.seconds}s`}
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
