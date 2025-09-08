import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaUser,
  FaArrowDown,
  FaArrowUp,
  FaDownload,
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
  addHours,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "../Css/SalesSummery.css";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { IoCalendar } from "react-icons/io5";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode"; // Make sure this is imported
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable"; // ← import the function directly
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
    const token = localStorage.getItem("token"); // Or sessionStorage if needed

    if (!token) {
      toast.error("Authentication token is missing.");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setEmail(decoded.email); // Extract email from token
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, []);
  useEffect(() => {
    // Initially select all stores and employees
    setSelectedStores(stores);
    setSelectedEmployees(employees);
  }, [selectedOption, stores]);

  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh(selectedOption, selectedStartDate, selectedEndDate);
    }
  }, [selectedStores, selectedOption, selectedStartDate, selectedEndDate]);
  useEffect(() => {
    console.log("Selected Option:", selectedOption);
  }, [selectedOption]);
  useEffect(() => {
    if (email) {
      fetchStores();
    }
  }, [email]);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

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
      const token = localStorage.getItem("token"); // Or sessionStorage if that's where you store it

      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      // Format the startDate and endDate as strings in ISO format
      const formattedStartDate = startDate;
      const formattedEndDate = endDate;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/dashboardRouter/${timeframe}?startDate=${formattedStartDate}&endDate=${formattedEndDate}&email=${encodeURIComponent(
          userEmail
        )}`
      );
      const responseData = await response.json();
      console.log(`Receipts for ${timeframe}:`);
      if (!response.ok) {
        const errorMessage = await response.text(); // or response.json() if you return JSON errors
        toast.error(`Error: ${"User not found or invalid email."}`);
      }
      const {
        totalAmountSum, //with refunds
        totalCostAmountSumWithoutRefunds, //without refunds
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
      //calculate profit using netsales minus the totalcosts from all receipts except the refunded
      const calculatedProfit = netSales - totalCostAmountSumWithoutRefunds; //remember discount and refunds is removed already from server side
      // Calculate profit and profit percentage difference
      setProfit(calculatedProfit);

      const calculatedProfitPercentage =
        prevProfit === 0
          ? 0
          : ((calculatedProfit - prevProfit) / prevProfit) * 100;
      setProfitPercentDiff(calculatedProfitPercentage);

      // Object to store product quantities and total prices
      const filterRefundedReceipts = receipts.filter(
        (receipt) => receipt.label === "Refunded"
      );
      console.log("====================================");
      console.log(filterRefundedReceipts);
      console.log("====================================");
      const totalRefunds = filterRefundedReceipts.reduce(
        (sum, receipt) => sum + receipt.totalAmountUsd,
        0
      );
      // Helper to group receipts by date
      const receiptsByDate = receipts.reduce((acc, receipt) => {
        const date = convertFirestoreTimestampToDate(receipt.dateTime)
          .toISOString()
          .split("T")[0]; // Convert to YYYY-MM-DD format
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(receipt);
        return acc;
      }, {});

      // Set the sorted employee data as an array
      // setEmployeeData(sortedEmployeeData);
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
    NProgress.start(); // 🔵 Start progress bar
    setIsRefreshing(true);
    await fetchAllReceiptsData(
      selectedOption,
      selectedStartRange,
      selectedEndRange
    )
      .then(() => {
        NProgress.done(); // ✅ End progress bar
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

  // const handleEmployeeSelect = (employee) => {
  //   if (employee === "All Employees") {
  //     if (selectedEmployees.length === employees.length) {
  //       setSelectedEmployees([]);
  //     } else {
  //       setSelectedEmployees(employees);
  //     }
  //   } else {
  //     const updatedEmployees = selectedEmployees.includes(employee)
  //       ? selectedEmployees.filter((item) => item !== employee)
  //       : [...selectedEmployees, employee];
  //     setSelectedEmployees(updatedEmployees);
  //   }
  // };

  const handleClickOutside = (event) => {
    if (
      isStoreDropdownOpen &&
      !event.target.closest(".buttonContainerStoresSummery")
    ) {
      setIsStoreDropdownOpen(false);
      console.log("Selected Stores:", selectedStores);

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
      } else {
        // onRefresh(selectedOption, selectedStartDate, selectedEndDate);
      }
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".buttonContainerExportSummery")
    ) {
      setIsExportDropdownOpen(false);
      console.log("Selected Export Option:");
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
    console.log("====================================");
    console.log(customStaticRanges);
    console.log("====================================");
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
        startDate: new Date(new Date().getFullYear(), 0, 1), // January 1st of the current year
        endDate: new Date(new Date().getFullYear(), 11, 31), // December 31st of the current year
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

    // Check if newEndDate is beyond end of today
    if (selectedEndDate <= new Date()) {
      setSelectedStartDate(newStartDate);
      setSelectedEndDate(newEndDate);
      onRefresh(selectedOption, newStartDate, newEndDate);
    }
  };

  // Sample column titles – update if needed
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

    const salesDates = Object.keys(receiptsByDate);

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

      // Accumulate totals
      totalGrossSales += grossSales;
      totalDiscounts += discounts;
      totalRefunds += refunds;
      totalNetSales += netSales;
      totalCogs += cogs;
      totalProfit += profit;

      // Push row
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

    // Laybye row (optional)
    if (laybyeTotal > 0) {
      const laybyeRow = [
        "Laybye Payments",
        laybyeTotal.toFixed(2),
        "",
        "", // refund, discount
        laybyeTotal.toFixed(2), // net sales
        "",
        "",
        "", // cogs, profit, margin
      ];
      rows.push(laybyeRow);
    }

    // Totals row: include laybye in gross sales, net sales, and profit margin
    const totalRow = [
      "TOTALS",
      (totalGrossSales + laybyeTotal).toFixed(2), // gross sales include laybye
      totalRefunds.toFixed(2),
      totalDiscounts.toFixed(2),
      (totalNetSales + laybyeTotal).toFixed(2), // net sales include laybye
      totalCogs.toFixed(2),
      totalProfit.toFixed(2),
      totalNetSales + laybyeTotal > 0
        ? `${((totalProfit / (totalNetSales + laybyeTotal)) * 100).toFixed(2)}%`
        : "0.00%", // profit margin adjusted to include laybye
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

    // Correct usage when autoTable is imported directly
    autoTable(doc, {
      startY: 35,
      head: tableHeaders,
      body: rows,
    });

    doc.save("SalesSummary.pdf");
  };

  // Function to generate the table rows based on data
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

      // Accumulate totals
      totalGrossSales += grossSales;
      totalDiscounts += discounts;
      totalRefunds += refunds;
      totalNetSales += netSales;
      totalCogs += cogs;
      totalProfit += profit;

      return (
        <tr key={date}>
          <td>{date}</td>
          <td>${grossSales.toFixed(2)}</td>
          <td>${refunds.toFixed(2)}</td>
          <td>${discounts.toFixed(2)}</td>
          <td>${netSales.toFixed(2)}</td>
          <td>${cogs.toFixed(2)}</td>
          <td>${profit.toFixed(2)}</td>
          <td>{profitMargin.toFixed(2)}%</td>
        </tr>
      );
    });

    // Optionally include laybye row
    if (laybyeTotal > 0) {
      const laybyeRow = (
        <tr key="laybye">
          <td>Laybye Payments</td>
          <td>${laybyeTotal.toFixed(2)}</td>
          <td></td>
          <td></td>
          <td>${laybyeTotal.toFixed(2)}</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      );
      rows.push(laybyeRow);
    }

    // Add totals row
    rows.push(
      <tr key="totals" style={{ fontWeight: "bold" }}>
        <td>TOTALS</td>
        <td>${(totalGrossSales + laybyeTotal).toFixed(2)}</td>
        <td>${totalRefunds.toFixed(2)}</td>
        <td>${totalDiscounts.toFixed(2)}</td>
        <td>${(totalNetSales + laybyeTotal).toFixed(2)}</td>
        <td>${totalCogs.toFixed(2)}</td>
        <td>${totalProfit.toFixed(2)}</td>
        <td>
          {totalNetSales + laybyeTotal > 0
            ? ((totalProfit / (totalNetSales + laybyeTotal)) * 100).toFixed(2)
            : "0"}
          %
        </td>
      </tr>
    );

    return rows;
  };
  const percentageStyleReceipts = {
    color: percentageDiffReceipts < 0 ? "red" : "green", // red for negative, green for positive
  };

  const percentageStyleSales = {
    color: percentageDiffTotalIncome < 0 ? "red" : "green", // red for negative, green for positive
  };

  const percentageStyleProfit = {
    color: percentageDiffProfit < 0 ? "red" : "green", // red for negative, green for positive
  };
  const percentageDifferenceReceippts = `${percentageDiffReceipts.toFixed(2)}%`; // the percentage difference from the previous sales as per the date selected
  const percentageDifferenceIncome = `${percentageDiffTotalIncome.toFixed(2)}%`; // the percentage difference from the previous sales as per the date selected
  const percentageDifferenceProfit = `${percentageDiffProfit.toFixed(2)}%`; // the percentage difference from the previous sales as per the date selected

  return (
    <div className="mainContainerSalesSummery">
      <div className="toolBar">
        {isSidebarOpen ? (
          <FaTimes className="sidebar-icon" onClick={toggleSidebar} />
        ) : (
          <FaBars className="sidebar-icon" onClick={toggleSidebar} />
        )}
        <span className="toolBarTitle">Sales Summary</span>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`content ${isSidebarOpen ? "shifted" : "collapsed"}`}
        id="contentsContainer"
      >
        <div className="buttonsContainerSalesSummery">
          <div className="buttonContainerDateSummery">
            <div className="iconContainerBackSummery" onClick={handleBackClick}>
              <IoIosArrowBack color="grey" className="iconLeft" />
            </div>
            <button
              className="inputButtonDate"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            >
              <IoCalendar color="grey" className="iconRiconCalenderight" />

              {selectedStartDate && selectedEndDate
                ? `${selectedStartDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })} - ${selectedEndDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : "Select Date Range"}
            </button>
            <div
              className="iconContainerForwardSummery"
              onClick={handleForwardClick}
            >
              <IoIosArrowForward color="grey" className="iconRight" />
            </div>
          </div>
          {isDatePickerOpen && (
            <div ref={dateRangePickerRef} className="datePickerContainer">
              <DateRangePicker
                ranges={[
                  {
                    startDate: selectedStartDate,
                    endDate: selectedEndDate,
                    key: "selection",
                  },
                ]}
                onChange={handleDateRangeChange}
                moveRangeOnFirstSelection={true}
                months={2}
                direction="horizontal"
                locale={enUS}
                staticRanges={customStaticRanges}
              />
            </div>
          )}
          <div className="buttonContainerStoresSummery">
            <button
              className="inputButtonStore"
              onClick={() => {
                setIsStoreDropdownOpen(!isStoreDropdownOpen);
                setIsEmployeeDropdownOpen(false);
                setIsExportDropdownOpen(false);
              }}
            >
              {selectedStores.length === 0
                ? "Select Store"
                : selectedStores.length === 1
                ? selectedStores[0].storeName
                : selectedStores.length === stores.length
                ? "All Stores"
                : selectedStores.map((s) => s.storeName).join(", ")}{" "}
              <FaStore className="icon" color="grey" />
            </button>
            {isStoreDropdownOpen && (
              <div className="dropdown">
                <div
                  className="dropdownItem"
                  onClick={() => handleStoreSelect("All Stores")}
                >
                  <div className="checkboxContainer">
                    <input
                      className="inputCheckBox"
                      type="checkbox"
                      checked={selectedStores.length === stores.length}
                      readOnly
                    />
                  </div>
                  <span className="storeName">All Stores</span>
                </div>
                {stores.map((store) => (
                  <div
                    className="dropdownItem"
                    key={store.storeId}
                    onClick={() => handleStoreSelect(store)}
                  >
                    <div className="checkboxContainer">
                      <input
                        className="inputCheckBox"
                        type="checkbox"
                        checked={selectedStores.some(
                          (s) => s.storeId === store.storeId
                        )}
                        readOnly
                      />
                    </div>
                    <span className="storeName">{store.storeName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* <div className="buttonContainerEmployees">
            <button
              className="inputButtonEmployee"
              onClick={() => {
                setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen);
                setIsStoreDropdownOpen(false);
                setIsExportDropdownOpen(false);
              }}
            >
              {selectedEmployees.length === 0
                ? "Select Employee"
                : selectedEmployees.length === employees.length
                ? "All Employees"
                : selectedEmployees.join(", ")}

              <FaUser className="icon" color="grey" />
            </button>
            {isEmployeeDropdownOpen && (
              <div className="dropdown">
                <div
                  className="dropdownItem"
                  onClick={() => handleEmployeeSelect("All Employees")}
                >
                  <div className="checkboxContainer">
                    <input
                      className="inputCheckBox"
                      type="checkbox"
                      checked={selectedEmployees.length === employees.length}
                      readOnly
                    />
                  </div>
                  <span className="employeeName">All Employees</span>
                </div>
                {employees.map((employee) => (
                  <div
                    className="dropdownItem"
                    key={employee}
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <div className="checkboxContainer">
                      <input
                        className="inputCheckBox"
                        type="checkbox"
                        checked={selectedEmployees.includes(employee)}
                        readOnly
                      />
                    </div>
                    <span className="employeeName">{employee}</span>
                  </div>
                ))}
              </div>
            )}
          </div> */}
          <div className="buttonContainerExportSummery">
            <button
              className="inputButtonExportSummery"
              onClick={() => {
                setIsExportDropdownOpen(!isExportDropdownOpen);
                setIsEmployeeDropdownOpen(false);
                setIsStoreDropdownOpen(false);
              }}
            >
              Export
              <FaDownload className="icon" color="grey" />
            </button>
            {isExportDropdownOpen && (
              <div className="dropdown">
                <div
                  className="dropdownItem"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    downloadPdf();

                    console.log("PDF");
                  }}
                >
                  <span className="storeName">
                    Download PDF{" "}
                    <FaFilePdf color="red" style={{ marginRight: 8 }} />
                  </span>
                </div>
                <div
                  className="dropdownItem"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    downloadCsv();
                    console.log("PDF");
                  }}
                >
                  <span className="storeName">
                    Download CSV{" "}
                    <FaFileCsv color="green" style={{ marginRight: 8 }} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="salesContainerSummery">
        <div className="salesSubContainer">
          <h1>Gross Sales</h1>
          <span className="amount">
            $
            {grossSales.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="percentage" style={percentageStyleSales}>
            {percentageDifferenceIncome}
          </span>
          {percentageDiffTotalIncome < 0 ? (
            <FaArrowDown color="red" size={10} />
          ) : (
            <FaArrowUp color="green" size={10} />
          )}
        </div>

        {laybyeTotal > 0 && (
          <div className="salesSubContainer">
            <h1>Laybye Payments</h1>
            <span className="amount">
              $
              {laybyeTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="percentage">-</span>
            <FaArrowDown color="white" size={10} />
          </div>
        )}

        <div className="salesSubContainer">
          <h1>Refunds</h1>
          <span className="amount">
            $
            {refunds.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="percentage">-</span>
          <FaArrowDown color="white" size={10} />
        </div>

        <div className="salesSubContainer">
          <h1>Discounts</h1>
          <span className="amount">
            $
            {discounts.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="percentage">-</span>
          <FaArrowDown color="white" size={10} />
        </div>

        <div className="salesSubContainer">
          <h1>Net Sales</h1>
          <span className="amount">
            $
            {totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="percentage" style={percentageStyleSales}>
            {percentageDifferenceIncome}
          </span>
          {percentageDiffTotalIncome < 0 ? (
            <FaArrowDown color="red" size={10} />
          ) : (
            <FaArrowUp color="green" size={10} />
          )}
        </div>

        <div className="salesSubContainer">
          <h1>COGS</h1>
          <span className="amount">
            $
            {cost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="percentage">-</span>
          <FaArrowDown color="white" size={10} />
        </div>

        <div className="salesSubContainer">
          <h1>Profit</h1>
          <span className="amount">
            $
            {profit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="percentage" style={percentageStyleProfit}>
            {percentageDifferenceProfit}
          </span>
          {percentageDiffProfit < 0 ? (
            <FaArrowDown color="red" size={10} />
          ) : (
            <FaArrowUp color="green" size={10} />
          )}
        </div>
      </div>

      <div className="tableContainerSummery">
        <table className="salesTableSales">
          <thead>
            <tr>
              <th>Date</th>
              <th>Gross Sales</th>
              <th>Refund</th>
              <th>Discount</th>
              <th>Net Sales</th>
              <th>Cost of Goods Sold</th>
              <th>Profit</th>
              <th>Profit Margin</th>
            </tr>
          </thead>
          <tbody>{generateRows()}</tbody>
        </table>
      </div>
      <RemainingTimeFooter />
    </div>
  );
};

export default SalesSummery;
