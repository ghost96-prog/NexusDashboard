import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaStore,
  FaDownload,
  FaChartLine,
  FaBox,
  FaShoppingCart,
  FaFilter,
  FaSearch,
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
import "../Css/TopSellingProducts.css";
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
import autoTable from "jspdf-autotable";
import { FaFileCsv, FaFilePdf } from "react-icons/fa6";
import RemainingTimeFooter from "../components/RemainingTimeFooter";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const TopSellingProducts = () => {
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
  const [productSummary, setProductSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [filterTopSellingBySales, setFilterTopSelling] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);

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
      }

      const { soldProducts } = responseData;

      let sortedProductSummary;
      if (filterTopSellingBySales) {
        sortedProductSummary = Object.values(soldProducts).sort(
          (a, b) => b.totalPrice - a.totalPrice
        );
      } else {
        sortedProductSummary = Object.values(soldProducts).sort(
          (a, b) => b.quantity - a.quantity
        );
      }

      // Calculate totals
      const salesTotal = sortedProductSummary.reduce((sum, item) => sum + item.totalPrice, 0);
      const costTotal = sortedProductSummary.reduce((sum, item) => sum + item.totalCost, 0);
      const profitTotal = sortedProductSummary.reduce((sum, item) => sum + item.profit, 0);
      const quantityTotal = sortedProductSummary.reduce((sum, item) => sum + item.quantity, 0);

      setTotalSales(salesTotal);
      setTotalCost(costTotal);
      setTotalProfit(profitTotal);
      setTotalQuantity(quantityTotal);
      setProductSummary(sortedProductSummary);

    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching products.");
      }
      console.error("Error fetching products:", error);
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
    if (isStoreDropdownOpen && !event.target.closest(".topselling-store-selector")) {
      setIsStoreDropdownOpen(false);
      if (selectedStores.length === 0) {
        setProductSummary([]);
        setTotalSales(0);
        setTotalCost(0);
        setTotalProfit(0);
        setTotalQuantity(0);
      }
    }

    if (isExportDropdownOpen && !event.target.closest(".topselling-export-button")) {
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

  const StatCard = ({ title, value, icon, color, isCurrency = true, subValue }) => (
    <div className="topselling-stat-card">
      <div className="topselling-stat-icon-container" style={{ backgroundColor: color + '20', color: color }}>
        <div className="topselling-stat-icon-circle">
          {icon}
        </div>
      </div>
      <div className="topselling-stat-content">
        <div className="topselling-stat-title">{title}</div>
        <div className="topselling-stat-value">
          {isCurrency ? '$' : ''}{value.toLocaleString(undefined, {
            minimumFractionDigits: isCurrency ? 2 : 0,
            maximumFractionDigits: isCurrency ? 2 : 0,
          })}
        </div>
        {subValue && <div className="topselling-stat-subvalue">{subValue}</div>}
      </div>
    </div>
  );

  const handlePDFExport = () => {
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
    doc.text("Top Selling Products", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${date}`, 14, 28);
    
    const storeNames = selectedStores.length === 0 
      ? "All Stores" 
      : selectedStores.map(s => s.storeName).join(", ");
    doc.text(`Stores: ${storeNames}`, 14, 36);

    const tableData = productSummary.map((item) => [
      item.productName,
      item.quantity,
      `$${Number(item.totalPrice).toFixed(2)}`,
      `$${Number(item.totalCost).toFixed(2)}`,
      `$${Number(item.profit).toFixed(2)}`,
    ]);

    tableData.push([
      "TOTAL",
      totalQuantity,
      `$${totalSales.toFixed(2)}`,
      `$${totalCost.toFixed(2)}`,
      `$${totalProfit.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Product Name", "QTY", "Total Sales", "Total Cost", "Profit"]],
      body: tableData,
    });

    doc.save("TopSellingProducts.pdf");
  };

  const handleCSVExport = () => {
    const date = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const storeNames = selectedStores.length === 0 
      ? "All Stores" 
      : selectedStores.map(s => s.storeName).join(", ");

    let csv = "TOP SELLING PRODUCTS\n\n";
    csv += `Generated on:,${date}\n`;
    csv += `Stores:,${storeNames}\n\n`;
    csv += "Product Name,Quantity,Total Sales,Total Cost,Profit\n";
    
    productSummary.forEach((item) => {
      csv += `${item.productName},${item.quantity},${Number(item.totalPrice).toFixed(2)},${Number(item.totalCost).toFixed(2)},${Number(item.profit).toFixed(2)}\n`;
    });

    csv += `TOTAL,${totalQuantity},${totalSales.toFixed(2)},${totalCost.toFixed(2)},${totalProfit.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "TopSellingProducts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = productSummary.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="topselling-container">
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
      
      <div className={`topselling-content ${isSidebarOpen ? "topselling-content-shifted" : "topselling-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="topselling-toolbar">
          <div className="topselling-toolbar-content">
            <h1 className="topselling-toolbar-title">Top Selling Products</h1>
            <div className="topselling-toolbar-subtitle">
              Analysis of best performing products
            </div>
          </div>
          <div className="topselling-toolbar-actions">
            <button 
              className="topselling-refresh-btn"
              onClick={() => onRefresh(selectedOption, selectedStartDate, selectedEndDate)}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="topselling-control-panel">
          <div className="topselling-date-controls">
            <div className="topselling-date-navigation">
              <button 
                className="topselling-nav-btn"
                onClick={handleBackClick}
              >
                <IoIosArrowBack />
              </button>
              <button 
                className="topselling-date-range-btn"
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
                className="topselling-nav-btn"
                onClick={handleForwardClick}
              >
                <IoIosArrowForward />
              </button>
            </div>
            
            {isDatePickerOpen && (
              <div ref={dateRangePickerRef} className="topselling-datepicker-modal">
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
          
          <div className="topselling-filter-controls">
            <div className="topselling-store-selector">
              <button 
                className="topselling-filter-btn"
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
                <div className="topselling-dropdown">
                  <div className="topselling-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="topselling-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="topselling-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="topselling-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="topselling-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="topselling-checkbox-custom"></div>
                        </div>
                        <span className="topselling-store-name">{store.storeName}</span>
                        <span className="topselling-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="topselling-export-button">
              <button 
                className="topselling-filter-btn"
                onClick={() => {
                  setIsExportDropdownOpen(!isExportDropdownOpen);
                  setIsStoreDropdownOpen(false);
                }}
              >
                <FaDownload />
                <span>Export</span>
              </button>
              
              {isExportDropdownOpen && (
                <div className="topselling-dropdown">
                  <div 
                    className="topselling-dropdown-item"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      handlePDFExport();
                    }}
                  >
                    <FaFilePdf color="#ef4444" />
                    <span>Download PDF</span>
                  </div>
                  <div 
                    className="topselling-dropdown-item"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      handleCSVExport();
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
        <div className="topselling-stats-grid">
          <StatCard
            title="Total Products"
            value={productSummary.length}
            icon={<FaBox />}
            color="#6366f1"
            isCurrency={false}
          />
          
          <StatCard
            title="Total Quantity"
            value={totalQuantity}
            icon={<FaShoppingCart />}
            color="#8b5cf6"
            isCurrency={false}
          />
          
          <StatCard
            title="Total Sales"
            value={totalSales}
            icon={<FaChartLine />}
            color="#10b981"
          />
          
          <StatCard
            title="Total Profit"
            value={totalProfit}
            icon={<FaChartLine />}
            color="#8b5cf6"
            subValue={`${totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}% margin`}
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="topselling-search-filter">
          <div className="topselling-search-container">
            <FaSearch className="topselling-search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="topselling-search-input"
            />
            {searchTerm && (
              <button 
                className="topselling-clear-search"
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="topselling-filter-container">
            <FaFilter className="topselling-filter-icon" />
            <select
              value={filterTopSellingBySales ? "sales" : "quantity"}
              onChange={(e) => setFilterTopSelling(e.target.value === "sales")}
              className="topselling-filter-select"
            >
              <option value="sales">Sort by Sales</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="topselling-table-container">
          <div className="topselling-table-header">
            <h3>Product Performance</h3>
            <div className="topselling-table-actions">
              <span className="topselling-table-count">
                Showing {filteredProducts.length} products
              </span>
            </div>
          </div>
          
       {/* Products Table - Updated with null checks */}
<div className="topselling-table-wrapper">
  <table className="topselling-table">
    <thead>
      <tr>
        <th>Product Name</th>
        <th>Quantity</th>
        <th>Total Sales</th>
        <th>Total Cost</th>
        <th>Profit</th>
        <th>Profit Margin</th>
      </tr>
    </thead>
    <tbody>
      {filteredProducts.map((item, index) => {
        // Add null checks for all numeric values
        const totalPrice = item.totalPrice || 0;
        const totalCost = item.totalCost || 0;
        const profit = item.profit || 0;
        const quantity = item.quantity || 0;
        
        // Calculate profit margin with null check
        const profitMargin = totalPrice > 0 ? (profit / totalPrice) * 100 : 0;
        
        return (
          <tr key={index} className="topselling-table-row">
            <td className="topselling-table-cell">{item.productName || 'Unknown Product'}</td>
            <td className="topselling-table-cell">{quantity}</td>
            <td className="topselling-table-cell">${totalPrice.toFixed(2)}</td>
            <td className="topselling-table-cell">${totalCost.toFixed(2)}</td>
            <td className="topselling-table-cell topselling-profit">
              ${profit.toFixed(2)}
            </td>
            <td className="topselling-table-cell">
              <div className="topselling-margin-container">
                <span className="topselling-margin-value">{profitMargin.toFixed(1)}%</span>
                <div className="topselling-margin-bar">
                  <div 
                    className="topselling-margin-fill"
                    style={{ 
                      width: `${Math.min(profitMargin, 100)}%`,
                      backgroundColor: profitMargin >= 0 ? '#10b981' : '#ef4444'
                    }}
                  ></div>
                </div>
              </div>
            </td>
          </tr>
        );
      })}
      
      {/* Totals Row with null checks */}
      <tr className="topselling-table-row topselling-total-row">
        <td className="topselling-table-cell topselling-total">TOTAL</td>
        <td className="topselling-table-cell topselling-total">{totalQuantity}</td>
        <td className="topselling-table-cell topselling-total">${(totalSales || 0).toFixed(2)}</td>
        <td className="topselling-table-cell topselling-total">${(totalCost || 0).toFixed(2)}</td>
        <td className="topselling-table-cell topselling-total topselling-profit">
          ${(totalProfit || 0).toFixed(2)}
        </td>
        <td className="topselling-table-cell topselling-total">
          {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%
        </td>
      </tr>
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

export default TopSellingProducts;