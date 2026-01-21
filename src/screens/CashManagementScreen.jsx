import React, { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaChartLine,
  FaDollarSign,
  FaMoneyBillWave,
  FaExchangeAlt,
  FaReceipt,
  FaCreditCard,
  FaSearch,
  FaTimes as FaTimesIcon,
  FaHashtag
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import RemainingTimeFooter from "../components/RemainingTimeFooter";
import "../Css/CashManagementScreen.css";

function CashManagementScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cashManagementData, setCashManagementData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState([]);
  const [shifts, setShifts] = useState([]); // Added state for shifts
  
  // Stats data
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPayIn, setTotalPayIn] = useState(0);
  const [totalPayOut, setTotalPayOut] = useState(0);
  const [netCashFlow, setNetCashFlow] = useState(0);
  const [averageTransaction, setAverageTransaction] = useState(0);
  
  const itemsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.email);
        setUserId(decoded.userId.toString());
      } catch (error) {
        toast.error("Invalid authentication token.");
      }
    }
    fetchStores();
    fetchShifts(); // Fetch shifts data
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && userId) {
      onRefresh();
    }
  }, [userEmail, userId]);

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
        `https://nexuspos.onrender.com/api/storeRouter/stores?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch stores");
      }

      const data = await response.json();
      setStores(data || []);
      
      // Select all stores by default
      if (data.length > 0) {
        setSelectedStores(data);
        const storeNames = data.map(store => store.storeName);
        if (storeNames.length === 1) {
          setSelectedStoreName(storeNames[0]);
        } else {
          setSelectedStoreName("All Stores");
        }
      } else {
        setSelectedStoreName("No Stores Found");
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Error fetching stores!");
    }
  };

  const fetchShifts = async () => {
    try {
      if (!userEmail) return;
      
      const response = await fetch(
        `https://nexuspos.onrender.com/api/shiftsRouter/shifts?email=${encodeURIComponent(userEmail)}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch shifts");
      }
      
      const data = await response.json();
      const filteredShifts = data.data?.filter(
        (shift) => shift.userId === userId
      ) || [];
      
      setShifts(filteredShifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  const fetchCashManagementData = async () => {
    try {
      if (!navigator.onLine) {
        toast.error("No internet connection!");
        return;
      }

      const response = await fetch(
        `https://nexuspos.onrender.com/api/cashManagementRouter/cashmanagement?email=${encodeURIComponent(userEmail)}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch cash management data");
      }
      
      const cashManagementDataFromServer = await response.json();
      
      console.log("API Response:", cashManagementDataFromServer); // Debug log
      
      // Check if data is directly in the response or nested
      const data = cashManagementDataFromServer.data || cashManagementDataFromServer || [];
      console.log("Data to process:", data); // Debug log
      
      // Filter cash management data by userId
      const filteredData = data.filter(
        (item) => item.userId === userId
      );
      
      console.log("Filtered data:", filteredData); // Debug log
      
      setCashManagementData(filteredData);
      calculateStats(filteredData);
    } catch (error) {
      console.error("Error fetching cash management data:", error);
      toast.error("Error fetching cash management data!");
    }
  };

  const calculateStats = (data) => {
    console.log("Calculating stats for:", data); // Debug log
    
    let total = data.length;
    let totalPayInSum = 0;
    let totalPayOutSum = 0;
    let netCashFlowSum = 0;
    let totalAmountSum = 0;

    data.forEach(item => {
      console.log("Processing item:", item); // Debug log each item
      
      // Handle different possible property names
      const amount = parseFloat(item.amount) || parseFloat(item.Amount) || parseFloat(item.totalAmount) || 0;
      const type = (item.type || item.Type || item.transactionType || '').toString().toLowerCase().trim();
      
      console.log("Parsed:", { type, amount }); // Debug parsed values
      
      totalAmountSum += Math.abs(amount); // Use absolute value for total amount sum
      
      // Check for pay in types - expanded matching
      if (
        type.includes('payin') || 
        type.includes('income') || 
        type.includes('deposit') || 
        type.includes('pay_in') ||
        type.includes('paidin') ||
        type.includes('payment') ||
        type.includes('credit') ||
        type === 'in' ||
        type === 'pay in' ||
        type === 'deposit' ||
        type === 'income' ||
        type === 'credit'
      ) {
        totalPayInSum += amount;
        netCashFlowSum += amount;
        console.log("Added to pay in:", amount);
      } 
      // Check for pay out types - expanded matching
      else if (
        type.includes('payout') || 
        type.includes('expense') || 
        type.includes('withdrawal') || 
        type.includes('pay_out') ||
        type.includes('paidout') ||
        type.includes('debit') ||
        type === 'out' ||
        type === 'pay out' ||
        type === 'withdrawal' ||
        type === 'expense' ||
        type === 'debit'
      ) {
        totalPayOutSum += amount;
        netCashFlowSum -= amount;
        console.log("Added to pay out:", amount);
      } else {
        // If type is not clear, check if amount is positive or negative
        console.log("Unknown type:", type, "Amount:", amount);
        if (amount > 0) {
          totalPayInSum += amount;
          netCashFlowSum += amount;
          console.log("Positive amount treated as pay in:", amount);
        } else if (amount < 0) {
          totalPayOutSum += Math.abs(amount);
          netCashFlowSum += amount; // amount is negative, so this subtracts
          console.log("Negative amount treated as pay out:", Math.abs(amount));
        }
      }
    });

    console.log("Calculated stats:", {
      total,
      totalPayInSum,
      totalPayOutSum,
      netCashFlowSum,
      average: total > 0 ? totalAmountSum / total : 0
    });

    setTotalTransactions(total);
    setTotalPayIn(totalPayInSum);
    setTotalPayOut(totalPayOutSum);
    setNetCashFlow(netCashFlowSum);
    setAverageTransaction(total > 0 ? totalAmountSum / total : 0);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchCashManagementData()
      .then(() => setIsRefreshing(false))
      .catch((error) => {
        console.error(error);
        setIsRefreshing(false);
        toast.error("Failed to refresh data");
      });
  };

  const handleStoreSelect = (store) => {
    if (store === "All Stores") {
      if (selectedStores.length === stores.length) {
        setSelectedStores([]);
        setSelectedStoreName("Select Store");
      } else {
        setSelectedStores([...stores]);
        setSelectedStoreName("All Stores");
      }
    } else {
      const exists = selectedStores.some((s) => s.storeId === store.storeId);
      const updatedStores = exists
        ? selectedStores.filter((s) => s.storeId !== store.storeId)
        : [...selectedStores, store];
      
      setSelectedStores(updatedStores);
      
      if (updatedStores.length === 0) {
        setSelectedStoreName("Select Store");
      } else if (updatedStores.length === 1) {
        setSelectedStoreName(updatedStores[0].storeName);
      } else if (updatedStores.length === stores.length) {
        setSelectedStoreName("All Stores");
      } else {
        setSelectedStoreName("Multiple Stores Selected");
      }
    }
  };

  const handleClickOutside = (event) => {
    if (
      isStoreDropdownOpen &&
      !event.target.closest(".cash-management-store-selector")
    ) {
      setIsStoreDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const getShiftNumber = (item) => {
    // Check for shiftNumber directly on the item
    if (item.shiftNumber) {
      return item.shiftNumber;
    }
    
    // Check for shiftId and try to find matching shift
    if (item.shiftId) {
      const matchingShift = shifts.find(shift => shift.shiftId === item.shiftId);
      if (matchingShift) {
        return matchingShift.shiftNumber;
      }
    }
    
    // Return default value if no shift found
    return 'N/A';
  };

  const getShiftStatus = (item) => {
    if (item.shiftId) {
      const matchingShift = shifts.find(shift => shift.shiftId === item.shiftId);
      if (matchingShift) {
        return matchingShift.closingDate ? 'Closed' : 'Open';
      }
    }
    return 'N/A';
  };

  const filteredData = cashManagementData
    .filter(item => {
      if (!item) return false;
      
      const comment = (item.comment || '').toString().toLowerCase();
      const type = (item.type || '').toString().toLowerCase();
      const currencyName = (item.currency?.name || '').toString().toLowerCase();
      const shiftNumber = getShiftNumber(item).toString().toLowerCase();
      const searchLower = searchText.toLowerCase();
      
      return comment.includes(searchLower) ||
             type.includes(searchLower) ||
             currencyName.includes(searchLower) ||
             shiftNumber.includes(searchLower) ||
             (searchLower.startsWith('#') && shiftNumber.includes(searchLower.slice(1))) ||
             (searchLower.startsWith('shift') && shiftNumber.includes(searchLower.slice(5).trim()));
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA; // Newest first
    });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const StatCard = ({ title, value, icon, percentage, isPositive, subValue, color, isCurrency = true }) => (
    <div className="cash-management-stat-card">
      <div 
        className="cash-management-stat-icon-container" 
        style={{ backgroundColor: `${color}20`, borderColor: color }}
      >
        <div 
          className="cash-management-stat-icon-circle" 
          style={{ color: color, borderColor: color }}
        >
          {icon}
        </div>
      </div>
      <div className="cash-management-stat-content">
        <div className="cash-management-stat-title">{title}</div>
        <div className="cash-management-stat-value">
          {isCurrency ? '$' : ''}{value.toLocaleString(undefined, {
            minimumFractionDigits: isCurrency ? 2 : 0,
            maximumFractionDigits: isCurrency ? 2 : 0,
          })}
        </div>
        {percentage && (
          <div className="cash-management-stat-change-container">
            <div className={`cash-management-stat-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <FaArrowUp /> : <FaArrowDown />}
              <span>{percentage}</span>
            </div>
          </div>
        )}
        {subValue && <div className="cash-management-stat-subvalue">{subValue}</div>}
      </div>
    </div>
  );

  return (
    <div className="cash-management-container">
      <div className="cash-management-sidebar-toggle-wrapper">
        <button 
          className="cash-management-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`cash-management-content ${isSidebarOpen ? "cash-management-content-shifted" : "cash-management-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="cash-management-toolbar">
          <div className="cash-management-toolbar-content">
            <h1 className="cash-management-toolbar-title">Cash Management</h1>
            <div className="cash-management-toolbar-subtitle">
              Track pay in, pay out, and cash flow transactions
            </div>
          </div>
          <div className="cash-management-toolbar-actions">
            <button 
              className="cash-management-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <IoReload />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="cash-management-control-panel">
          <div className="cash-management-filter-controls">
            <div className="cash-management-store-selector">
              <button 
                className="cash-management-filter-btn"
                onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
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
                <div className="cash-management-dropdown">
                  <div className="cash-management-dropdown-header">
                    <span>Select Stores</span>
                    <button 
                      className="cash-management-dropdown-select-all"
                      onClick={() => handleStoreSelect("All Stores")}
                    >
                      {selectedStores.length === stores.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="cash-management-dropdown-content">
                    {stores.map((store) => (
                      <div
                        className="cash-management-dropdown-item"
                        key={store.storeId}
                        onClick={() => handleStoreSelect(store)}
                      >
                        <div className="cash-management-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStores.some((s) => s.storeId === store.storeId)}
                            readOnly
                          />
                          <div className="cash-management-checkbox-custom"></div>
                        </div>
                        <span className="cash-management-store-name">{store.storeName}</span>
                        <span className="cash-management-store-location">{store.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="cash-management-stats-grid">
          <StatCard
            title="Total Transactions"
            value={totalTransactions}
            icon={<FaReceipt />}
            isPositive={true}
            color="#6366f1"
            isCurrency={false}
          />
          
          <StatCard
            title="Total Pay In"
            value={totalPayIn}
            icon={<FaArrowUp />}
            isPositive={true}
            color="#10b981"
          />
          
          <StatCard
            title="Total Pay Out"
            value={totalPayOut}
            icon={<FaArrowDown />}
            isPositive={false}
            color="#ef4444"
          />
          
          {/* <StatCard
            title="Net Cash Flow"
            value={netCashFlow}
            icon={<FaExchangeAlt />}
            isPositive={netCashFlow >= 0}
            percentage={netCashFlow >= 0 ? "Positive" : "Negative"}
            color={netCashFlow >= 0 ? "#10b981" : "#ef4444"}
          /> */}
        </div>

        {/* Search and Filter */}
        <div className="cash-management-search-filter">
          <div className="cash-management-search-container">
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by comment, type, currency, or shift number..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="cash-management-search-input"
              style={{ paddingLeft: '40px' }}
            />
            {searchText && (
              <button 
                className="cash-management-search-clear"
                onClick={() => setSearchText("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="cash-management-table-container">
          <div className="cash-management-table-header">
            <h3>Transaction Details</h3>
            <span className="cash-management-table-count">
              Showing {paginatedItems.length} of {totalItems} transactions
            </span>
          </div>
          
          <div className="cash-management-table-wrapper">
            <table className="cash-management-table">
              <thead>
                <tr>
                  <th>Shift #</th>
                  <th>Comment</th>
                  <th>Type</th>
                  <th>Currency</th>
                  <th>Amount</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item, index) => {
                    const typeLower = item.type || 'other';
                    const amount = parseFloat(item.amount) || 0;
                    const shiftNumber = getShiftNumber(item);
                    const shiftStatus = getShiftStatus(item);
                    
                    return (
                      <tr key={index} className="cash-management-table-row">
                        <td className="cash-management-table-cell">
                          <div className="shift-info-cell">
                            <div className="shift-number-container">
                              <FaHashtag className="shift-number-icon" />
                              <span className="shift-number">
                                {shiftNumber}
                              </span>
                            </div>
                            {shiftStatus !== 'N/A' && (
                              <div className={`shift-status ${shiftStatus.toLowerCase()}`}>
                                {shiftStatus}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="cash-management-table-cell">
                          <span style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.comment || 'No comment'}
                          </span>
                        </td>
                        <td className="cash-management-table-cell">
                          <span 
                            className="cash-management-type-badge" 
                            style={{ 
                              backgroundColor: typeLower.includes('PAY OUT') ? '#fee2e2' : '#dcfce7',
                              color: typeLower.includes('PAY OUT') ? '#dc2626' : '#16a34a'
                            }}
                          >
                            {item.type || 'Other'}
                          </span>
                        </td>
                        <td className="cash-management-table-cell">
                          {item.currency?.name || 'USD'}
                        </td>
                       <td className="cash-management-table-cell">
  <span style={{ 
    color: typeLower.includes('PAY OUT') ? '#dc2626' : '#16a34a',
    fontWeight: '600'
  }}>
    {typeLower.includes('PAY OUT') ? '-' : '+'}
    {item.currency?.name === 'USD' ? '$' : (item.currency?.name || '')}
    {amount.toFixed(2)}
  </span>
</td>
                        <td className="cash-management-table-cell">
                          {item.date ? new Date(item.date).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="cash-management-empty-state">
                      <div className="cash-management-empty-state">
                        <FaReceipt className="cash-management-empty-icon" />
                        <h3 className="cash-management-empty-title">No Transactions Found</h3>
                        <p className="cash-management-empty-description">
                          {searchText ? `No transactions found for "${searchText}"` : "No cash management data available"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="cash-management-pagination">
            <button
              className="cash-management-pagination-btn"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              ←
            </button>
            
            <span className="cash-management-page-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              className="cash-management-pagination-btn"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              →
            </button>
          </div>
        )}
        
        <RemainingTimeFooter />
      </div>
      
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default CashManagementScreen;