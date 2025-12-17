import React, { useState, useEffect } from 'react';
import Sidebar from '../Components/Sidebar';
import '../Css/InventoryCountsScreen.css';
import {
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SubscriptionModal from '../Components/SubscriptionModal';

const InventoryCountsScreen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inventoryCounts, setInventoryCounts] = useState([]);
  const [isSubscribedAdmin, setIsSubscribedAdmin] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

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

// Updated fetchInventoryCounts function
const fetchInventoryCounts = async () => {
  try {
    setLoading(true);

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
    console.log('API Response:', result);

    // API is the single source of truth
    setInventoryCounts(result.data);

  } catch (error) {
    console.error("Error fetching inventory counts:", error);
    setInventoryCounts([]); // or keep previous state if preferred
  } finally {
    setLoading(false);
  }
};


// Updated handleViewCountDetails function
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
  console.log(response.status);
  
        toast.error('Count not found');
      
    }
  } catch (error) {
    console.error('Error fetching count details:', error);
 
      toast.error('Count not found');
    
  }
};

 // Add this function to your component
const formatFirebaseDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  // Check if it has _seconds (Firestore format)
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

// Use it like this in your JSX:

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || '';
    let statusClass = '';
    
    if (statusLower.includes('completed')) {
      statusClass = 'inventory-counts-status-completed';
    } else if (statusLower.includes('progress') || statusLower.includes('in progress')) {
      statusClass = 'inventory-counts-status-in-progress';
    } else if (statusLower.includes('draft')) {
      statusClass = 'inventory-counts-status-draft';
    } else {
      statusClass = 'inventory-counts-status-draft';
    }
    
    return <span className={`inventory-counts-status-badge ${statusClass}`}>{status}</span>;
  };

  const handleCreateCount = () => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    navigate("/create-counts");
  };


  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const filteredCounts = statusFilter === 'All' 
    ? inventoryCounts 
    : inventoryCounts.filter(count => 
        statusFilter === 'Completed' ? count.status?.toLowerCase().includes('completed') :
        statusFilter === 'In Progress' ? count.status?.toLowerCase().includes('progress') || count.status?.toLowerCase().includes('in progress') :
        count.status?.toLowerCase().includes(statusFilter.toLowerCase())
      );

  return (
    <div className="mainContainerInventory">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="toolBarrInventory">
        {isSidebarOpen ? (
          <FaTimes className="sidebar-icon" onClick={toggleSidebar} />
        ) : (
          <FaBars className="sidebar-icon" onClick={toggleSidebar} />
        )}
        <span className="toolBarTitle">Inventory Count</span>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`content ${isSidebarOpen ? 'shifted' : 'collapsed'}`}>
        <div className="inventory-counts-buttonsContainer">
          <div className="inventory-counts-addButtonContainer">
            <button 
              className="inventory-counts-createButton"               
              onClick={handleCreateCount}
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              ADD INVENTORY COUNT
            </button>
          </div>
        </div>

        {/* Main Container */}
        <div className="inventory-counts-container">
          <div className="inventory-counts-subContainer">
            {/* Info Section */}
            <div className="inventory-counts-infoSection">
              <h3>Inventory counts</h3>
            </div>

            {/* Filter Section */}
            {/* <div className="inventory-counts-filterSection">
              <div className="inventory-counts-filterLabel">Filter by status:</div>
              <div className="inventory-counts-filterButtons">
                <button 
                  className={`inventory-counts-filterBtn ${statusFilter === 'All' ? 'active' : ''}`}
                  onClick={() => handleStatusFilter('All')}
                >
                  All
                </button>
                <button 
                  className={`inventory-counts-filterBtn ${statusFilter === 'Completed' ? 'active' : ''}`}
                  onClick={() => handleStatusFilter('Completed')}
                >
                  Completed
                </button>
                <button 
                  className={`inventory-counts-filterBtn ${statusFilter === 'In Progress' ? 'active' : ''}`}
                  onClick={() => handleStatusFilter('In Progress')}
                >
                  In Progress
                </button>
                <button 
                  className={`inventory-counts-filterBtn ${statusFilter === 'Draft' ? 'active' : ''}`}
                  onClick={() => handleStatusFilter('Draft')}
                >
                  Draft
                </button>
              </div>
            </div> */}

            {/* Add Button for mobile */}
            <div className="inventory-counts-addButtonMobile">
              <button className="inventory-counts-createButton" onClick={handleCreateCount}>
                <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                ADD INVENTORY COUNT
              </button>
            </div>

            {/* Table Container */}
            <div className="inventory-counts-tableContainer">
              <div className="inventory-counts-receiptHeader">
                <div className="inventory-counts-headerItem">Inventory count #</div>
                <div className="inventory-counts-headerItem">Date created</div>
                <div className="inventory-counts-headerItem">Date completed</div>
                <div className="inventory-counts-headerItem">Status</div>
                <div className="inventory-counts-headerItem">Notes</div>
              </div>

              {/* Inventory Counts List */}
              <div className="inventory-counts-itemsList">
                {loading ? (
                  <div className="inventory-counts-loading">
                    <div className="inventory-counts-loading-spinner"></div>
                    <p className="inventory-counts-loading-text">Loading counts...</p>
                  </div>
                ) : filteredCounts.length > 0 ? (
                  filteredCounts.map((count) => (
                    <div 
                      key={count.countId} 
                      className="inventory-counts-item"
                      onClick={() => handleViewCountDetails(count.countId)}
                    >
                      <div className="inventory-counts-itemDetails">
                        <div className="inventory-counts-itemDetail" data-label="Inventory count #">
                          {count.countId}
                        </div>
                        <div className="inventory-counts-itemDetail" data-label="Date created">
                          {formatFirebaseDate(count.dateCreated)}
                        </div>
                        <div className="inventory-counts-itemDetail" data-label="Date completed">
                          {formatFirebaseDate(count.dateCompleted)}
                        </div>
                        <div className="inventory-counts-itemDetail" data-label="Status">
                          {renderStatusBadge(count.status)}
                        </div>
                        <div className="inventory-counts-itemDetail" data-label="Notes">
                          {count.notes || '-'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="inventory-counts-empty">
                    <div className="inventory-counts-empty-icon">📊</div>
                    <p className="inventory-counts-empty-text">
                      {statusFilter !== 'All' 
                        ? `No ${statusFilter.toLowerCase()} counts found` 
                        : 'No inventory counts found'}
                    </p>
                    <p className="inventory-counts-empty-subtext">
                      Create your first inventory count to get started
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with counts info */}
            <div className="inventory-counts-footer">
              <div className="inventory-counts-paginationInfo">
                Showing {filteredCounts.length} of {inventoryCounts.length} counts
              </div>
              <div className="inventory-counts-totalInfo">
                Total: {inventoryCounts.length} count{inventoryCounts.length !== 1 ? 's' : ''}
              </div>
            </div>
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

export default InventoryCountsScreen;