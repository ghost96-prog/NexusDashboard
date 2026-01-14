import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaSearch,
  FaTimes as FaTimesIcon,
  FaPlus,
  FaCalendarAlt,
  FaClipboardList,
  FaStore,
  FaFileInvoice,
  FaSpinner,
  FaSyncAlt
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import "../Css/GoodsReceivedScreen.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import SubscriptionModal from "../components/SubscriptionModal";

const GoodsReceivedScreen = () => {
  const [grvSidebarOpen, setGrvSidebarOpen] = useState(false);
  const [grvs, setGrvs] = useState([]);
  const [filteredGrvs, setFilteredGrvs] = useState([]);
  const [grvEmail, setGrvEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isSubscribedAdmin, setIsSubscribedAdmin] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  
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
      setGrvEmail(decoded.email);
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, [navigate]);

  useEffect(() => {
    if (grvEmail) {
      fetchAdminSubscriptionStatus();
      fetchGRVs();
    }
  }, [grvEmail]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedStatus, grvs]);

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

  const fetchGRVs = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setShowLoadingModal(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/grv?email=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch GRVs: ${response.status}`);
      }

      const result = await response.json();
      setGrvs(result.data || []);

    } catch (error) {
      console.error("Error fetching GRVs:", error);
      toast.error("Failed to load GRVs");
      setGrvs([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      // Small delay to show loading animation
      setTimeout(() => {
        setShowLoadingModal(false);
      }, 500);
    }
  };

  const applyFilters = () => {
    let filtered = [...grvs];

    if (selectedStatus !== "All") {
      filtered = filtered.filter(grv => grv.status?.toLowerCase() === selectedStatus.toLowerCase());
    }

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(grv => 
        grv.grNumber?.toLowerCase().includes(lowerSearch) ||
        grv.supplierName?.toLowerCase().includes(lowerSearch) ||
        grv.poNumber?.toLowerCase().includes(lowerSearch)
      );
    }

    filtered.sort((a, b) => {
      const dateA = a.dateCreated?._seconds || 0;
      const dateB = b.dateCreated?._seconds || 0;
      return dateB - dateA;
    });

    setFilteredGrvs(filtered);
  };

  const formatFirebaseDate = (timestamp) => {
    if (!timestamp) return '-';
    
    if (timestamp._seconds) {
      const date = new Date(timestamp._seconds * 1000);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    return 'Invalid Date';
  };

  const toggleGrvSidebar = () => {
    setGrvSidebarOpen(!grvSidebarOpen);
  };

  const handleCreateGRV = () => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    navigate("/create-grv");
  };

  const handleViewGRVDetails = (grvId) => {
    navigate(`/grv-details/${grvId}`);
  };

  const renderStatusBadge = (status) => {
    let statusClass = '';
    let displayText = status || 'Draft';
    
    switch(status?.toLowerCase()) {
      case 'completed':
      case 'processed':
        statusClass = 'grv-status-completed';
        break;
      case 'pending':
        statusClass = 'grv-status-pending';
        break;
      case 'draft':
      default:
        statusClass = 'grv-status-draft';
    }
    
    return (
      <span className={`grv-status-badge ${statusClass}`}>
        {displayText}
      </span>
    );
  };

  const handleRefresh = async () => {
    await fetchGRVs();
    toast.success("GRVs refreshed");
  };

  return (
    <div className="grv-main-container">
      <ToastContainer position="bottom-right" />
      
      {/* Loading Modal */}
      {showLoadingModal && (
        <div className="grv-loading-modal">
          <div className="grv-loading-modal-content">
            <div className="grv-loading-spinner-container">
              <FaSyncAlt className="grv-loading-icon" />
            </div>
            <h3 className="grv-loading-title">
              {isRefreshing ? 'Refreshing GRVs...' : 'Loading GRVs...'}
            </h3>
            <p className="grv-loading-message">
              Please wait while we load your goods received vouchers...
            </p>
            <div className="grv-loading-progress">
              <div className="grv-loading-progress-bar"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grv-sidebar-toggle-wrapper">
        <button 
          className="grv-sidebar-toggle"
          onClick={toggleGrvSidebar}
          style={{ left: grvSidebarOpen ? '280px' : '80px' }}
        >
          {grvSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={grvSidebarOpen} toggleSidebar={toggleGrvSidebar} />
      
      <div className={`grv-content ${grvSidebarOpen ? "grv-content-shifted" : "grv-content-collapsed"}`}>
        <div className="grv-toolbar">
          <div className="grv-toolbar-content">
            <h1 className="grv-toolbar-title">Goods Received</h1>
            <div className="grv-toolbar-subtitle">
              Track and manage goods received from suppliers
            </div>
          </div>
          <div className="grv-toolbar-actions">
            <button 
              className="grv-refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing || showLoadingModal}
            >
              {isRefreshing ? (
                <>
                  <FaSpinner className="grv-refresh-spinner" />
                  Refreshing...
                </>
              ) : (
                <>
                  <IoReload />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grv-search-filter">
          <button 
            className="grv-create-btn"
            onClick={handleCreateGRV}
            disabled={showLoadingModal}
          >
            <FaPlus />
            Create GRV
          </button>
          <div className="grv-search-container">
            <FaSearch className="grv-search-icon" />
            <input
              type="text"
              placeholder={showLoadingModal ? "Loading GRVs..." : "Search GRVs..."}
              value={searchTerm}
              onChange={(e) => !showLoadingModal && setSearchTerm(e.target.value)}
              className="grv-search-input"
              disabled={showLoadingModal}
            />
            {searchTerm && !showLoadingModal && (
              <button 
                className="grv-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
            {showLoadingModal && (
              <div className="grv-search-loading">
                <FaSpinner className="grv-search-loading-icon" />
              </div>
            )}
          </div>
        </div>

        <div className="grv-status-filter">
          <button 
            className={`grv-status-filter-btn ${selectedStatus === 'All' ? 'active' : ''}`}
            onClick={() => !showLoadingModal && setSelectedStatus('All')}
            disabled={showLoadingModal}
          >
            All
          </button>
          <button 
            className={`grv-status-filter-btn ${selectedStatus === 'Completed' ? 'active' : ''}`}
            onClick={() => !showLoadingModal && setSelectedStatus('Completed')}
            disabled={showLoadingModal}
          >
            Completed
          </button>
        </div>

        <div className="grv-table-container">
          <div className="grv-table-header">
            <h3>Goods Received Vouchers</h3>
            <span className="grv-table-count">
              {showLoadingModal ? 'Loading...' : 
               loading ? 'Loading...' : 
               isRefreshing ? 'Refreshing...' : 
               `Showing ${filteredGrvs.length} of ${grvs.length} GRVs`}
            </span>
          </div>
          
          <div className="grv-table-wrapper">
            <table className="grv-table">
              <thead>
                <tr>
                  <th>GR Number</th>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Date Received</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {showLoadingModal ? (
                  <tr>
                    <td colSpan="7" className="grv-loading">
                      <div className="grv-loading-spinner"></div>
                      <p className="grv-loading-text">
                        {isRefreshing ? 'Refreshing GRVs...' : 'Loading GRVs...'}
                      </p>
                    </td>
                  </tr>
                ) : filteredGrvs.length > 0 ? (
                  filteredGrvs.map((grv, index) => (
                    <tr 
                      key={`${grv.id}-${index}`} 
                      className="grv-table-row"
                      onClick={() => !showLoadingModal && handleViewGRVDetails(grv.id)}
                    >
                      <td className="grv-table-cell">
                        <span style={{ fontWeight: '500' }}>
                          {grv.grNumber || `GRV-${index + 1}`}
                        </span>
                      </td>
                      <td className="grv-table-cell">
                        {grv.poNumber || '-'}
                      </td>
                      <td className="grv-table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaStore style={{ color: '#94a3b8', fontSize: '12px' }} />
                          {grv.supplierName || '-'}
                        </div>
                      </td>
                      <td className="grv-table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaCalendarAlt style={{ color: '#94a3b8', fontSize: '12px' }} />
                          {formatFirebaseDate(grv.dateReceived)}
                        </div>
                      </td>
                      <td className="grv-table-cell">
                        {renderStatusBadge(grv.status)}
                      </td>
                      <td className="grv-table-cell">
                        {grv.items?.length || 0} items
                      </td>
                      <td className="grv-table-cell">
                        ${(grv.totalValue || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="grv-empty-state">
                      <FaFileInvoice className="grv-empty-icon" />
                      <h3 className="grv-empty-title">
                        {searchTerm ? 'No GRVs Found' : 'No Goods Received Vouchers'}
                      </h3>
                      <p className="grv-empty-description">
                        {searchTerm 
                          ? `No GRVs found for "${searchTerm}"`
                          : selectedStatus !== "All"
                          ? `No ${selectedStatus.toLowerCase()} GRVs found`
                          : "Create your first GRV to get started"}
                      </p>
                      <button 
                        className="grv-create-btn"
                        onClick={handleCreateGRV}
                        style={{ marginTop: '10px' }}
                        disabled={showLoadingModal}
                      >
                        <FaPlus />
                        Create GRV
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
    </div>
  );
};

export default GoodsReceivedScreen;