import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaStore,
  FaDownload,
  FaReceipt,
  FaExchangeAlt,
  FaSearch,
  FaFilePdf,
  FaFileCsv,
  FaTimes,
  FaBars,
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
import "../Css/ReceiptsScreen.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { IoCalendar } from "react-icons/io5";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReceiptModal from "../components/ReceiptModal";
import ReceiptListItem from "../components/ReceiptListItem";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import RemainingTimeFooter from "../components/RemainingTimeFooter";

const ReceiptsScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [stores, setStoreData] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState(startOfToday());
  const [selectedEndDate, setSelectedEndDate] = useState(endOfToday());
  const [selectedOption, setSelectedOption] = useState("today");
  const [selectedRange, setSelectedRange] = useState("Today");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dateRangePickerRef = useRef(null);
  const [receipts, setReceipts] = useState([]);
  const [modalReceipt, setModalReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [refundedReceipts, setRefundedReceipts] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [refundedAmount, setRefundedAmount] = useState(0);

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
    if (modalReceipt) {
      window.history.pushState({ modalOpen: true }, "");
      const handlePopState = () => setModalReceipt(null);
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [modalReceipt]);

  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh(selectedOption, selectedStartDate, selectedEndDate);
    }
  }, [selectedStores, selectedOption, selectedStartDate, selectedEndDate]);

  useEffect(() => {
    setSelectedStores(stores);
  }, [selectedOption, stores]);

  useEffect(() => {
    if (email) {
      fetchStores();
    }
  }, [email]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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
        return;
      }

      const { receipts: rawReceipts } = responseData;
      const selectedStoreIds = selectedStores.map((store) => store.storeId);

      const filteredReceipts = rawReceipts
        .map((receipt) => ({
          ...receipt,
          dateTime: convertFirestoreTimestampToISO(receipt.dateTime),
        }))
        .filter((receipt) => selectedStoreIds.includes(receipt.storeId));

      // Calculate statistics
      const total = filteredReceipts.length;
      const refunded = filteredReceipts.filter(receipt => receipt.label === "Refunded").length;
      const totalAmountSum = filteredReceipts.reduce((sum, receipt) => 
        sum + (receipt.totalAmountUsd || 0) * (receipt.rate || 1), 0);
      const refundedAmountSum = filteredReceipts
        .filter(receipt => receipt.label === "Refunded")
        .reduce((sum, receipt) => 
          sum + (receipt.totalAmountUsd || 0) * (receipt.rate || 1), 0);

      setTotalReceipts(total);
      setRefundedReceipts(refunded);
      setTotalAmount(totalAmountSum);
      setRefundedAmount(refundedAmountSum);
      setReceipts(filteredReceipts);

    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching receipts.");
      }
      console.error("Error fetching receipts:", error);
    }
  };

  const onRefresh = async (selectedOption, selectedStartRange, selectedEndRange) => {
    NProgress.start();
    setIsRefreshing(true);
    await fetchAllReceiptsData(selectedOption, selectedStartRange, selectedEndRange)
      .then(() => {
        NProgress.done();
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
    if (isStoreDropdownOpen && !event.target.closest(".receipts-store-selector")) {
      setIsStoreDropdownOpen(false);
      if (selectedStores.length === 0) {
        setReceipts([]);
        setTotalReceipts(0);
        setRefundedReceipts(0);
        setTotalAmount(0);
        setRefundedAmount(0);
      }
    }

    if (isExportDropdownOpen && !event.target.closest(".receipts-export-button")) {
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
      if (dateRangePickerRef.current && !dateRangePickerRef.current.contains(event.target)) {
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

  const StatCard = ({ title, value, icon, color, isCurrency = false, subValue }) => (
    <div className="receipts-stat-card">
      <div className="receipts-stat-icon-container" style={{ backgroundColor: color + '20', color: color }}>
        <div className="receipts-stat-icon-circle">
          {icon}
        </div>
      </div>
      <div className="receipts-stat-content">
        <div className="receipts-stat-title">{title}</div>
        <div className="receipts-stat-value">
          {isCurrency ? '$' : ''}{value.toLocaleString(undefined, {
            minimumFractionDigits: isCurrency ? 2 : 0,
            maximumFractionDigits: isCurrency ? 2 : 0,
          })}
        </div>
        {subValue && <div className="receipts-stat-subvalue">{subValue}</div>}
      </div>
    </div>
  );

  const filteredReceipts = receipts
    .filter((receipt) =>
      receipt.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  function handleItemClick(item) {
    setModalReceipt(item);
  }
// Add this formatting function at the top of your component or in the render section
// Update the formatDate function to show day name first
const formatDate = (dateString) => {
  try {
    const dateObj = new Date(dateString);
    
    // Day of week (Mon, Tue, etc.)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekday = weekdays[dateObj.getDay()];
    
    // Day of month (1, 2, 3... not 01, 02)
    const day = dateObj.getDate();
    
    // Month (Jan, Feb, etc.)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dateObj.getMonth()];
    
    // Year
    const year = dateObj.getFullYear();
    
    // Time (12:23:44)
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
    const time = `${hours}:${minutes}:${seconds}`;
    
    // Format: "Thu 1 Jan 2025 12:23:44"
    return `${weekday} ${day} ${month} ${year} ${time}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};


  return (
    <div className="receipts-container">
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
      
      <div className={`receipts-content ${isSidebarOpen ? "receipts-content-shifted" : "receipts-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="receipts-toolbar">
          <div className="receipts-toolbar-content">
            <h1 className="receipts-toolbar-title">Receipts</h1>
            <div className="receipts-toolbar-subtitle">
              View and manage all transaction receipts
            </div>
          </div>
          <div className="receipts-toolbar-actions">
            <button 
              className="receipts-refresh-btn"
              onClick={() => onRefresh(selectedOption, selectedStartDate, selectedEndDate)}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="receipts-control-panel">
          <div className="receipts-date-controls">
            <div className="receipts-date-navigation">
              <button 
                className="receipts-nav-btn"
                onClick={handleBackClick}
              >
                <IoIosArrowBack />
              </button>
              <button 
                className="receipts-date-range-btn"
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
                className="receipts-nav-btn"
                onClick={handleForwardClick}
              >
                <IoIosArrowForward />
              </button>
            </div>
            
            {isDatePickerOpen && (
              <div ref={dateRangePickerRef} className="receipts-datepicker-modal">
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
          
          <div className="receipts-filter-controls">
            <div className="receipts-store-selector">
              <button 
                className="receipts-filter-btn"
                onClick={() => {
                  setIsStoreDropdownOpen(!isStoreDropdownOpen);
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
                <div className="receipts-dropdown">
                  <div className="receipts-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="receipts-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="receipts-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="receipts-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="receipts-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="receipts-checkbox-custom"></div>
                        </div>
                        <span className="receipts-store-name">{store.storeName}</span>
                        <span className="receipts-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="receipts-stats-grid">
          <StatCard
            title="Total Receipts"
            value={totalReceipts}
            icon={<FaReceipt />}
            color="#6366f1"
            isCurrency={false}
            subValue={`$${totalAmount.toFixed(2)} total`}
          />
          
          <StatCard
            title="Refunded Receipts"
            value={refundedReceipts}
            icon={<FaExchangeAlt />}
            color="#ef4444"
            isCurrency={false}
            subValue={`$${refundedAmount.toFixed(2)} refunded`}
          />
          
          <StatCard
            title="Total Amount"
            value={totalAmount}
            icon={<FaReceipt />}
            color="#10b981"
            isCurrency={true}
            subValue={`${totalReceipts > 0 ? (totalAmount / totalReceipts).toFixed(2) : 0} avg`}
          />
          
          <StatCard
            title="Refunded Amount"
            value={refundedAmount}
            icon={<FaExchangeAlt />}
            color="#f59e0b"
            isCurrency={true}
            subValue={`${refundedReceipts > 0 ? (refundedAmount / refundedReceipts).toFixed(2) : 0} avg refund`}
          />
        </div>

        {/* Search Bar */}
        <div className="receipts-search-container">
          <FaSearch className="receipts-search-icon" />
          <input
            type="text"
            placeholder="Search by receipt number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="receipts-search-input"
          />
          {searchTerm && (
            <button 
              className="receipts-clear-search"
              onClick={() => setSearchTerm("")}
            >
              ×
            </button>
          )}
        </div>

        {/* Receipts Table */}
        <div className="receipts-table-container">
          <div className="receipts-table-header">
            <h3>Transaction Receipts</h3>
            <div className="receipts-table-actions">
              <span className="receipts-table-count">
                Showing {filteredReceipts.length} receipts
              </span>
            </div>
          </div>
          
          <div className="receipts-table-wrapper">
            <table className="receipts-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Store</th>
                  <th>Payment Type</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr className="receipts-empty-row">
                    <td colSpan="7" className="receipts-empty-cell">
                      No receipts found for the selected criteria
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((item, index) => {
                    const matchedStore = stores.find(
                      (store) => store.storeId === item.storeId
                    );
                    const isRefunded = item.label === "Refunded";
                    
                    return (
                      <tr key={index} className={`receipts-table-row ${isRefunded ? 'receipts-refunded-row' : ''}`}>
                        <td className="receipts-table-cell">{item.ticketNumber || 'N/A'}</td>
                        <td className="receipts-table-cell">
  {item.dateTime ? formatDate(item.dateTime) : 'N/A'}
                        </td>
                        <td className="receipts-table-cell">{matchedStore?.storeName || 'Unknown Store'}</td>
                        <td className="receipts-table-cell">{item.selectedCurrency || 'N/A'}</td>
                        <td className="receipts-table-cell">
                          ${(Number(item.totalAmountUsd || 0) * Number(item.rate || 1)).toFixed(2)}
                        </td>
                        <td className="receipts-table-cell">
                          <span className={`receipts-status ${isRefunded ? 'receipts-status-refunded' : 'receipts-status-completed'}`}>
                            {isRefunded ? 'Refunded' : 'Completed'}
                          </span>
                        </td>
                        <td className="receipts-table-cell">
                          <button 
                            className="receipts-view-btn"
                            onClick={() => handleItemClick(item)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <RemainingTimeFooter />
      </div>
      
      {/* Receipt Modal */}
      {modalReceipt && (() => {
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
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ReceiptsScreen;