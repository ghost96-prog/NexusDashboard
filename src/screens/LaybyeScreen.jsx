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
  FaTags,
  FaUser,
  FaCalendar,
  FaMoneyBill,
  FaCreditCard,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSearch,
  FaTimes as FaTimesIcon
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
  isAfter,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import "../Css/LaybyeScreen.css";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { IoCalendar } from "react-icons/io5";
import { useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import PaymentsScreen from "./PaymentsScreen";
import RemainingTimeFooter from "../components/RemainingTimeFooter";

const LaybyeScreen = () => {
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
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [paymentsData, setPaymentsData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLaybyeData, setSelectedLaybyeData] = useState(null);
  const [laybyes, setLaybyes] = useState([]);
  
  // Stats data
  const [totalLaybyes, setTotalLaybyes] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [paidLaybyes, setPaidLaybyes] = useState(0);
  const [pendingLaybyes, setPendingLaybyes] = useState(0);
  const [overdueLaybyes, setOverdueLaybyes] = useState(0);

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
    if (email) {
      fetchStores();
    }
  }, [email]);

  useEffect(() => {
    if (selectedStores.length > 0) {
      onRefresh();
    }
  }, [selectedStores]);

  useEffect(() => {
    setSelectedStores(stores);
  }, [selectedOption, stores]);

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

  const fetchPaymentsOnlineAndSetToRealm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/laybyeRouter/laybyes?email=${encodeURIComponent(
          userEmail
        )}`
      );
      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("User not found or invalid email.");
        return;
      }

      const responsedata = await response.json();
      setPaymentsData(responsedata.data || []);
      const depositLaybyes = (responsedata.data || []).filter(
        (payment) => payment.type === "Deposit"
      );
      setLaybyes(depositLaybyes);
      calculateStats(depositLaybyes, responsedata.data || []);
    } catch (error) {
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching laybyes.");
      }
      console.error("Error fetching laybyes:", error);
    }
  };

  const calculateStats = (laybyesData, paymentsData) => {
    let total = 0;
    let totalValueSum = 0;
    let totalPaidSum = 0;
    let totalBalanceSum = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    laybyesData.forEach(item => {
      let totalPaid = parseFloat(item.deposit) || 0;
      const paymentsForLaybye = paymentsData.filter(
        (payment) =>
          payment.laybyeId === item.id && payment.refunded !== "REFUNDED"
      );

      paymentsForLaybye.forEach((payment) => {
        totalPaid +=
          payment.type === "Deposit"
            ? parseFloat(payment.deposit)
            : parseFloat(payment.amount);
      });

      const totalBill = parseFloat(item.totalBill) || 0;
      const balance = totalBill - totalPaid;
      const isOverdue = item.finalPaymentDate && 
        isAfter(new Date(), new Date(item.finalPaymentDate)) && 
        balance > 0;

      total++;
      totalValueSum += totalBill;
      totalPaidSum += totalPaid;
      totalBalanceSum += balance;

      if (balance === 0) {
        paidCount++;
      } else if (isOverdue) {
        overdueCount++;
        pendingCount++;
      } else {
        pendingCount++;
      }
    });

    setTotalLaybyes(total);
    setTotalValue(totalValueSum);
    setTotalPaid(totalPaidSum);
    setTotalBalance(totalBalanceSum);
    setPaidLaybyes(paidCount);
    setPendingLaybyes(pendingCount);
    setOverdueLaybyes(overdueCount);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    NProgress.start();
    await fetchPaymentsOnlineAndSetToRealm()
      .then(() => {
        NProgress.done();
        setIsRefreshing(false);
      })
      .catch((error) => {
        console.error(error);
        NProgress.done();
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
      !event.target.closest(".laybye-screen-store-selector")
    ) {
      setIsStoreDropdownOpen(false);
    }

    if (
      isExportDropdownOpen &&
      !event.target.closest(".laybye-screen-export-button")
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

  const calculateLatePayment = (
    totalBill,
    totalPaid,
    balance,
    finalPaymentDate
  ) => {
    if (balance > 0 && finalPaymentDate) {
      const currentDate = new Date();
      const isLate = isAfter(currentDate, new Date(finalPaymentDate));
      if (isLate) {
        const overdueAmount = totalBill - totalPaid;
        const lateFee = overdueAmount * 0.05;
        return lateFee;
      }
    }
    return 0;
  };

  const handleNavigatePayLaybye = (item) => {
    const formattedItem = {
      ...item,
      date: new Date(item.date).toISOString(),
      finalPaymentDate: new Date(item.finalPaymentDate).toISOString(),
    };

    setSelectedLaybyeData({
      laybyeData: formattedItem,
      paymentsData: paymentsData,
    });

    setModalVisible(true);
  };

  const filteredLaybyes = laybyes
    .filter((item) => {
      const nameMatch = item.customerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      let totalPaid = parseFloat(item.deposit) || 0;
      const paymentsForLaybye = paymentsData.filter(
        (payment) =>
          payment.laybyeId === item.id && payment.refunded !== "REFUNDED"
      );

      paymentsForLaybye.forEach((payment) => {
        totalPaid +=
          payment.type === "Deposit"
            ? parseFloat(payment.deposit)
            : parseFloat(payment.amount);
      });

      const balance = parseFloat(item.totalBill) - totalPaid;

      const statusMatch =
        filterStatus === "all"
          ? true
          : filterStatus === "paid"
          ? balance === 0
          : filterStatus === "pending"
          ? balance > 0
          : true;

      return nameMatch && statusMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const StatCard = ({ title, value, icon, percentage, isPositive, subValue, color, isCurrency = true }) => (
    <div className="laybye-screen-stat-card">
      <div className="laybye-screen-stat-icon-container" style={{ backgroundColor: color + '20', color: color }}>
        <div className="laybye-screen-stat-icon-circle">
          {icon}
        </div>
      </div>
      <div className="laybye-screen-stat-content">
        <div className="laybye-screen-stat-title">{title}</div>
        <div className="laybye-screen-stat-value">
          {isCurrency ? '$' : ''}{value.toLocaleString(undefined, {
            minimumFractionDigits: isCurrency ? 2 : 0,
            maximumFractionDigits: isCurrency ? 2 : 0,
          })}
        </div>
        {percentage && (
          <div className="laybye-screen-stat-change-container">
            <div className={`laybye-screen-stat-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <FaArrowUp /> : <FaArrowDown />}
              <span>{percentage}</span>
            </div>
          </div>
        )}
        {subValue && <div className="laybye-screen-stat-subvalue">{subValue}</div>}
      </div>
    </div>
  );

  const renderLaybyeCard = (item) => {
    let totalPaid = parseFloat(item.deposit) || 0;
    const paymentsForLaybye = paymentsData.filter(
      (payment) =>
        payment.laybyeId === item.id && payment.refunded !== "REFUNDED"
    );

    paymentsForLaybye.forEach((payment) => {
      totalPaid +=
        payment.type === "Deposit"
          ? parseFloat(payment.deposit)
          : parseFloat(payment.amount);
    });

    const totalBill = parseFloat(item.totalBill) || 0;
    const balance = totalBill - totalPaid;
    const progressPercentage = totalBill > 0 ? (totalPaid / totalBill) * 100 : 0;
    
    const isOverdue = item.finalPaymentDate && 
      isAfter(new Date(), new Date(item.finalPaymentDate)) && 
      balance > 0;
    
    const lateFee = calculateLatePayment(
      totalBill,
      totalPaid,
      balance,
      item.finalPaymentDate
    );

    let status = "paid";
    let statusText = "Paid";
    if (balance > 0) {
      if (isOverdue) {
        status = "unpaid";
        statusText = "Overdue";
      } else {
        status = "pending";
        statusText = "Pending";
      }
    }

    return (
      <div 
        key={item.id} 
        className="laybye-screen-laybye-card"
        onClick={() => handleNavigatePayLaybye(item)}
      >
        <div className="laybye-screen-laybye-header">
          <h4 className="laybye-screen-customer-name">{item.customerName}</h4>
          <span className={`laybye-screen-payment-status ${status}`}>
            {statusText}
          </span>
        </div>
        
        <div className="laybye-screen-laybye-details">
          <div className="laybye-screen-detail-item">
            <span className="laybye-screen-detail-label">Total Bill</span>
            <span className="laybye-screen-detail-value">${totalBill.toFixed(2)}</span>
          </div>
          <div className="laybye-screen-detail-item">
            <span className="laybye-screen-detail-label">Paid</span>
            <span className="laybye-screen-detail-value" style={{ color: '#10b981' }}>
              ${totalPaid.toFixed(2)}
            </span>
          </div>
          <div className="laybye-screen-detail-item">
            <span className="laybye-screen-detail-label">Balance</span>
            <span className="laybye-screen-detail-value" style={{ color: balance > 0 ? '#ef4444' : '#10b981' }}>
              ${balance.toFixed(2)}
            </span>
          </div>
          <div className="laybye-screen-detail-item">
            <span className="laybye-screen-detail-label">Due Date</span>
            <span className="laybye-screen-detail-value">
              {item.finalPaymentDate ? new Date(item.finalPaymentDate).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>

        <div className="laybye-screen-laybye-progress">
          <div className="laybye-screen-progress-bar">
            <div 
              className="laybye-screen-progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="laybye-screen-progress-text">
            <span>${totalPaid.toFixed(2)} paid</span>
            <span>${totalBill.toFixed(2)} total</span>
          </div>
        </div>

        {lateFee > 0 && (
          <div className="laybye-screen-detail-item" style={{ marginBottom: '12px' }}>
            <span className="laybye-screen-detail-label">Late Fee</span>
            <span className="laybye-screen-detail-value" style={{ color: '#ef4444' }}>
              ${lateFee.toFixed(2)}
            </span>
          </div>
        )}

      
      </div>
    );
  };

  return (
    <div className="laybye-screen-container">
      <div className="laybye-screen-sidebar-toggle-wrapper">
        <button 
          className="laybye-screen-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`laybye-screen-content ${isSidebarOpen ? "laybye-screen-content-shifted" : "laybye-screen-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="laybye-screen-toolbar">
          <div className="laybye-screen-toolbar-content">
            <h1 className="laybye-screen-toolbar-title">Laybyes Dashboard</h1>
            <div className="laybye-screen-toolbar-subtitle">
              Manage and track customer laybyes
            </div>
          </div>
          <div className="laybye-screen-toolbar-actions">
            <button 
              className="laybye-screen-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="laybye-screen-control-panel">
          <div className="laybye-screen-date-controls">
            <div className="laybye-screen-date-navigation">
              <button 
                className="laybye-screen-nav-btn"
                onClick={() => {/* Handle back navigation */}}
              >
                <IoIosArrowBack />
              </button>
              <button 
                className="laybye-screen-date-range-btn"
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
                className="laybye-screen-nav-btn"
                onClick={() => {/* Handle forward navigation */}}
              >
                <IoIosArrowForward />
              </button>
            </div>
            
            {isDatePickerOpen && (
              <div ref={dateRangePickerRef} className="laybye-screen-datepicker-modal">
                <DateRangePicker
                  ranges={[{
                    startDate: selectedStartDate,
                    endDate: selectedEndDate,
                    key: "selection",
                  }]}
                  onChange={(ranges) => {
                    const { startDate, endDate } = ranges.selection;
                    setSelectedStartDate(startDate);
                    setSelectedEndDate(endDate);
                    setIsDatePickerOpen(false);
                  }}
                  moveRangeOnFirstSelection={true}
                  months={2}
                  direction="horizontal"
                  locale={enUS}
                />
              </div>
            )}
          </div>
          
          <div className="laybye-screen-filter-controls">
            <div className="laybye-screen-store-selector">
              <button 
                className="laybye-screen-filter-btn"
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
                <div className="laybye-screen-dropdown">
                  <div className="laybye-screen-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="laybye-screen-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="laybye-screen-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="laybye-screen-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="laybye-screen-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="laybye-screen-checkbox-custom"></div>
                        </div>
                        <span className="laybye-screen-store-name">{store.storeName}</span>
                        <span className="laybye-screen-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="laybye-screen-stats-grid">
          <StatCard
            title="Total Laybyes"
            value={totalLaybyes}
            icon={<FaShoppingCart />}
            isPositive={true}
            color="#6366f1"
            isCurrency={false}
          />
          
          <StatCard
            title="Total Value"
            value={totalValue}
            icon={<FaDollarSign />}
            isPositive={true}
            color="#10b981"
          />
          
          <StatCard
            title="Total Paid"
            value={totalPaid}
            icon={<FaMoneyBill />}
            isPositive={true}
            color="#10b981"
          />
          
          <StatCard
            title="Total Balance"
            value={totalBalance}
            icon={<FaCreditCard />}
            isPositive={false}
            color={totalBalance > 0 ? "#ef4444" : "#10b981"}
          />
          
          <StatCard
            title="Paid Up"
            value={paidLaybyes}
            icon={<FaCheckCircle />}
            isPositive={true}
            color="#10b981"
            isCurrency={false}
            subValue={`${totalLaybyes > 0 ? ((paidLaybyes / totalLaybyes) * 100).toFixed(1) : 0}% of total`}
          />
          
          <StatCard
            title="Pending"
            value={pendingLaybyes}
            icon={<FaClock />}
            isPositive={false}
            color="#f59e0b"
            isCurrency={false}
          />
          
          {overdueLaybyes > 0 && (
            <StatCard
              title="Overdue"
              value={overdueLaybyes}
              icon={<FaExclamationTriangle />}
              isPositive={false}
              color="#ef4444"
              isCurrency={false}
            />
          )}
        </div>

        {/* Search and Filter */}
        <div className="laybye-screen-search-filter">
          <div className="laybye-screen-search-container">
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="laybye-screen-search-input"
              style={{ paddingLeft: '40px' }}
            />
            {searchTerm && (
              <button 
                className="laybye-screen-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
          
          <select
            className="laybye-screen-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Laybyes</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid Up</option>
          </select>
        </div>

        {/* Laybyes List */}
        <div className="laybye-screen-list-container">
          <div className="laybye-screen-list-header">
            <h3>Customer Laybyes</h3>
            <span className="laybye-screen-list-count">
              {filteredLaybyes.length} laybyes
            </span>
          </div>
          
          <div className="laybye-screen-list-content">
            {filteredLaybyes.length > 0 ? (
              <div className="laybye-screen-list-grid">
                {filteredLaybyes.map(renderLaybyeCard)}
              </div>
            ) : (
              <div className="laybye-screen-empty-state">
                <FaShoppingCart className="laybye-screen-empty-icon" />
                <h3 className="laybye-screen-empty-title">No Laybyes Found</h3>
                <p className="laybye-screen-empty-description">
                  {searchTerm ? `No laybyes found for "${searchTerm}"` : "No laybyes available for the selected filters"}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <RemainingTimeFooter />
      </div>
      
      {/* Modal for Payments */}
      {modalVisible && (
        <div className="laybye-screen-modal-overlay">
          <div className="laybye-screen-modal-content">
            <button 
              className="laybye-screen-modal-close"
              onClick={() => setModalVisible(false)}
            >
              <FaTimes />
            </button>
            <PaymentsScreen
              laybyeData={selectedLaybyeData?.laybyeData}
              paymentsData={selectedLaybyeData?.paymentsData}
              onClose={() => setModalVisible(false)}
            />
          </div>
        </div>
      )}
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default LaybyeScreen;