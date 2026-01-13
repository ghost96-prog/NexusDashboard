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
  FaFolder,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimesCircle
} from "react-icons/fa";
import { IoReload } from "react-icons/io5";
import "../Css/CategoriesScreen.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useNavigate } from "react-router-dom";
import RemainingTimeFooter from "../components/RemainingTimeFooter";
import SubscriptionModal from "../components/SubscriptionModal";

const CategoriesScreen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState(null);
  const [categories, setCategories] = useState([]);
  const [displayCategories, setDisplayCategories] = useState([]);
  const [hasInitialData, setHasInitialData] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [isSubscribedAdmin, setIsSubscribedAdmin] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const navigate = useNavigate();
  const createInputRef = useRef(null);
  const editInputRef = useRef(null);

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
      fetchCategories();
    }
  }, [email]);

  useEffect(() => {
    if (categories.length > 0) {
      const filtered = applyFilters(categories);
      setDisplayCategories(filtered);
      setHasInitialData(true);
    }
  }, [categories, searchTerm]);

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

  const fetchCategories = async () => {
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
        `https://nexuspos.onrender.com/api/categoryRouter/categories?email=${encodeURIComponent(
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
      if (data.success) {
        const sortedCategories = data.data.sort((a, b) => 
          a.categoryName.localeCompare(b.categoryName)
        );
        setCategories(sortedCategories);
      } else {
        toast.error("Error fetching categories");
      }
      setIsRefreshing(false);
    } catch (error) {
      setIsRefreshing(false);
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error("An error occurred while fetching categories.");
      }
      console.error("Error fetching categories:", error);
    }
  };

  const onRefresh = async () => {
    NProgress.start();
    try {
      await fetchCategories();
    } catch (error) {
      console.error(error);
    } finally {
      NProgress.done();
    }
  };

  const applyFilters = (categoriesList) => {
    return categoriesList.filter(category => {
      if (searchTerm.trim() !== "") {
        const lowerSearch = searchTerm.toLowerCase();
        return category.categoryName?.toLowerCase().includes(lowerSearch);
      }
      return true;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCreateCategory = () => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    setNewCategoryName("");
    setShowCreateModal(true);
    setTimeout(() => {
      if (createInputRef.current) {
        createInputRef.current.focus();
      }
    }, 100);
  };

  const handleEditCategory = (category) => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }
    setSelectedCategory(category);
    setEditingCategoryName(category.categoryName);
    setShowEditModal(true);
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 100);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!isSubscribedAdmin) {
      setShowSubscriptionModal(true);
      return;
    }

    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onnder.com/api/categoryRouter/categories/${encodeURIComponent(categoryId)}?email=${encodeURIComponent(userEmail)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Category deleted successfully");
        // Remove from local state
        setCategories(prev => prev.filter(cat => cat.categoryId !== categoryId));
      } else {
        toast.error("Error deleting category: " + data.error);
      }
    } catch (error) {
      toast.error("Error deleting category");
      console.error("Error deleting category:", error);
    } finally {
      setDeleting(false);
    }
  };

  const saveNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const categoryId = generateCategoryId();
      const newCategory = {
        categoryId: categoryId,
        categoryName: newCategoryName.toUpperCase(),
        currentDate: new Date().toISOString(),
        items: 0,
      };

      const response = await fetch(
        `https://nexuspos.onrender.com/api/categoryRouter/category-updates?email=${encodeURIComponent(userEmail)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCategory),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Category created successfully");
        setShowCreateModal(false);
        setNewCategoryName("");
        // Add to local state
        setCategories(prev => [...prev, newCategory].sort((a, b) => 
          a.categoryName.localeCompare(b.categoryName)
        ));
      } else {
        toast.error("Error creating category: " + data.error);
      }
    } catch (error) {
      toast.error("Error creating category");
      console.error("Error creating category:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveEditedCategory = async () => {
    if (!editingCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const updatedCategory = {
        categoryId: selectedCategory.categoryId,
        categoryName: editingCategoryName.toUpperCase(),
      };

      const response = await fetch(
        `https://nexuspos.onrender.com/api/categoryRouter/category-updates?email=${encodeURIComponent(userEmail)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedCategory),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Category updated successfully");
        setShowEditModal(false);
        // Update in local state
        setCategories(prev => 
          prev.map(cat => 
            cat.categoryId === selectedCategory.categoryId 
              ? { ...cat, categoryName: editingCategoryName.toUpperCase() }
              : cat
          ).sort((a, b) => a.categoryName.localeCompare(b.categoryName))
        );
      } else {
        toast.error("Error updating category: " + data.error);
      }
    } catch (error) {
      toast.error("Error updating category");
      console.error("Error updating category:", error);
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

  const generateCategoryId = () => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
    const hours = String(currentDate.getHours() % 12 || 12).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");
    const ampm = currentDate.getHours() >= 12 ? "PM" : "AM";
    const timestamp = new Date().getTime().toString(16);
    const randomString = generateRandomString(16);
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}-${timestamp}${randomString}`;
  };

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      if (type === "create") {
        saveNewCategory();
      } else if (type === "edit") {
        saveEditedCategory();
      }
    } else if (e.key === "Escape") {
      if (type === "create") {
        setShowCreateModal(false);
      } else if (type === "edit") {
        setShowEditModal(false);
      }
    }
  };

  return (
    <div className="categories-container">
      <div className="categories-sidebar-toggle-wrapper">
        <button 
          className="categories-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: isSidebarOpen ? '280px' : '80px' }}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`categories-content ${isSidebarOpen ? "categories-content-shifted" : "categories-content-collapsed"}`}>
        {/* Toolbar */}
        <div className="categories-toolbar">
          <div className="categories-toolbar-content">
            <h1 className="categories-toolbar-title">Categories</h1>
            <div className="categories-toolbar-subtitle">
              Manage your product categories
            </div>
          </div>
          <div className="categories-toolbar-actions">
            <button 
              className="categories-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <IoReload />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Search and Create Button */}
        <div className="categories-search-filter">
          <div className="categories-search-container">
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="categories-search-input"
              style={{ paddingLeft: '40px' }}
            />
            {searchTerm && (
              <button 
                className="categories-search-clear"
                onClick={() => setSearchTerm("")}
              >
                <FaTimesIcon />
              </button>
            )}
          </div>
          
          <button 
            className="categories-create-btn"
            onClick={handleCreateCategory}
          >
            <FaPlus />
            Create Category
          </button>
        </div>

        {/* Table Container */}
        <div className="categories-table-container">
          <div className="categories-table-header">
            <h3>Category List</h3>
            <span className="categories-table-count">
              {isRefreshing ? 'Refreshing...' : 
               hasInitialData ? `Showing ${displayCategories.length} categories` : 
               'Loading categories...'}
            </span>
          </div>
          
        <div className="categories-table-wrapper">
  <table className="categories-table">
    <thead>
      <tr>
        <th>Category Name</th>
        {/* <th>Number of Items</th>
        <th>Created Date</th> */}
        <th>EDIT</th>
      </tr>
    </thead>
    <tbody>
      {displayCategories.length > 0 ? (
        displayCategories.map((category, index) => {
          const createdDate = new Date(category.currentDate).toLocaleDateString();
          
          return (
            <tr 
              key={`${category.categoryId}-${index}`} 
              className="categories-table-row"
              onClick={(e) => {
                // Check if the click was on the edit button specifically
                if (!e.target.closest('.categories-edit-btn')) {
                  handleEditCategory(category);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <td className="categories-table-cell">
                <div className="categories-name-cell">
                  <FaFolder className="categories-folder-icon" />
                  <span style={{ fontWeight: '500' }}>
                    {category.categoryName}
                  </span>
                </div>
              </td>
              {/* <td className="categories-table-cell">
                <span className="categories-item-count">
                  {category.items || 0}
                </span>
              </td>
              <td className="categories-table-cell">
                {createdDate}
              </td> */}
              <td className="categories-table-cell">
                <div className="categories-actions">
                  <button 
                    className="categories-edit-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click from firing
                      handleEditCategory(category);
                    }}
                    title="Edit Category"
                  >
                    <FaEdit />
                  </button>
                  {/* <button 
                    className="categories-delete-btn"
                    onClick={() => handleDeleteCategory(category.categoryId)}
                    title="Delete Category"
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
          <td colSpan="4" className="categories-empty-state">
            <FaBox className="categories-empty-icon" />
            <h3 className="categories-empty-title">
              {isRefreshing ? 'Refreshing categories...' : 
                hasInitialData ? 'No Categories Found' : 
                'Loading categories...'}
            </h3>
            <p className="categories-empty-description">
              {searchTerm ? `No categories found for "${searchTerm}"` : 
                hasInitialData ? "No categories available. Create your first category!" :
                "Please wait while we load your categories..."}
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

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="categories-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="categories-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="categories-modal-header">
              <h2 className="categories-modal-title">
                <FaPlus className="categories-modal-icon" />
                Create New Category
              </h2>
              <button 
                className="categories-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="categories-modal-body">
              <div className="categories-modal-input-group">
                <label htmlFor="categoryName">Category Name</label>
                <input
                  ref={createInputRef}
                  id="categoryName"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, "create")}
                  placeholder="Enter category name"
                  className="categories-modal-input"
                  maxLength={50}
                  disabled={loading}
                />
                <div className="categories-modal-hint">
                  Max 50 characters. Will be converted to uppercase.
                </div>
              </div>
              
              <div className="categories-modal-actions">
                <button 
                  className="categories-modal-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                >
                  <FaTimesCircle />
                  Cancel
                </button>
                <button 
                  className="categories-modal-save"
                  onClick={saveNewCategory}
                  disabled={loading || !newCategoryName.trim()}
                >
                  {loading ? (
                    <>
                      <div className="categories-loading-spinner"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="categories-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="categories-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="categories-modal-header">
              <h2 className="categories-modal-title">
                <FaEdit className="categories-modal-icon" />
                Edit Category
              </h2>
              <button 
                className="categories-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="categories-modal-body">
              <div className="categories-modal-input-group">
                <label htmlFor="editCategoryName">Category Name</label>
                <input
                  ref={editInputRef}
                  id="editCategoryName"
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, "edit")}
                  placeholder="Enter category name"
                  className="categories-modal-input"
                  maxLength={50}
                  disabled={loading}
                />
                <div className="categories-modal-hint">
                  Max 50 characters. Will be converted to uppercase.
                </div>
              </div>
              
              <div className="categories-modal-actions">
                <button 
                  className="categories-modal-cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={loading}
                >
                  <FaTimesCircle />
                  Cancel
                </button>
                <button 
                  className="categories-modal-save"
                  onClick={saveEditedCategory}
                  disabled={loading || !editingCategoryName.trim() || editingCategoryName === selectedCategory.categoryName}
                >
                  {loading ? (
                    <>
                      <div className="categories-loading-spinner"></div>
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

export default CategoriesScreen;