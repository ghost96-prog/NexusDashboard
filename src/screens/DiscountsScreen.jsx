import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import {
  FaBars,
  FaTimes,
  FaStore,
  FaDownload,
  FaSearch,
  FaTimes as FaTimesIcon,
  FaFileAlt,
  FaBox,
  FaFilter,
  FaPlus,
  FaTag,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimesCircle,
  FaPercentage,
  FaMoneyBill
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import "../Css/DiscountsScreen.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useNavigate } from "react-router-dom";
import RemainingTimeFooter from "../components/RemainingTimeFooter";
import SubscriptionModal from "../components/SubscriptionModal";

const DiscountsScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [displayDiscounts, setDisplayDiscounts] = useState([]);
  const [hasInitialData, setHasInitialData] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [newDiscountName, setNewDiscountName] = useState("");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newDiscountType, setNewDiscountType] = useState("percentage");
  const [editingDiscountName, setEditingDiscountName] = useState("");
  const [editingDiscountValue, setEditingDiscountValue] = useState("");
  const [editingDiscountType, setEditingDiscountType] = useState("percentage");
  const [isSubscribedAdmin, setIsSubscribedAdmin] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const navigate = useNavigate();
  const createNameInputRef = useRef(null);
  const editNameInputRef = useRef(null);

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
      fetchAdminSubscriptionStatus();
      fetchDiscounts();
    }
  }, [email]);

  useEffect(() => {
    if (discounts.length > 0) {
      const filtered = applyFilters(discounts);
      setDisplayDiscounts(filtered);
      setHasInitialData(true);
    }
  }, [discounts, searchTerm]);

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

  const fetchDiscounts = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/discountRouter/discounts?email=${encodeURIComponent(
          userEmail
        )}`
      );
      
      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error(`Error: ${"User not found or invalid email."}`);
        setIsRefreshing(false);
        return;
      }
      
      const data = await response.json();
      const sortedDiscounts = data.data.sort((a, b) => 
        a.discountName.localeCompare(b.discountName)
      );
      setDiscounts(sortedDiscounts);
      setIsRefreshing(false);
    } catch (error) {
      setIsRefreshing(false);
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching discounts.");
      }
      console.error("Error fetching discounts:", error);
    }
  };

  const onRefresh = async () => {
    NProgress.start();
    try {
      await fetchDiscounts();
    } catch (error) {
      console.error(error);
    } finally {
      NProgress.done();
    }
  };

  const applyFilters = (discountsList) => {
    return discountsList.filter(discount => {
      if (searchTerm.trim() !== "") {
        const lowerSearch = searchTerm.toLowerCase();
        return discount.discountName?.toLowerCase().includes(lowerSearch);
      }
      return true;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCreateDiscount = () => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    setNewDiscountName("");
    setNewDiscountValue("");
    setNewDiscountType("percentage");
    setShowCreateModal(true);
    setTimeout(() => {
      if (createNameInputRef.current) {
        createNameInputRef.current.focus();
      }
    }, 100);
  };

  const handleEditDiscount = (discount) => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    setSelectedDiscount(discount);
    setEditingDiscountName(discount.discountName);
    setEditingDiscountValue(discount.discountValue);
    setEditingDiscountType(discount.discountType || "percentage");
    setShowEditModal(true);
    setTimeout(() => {
      if (editNameInputRef.current) {
        editNameInputRef.current.focus();
      }
    }, 100);
  };

  const handleDeleteDiscount = async (discountId) => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }

    if (!window.confirm("Are you sure you want to delete this discount?")) {
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/discountRouter/discounts/${encodeURIComponent(discountId)}?email=${encodeURIComponent(userEmail)}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Discount deleted successfully");
        // Remove from local state
        setDiscounts(prev => prev.filter(disc => disc.discountId !== discountId));
      } else {
        const data = await response.json();
        toast.error("Error deleting discount: " + data.error);
      }
    } catch (error) {
      toast.error("Error deleting discount");
      console.error("Error deleting discount:", error);
    } finally {
      setDeleting(false);
    }
  };

  const saveNewDiscount = async () => {
    if (!newDiscountName.trim()) {
      toast.error("Please enter a discount name");
      return;
    }

    if (!newDiscountValue.trim() || isNaN(parseFloat(newDiscountValue))) {
      toast.error("Please enter a valid discount value");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const discountId = generateDiscountId();
      const discountValue = newDiscountType === "percentage" 
        ? parseFloat(newDiscountValue).toFixed(2)
        : parseFloat(newDiscountValue).toFixed(2);

      const newDiscount = {
        discountId: discountId,
        discountName: newDiscountName.toUpperCase(),
        discountValue: discountValue,
        discountType: newDiscountType,
      };

      const response = await fetch(
        `https://nexuspos.onrender.com/api/discountRouter/discount-updates?email=${encodeURIComponent(userEmail)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newDiscount),
        }
      );

      if (response.ok) {
        toast.success("Discount created successfully");
        setShowCreateModal(false);
        setNewDiscountName("");
        setNewDiscountValue("");
        // Add to local state
        setDiscounts(prev => [...prev, newDiscount].sort((a, b) => 
          a.discountName.localeCompare(b.discountName)
        ));
      } else {
        const data = await response.json();
        toast.error("Error creating discount: " + data.error);
      }
    } catch (error) {
      toast.error("Error creating discount");
      console.error("Error creating discount:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveEditedDiscount = async () => {
    if (!editingDiscountName.trim()) {
      toast.error("Please enter a discount name");
      return;
    }

    if (!editingDiscountValue.trim() || isNaN(parseFloat(editingDiscountValue))) {
      toast.error("Please enter a valid discount value");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const discountValue = editingDiscountType === "percentage" 
        ? parseFloat(editingDiscountValue).toFixed(2)
        : parseFloat(editingDiscountValue).toFixed(2);

      const updatedDiscount = {
        discountId: selectedDiscount.discountId,
        discountName: editingDiscountName.toUpperCase(),
        discountValue: discountValue,
        discountType: editingDiscountType,
      };

      const response = await fetch(
        `https://nexuspos.onrender.com/api/discountRouter/discount-updates?email=${encodeURIComponent(userEmail)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedDiscount),
        }
      );

      if (response.ok) {
        toast.success("Discount updated successfully");
        setShowEditModal(false);
        // Update in local state
        setDiscounts(prev => 
          prev.map(disc => 
            disc.discountId === selectedDiscount.discountId 
              ? { ...updatedDiscount }
              : disc
          ).sort((a, b) => a.discountName.localeCompare(b.discountName))
        );
      } else {
        const data = await response.json();
        toast.error("Error updating discount: " + data.error);
      }
    } catch (error) {
      toast.error("Error updating discount");
      console.error("Error updating discount:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomString = (length) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const generateDiscountId = () => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
    const hours = String(currentDate.getHours() % 12 || 12).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");
    const ampm = currentDate.getHours() >= 12 ? "PM" : "AM";
    const randomId = generateRandomString(16);
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}-${randomId}`;
  };

  const handleDiscountValueChange = (value, setter) => {
    // Allow only numbers and one decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setter(numericValue);
  };

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      if (type === "create") {
        saveNewDiscount();
      } else if (type === "edit") {
        saveEditedDiscount();
      }
    } else if (e.key === "Escape") {
      if (type === "create") {
        setShowCreateModal(false);
      } else if (type === "edit") {
        setShowEditModal(false);
      }
    }
  };

  const formatDiscountValue = (discount) => {
    if (discount.discountType === "amount") {
      return `$${parseFloat(discount.discountValue).toFixed(2)}`;
    } else {
      return `${parseFloat(discount.discountValue).toFixed(2)}%`;
    }
  };

  return (
    <div className="discounts-container">
      <div className="discounts-sidebar-toggle-wrapper">
        <button 
          className="discounts-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`discounts-content ${isSidebarOpen ? "discounts-content-shifted" : "discounts-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="discounts-toolbar">
          <div className="discounts-toolbar-content">
            <h1 className="discounts-toolbar-title">Discounts</h1>
            <div className="discounts-toolbar-subtitle">
              Manage your discount offers and promotions
            </div>
          </div>
          {/* <div className="discounts-toolbar-actions">
            <button 
              className="discounts-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <IoReload />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div> */}
        </div>

        {/* Search and Create Button */}
        <div className="discounts-search-filter">
          <div className="discounts-search-container">
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search discounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="discounts-search-input"
              style={{ paddingLeft: '40px' }}
            />
            {searchTerm && (
              <button 
                className="discounts-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
          
          <button 
            className="discounts-create-btn"
            onClick={handleCreateDiscount}
          >
            <FaPlus />
            Create Discount
          </button>
        </div>

        {/* Table Container */}
      <div className="discounts-table-container">
  <div className="discounts-table-header">
    <h3>Discount List</h3>
    <span className="discounts-table-count">
      {isRefreshing ? 'Refreshing...' : 
        hasInitialData ? `Showing ${displayDiscounts.length} discounts` : 
        'Loading discounts...'}
    </span>
  </div>
  
  <div className="discounts-table-wrapper">
    <table className="discounts-table">
      <thead>
        <tr>
          <th>Discount Name</th>
          <th>Type</th>
          <th>Value</th>
          <th>EDIT</th>
        </tr>
      </thead>
      <tbody>
        {displayDiscounts.length > 0 ? (
          displayDiscounts.map((discount, index) => {
            return (
              <tr 
                key={`${discount.discountId}-${index}`} 
                className="discounts-table-row"
                onClick={(e) => {
                  // Check if the click was on any button
                  if (!e.target.closest('.discounts-edit-btn') && !e.target.closest('.discounts-delete-btn')) {
                    handleEditDiscount(discount);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <td className="discounts-table-cell">
                  <div className="discounts-name-cell">
                    <FaTag className="discounts-tag-icon" />
                    <span style={{ fontWeight: '500' }}>
                      {discount.discountName}
                    </span>
                  </div>
                </td>
                <td className="discounts-table-cell">
                  <span className={`discounts-type-badge ${discount.discountType === 'percentage' ? 'discounts-type-percentage' : 'discounts-type-amount'}`}>
                    {discount.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                  </span>
                </td>
                <td className="discounts-table-cell">
                  <span className="discounts-value">
                    {formatDiscountValue(discount)}
                  </span>
                </td>
                <td className="discounts-table-cell">
                  <div className="discounts-actions">
                    <button 
                      className="discounts-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click from firing
                        handleEditDiscount(discount);
                      }}
                      title="Edit Discount"
                    >
                      <FaEdit />
                    </button>
                    {/* <button 
                      className="discounts-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click from firing
                        handleDeleteDiscount(discount.discountId);
                      }}
                      title="Delete Discount"
                      disabled={deleting}
                    >
                      <FaTrash />
                    </button> */}
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="4" className="discounts-empty-state">
              <FaBox className="discounts-empty-icon" />
              <h3 className="discounts-empty-title">
                {isRefreshing ? 'Refreshing discounts...' : 
                  hasInitialData ? 'No Discounts Found' : 
                  'Loading discounts...'}
              </h3>
              <p className="discounts-empty-description">
                {searchTerm ? `No discounts found for "${searchTerm}"` : 
                  hasInitialData ? "No discounts available. Create your first discount!" :
                  "Please wait while we load your discounts..."}
              </p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
        <RemainingTimeFooter />
      </div>

      {/* Create Discount Modal */}
      {showCreateModal && (
        <div className="discounts-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="discounts-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="discounts-modal-header">
              <h2 className="discounts-modal-title">
                <FaPlus className="discounts-modal-icon" />
                Create New Discount
              </h2>
              <button 
                className="discounts-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="discounts-modal-body">
              <div className="discounts-modal-input-group">
                <label htmlFor="discountName">Discount Name</label>
                <input
                  ref={createNameInputRef}
                  id="discountName"
                  type="text"
                  value={newDiscountName}
                  onChange={(e) => setNewDiscountName(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, "create")}
                  placeholder="Enter discount name"
                  className="discounts-modal-input"
                  maxLength={50}
                  disabled={loading}
                />
                <div className="discounts-modal-hint">
                  Max 50 characters. Will be converted to uppercase.
                </div>
              </div>
              
              <div className="discounts-modal-row">
                <div className="discounts-modal-input-group" style={{ flex: 2 }}>
                  <label htmlFor="discountValue">
                    {newDiscountType === "percentage" ? "Percentage Value" : "Amount"}
                  </label>
                  <input
                    id="discountValue"
                    type="text"
                    value={newDiscountValue}
                    onChange={(e) => handleDiscountValueChange(e.target.value, setNewDiscountValue)}
                    onKeyDown={(e) => handleKeyPress(e, "create")}
                    placeholder={newDiscountType === "percentage" ? "Enter percentage" : "Enter amount"}
                    className="discounts-modal-input"
                    disabled={loading}
                  />
                  <div className="discounts-modal-hint">
                    {newDiscountType === "percentage" ? "Enter percentage (e.g., 10.50 for 10.5%)" : "Enter amount (e.g., 5.00 for $5.00)"}
                  </div>
                </div>
                
                <div className="discounts-modal-input-group" style={{ flex: 1 }}>
                  <label>Type</label>
                  <div className="discounts-type-selector">
                    <button
                      type="button"
                      className={`discounts-type-btn ${newDiscountType === "percentage" ? "discounts-type-active" : ""}`}
                      onClick={() => setNewDiscountType("percentage")}
                      disabled={loading}
                    >
                      <FaPercentage />
                      %
                    </button>
                    {/* <button
                      type="button"
                      className={`discounts-type-btn ${newDiscountType === "amount" ? "discounts-type-active" : ""}`}
                      onClick={() => setNewDiscountType("amount")}
                      disabled={loading}
                    >
                      <FaMoneyBill />
                      $
                    </button> */}
                  </div>
                </div>
              </div>
              
              <div className="discounts-modal-actions">
                <button 
                  className="discounts-modal-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                >
                  <FaTimesCircle />
                  Cancel
                </button>
                <button 
                  className="discounts-modal-save"
                  onClick={saveNewDiscount}
                  disabled={loading || !newDiscountName.trim() || !newDiscountValue.trim()}
                >
                  {loading ? (
                    <>
                      <div className="discounts-loading-spinner"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Create Discount
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Discount Modal */}
      {showEditModal && selectedDiscount && (
        <div className="discounts-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="discounts-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="discounts-modal-header">
              <h2 className="discounts-modal-title">
                <FaEdit className="discounts-modal-icon" />
                Edit Discount
              </h2>
              <button 
                className="discounts-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="discounts-modal-body">
              <div className="discounts-modal-input-group">
                <label htmlFor="editDiscountName">Discount Name</label>
                <input
                  ref={editNameInputRef}
                  id="editDiscountName"
                  type="text"
                  value={editingDiscountName}
                  onChange={(e) => setEditingDiscountName(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, "edit")}
                  placeholder="Enter discount name"
                  className="discounts-modal-input"
                  maxLength={50}
                  disabled={loading}
                />
                <div className="discounts-modal-hint">
                  Max 50 characters. Will be converted to uppercase.
                </div>
              </div>
              
              <div className="discounts-modal-row">
                <div className="discounts-modal-input-group" style={{ flex: 2 }}>
                  <label htmlFor="editDiscountValue">
                    {editingDiscountType === "percentage" ? "Percentage Value" : "Amount"}
                  </label>
                  <input
                    id="editDiscountValue"
                    type="text"
                    value={editingDiscountValue}
                    onChange={(e) => handleDiscountValueChange(e.target.value, setEditingDiscountValue)}
                    onKeyDown={(e) => handleKeyPress(e, "edit")}
                    placeholder={editingDiscountType === "percentage" ? "Enter percentage" : "Enter amount"}
                    className="discounts-modal-input"
                    disabled={loading}
                  />
                  <div className="discounts-modal-hint">
                    {editingDiscountType === "percentage" ? "Enter percentage (e.g., 10.50 for 10.5%)" : "Enter amount (e.g., 5.00 for $5.00)"}
                  </div>
                </div>
                
                <div className="discounts-modal-input-group" style={{ flex: 1 }}>
                  <label>Type</label>
                  <div className="discounts-type-selector">
                    <button
                      type="button"
                      className={`discounts-type-btn ${editingDiscountType === "percentage" ? "discounts-type-active" : ""}`}
                      onClick={() => setEditingDiscountType("percentage")}
                      disabled={loading}
                    >
                      <FaPercentage />
                      %
                    </button>
                    {/* <button
                      type="button"
                      className={`discounts-type-btn ${editingDiscountType === "amount" ? "discounts-type-active" : ""}`}
                      onClick={() => setEditingDiscountType("amount")}
                      disabled={loading}
                    >
                      <FaMoneyBill />
                      $
                    </button> */}
                  </div>
                </div>
              </div>
              
              <div className="discounts-modal-actions">
                <button 
                  className="discounts-modal-cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={loading}
                >
                  <FaTimesCircle />
                  Cancel
                </button>
                <button 
                  className="discounts-modal-save"
                  onClick={saveEditedDiscount}
                  disabled={loading || !editingDiscountName.trim() || !editingDiscountValue.trim()}
                >
                  {loading ? (
                    <>
                      <div className="discounts-loading-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default DiscountsScreen;