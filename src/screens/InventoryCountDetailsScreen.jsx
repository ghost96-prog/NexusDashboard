import React, { useState, useEffect } from 'react';
import '../Css/InventoryCountDetailsScreen.css';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaStore,
  FaChevronLeft,
  FaDownload,
  FaFilePdf,
  FaFileCsv,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SubscriptionModal from '../components/SubscriptionModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InventoryCountDetailsScreen = () => {
  const [inventoryDetailsSidebarOpen, setInventoryDetailsSidebarOpen] = useState(false);
  const [inventoryCount, setInventoryCount] = useState(null);
  const [inventoryIsSubscribedAdmin, setInventoryIsSubscribedAdmin] = useState(false);
  const [inventoryShowSubscriptionModal, setInventoryShowSubscriptionModal] = useState(false);
  const [inventoryEmail, setInventoryEmail] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryShowExportDropdown, setInventoryShowExportDropdown] = useState(false);
  const [inventoryCountId, setInventoryCountId] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Load count data from location state or fetch from API
  useEffect(() => {
    if (location.state?.countData) {
      setInventoryCount(location.state.countData);
      setInventoryCountId(location.state.countData.countId || 'IC1001');
    } else if (params.countId) {
      setInventoryCountId(params.countId);
      fetchInventoryCount(params.countId);
    }
  }, [location.state, params.countId]);

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
      setInventoryEmail(decoded.email);
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, [navigate]);

  // Fetch subscription status
  useEffect(() => {
    if (inventoryEmail) {
      fetchInventoryAdminSubscriptionStatus();
    }
  }, [inventoryEmail]);
const formatFirebaseDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let date;
  
  try {
    // Handle Firestore timestamp with _seconds
    if (timestamp && typeof timestamp === 'object') {
      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        // Try to parse as string
        date = new Date(timestamp);
      }
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    }
    
    // Validate the date
    if (!date || isNaN(date.getTime())) {
      console.log('Invalid date input:', timestamp);
      return 'Just now'; // Return a friendly default
    }
    
    // Format the date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
  } catch (error) {
    console.error('Error formatting date:', error, timestamp);
    return 'Recent'; // Return a friendly default
  }
};
  const fetchInventoryAdminSubscriptionStatus = async () => {
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
        setInventoryIsSubscribedAdmin(data.isSubscribedAdmin);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

// Updated fetchInventoryCount function
const fetchInventoryCount = async (countId) => {
  try {
    setInventoryLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No auth token found");
      return;
    }

    const decoded = jwtDecode(token);
    const userEmail = decoded.email;

    const response = await fetch(
      `https://nexuspos.onrender.com/api/inventoryCounts/${countId}?email=${encodeURIComponent(userEmail)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory count: ${response.status}`);
    }

    const result = await response.json();
    
    // If the count is still marked as "Draft", automatically mark it as "Completed"
    // because by the time we view details, it should be completed
    let countData = result.data;
    
    if (countData && countData.status === 'Draft') {
      console.log(`Auto-completing count ${countId} as it should be completed`);
      
      // Mark as completed
      countData.status = 'Completed';
      
      // Set completion date if not already set
      if (!countData.dateCompleted) {
        countData.dateCompleted = new Date();
      }
      
      // Optionally update it on the backend too
      try {
        await fetch(
          `https://nexuspos.onrender.com/api/inventoryCounts/${countId}/complete?email=${encodeURIComponent(userEmail)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log(`Count ${countId} marked as completed on backend`);
      } catch (error) {
        console.warn(`Could not update count status on backend:`, error);
        // Continue anyway - we'll just show it as completed locally
      }
    }
    
    setInventoryCount(countData);

  } catch (error) {
    console.error("Error fetching inventory count:", error);
    setInventoryCount(null);
  } finally {
    setInventoryLoading(false);
  }
};


  const toggleInventoryDetailsSidebar = () => {
    setInventoryDetailsSidebarOpen(!inventoryDetailsSidebarOpen);
  };

  const handleInventoryBack = () => {
    navigate('/counts');
  };

  const handleExportToPDF = () => {
    if (!inventoryIsSubscribedAdmin) {
      setInventoryShowSubscriptionModal(true);
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Inventory Count Details', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Count ID: ${inventoryCount?.countId|| 'N/A'}`, 14, 32);
    doc.text(`Date Created: ${formatFirebaseDate(inventoryCount?.dateCreated) || 'N/A'}`, 14, 38);
    doc.text(`Date Completed: ${formatFirebaseDate(inventoryCount?.dateCompleted) || 'N/A'}`, 14, 44);
    doc.text(`Status: ${inventoryCount?.status || 'N/A'}`, 14, 50);
    
    // Store and Notes
    doc.text(`Store: ${inventoryCount?.storeName || 'N/A'}`, 14, 60);
    doc.text(`Notes: ${inventoryCount?.notes || 'N/A'}`, 14, 66);
    
    // Items Table
    autoTable(doc, {
      startY: 75,
      head: [['Item', 'Expected Stock', 'Counted', 'Difference', 'Price Difference']],
      body: inventoryCount?.items?.map(item => [
        `${item.productName} (SKU: ${item.sku})`,
        item.expectedStock || 0,
        item.counted || 0,
        item.difference || 0,
        `$${Math.abs(item.priceDifference || 0).toFixed(2)} ${item.priceDifference < 0 ? '(-)' : '(+)'}`
      ]) || [],
      foot: [
        [
          'Total',
          '',
          '',
          inventoryCount?.totalDifference || 0,
          `$${Math.abs(inventoryCount?.totalPriceDifference || 0).toFixed(2)} ${inventoryCount?.totalPriceDifference < 0 ? '(-)' : '(+)'}`
        ]
      ]
    });
    
    doc.save(`inventory_count_${inventoryCount?.countId|| 'details'}.pdf`);
    setInventoryShowExportDropdown(false);
    toast.success('PDF exported successfully!');
  };

  const handleExportToCSV = () => {
    if (!inventoryIsSubscribedAdmin) {
      setInventoryShowSubscriptionModal(true);
      return;
    }

    const headers = ['Item', 'SKU', 'Expected Stock', 'Counted', 'Difference', 'Price Difference'];
    const rows = inventoryCount?.items?.map(item => [
      `"${item.productName}"`,
      `"${item.sku}"`,
      `"${item.expectedStock || 0}"`,
      `"${item.counted || 0}"`,
      `"${item.difference || 0}"`,
      `"$${Math.abs(item.priceDifference || 0).toFixed(2)} ${item.priceDifference < 0 ? '(-)' : '(+)'}"`
    ]) || [];

    const csvContent = [
      ['Inventory Count Details'],
      [`Count ID:,${inventoryCount?.countId|| 'N/A'}`],
      [`Date Created:,${formatFirebaseDate(inventoryCount?.dateCreated) || 'N/A'}`],
      [`Date Completed:,${formatFirebaseDate(inventoryCount?.dateCompleted) || 'N/A'}`],
      [`Status:,${inventoryCount?.status || 'N/A'}`],
      [`Store:,${inventoryCount?.storeName || 'N/A'}`],
      [`Notes:,${inventoryCount?.notes || 'N/A'}`],
      [],
      headers,
      ...rows,
      [],
      ['Total', '', '', '', inventoryCount?.totalDifference || 0, `$${Math.abs(inventoryCount?.totalPriceDifference || 0).toFixed(2)} ${inventoryCount?.totalPriceDifference < 0 ? '(-)' : '(+)'}`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_count_${inventoryCount?.countId|| 'details'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setInventoryShowExportDropdown(false);
    toast.success('CSV exported successfully!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'inventory-details-status-completed';
      case 'in progress':
        return 'inventory-details-status-in-progress';
      case 'draft':
        return 'inventory-details-status-draft';
      default:
        return 'inventory-details-status-draft';
    }
  };

  return (
    <div className="inventory-details-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="inventory-details-toolbar">
        {inventoryDetailsSidebarOpen ? (
          <FaTimes className="inventory-details-sidebar-icon" onClick={toggleInventoryDetailsSidebar} />
        ) : (
          <FaBars className="inventory-details-sidebar-icon" onClick={toggleInventoryDetailsSidebar} />
        )}
        <span className="inventory-details-toolbar-title">Inventory Count Details</span>
        <button className="inventory-details-back-button" onClick={handleInventoryBack}>
          <FaChevronLeft /> Back
        </button>
      </div>
      
      <Sidebar isOpen={inventoryDetailsSidebarOpen} toggleSidebar={toggleInventoryDetailsSidebar} />
      
      <div className={`inventory-details-content ${inventoryDetailsSidebarOpen ? 'inventory-details-shifted' : 'inventory-details-collapsed'}`}>
        <div className="inventory-details-container">
          {/* Header Section */}
          <div className="inventory-details-header">
            <div className="inventory-details-title-section">
              <h2>Inventory count details</h2>
              <div className="inventory-details-export-container">
                <button 
                  className="inventory-details-export-btn"
                  onClick={() => setInventoryShowExportDropdown(!inventoryShowExportDropdown)}
                >
                  <FaDownload /> Export
                </button>
                
                {inventoryShowExportDropdown && (
                  <div className="inventory-details-export-dropdown">
                    <button 
                      className="inventory-details-export-option"
                      onClick={handleExportToPDF}
                    >
                      <FaFilePdf /> Download PDF
                    </button>
                    <button 
                      className="inventory-details-export-option"
                      onClick={handleExportToCSV}
                    >
                      <FaFileCsv /> Download CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="inventory-details-id-section">
              <div className="inventory-details-id">
                {inventoryCount?.countId|| 'Loading...'}
              </div>
              <div className={`inventory-details-status ${getStatusBadgeClass(inventoryCount?.status)}`}>
                {inventoryCount?.status || 'Loading'} 
                {inventoryCount?.dateCompleted && ` (${formatFirebaseDate(inventoryCount.dateCompleted)})`}
              </div>
            </div>
          </div>

          {/* Count Details Card */}
          <div className="inventory-details-card">
            <div className="inventory-details-info-grid">
              <div className="inventory-details-info-item">
                <div className="inventory-details-info-label">
                  <FaCalendarAlt /> Date created:
                </div>
                <div className="inventory-details-info-value">
                  {formatFirebaseDate(inventoryCount?.dateCreated) || 'N/A'}
                </div>
              </div>
              
              <div className="inventory-details-info-item">
                <div className="inventory-details-info-label">
                  <FaUser /> Created by:
                </div>
                <div className="inventory-details-info-value">
                  {inventoryCount?.createdBy || 'N/A'}
                </div>
              </div>
              
              <div className="inventory-details-info-item">
                <div className="inventory-details-info-label">
                  <FaStore /> Store:
                </div>
                <div className="inventory-details-info-value">
                  {inventoryCount?.storeName || 'N/A'}
                </div>
              </div>
              
              <div className="inventory-details-info-item full-width">
                <div className="inventory-details-info-label">
                  <FaFileAlt /> Notes:
                </div>
                <div className="inventory-details-info-value">
                  {inventoryCount?.notes || 'No notes'}
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="inventory-details-items-section">
            <div className="inventory-details-items-header">
              <h3>Items</h3>
              <div className="inventory-details-items-count">
                {inventoryCount?.items?.length || 0} item{(inventoryCount?.items?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
            
            {inventoryLoading ? (
              <div className="inventory-details-loading">
                Loading count details...
              </div>
            ) : inventoryCount?.items && inventoryCount.items.length > 0 ? (
              <>
                <div className="inventory-details-items-table-container">
                  <div className="inventory-details-items-table-header">
                    <div className="inventory-details-table-header-cell">Item</div>
                    <div className="inventory-details-table-header-cell">Expected stock</div>
                    <div className="inventory-details-table-header-cell">Counted</div>
                    <div className="inventory-details-table-header-cell">Difference</div>
                    <div className="inventory-details-table-header-cell">Price difference</div>
                  </div>
                  
                  <div className="inventory-details-items-table-body">
                    {inventoryCount.items.map((item, index) => (
                      <div key={index} className="inventory-details-item-row">
                        <div className="inventory-details-item-info">
                          <div className="inventory-details-item-name">{item.productName}</div>
                          <div className="inventory-details-item-details">
                            SKU: {item.sku}
                          </div>
                        </div>
                        <div className="inventory-details-item-expected">{item.expectedStock || 0}</div>
                        <div className="inventory-details-item-counted">{item.counted || 0}</div>
                        <div className={`inventory-details-item-difference ${(item.difference || 0) < 0 ? 'inventory-details-negative' : (item.difference || 0) > 0 ? 'inventory-details-positive' : ''}`}>
                          {item.difference || 0}
                        </div>
                        <div className={`inventory-details-item-price-difference ${(item.priceDifference || 0) < 0 ? 'inventory-details-negative' : (item.priceDifference || 0) > 0 ? 'inventory-details-positive' : ''}`}>
                          ${Math.abs(item.priceDifference || 0).toFixed(2)}
                          {(item.priceDifference || 0) < 0 ? ' (-)' : (item.priceDifference || 0) > 0 ? ' (+)' : ''}
                        </div>
                      </div>
                    ))}
                    
                    {/* Totals Row */}
                    <div className="inventory-details-totals-row">
                      <div className="inventory-details-total-label">Total</div>
                      <div className="inventory-details-total-expected"></div>
                      <div className="inventory-details-total-counted"></div>
                      <div className={`inventory-details-total-difference ${(inventoryCount.totalDifference || 0) < 0 ? 'inventory-details-negative' : (inventoryCount.totalDifference || 0) > 0 ? 'inventory-details-positive' : ''}`}>
                        {inventoryCount.totalDifference || 0}
                      </div>
                      <div className={`inventory-details-total-price-difference ${(inventoryCount.totalPriceDifference || 0) < 0 ? 'inventory-details-negative' : (inventoryCount.totalPriceDifference || 0) > 0 ? 'inventory-details-positive' : ''}`}>
                        ${Math.abs(inventoryCount.totalPriceDifference || 0).toFixed(2)}
                        {(inventoryCount.totalPriceDifference || 0) < 0 ? ' (-)' : (inventoryCount.totalPriceDifference || 0) > 0 ? ' (+)' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="inventory-details-no-items">
                <FaFileAlt className="inventory-details-no-items-icon" />
                <p>No items found in this count.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={inventoryShowSubscriptionModal}
        onClose={() => setInventoryShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default InventoryCountDetailsScreen;