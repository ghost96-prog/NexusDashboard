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
  FaUserCircle,
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
import "../Css/TopSellingProducts.css";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { IoCalendar } from "react-icons/io5";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReceiptModal from "../components/ReceiptModal";
import ReceiptListItem from "../components/ReceiptListItem";
import { jwtDecode } from "jwt-decode"; // Make sure this is imported
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import SoldItemsListItem from "../components/SoldItemsListItem";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FaFilePdf, FaFileCsv } from "react-icons/fa";

const TopSellingProducts = () => {
  // const stores = ["Store 1", "Store 2", "Store 3"];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [selectedExportOption, setSelectedExportOption] = useState("");
  const [stores, setStoreData] = useState([]);
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState(startOfToday());
  const [selectedEndDate, setSelectedEndDate] = useState(endOfToday());
  const [selectedOption, setSelectedOption] = useState("today");
  const [selectedRange, setSelectedRange] = useState("Today");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateRangePickerRef = useRef(null);
  const location = useLocation();
  const [receipts, setReceipts] = useState([]);
  const [productSummary, setProductSummary] = useState([]);
  const [modalReceipt, setModalReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [email, setEmail] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [profit, setProfit] = useState(0);
  const [filterTopSellingBySales, setFilterTopSelling] = useState("sales");
  const [topSellLabel, setTopSaleLabel] = useState("");
  const [allReceipts, setAllReceipts] = useState([]);
  console.log("====================================");
  console.log(filterTopSellingBySales);
  console.log("====================================");
  // Define the updateTopSaleLabel function

  // Call the updateTopSaleLabel function on every screen launch
  const updateTopSaleLabel = () => {
    if (filterTopSellingBySales == true) {
      setTopSaleLabel("Top Selling Items (Sales)");
    } else {
      setTopSaleLabel("Top Selling Items (Quantity)");
    }
  };
  // Call the updateTopSaleLabel function on every screen launch
  useEffect(() => {
    updateTopSaleLabel();
  }, [filterTopSellingBySales]); // Call this effect whenever filterTopSellingBySales changes

  useEffect(() => {
    onRefresh(selectedOption, selectedStartDate, selectedEndDate);
  }, [filterTopSellingBySales]); // Include filterTopSellingBySales in the dependency array

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

  console.log("====================================");
  console.log(email);
  console.log("====================================");
  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh(selectedOption, selectedStartDate, selectedEndDate);
    }
  }, [selectedStores, selectedOption, selectedStartDate, selectedEndDate]);

  useEffect(() => {
    setSelectedStores(stores);
  }, [selectedOption, stores]);
  useEffect(() => {
    console.log("Selected Option:", selectedOption);
  }, [selectedOption]);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
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
        totalAmountSum,
        totalCostAmountSumWithoutRefunds,
        receiptsNet,
        totalDiscount,
        netSales,
        receipts,
        totalAmountDifferencePercentage,
        totalCostDifferencePercentage,
        receiptsDifference,
        soldProducts,
      } = responseData;
      // Calculate profit using netsales minus the total costs from all receipts except the refunded
      const calculatedProfit = netSales - totalCostAmountSumWithoutRefunds; // Remember discount and refunds is removed already from server side

      // Object to store product quantities and total prices
      const filterRefundedReceipts = receipts.filter(
        (receipt) => receipt.label === "Refunded"
      );

      const totalRefunds = filterRefundedReceipts.reduce(
        (sum, receipt) => sum + receipt.totalAmountUsd,
        0
      );

      let sortedProductSummary;
      if (filterTopSellingBySales) {
        // Sort by total price (descending order)
        sortedProductSummary = Object.values(soldProducts).sort(
          (a, b) => b.totalPrice - a.totalPrice
        );
      } else {
        // Sort by quantity (descending order)
        sortedProductSummary = Object.values(soldProducts).sort(
          (a, b) => b.quantity - a.quantity
        );
      }

      // Log the sorted product summary
      console.log("Sorted Product Summary:", sortedProductSummary);
      sortedProductSummary.forEach(
        ({ productName, quantity, totalPrice, totalCost, profit }) => {
          console.log(
            `${productName}: Quantity - ${quantity}, Total Price - ${totalPrice.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}, Total Cost - ${totalCost.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}, Profit - ${profit.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          );
        }
      );

      console.log("====================================");
      console.log(sortedProductSummary);
      console.log("====================================");
      setProductSummary(sortedProductSummary);

      setReceipts(receiptsNet);
      setTotalAmount(netSales);
      setProfit(calculatedProfit);
      // setReceiptsLength(receiptsNet.length);
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching receipts.");
      }
      console.error("Error fetching receipts:", error);
    }
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
  const convertFirestoreTimestampToISO = (timestamp) => {
    const date = new Date(
      timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000
    );
    return date.toISOString();
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
      !event.target.closest(".buttonContainerStoressoldItems")
    ) {
      setIsStoreDropdownOpen(false);
      console.log("Selected Stores:", selectedStores);

      if (selectedStores.length === 0) {
        setProductSummary([]);
      } else {
        // onRefresh(selectedOption, selectedStartDate, selectedEndDate);
      }
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".buttonContainerExportsoldItems")
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

  function handleItemClick(item) {
    setModalReceipt(item);
  }
  const handleToggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };
  const filteredProductsSummary = productSummary.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleSignOut = () => {
    NProgress.start(); // ✅ End progress bar

    localStorage.removeItem("token");
    window.location.href = "/"; // or navigate to login using React Router
    NProgress.done(); // ✅ End progress bar
  };
  // Filter receipts based on the search term

  // Function to generate the table rows based on data
  const totalSalesTotal = filteredProductsSummary.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );
  const totalCostTotal = filteredProductsSummary.reduce(
    (sum, item) => sum + Number(item.totalCost),
    0
  );
  const totalProfitTotal = filteredProductsSummary.reduce(
    (sum, item) => sum + Number(item.profit),
    0
  );
  const getFormattedDateTime = () => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
      hour12: true,
    });
  };

  const getSelectedStoreNames = () => {
    if (selectedStores && selectedStores.length > 0) {
      const selectedStoreIds = selectedStores.map((s) => s.storeId);
      const matchedNames = stores
        .filter((store) => selectedStoreIds.includes(store.storeId))
        .map((store) => store.storeName);
      return matchedNames.join(", ");
    }
    return "All Stores";
  };

  const handlePDFExport = () => {
    const doc = new jsPDF();
    const dateTime = getFormattedDateTime();
    const storeNames = getSelectedStoreNames();

    doc.text("Sold Items Summary", 14, 10);
    doc.setFontSize(10);
    doc.text(`Date: ${dateTime}`, 14, 18);
    doc.text(`Store(s): ${storeNames}`, 14, 24);

    const tableData = filteredProductsSummary.map((item) => [
      item.productName,
      item.quantity,
      `$${Number(item.totalPrice).toFixed(2)}`,
      `$${Number(item.totalCost).toFixed(2)}`,
      `$${Number(item.profit).toFixed(2)}`,
    ]);

    tableData.push([
      "Total",
      "",
      `$${totalSalesTotal.toFixed(2)}`,
      `$${totalCostTotal.toFixed(2)}`,
      `$${totalProfitTotal.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 30, // start table lower to make room for text
      head: [["Product Name", "QTY", "Total Sales", "Total Cost", "Profit"]],
      body: tableData,
    });

    doc.save("sold_items_summary.pdf");
  };

  const handleCSVExport = () => {
    const dateTime = getFormattedDateTime();
    const storeNames = getSelectedStoreNames();

    const header = [
      `Sold Items Summary`,
      `Date: ${dateTime}`,
      `Store(s): ${storeNames}`,
      "",
      "Product Name,Quantity,Total Sales,Total Cost,Profit",
    ];

    const rows = filteredProductsSummary.map(
      (item) =>
        `${item.productName},${item.quantity},${Number(item.totalPrice).toFixed(
          2
        )},${Number(item.totalCost).toFixed(2)},${Number(item.profit).toFixed(
          2
        )}`
    );

    rows.push(
      `Total,,${totalSalesTotal.toFixed(2)},${totalCostTotal.toFixed(
        2
      )},${totalProfitTotal.toFixed(2)}`
    );

    const csvContent = [...header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sold_items_summary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mainContainersoldItems">
      {showDropdown && (
        <div className="dropdownMenu">
          <button className="signOutButton" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      )}
      <div className="toolBarsoldItems">
        {isSidebarOpen ? (
          <FaTimes className="sidebar-icon" onClick={toggleSidebar} />
        ) : (
          <FaBars className="sidebar-icon" onClick={toggleSidebar} />
        )}
        <span className="toolBarTitle">Sold Products</span>
      </div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="buttonsContainersoldItems">
        <div className="buttonContainerDatesoldItems">
          <div className="iconContainerBack" onClick={handleBackClick}>
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

          <div className="iconContainerForward" onClick={handleForwardClick}>
            <IoIosArrowForward color="grey" className="iconRight" />
          </div>
        </div>

        {isDatePickerOpen && (
          <div
            ref={dateRangePickerRef}
            className="datePickerContainersoldItems"
          >
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
        <div className="buttonContainerStoressoldItems">
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

        <div className="buttonContainerExportsoldItems">
          <button
            className="inputButtonExportsoldItems"
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
                  console.log("PDF");
                  handlePDFExport();
                }}
              >
                <span className="storeName">
                  Download PDF{" "}
                  <FaFilePdf color="red" style={{ marginRight: 0 }} />
                </span>
              </div>
              <div
                className="dropdownItem"
                onClick={() => {
                  setIsExportDropdownOpen(false);
                  console.log("csv");
                  handleCSVExport();
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

      <div className="soldItemsContainersoldItems">
        <div className="searchBarSoldItems">
          <div className="searchInputWrapper">
            <input
              type="text"
              placeholder="Search Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="searchInput"
            />
            {searchTerm && (
              <button className="clearButton" onClick={() => setSearchTerm("")}>
                ×
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="filterDropdown">
            <select
              value={filterTopSellingBySales ? "sales" : "quantity"}
              onChange={(e) => {
                const selectedValue = e.target.value;
                setFilterTopSelling(selectedValue === "sales");
              }}
              className="filterSelect"
            >
              <option value="sales">Filter by Sales</option>
              <option value="quantity">Filter by Quantity</option>
            </select>
          </div>
        </div>

        <div className="soldItemsSubContainer">
          <div className="soldHeader">
            <div className="headerItem">Product Name</div>
            <div className="headerItem">Store Name</div>
            <div className="headerItem">QTY</div>
            <div className="headerItem">Total Sales</div>
            <div className="headerItem">Total Cost</div>
            <div className="headerItem">Profit</div>
          </div>

          {filteredProductsSummary.map((item, index) => {
            // Step 1: Match storeId from selectedStores and stores
            const matchedStores = selectedStores.filter((store) =>
              stores.some((s) => s.storeId === store.storeId)
            );

            // Step 2: Get store names of selectedStores
            const storeNames = matchedStores
              .map((store) => store.storeName)
              .join(", "); // Create a comma-separated list of store names

            return (
              <SoldItemsListItem
                key={index}
                productName={item.productName}
                quantity={item.quantity}
                cost={Number(item.totalCost).toFixed(2)}
                storeName={storeNames || "Unknown Store"}
                profit={Number(item.profit).toFixed(2)}
                totalSales={Number(item.totalPrice).toFixed(2)}
              />
            );
          })}

          {/* Totals Row */}
          <div className="receiptTotalRow">
            <div className="headerItem">Total</div>
            <div className="headerItem"></div>{" "}
            <div className="headerItem"></div>{" "}
            {/* Placeholder for QTY column */}
            <div className="headerItem">${totalSalesTotal.toFixed(2)}</div>
            <div className="headerItem">${totalCostTotal.toFixed(2)}</div>
            <div className="headerItem">${totalProfitTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {modalReceipt &&
        (() => {
          // Compute the matching store before returning JSX
          const matchedStore = stores.find(
            (store) => store.storeId === modalReceipt.storeId
          );
          return (
            <ReceiptModal
              receipt={modalReceipt}
              store={matchedStore}
              email={email}
              onClose={() => setModalReceipt(null)}
            />
          );
        })()}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default TopSellingProducts;
