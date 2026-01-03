import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaArrowDown,
  FaArrowUp,
  FaDownload,
  FaChartLine,
  FaReceipt,
  FaPercentage,
  FaDollarSign,
  FaBox,
  FaShoppingCart,
  FaExchangeAlt,
  FaTags
} from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { DateRangePicker, defaultStaticRanges } from "react-date-range";
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  addDays,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  subYears,
  addYears,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "../Css/SalesSummery.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { IoCalendar } from "react-icons/io5";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { FaFileCsv, FaFilePdf } from "react-icons/fa6";
import RemainingTimeFooter from "../components/RemainingTimeFooter";

const SalesSummery = () => {
  const employees = ["Employee 1", "Employee 2", "Employee 3"];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [selectedExportOption, setSelectedExportOption] = useState("");
  const [stores, setStoreData] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [profit, setProfit] = useState(0);
  const [productSummary, setProductSummary] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState(startOfToday());
  const [selectedEndDate, setSelectedEndDate] = useState(endOfToday());
  const [selectedOption, setSelectedOption] = useState("today");
  const [selectedRange, setSelectedRange] = useState("Today");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const dateRangePickerRef = useRef(null);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [email, setEmail] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [grossSales, setGrossSales] = useState(0);
  const [discounts, setToTalDiscounts] = useState(0);
  const [refunds, setTotalRefunds] = useState(0);
  const [laybyeTotal, setLaybyeTotal] = useState(0);
  const [cost, setCost] = useState(0);
  const [receiptsByDate, setReceiptsByDate] = useState({});
  const [receiptsLength, setReceiptsLength] = useState(0);
  const [percentageDiffProfit, setProfitPercentDiff] = useState(0);
  const [percentageDiffReceipts, setPercentageDiffReceipts] = useState(0);
  const [percentageDiffTotalIncome, setPercentageDiffTotalIncome] = useState(0);
  const [percentageDiffTotalCost, setPercentageDiffTotalCost] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setEmail(decoded.email);
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, []);

  useEffect(() => {
    setSelectedStores(stores);
    setSelectedEmployees(employees);
  }, [selectedOption, stores]);

  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh(selectedOption, selectedStartDate, selectedEndDate);
    }
  }, [selectedStores, selectedOption, selectedStartDate, selectedEndDate]);

  useEffect(() => {
    if (email) {
      fetchStores();
    }
  }, [email]);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const email = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/storeRouter/stores?email=${encodeURIComponent(
          email
        )}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("User not found or invalid email.");
        return;
      }

      const data = await response.json();
      setStoreData(data || []);
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching stores.");
      }
      console.error("Error fetching stores:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchAllReceiptsData = async (timeframe, startDate, endDate) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const formattedStartDate = startDate;
      const formattedEndDate = endDate;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/dashboardRouter/${timeframe}?startDate=${formattedStartDate}&endDate=${formattedEndDate}&email=${encodeURIComponent(
          userEmail
        )}`
      );
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error(`Error: ${"User not found or invalid email."}`);
      }
      
      const {
        totalAmountSum,
        totalCostAmountSumWithoutRefunds,
        receiptsNet,
        laybyeTotal,
        totalDiscount,
        netSales,
        prevProfit,
        receipts,
        totalAmountDifferencePercentage,
        totalCostDifferencePercentage,
        receiptsDifference,
      } = responseData;
      
      const calculatedProfit = netSales - totalCostAmountSumWithoutRefunds;
      setProfit(calculatedProfit);

      const calculatedProfitPercentage =
        prevProfit === 0
          ? 0
          : ((calculatedProfit - prevProfit) / prevProfit) * 100;
      setProfitPercentDiff(calculatedProfitPercentage);

      const filterRefundedReceipts = receipts.filter(
        (receipt) => receipt.label === "Refunded"
      );
      
      const totalRefunds = filterRefundedReceipts.reduce(
        (sum, receipt) => sum + receipt.totalAmountUsd,
        0
      );

      const receiptsByDate = receipts.reduce((acc, receipt) => {
        const date = convertFirestoreTimestampToDate(receipt.dateTime)
          .toISOString()
          .split("T")[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(receipt);
        return acc;
      }, {});

      setLaybyeTotal(laybyeTotal);
      setReceiptsByDate(receiptsByDate);
      setGrossSales(totalAmountSum);
      setToTalDiscounts(totalDiscount);
      setTotalRefunds(totalRefunds);
      setCost(totalCostAmountSumWithoutRefunds);
      setPercentageDiffReceipts(receiptsDifference);
      setPercentageDiffTotalCost(totalCostDifferencePercentage);
      setPercentageDiffTotalIncome(totalAmountDifferencePercentage);
      setReceipts(receiptsNet);
      setTotalAmount(netSales);
      setProfit(calculatedProfit);
      setReceiptsLength(receiptsNet.length);
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching receipts.");
      }
      console.error("Error fetching receipts:", error);
    }
  };

  const convertFirestoreTimestampToDate = (timestamp) => {
    return new Date(
      timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000
    );
  };

  const onRefresh = async (
    selectedOption,
    selectedStartRange,
    selectedEndRange
  ) => {
    NProgress.start();
    setIsRefreshing(true);
    await fetchAllReceiptsData(
      selectedOption,
      selectedStartRange,
      selectedEndRange
    )
      .then(() => {
        NProgress.done();
        setIsRefreshing(false);
      })
      .catch((error) => {
        console.error(error);
        setIsRefreshing(false);
      });
  };

  const handleStoreSelect = (store) => {
    if (store === "All Stores") {
      if (selectedStores.length === stores.length) {
        setSelectedStores([]);
      } else {
        setSelectedStores([...stores]);
      }
    } else {
      const exists = selectedStores.some((s) => s.storeId === store.storeId);
      const updatedStores = exists
        ? selectedStores.filter((s) => s.storeId !== store.storeId)
        : [...selectedStores, store];
      setSelectedStores(updatedStores);
    }
  };

  const handleClickOutside = (event) => {
    if (
      isStoreDropdownOpen &&
      !event.target.closest(".sales-summery-store-selector")
    ) {
      setIsStoreDropdownOpen(false);
      if (selectedStores.length === 0) {
        setLaybyeTotal(0);
        setReceiptsByDate({});
        setGrossSales(0);
        setToTalDiscounts(0);
        setTotalRefunds(0);
        setCost(0);
        setPercentageDiffReceipts(0);
        setPercentageDiffTotalCost(0);
        setPercentageDiffTotalIncome(0);
        setReceipts([]);
        setTotalAmount(0);
        setProfit(0);
        setReceiptsLength(0);
      }
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".sales-summery-export-button")
    ) {
      setIsExportDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dateRangePickerRef.current &&
        !dateRangePickerRef.current.contains(event.target)
      ) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dateRangePickerRef]);

  const handleDateRangeChange = (ranges) => {
    const { startDate, endDate } = ranges.selection;

    const selectedRange = customStaticRanges.find(
      (range) =>
        range.range().startDate.getTime() === startDate.getTime() &&
        range.range().endDate.getTime() === endDate.getTime()
    );

    if (selectedRange) {
      if (selectedRange.label === "Today") {
        setSelectedOption("today");
        setSelectedRange("Today");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "Yesterday") {
        setSelectedOption("customPeriod");
        setSelectedRange("Yesterday");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "This Week") {
        setSelectedOption("thisWeek");
        setSelectedRange("This Week");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "Last Week") {
        setSelectedOption("customPeriod");
        setSelectedRange("Last Week");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "This Month") {
        setSelectedOption("thisMonth");
        setSelectedRange("This Month");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "Last Month") {
        setSelectedOption("customPeriod");
        setSelectedRange("Last Month");
        setIsDatePickerOpen(false);
      } else if (selectedRange.label === "This Year") {
        setSelectedOption("thisYear");
        setSelectedRange("This Year");
        setIsDatePickerOpen(false);
      }
    }

    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
    onRefresh(selectedOption, startDate, endDate);
  };

  const customStaticRanges = [
    ...defaultStaticRanges,
    {
      label: "This Year",
      range: () => ({
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().getFullYear(), 11, 31),
      }),
      isSelected: () => selectedOption === "This Year",
    },
  ];

  const handleBackClick = () => {
    let newStartDate, newEndDate;

    switch (selectedRange) {
      case "Today":
        newStartDate = subDays(selectedStartDate, 1);
        newEndDate = subDays(selectedEndDate, 1);
        break;
      case "Yesterday":
        newStartDate = subDays(selectedStartDate, 1);
        newEndDate = subDays(selectedEndDate, 1);
        break;
      case "This Week":
        newStartDate = subWeeks(selectedStartDate, 1);
        newEndDate = subWeeks(selectedEndDate, 1);
        break;
      case "Last Week":
        newStartDate = subWeeks(selectedStartDate, 1);
        newEndDate = subWeeks(selectedEndDate, 1);
        break;
      case "This Month":
        newStartDate = subMonths(selectedStartDate, 1);
        newEndDate = subMonths(selectedEndDate, 1);
        break;
      case "Last Month":
        newStartDate = subMonths(selectedStartDate, 1);
        newEndDate = subMonths(selectedEndDate, 1);
        break;
      case "This Year":
        newStartDate = subYears(selectedStartDate, 1);
        newEndDate = subYears(selectedEndDate, 1);
        break;
      default:
        newStartDate = subDays(selectedStartDate, 1);
        newEndDate = subDays(selectedEndDate, 1);
    }

    setSelectedStartDate(newStartDate);
    setSelectedEndDate(newEndDate);
    onRefresh(selectedOption, newStartDate, newEndDate);
  };

  const handleForwardClick = () => {
    let newStartDate, newEndDate;

    switch (selectedRange) {
      case "Today":
        newStartDate = addDays(selectedStartDate, 1);
        newEndDate = addDays(selectedEndDate, 1);
        break;
      case "Yesterday":
        newStartDate = addDays(selectedStartDate, 1);
        newEndDate = addDays(selectedEndDate, 1);
        break;
      case "This Week":
        newStartDate = addWeeks(selectedStartDate, 1);
        newEndDate = addWeeks(selectedEndDate, 1);
        break;
      case "Last Week":
        newStartDate = addWeeks(selectedStartDate, 1);
        newEndDate = addWeeks(selectedEndDate, 1);
        break;
      case "This Month":
        newStartDate = addMonths(selectedStartDate, 1);
        newEndDate = addMonths(selectedEndDate, 1);
        break;
      case "Last Month":
        newStartDate = addMonths(selectedStartDate, 1);
        newEndDate = addMonths(selectedEndDate, 1);
        break;
      case "This Year":
        newStartDate = addYears(selectedStartDate, 1);
        newEndDate = addYears(selectedEndDate, 1);
        break;
      default:
        newStartDate = addDays(selectedStartDate, 1);
        newEndDate = addDays(selectedEndDate, 1);
    }

    if (selectedEndDate <= new Date()) {
      setSelectedStartDate(newStartDate);
      setSelectedEndDate(newEndDate);
      onRefresh(selectedOption, newStartDate, newEndDate);
    }
  };

  const tableHeaders = [
    [
      "Date",
      "Gross Sales",
      "Refund",
      "Discount",
      "Net Sales",
      "COGS",
      "Profit",
      "Profit Margin",
    ],
  ];

  const getSalesSummaryRows = (receiptsByDate, laybyeTotal = 0) => {
    let rows = [];
    let totalGrossSales = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;
    let totalNetSales = 0;
    let totalCogs = 0;
    let totalProfit = 0;

    for (const [date, dailyReceipts] of Object.entries(receiptsByDate)) {
      const grossSales = dailyReceipts.reduce(
        (sum, receipt) => sum + receipt.totalAmountUsd,
        0
      );

      const discounts = dailyReceipts
        .filter((receipt) => receipt.label !== "Refunded")
        .reduce((sum, receipt) => sum + (receipt.discountApplied || 0), 0);

      const refunds = dailyReceipts
        .filter((receipt) => receipt.label === "Refunded")
        .reduce((sum, receipt) => sum + receipt.totalAmountUsd, 0);

      const netSales = grossSales - discounts - refunds;
      const cogs = dailyReceipts
        .filter((receipt) => receipt.label !== "Refunded")
        .reduce((sum, receipt) => sum + (receipt.totalCostUsd || 0), 0);
      const profit = netSales - cogs;
      const margin =
        netSales > 0 ? ((profit / netSales) * 100).toFixed(2) : "0.00";

      totalGrossSales += grossSales;
      totalDiscounts += discounts;
      totalRefunds += refunds;
      totalNetSales += netSales;
      totalCogs += cogs;
      totalProfit += profit;

      rows.push([
        date,
        grossSales.toFixed(2),
        refunds.toFixed(2),
        discounts.toFixed(2),
        netSales.toFixed(2),
        cogs.toFixed(2),
        profit.toFixed(2),
        `${margin}%`,
      ]);
    }

    if (laybyeTotal > 0) {
      const laybyeRow = [
        "Laybye Payments",
        laybyeTotal.toFixed(2),
        "",
        "",
        laybyeTotal.toFixed(2),
        "",
        "",
        "",
      ];
      rows.push(laybyeRow);
    }

    const totalRow = [
      "TOTALS",
      (totalGrossSales + laybyeTotal).toFixed(2),
      totalRefunds.toFixed(2),
      totalDiscounts.toFixed(2),
      (totalNetSales + laybyeTotal).toFixed(2),
      totalCogs.toFixed(2),
      totalProfit.toFixed(2),
      totalNetSales + laybyeTotal > 0
        ? `${((totalProfit / (totalNetSales + laybyeTotal)) * 100).toFixed(2)}%`
        : "0.00%",
    ];

    rows.push(totalRow);
    return rows;
  };

  const rows = getSalesSummaryRows(receiptsByDate, laybyeTotal);

  const generateCsvContent = () => {
    let csv = "SALES SUMMARY\n\n";
    const currentDateTime = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    csv += `Generated On:,${currentDateTime}\n\n`;
    csv += tableHeaders[0].join(",") + "\n";
    rows.forEach((row) => {
      csv += row.join(",") + "\n";
    });

    return csv;
  };

  const downloadCsv = () => {
    const csvContent = generateCsvContent();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "SalesSummary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    doc.setFontSize(16);
    doc.text("Sales Summary", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: tableHeaders,
      body: rows,
    });

    doc.save("SalesSummary.pdf");
  };

  const generateRows = () => {
    let totalGrossSales = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;
    let totalNetSales = 0;
    let totalCogs = 0;
    let totalProfit = 0;

    const rows = Object.entries(receiptsByDate).map(([date, dailyReceipts]) => {
      const grossSales = dailyReceipts.reduce(
        (sum, receipt) => sum + receipt.totalAmountUsd,
        0
      );

      const discounts = dailyReceipts
        .filter((receipt) => receipt.label !== "Refunded")
        .reduce((sum, receipt) => sum + (receipt.discountApplied || 0), 0);

      const refunds = dailyReceipts
        .filter((receipt) => receipt.label === "Refunded")
        .reduce((sum, receipt) => sum + receipt.totalAmountUsd, 0);

      const netSales = grossSales - discounts - refunds;

      const cogs = dailyReceipts
        .filter((receipt) => receipt.label !== "Refunded")
        .reduce((sum, receipt) => sum + (receipt.totalCostUsd || 0), 0);

      const profit = netSales - cogs;
      const profitMargin = netSales > 0 ? (profit / netSales) * 100 : 0;

      totalGrossSales += grossSales;
      totalDiscounts += discounts;
      totalRefunds += refunds;
      totalNetSales += netSales;
      totalCogs += cogs;
      totalProfit += profit;

      return (
        <tr key={date} className="sales-summery-table-row">
          <td className="sales-summery-table-cell">{date}</td>
          <td className="sales-summery-table-cell">${grossSales.toFixed(2)}</td>
          <td className="sales-summery-table-cell sales-summery-negative">${refunds.toFixed(2)}</td>
          <td className="sales-summery-table-cell sales-summery-negative">${discounts.toFixed(2)}</td>
          <td className="sales-summery-table-cell sales-summery-positive">${netSales.toFixed(2)}</td>
          <td className="sales-summery-table-cell">${cogs.toFixed(2)}</td>
          <td className="sales-summery-table-cell sales-summery-profit">${profit.toFixed(2)}</td>
          <td className="sales-summery-table-cell">{profitMargin.toFixed(2)}%</td>
        </tr>
      );
    });

    if (laybyeTotal > 0) {
      const laybyeRow = (
        <tr key="laybye" className="sales-summery-table-row sales-summery-laybye">
          <td className="sales-summery-table-cell">Laybye Payments</td>
          <td className="sales-summery-table-cell">${laybyeTotal.toFixed(2)}</td>
          <td className="sales-summery-table-cell"></td>
          <td className="sales-summery-table-cell"></td>
          <td className="sales-summery-table-cell sales-summery-positive">${laybyeTotal.toFixed(2)}</td>
          <td className="sales-summery-table-cell"></td>
          <td className="sales-summery-table-cell"></td>
          <td className="sales-summery-table-cell"></td>
        </tr>
      );
      rows.push(laybyeRow);
    }

    rows.push(
      <tr key="totals" className="sales-summery-table-row sales-summery-total-row">
        <td className="sales-summery-table-cell sales-summery-total">TOTALS</td>
        <td className="sales-summery-table-cell sales-summery-total">${(totalGrossSales + laybyeTotal).toFixed(2)}</td>
        <td className="sales-summery-table-cell sales-summery-total sales-summery-negative">${totalRefunds.toFixed(2)}</td>
        <td className="sales-summery-table-cell sales-summery-total sales-summery-negative">${totalDiscounts.toFixed(2)}</td>
        <td className="sales-summery-table-cell sales-summery-total sales-summery-positive">${(totalNetSales + laybyeTotal).toFixed(2)}</td>
        <td className="sales-summery-table-cell sales-summery-total">${totalCogs.toFixed(2)}</td>
        <td className="sales-summery-table-cell sales-summery-total sales-summery-profit">${totalProfit.toFixed(2)}</td>
        <td className="sales-summery-table-cell sales-summery-total">
          {totalNetSales + laybyeTotal > 0
            ? ((totalProfit / (totalNetSales + laybyeTotal)) * 100).toFixed(2)
            : "0"}%
        </td>
      </tr>
    );

    return rows;
  };

  const percentageStyleReceipts = {
    color: percentageDiffReceipts < 0 ? "#ef4444" : "#10b981",
  };

  const percentageStyleSales = {
    color: percentageDiffTotalIncome < 0 ? "#ef4444" : "#10b981",
  };

  const percentageStyleProfit = {
    color: percentageDiffProfit < 0 ? "#ef4444" : "#10b981",
  };

  const percentageDifferenceReceipts = `${percentageDiffReceipts.toFixed(2)}%`;
  const percentageDifferenceIncome = `${percentageDiffTotalIncome.toFixed(2)}%`;
  const percentageDifferenceProfit = `${percentageDiffProfit.toFixed(2)}%`;

const StatCard = ({ title, value, icon, percentage, isPositive, subValue, color, isCurrency = true }) => (
  <div className="sales-summery-stat-card">
    <div className="sales-summery-stat-icon-container" style={{ backgroundColor: color + '20', color: color }}>
      <div className="sales-summery-stat-icon-circle">
        {icon}
      </div>
    </div>
    <div className="sales-summery-stat-content">
      <div className="sales-summery-stat-title">{title}</div>
      <div className="sales-summery-stat-value">
        {isCurrency ? '$' : ''}{value.toLocaleString(undefined, {
          minimumFractionDigits: isCurrency ? 2 : 0,
          maximumFractionDigits: isCurrency ? 2 : 0,
        })}
      </div>
      <div className="sales-summery-stat-change-container">
        <div className={`sales-summery-stat-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FaArrowUp /> : <FaArrowDown />}
          <span>{percentage}</span>
        </div>
      </div>
      {subValue && <div className="sales-summery-stat-subvalue">{subValue}</div>}
    </div>
  </div>
);

  return (
    <div className="sales-summery-container">
      <div className="sales-summery-sidebar-toggle-wrapper">
        <button 
          className="sales-summery-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`sales-summery-content ${isSidebarOpen ? "sales-summery-content-shifted" : "sales-summery-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="sales-summery-toolbar">
          <div className="sales-summery-toolbar-content">
            <h1 className="sales-summery-toolbar-title">Sales Dashboard</h1>
            <div className="sales-summery-toolbar-subtitle">
              Comprehensive overview of your sales performance
            </div>
          </div>
          <div className="sales-summery-toolbar-actions">
            <button 
              className="sales-summery-refresh-btn"
              onClick={() => onRefresh(selectedOption, selectedStartDate, selectedEndDate)}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="sales-summery-control-panel">
          <div className="sales-summery-date-controls">
            <div className="sales-summery-date-navigation">
              <button 
                className="sales-summery-nav-btn"
                onClick={handleBackClick}
              >
                <IoIosArrowBack />
              </button>
              <button 
                className="sales-summery-date-range-btn"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              >
                <IoCalendar />
                <span>
                  {selectedStartDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })} - {selectedEndDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </button>
              <button 
                className="sales-summery-nav-btn"
                onClick={handleForwardClick}
              >
                <IoIosArrowForward />
              </button>
            </div>
            
            {isDatePickerOpen && (
              <div ref={dateRangePickerRef} className="sales-summery-datepicker-modal">
                <DateRangePicker
                  ranges={[{
                    startDate: selectedStartDate,
                    endDate: selectedEndDate,
                    key: "selection",
                  }]}
                  onChange={handleDateRangeChange}
                  moveRangeOnFirstSelection={true}
                  months={2}
                  direction="horizontal"
                  locale={enUS}
                  staticRanges={customStaticRanges}
                />
              </div>
            )}
          </div>
          
          <div className="sales-summery-filter-controls">
            <div className="sales-summery-store-selector">
              <button 
                className="sales-summery-filter-btn"
                onClick={() => {
                  setIsStoreDropdownOpen(!isStoreDropdownOpen);
                  setIsEmployeeDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
              >
                <FaStore />
                <span>
                  {selectedStores.length === 0
                    ? "Select Store"
                    : selectedStores.length === 1
                    ? selectedStores[0].storeName
                    : selectedStores.length === stores.length
                    ? "All Stores"
                    : `${selectedStores.length} stores`}
                </span>
              </button>
              
              {isStoreDropdownOpen && (
                <div className="sales-summery-dropdown">
                  <div className="sales-summery-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="sales-summery-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="sales-summery-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="sales-summery-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="sales-summery-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="sales-summery-checkbox-custom"></div>
                        </div>
                        <span className="sales-summery-store-name">{store.storeName}</span>
                        <span className="sales-summery-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="sales-summery-export-button">
              <button 
                className="sales-summery-filter-btn"
                onClick={() => {
                  setIsExportDropdownOpen(!isExportDropdownOpen);
                  setIsEmployeeDropdownOpen(false);
                  setIsStoreDropdownOpen(false);
                }}
              >
                <FaDownload />
                <span>Export</span>
              </button>
              
              {isExportDropdownOpen && (
                <div className="sales-summery-dropdown">
                  <div 
                    className="sales-summery-dropdown-item"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      downloadPdf();
                    }}
                  >
                    <FaFilePdf color="#ef4444" />
                    <span>Download PDF</span>
                  </div>
                  <div 
                    className="sales-summery-dropdown-item"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      downloadCsv();
                    }}
                  >
                    <FaFileCsv color="#10b981" />
                    <span>Download CSV</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="sales-summery-stats-grid">
          <StatCard
            title="Gross Sales"
            value={grossSales}
            icon={<FaChartLine />}
            percentage={percentageDifferenceIncome}
            isPositive={percentageDiffTotalIncome >= 0}
            color="#6366f1"
          />
          
          {laybyeTotal > 0 && (
            <StatCard
              title="Laybye Payments"
              value={laybyeTotal}
              icon={<FaShoppingCart />}
              percentage="-"
              isPositive={true}
              color="#8b5cf6"
            />
          )}
          
          <StatCard
            title="Refunds"
            value={refunds}
            icon={<FaExchangeAlt />}
            percentage="-"
            isPositive={false}
            color="#ef4444"
          />
          
          <StatCard
            title="Discounts"
            value={discounts}
            icon={<FaTags />}
            percentage="-"
            isPositive={false}
            color="#f59e0b"
          />
          
          <StatCard
            title="Net Sales"
            value={totalAmount}
            icon={<FaDollarSign />}
            percentage={percentageDifferenceIncome}
            isPositive={percentageDiffTotalIncome >= 0}
            color="#10b981"
          />
          
          <StatCard
            title="COGS"
            value={cost}
            icon={<FaBox />}
            percentage="-"
            isPositive={false}
            color="#6b7280"
          />
          
          <StatCard
            title="Profit"
            value={profit}
            icon={<FaChartLine />}
            percentage={percentageDifferenceProfit}
            isPositive={percentageDiffProfit >= 0}
            color="#8b5cf6"
          />
          
        <StatCard
  title="Receipts"
  value={receiptsLength}
  icon={<FaReceipt />}
  percentage={percentageDifferenceReceipts}
  isPositive={percentageDiffReceipts >= 0}
  subValue={`$${totalAmount.toFixed(2)} total`}
  color="#6366f1"
  isCurrency={false}  // Add this line
/>
        </div>

        {/* Data Table */}
        <div className="sales-summery-table-container">
          <div className="sales-summery-table-header">
            <h3>Sales Summary Details</h3>
            <div className="sales-summery-table-actions">
              <span className="sales-summery-table-count">
                Showing {Object.keys(receiptsByDate).length} days
              </span>
            </div>
          </div>
          
          <div className="sales-summery-table-wrapper">
            <table className="sales-summery-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Gross Sales</th>
                  <th>Refund</th>
                  <th>Discount</th>
                  <th>Net Sales</th>
                  <th>COGS</th>
                  <th>Profit</th>
                  <th>Profit Margin</th>
                </tr>
              </thead>
              <tbody>
                {generateRows()}
              </tbody>
            </table>
          </div>
        </div>
        
        <RemainingTimeFooter />
      </div>
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default SalesSummery;