import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaSearch,
  FaTimes as FaTimesIcon,
  FaFilter,
  FaPlus,
  FaCalendarAlt,
  FaSortAmountDown,
  FaClipboardList
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import "../Css/InventoryCountsScreen.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import SubscriptionModal from "../components/SubscriptionModal";

const InventoryCountsScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Date Created");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [inventoryCounts, setInventoryCounts] = useState([]);
  const [filteredCounts, setFilteredCounts] = useState([]);
  const [isSubscribedAdmin, setIsSubscribedAdmin] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const navigate = useNavigate();
  const statusDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Fetch email from token
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

  // Fetch subscription status and counts when email is available
  useEffect(() => {
    if (email) {
      fetchAdminSubscriptionStatus();
      fetchInventoryCounts();
    }
  }, [email]);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, sortBy, searchTerm, inventoryCounts]);

  const fetchAdminSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/adminSubscriptionRouter/status?email=${encodeURIComponent(
          userEmail
        )}`
      );

      if (response.ok) {
        const data = await response.json();
        setIsSubscribedAdmin(data.isSubscribedAdmin);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  const fetchInventoryCounts = async () => {
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
        `https://nexuspos.onrender.com/api/inventoryCounts?email=${encodeURIComponent(userEmail)}&status=${statusFilter === 'All' ? 'All' : statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch inventory counts: ${response.status}`);
      }

      const result = await response.json();
      setInventoryCounts(result.data || []);

    } catch (error) {
      console.error("Error fetching inventory counts:", error);
      toast.error("Failed to load inventory counts");
      setInventoryCounts([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleViewCountDetails = async (countId) => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/inventoryCounts/${countId}?email=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        navigate(`/inventory-count/${countId}`, { state: { countData: result.data } });
      } else {
        toast.error('Count not found');
      }
    } catch (error) {
      console.error('Error fetching count details:', error);
      toast.error('Failed to load count details');
    }
  };

  const formatFirebaseDate = (timestamp) => {
    if (!timestamp) return '-';
    
    if (timestamp._seconds) {
      const date = new Date(timestamp._seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return 'Invalid Date';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    let statusClass = '';
    let displayText = status || 'Draft';
    
    if (statusLower.includes('completed')) {
      statusClass = 'inventory-counts-status-completed';
    } else if (statusLower.includes('progress') || statusLower.includes('in progress')) {
      statusClass = 'inventory-counts-status-in-progress';
    } else {
      statusClass = 'inventory-counts-status-draft';
    }
    
    return (
      <span className={`inventory-counts-status-badge ${statusClass}`}>
        {displayText}
      </span>
    );
  };

  const handleCreateCount = () => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    navigate("/create-counts");
  };

  const handleStatusFilterSelect = (status) => {
    setStatusFilter(status);
    setIsStatusDropdownOpen(false);
  };

  const handleSortSelect = (sortOption) => {
    setSortBy(sortOption);
    setIsSortDropdownOpen(false);
  };

  const applyFilters = () => {
    let filtered = [...inventoryCounts];

    // Apply status filter
    if (statusFilter !== "All") {
      const statusLower = statusFilter.toLowerCase();
      filtered = filtered.filter(count => {
        const countStatus = count.status?.toLowerCase() || '';
        if (statusLower === "in progress") {
          return countStatus.includes('progress') || countStatus.includes('in progress');
        }
        return countStatus.includes(statusLower);
      });
    }

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(count => 
        count.countId?.toLowerCase().includes(lowerSearch) ||
        count.notes?.toLowerCase().includes(lowerSearch) ||
        count.status?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "Date Created") {
        const dateA = a.dateCreated?._seconds || 0;
        const dateB = b.dateCreated?._seconds || 0;
        return dateB - dateA; // Newest first
      } else if (sortBy === "Status") {
        const statusA = a.status || "Draft";
        const statusB = b.status || "Draft";
        return statusA.localeCompare(statusB);
      }
      return 0;
    });

    setFilteredCounts(filtered);
  };

  const handleRefresh = async () => {
    await fetchInventoryCounts();
    toast.success("Inventory counts refreshed");
  };

  const handleClickOutside = (event) => {
    if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
      setIsStatusDropdownOpen(false);
    }
    if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
      setIsSortDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const statusOptions = ["All", "Completed", "In Progress", "Draft"];
  const sortOptions = ["Date Created", "Status"];

  return (
    <div className="inventory-counts-container">
      <div className="inventory-counts-sidebar-toggle-wrapper">
        <button 
          className="inventory-counts-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`inventory-counts-content ${isSidebarOpen ? "inventory-counts-content-shifted" : "inventory-counts-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="inventory-counts-toolbar">
          <div className="inventory-counts-toolbar-content">
            <h1 className="inventory-counts-toolbar-title">Inventory Counts</h1>
            <div className="inventory-counts-toolbar-subtitle">
              Track and manage your inventory counts
            </div>
          </div>
          <div className="inventory-counts-toolbar-actions">
            <button 
              className="inventory-counts-refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <IoReload />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

       
        {/* Search and Create Button */}
        <div className="inventory-counts-search-filter">
          <button 
            className="inventory-counts-create-btn"
            onClick={handleCreateCount}
          >
            <FaPlus />
            Create Count
          </button>
          <div className="inventory-counts-search-container">
            <FaSearch style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#94a3b8' 
            }} />
            <input
              type="text"
              placeholder="Search counts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="inventory-counts-search-input"
            />
            {searchTerm && (
              <button 
                className="inventory-counts-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="inventory-counts-table-container">
          <div className="inventory-counts-table-header">
            <h3>Inventory Count Details</h3>
            <span className="inventory-counts-table-count">
              {loading ? 'Loading...' : 
               isRefreshing ? 'Refreshing...' : 
               `Showing ${filteredCounts.length} of ${inventoryCounts.length} counts`}
            </span>
          </div>
          
          <div className="inventory-counts-table-wrapper">
            <table className="inventory-counts-table">
              <thead>
                <tr>
                  <th>Count #</th>
                  <th>Date Created</th>
                  {/* <th>Date Completed</th> */}
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="inventory-counts-loading">
                      <div className="inventory-counts-loading-spinner"></div>
                      <p className="inventory-counts-loading-text">Loading inventory counts...</p>
                    </td>
                  </tr>
                ) : filteredCounts.length > 0 ? (
                  filteredCounts.map((count, index) => (
                    <tr 
                      key={`${count.countId}-${index}`} 
                      className="inventory-counts-table-row"
                      onClick={() => handleViewCountDetails(count.countId)}
                    >
                      <td className="inventory-counts-table-cell">
                        <span style={{ fontWeight: '500' }}>
                          {count.countId || `COUNT-${index + 1}`}
                        </span>
                      </td>
                      <td className="inventory-counts-table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaCalendarAlt style={{ color: '#94a3b8', fontSize: '12px' }} />
                          {formatFirebaseDate(count.dateCreated)}
                        </div>
                      </td>
                      {/* <td className="inventory-counts-table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaCalendarAlt style={{ color: '#94a3b8', fontSize: '12px' }} />
                          {count.status?.toLowerCase().includes('completed') 
                            ? formatFirebaseDate(count.dateCompleted) 
                            : '-'}
                        </div>
                      </td> */}
                      <td className="inventory-counts-table-cell">
                        {renderStatusBadge(count.status)}
                      </td>
                      <td className="inventory-counts-table-cell">
                        {count.notes || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="inventory-counts-empty-state">
                      <FaClipboardList className="inventory-counts-empty-icon" />
                      <h3 className="inventory-counts-empty-title">
                        {searchTerm ? 'No Counts Found' : 'No Inventory Counts'}
                      </h3>
                      <p className="inventory-counts-empty-description">
                        {searchTerm 
                          ? `No counts found for "${searchTerm}"`
                          : statusFilter !== "All"
                          ? `No ${statusFilter.toLowerCase()} counts found`
                          : "Create your first inventory count to get started"}
                      </p>
                      <button 
                        className="inventory-counts-create-btn"
                        onClick={handleCreateCount}
                        style={{ marginTop: '10px' }}
                      >
                        <FaPlus />
                        Create Count
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

export default InventoryCountsScreen;