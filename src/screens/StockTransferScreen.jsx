import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaSearch,
  FaTimes as FaTimesIcon,
  FaPlus,
  FaCalendarAlt,
  FaExchangeAlt,
  FaStore
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import "../Css/StockTransferScreen.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import SubscriptionModal from "../components/SubscriptionModal";

const StockTransferScreen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isSubscribedAdmin, setIsSubscribedAdmin] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setEmail(decoded.email);
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, [navigate]);

  useEffect(() => {
    if (email) {
      fetchAdminSubscriptionStatus();
      fetchTransfers();
    }
  }, [email]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedStatus, transfers]);

  const fetchAdminSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/adminSubscriptionRouter/status?email=${encodeURIComponent(userEmail)}`
      );

      if (response.ok) {
        const data = await response.json();
        setIsSubscribedAdmin(data.isSubscribedAdmin);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/stock-transfer?email=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transfers: ${response.status}`);
      }

      const result = await response.json();
      setTransfers(result.data || []);

    } catch (error) {
      console.error("Error fetching transfers:", error);
      toast.error("Failed to load transfers");
      setTransfers([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transfers];

    if (selectedStatus !== "All") {
      filtered = filtered.filter(transfer => transfer.status?.toLowerCase() === selectedStatus.toLowerCase());
    }

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(transfer => 
        transfer.transferNumber?.toLowerCase().includes(lowerSearch) ||
        transfer.toStoreName?.toLowerCase().includes(lowerSearch) ||
        transfer.fromStoreName?.toLowerCase().includes(lowerSearch) ||
        transfer.reference?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort by date - handle both string and Firestore timestamp formats
    filtered.sort((a, b) => {
      const dateA = getDateValue(a.dateCreated);
      const dateB = getDateValue(b.dateCreated);
      return dateB - dateA; // Sort newest first
    });

    setFilteredTransfers(filtered);
  };

  // Helper function to get date value from different formats
  const getDateValue = (dateField) => {
    if (!dateField) return 0;
    
    // If it's a Firestore timestamp object
    if (dateField._seconds) {
      return dateField._seconds * 1000;
    }
    
    // If it's a string
    if (typeof dateField === 'string') {
      return new Date(dateField).getTime();
    }
    
    // If it has toDate method
    if (dateField.toDate && typeof dateField.toDate === 'function') {
      return dateField.toDate().getTime();
    }
    
    // Try to parse as Date
    try {
      return new Date(dateField).getTime();
    } catch (error) {
      return 0;
    }
  };

  const formatFirebaseDate = (dateField) => {
    if (!dateField) return '-';
    
    try {
      let date;
      
      // Handle Firestore timestamp
      if (dateField._seconds) {
        date = new Date(dateField._seconds * 1000);
      } 
      // Handle string date
      else if (typeof dateField === 'string') {
        date = new Date(dateField);
      }
      // Handle Firestore Timestamp object
      else if (dateField.toDate && typeof dateField.toDate === 'function') {
        date = dateField.toDate();
      }
      // Try to parse as Date
      else {
        date = new Date(dateField);
      }
      
      // Check if date is valid
      if (!date || isNaN(date.getTime())) {
        console.warn('Invalid date field:', dateField);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date field:', dateField);
      return 'Invalid Date';
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCreateTransfer = () => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    navigate("/create-stock-transfer");
  };

  const handleViewTransferDetails = (transferId) => {
    navigate(`/stock-transfer-details/${transferId}`);
  };

  const renderStatusBadge = (status) => {
    let statusClass = '';
    let displayText = status || 'Pending';
    
    switch(status?.toLowerCase()) {
      case 'completed':
      case 'transferred':
        statusClass = 'transfer-status-completed';
        break;
      case 'pending':
      case 'in-progress':
        statusClass = 'transfer-status-pending';
        break;
      case 'cancelled':
        statusClass = 'transfer-status-cancelled';
        break;
      default:
        statusClass = 'transfer-status-pending';
    }
    
    return (
      <span className={`transfer-status-badge ${statusClass}`}>
        {displayText}
      </span>
    );
  };

  const handleRefresh = async () => {
    await fetchTransfers();
    toast.success("Transfers refreshed");
  };

  return (
    <div className="transfer-main-container">
      <div className="transfer-sidebar-toggle-wrapper">
        <button 
          className="transfer-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: sidebarOpen ? '280px' : '80px' }}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`transfer-content ${sidebarOpen ? "transfer-content-shifted" : "transfer-content-collapsed"}`}>
        <div className="transfer-toolbar">
          <div className="transfer-toolbar-content">
            <h1 className="transfer-toolbar-title">Stock Transfers</h1>
            <div className="transfer-toolbar-subtitle">
              Transfer stock between your stores
            </div>
          </div>
          <div className="transfer-toolbar-actions">
            <button 
              className="transfer-refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <IoReload />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="transfer-search-filter">
          <button 
            className="transfer-create-btn"
            onClick={handleCreateTransfer}
          >
            <FaPlus />
            Create Transfer
          </button>
          <div className="transfer-search-container">
            <FaSearch className="transfer-search-icon" />
            <input
              type="text"
              placeholder="Search transfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="transfer-search-input"
            />
            {searchTerm && (
              <button 
                className="transfer-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
        </div>

        <div className="transfer-status-filter">
          <button 
            className={`transfer-status-filter-btn ${selectedStatus === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('All')}
          >
            All
          </button>
          <button 
            className={`transfer-status-filter-btn ${selectedStatus === 'Completed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('Completed')}
          >
            Completed
          </button>
          {/* <button 
            className={`transfer-status-filter-btn ${selectedStatus === 'Pending' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('Pending')}
          >
            Pending
          </button>
          <button 
            className={`transfer-status-filter-btn ${selectedStatus === 'Cancelled' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('Cancelled')}
          >
            Cancelled
          </button> */}
        </div>

        <div className="transfer-table-container">
          <div className="transfer-table-header">
            <h3>Stock Transfers</h3>
            <span className="transfer-table-count">
              {loading ? 'Loading...' : 
               isRefreshing ? 'Refreshing...' : 
               `Showing ${filteredTransfers.length} of ${transfers.length} transfers`}
            </span>
          </div>
          
          <div className="transfer-table-wrapper">
            <table className="transfer-table">
              <thead>
                <tr>
                  <th>Transfer #</th>
                  <th>From Store</th>
                  <th>To Store</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total Value</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="transfer-loading">
                      <div className="transfer-loading-spinner"></div>
                      <p className="transfer-loading-text">Loading transfers...</p>
                    </td>
                  </tr>
                ) : filteredTransfers.length > 0 ? (
                  filteredTransfers.map((transfer, index) => (
                    <tr 
                      key={`${transfer.id}-${index}`} 
                      className="transfer-table-row"
                      onClick={() => handleViewTransferDetails(transfer.id)}
                    >
                      <td className="transfer-table-cell">
                        <span style={{ fontWeight: '500' }}>
                          {transfer.transferNumber || `TRF-${index + 1}`}
                        </span>
                      </td>
                      <td className="transfer-table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaStore style={{ color: '#94a3b8', fontSize: '12px' }} />
                          {transfer.fromStoreName || '-'}
                        </div>
                      </td>
                      <td className="transfer-table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaStore style={{ color: '#94a3b8', fontSize: '12px' }} />
                          {transfer.toStoreName || '-'}
                        </div>
                      </td>
                      <td className="transfer-table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaCalendarAlt style={{ color: '#94a3b8', fontSize: '12px' }} />
                          {formatFirebaseDate(transfer.dateCreated)}
                        </div>
                      </td>
                      <td className="transfer-table-cell">
                        {renderStatusBadge(transfer.status)}
                      </td>
                      <td className="transfer-table-cell">
                        {transfer.items?.length || 0} items
                      </td>
                      <td className="transfer-table-cell">
                        ${(transfer.totalValue || 0).toFixed(2)}
                      </td>
                      <td className="transfer-table-cell">
                        {transfer.reference || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="transfer-empty-state">
                      <FaExchangeAlt className="transfer-empty-icon" />
                      <h3 className="transfer-empty-title">
                        {searchTerm ? 'No Transfers Found' : 'No Stock Transfers'}
                      </h3>
                      <p className="transfer-empty-description">
                        {searchTerm 
                          ? `No transfers found for "${searchTerm}"`
                          : selectedStatus !== "All"
                          ? `No ${selectedStatus.toLowerCase()} transfers found`
                          : "Create your first stock transfer to get started"}
                      </p>
                      <button 
                        className="transfer-create-btn"
                        onClick={handleCreateTransfer}
                        style={{ marginTop: '10px' }}
                      >
                        <FaPlus />
                        Create Transfer
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default StockTransferScreen;