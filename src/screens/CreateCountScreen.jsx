import React, { useState, useEffect } from 'react';
import '../Css/CreateCountScreen.css';
import { useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaSearch,
  FaCheck,
  FaTimesCircle,
  FaStore,
  FaBox,
  FaFilter,
  FaSpinner
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SubscriptionModal from '../components/SubscriptionModal';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const CreateCountScreen = () => {
  const [createCountSidebarOpen, setCreateCountSidebarOpen] = useState(false);
  const [createCountType, setCreateCountType] = useState('Partial');
  const [createCountNotes, setCreateCountNotes] = useState('');
  const [createCountSearchTerm, setCreateCountSearchTerm] = useState('');
  const [createCountShowSearchResults, setCreateCountShowSearchResults] = useState(false);
  const [createCountSelectedItems, setCreateCountSelectedItems] = useState([]);
  const [createCountSearchResults, setCreateCountSearchResults] = useState([]);
  const [createCountProducts, setCreateCountProducts] = useState([]);
  const [createCountLoading, setCreateCountLoading] = useState(false);
  const [createCountEmail, setCreateCountEmail] = useState(null);
  const [createCountIsSubscribedAdmin, setCreateCountIsSubscribedAdmin] = useState(false);
  const [createCountShowSubscriptionModal, setCreateCountShowSubscriptionModal] = useState(false);
  const [createCountSelectedStore, setCreateCountSelectedStore] = useState(null);
  const [createCountStores, setCreateCountStores] = useState([]);
  const navigate = useNavigate();
  const [createCountTotalProducts, setCreateCountTotalProducts] = useState(0);
  const [createCountTempSelectedProducts, setCreateCountTempSelectedProducts] = useState([]);
  
  // New state for category filtering
  const [createCountCategories, setCreateCountCategories] = useState([]);
  const [createCountSelectedCategory, setCreateCountSelectedCategory] = useState(null);
  const [createCountIsCategoryDropdownOpen, setCreateCountIsCategoryDropdownOpen] = useState(false);
  const [createCountIsLoadingCategories, setCreateCountIsLoadingCategories] = useState(false);

  // Fetch email from token on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setCreateCountEmail(decoded.email);
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, [navigate]);

  // Fetch subscription status and stores when email is available
  useEffect(() => {
    if (createCountEmail) {
      fetchCreateCountAdminSubscriptionStatus();
      fetchCreateCountStores();
    }
  }, [createCountEmail]);

  // Fetch products when store is selected
  useEffect(() => {
    if (createCountSelectedStore) {
      fetchCreateCountProducts();
      fetchCreateCountCategories(); // Fetch categories when store changes
    }
  }, [createCountSelectedStore]);

  const fetchCreateCountAdminSubscriptionStatus = async () => {
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
        setCreateCountIsSubscribedAdmin(data.isSubscribedAdmin);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  const fetchCreateCountStores = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/storeRouter/stores?email=${encodeURIComponent(
          userEmail
        )}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("Failed to fetch stores.");
        return;
      }

      const data = await response.json();
      setCreateCountStores(data || []);
      
      // Select the first store by default
      if (data.length > 0) {
        setCreateCountSelectedStore(data[0]);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("An error occurred while fetching stores.");
    }
  };

  const fetchCreateCountProducts = async () => {
    try {
      NProgress.start();
      setCreateCountLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        NProgress.done();
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/productRouter/products?email=${encodeURIComponent(
          userEmail
        )}`
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("Failed to fetch products.");
        NProgress.done();
        return;
      }

      const responseData = await response.json();
      
      // Filter products for the current user
      const filteredProducts = responseData.data.filter(product => 
        product.userId === userId
      );

      // Set total products count
      setCreateCountTotalProducts(filteredProducts.length);

      // Sort products by name
      filteredProducts.sort((a, b) => 
        a.productName?.localeCompare(b.productName || '')
      );

      setCreateCountProducts(filteredProducts);
      setCreateCountLoading(false);
      NProgress.done();
      
      toast.success(`Loaded ${filteredProducts.length} products`);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("An error occurred while fetching products.");
      setCreateCountLoading(false);
      NProgress.done();
    }
  };

  // Fetch categories function
// Fetch categories function - UPDATED to include "No Category"
const fetchCreateCountCategories = async () => {
  try {
    setCreateCountIsLoadingCategories(true);
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
    
    const data = await response.json();
    if (!response.ok) {
      toast.error("Failed to fetch categories.");
      return;
    }
    
    if (data.success) {
      // Add "All Categories" option at the beginning
      const allCategories = [
        { categoryId: "all", categoryName: "All Categories" },
        // Add "No Category" option
        { categoryId: "no-category", categoryName: "No Category" },
        ...data.data
      ];
      setCreateCountCategories(allCategories);
      setCreateCountSelectedCategory(allCategories[0]); // Default to "All Categories"
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    toast.error("An error occurred while fetching categories.");
  } finally {
    setCreateCountIsLoadingCategories(false);
  }
};
  // Filter products by category function
// Filter products by category function - UPDATED to handle "No Category"
const filterProductsByCategory = (category) => {
  setCreateCountSelectedCategory(category);
  setCreateCountIsCategoryDropdownOpen(false);
  
  if (createCountType === 'Full') return;
  
  // Filter products based on selected category
  let filteredResults;
  
  if (category.categoryId === "all") {
    // Show all products not already added
    filteredResults = createCountProducts.filter(product =>
      !createCountSelectedItems.some(item => item.productId === product.productId)
    );
  } else if (category.categoryId === "no-category") {
    // Filter products with no category (null, empty, or "No Category")
    filteredResults = createCountProducts.filter(product => {
      const hasNoCategory = !product.category || 
                           product.category.trim() === '' || 
                           product.category.toUpperCase() === 'NO CATEGORY' ||
                           product.category.toUpperCase() === 'NO CATEGORY';
      return hasNoCategory && !createCountSelectedItems.some(item => item.productId === product.productId);
    });
  } else {
    // Filter by selected category
    filteredResults = createCountProducts.filter(product =>
      product.category === category.categoryName &&
      !createCountSelectedItems.some(item => item.productId === product.productId)
    );
  }
  
  setCreateCountSearchResults(filteredResults);
  setCreateCountShowSearchResults(true);
  setCreateCountSearchTerm(''); // Clear search term when filtering by category
};
  const toggleCreateCountSidebar = () => {
    setCreateCountSidebarOpen(!createCountSidebarOpen);
  };

  // Handle search input
// Handle search input - UPDATED to handle "No Category"
useEffect(() => {
  if (createCountType === 'Full' || createCountSearchTerm.trim() === '') {
    if (createCountType === 'Partial' && createCountSearchTerm.trim() === '') {
      // Show products based on selected category
      let baseProducts;
      if (createCountSelectedCategory?.categoryId === "all") {
        baseProducts = createCountProducts;
      } else if (createCountSelectedCategory?.categoryId === "no-category") {
        // Filter products with no category
        baseProducts = createCountProducts.filter(product => {
          const hasNoCategory = !product.category || 
                               product.category.trim() === '' || 
                               product.category.toUpperCase() === 'NO CATEGORY' ||
                               product.category.toUpperCase() === 'NO CATEGORY';
          return hasNoCategory;
        });
      } else {
        baseProducts = createCountProducts.filter(product => 
          product.category === createCountSelectedCategory?.categoryName
        );
      }
      
      const allResults = baseProducts.filter(product =>
        !createCountSelectedItems.some(item => item.productId === product.productId)
      );
      setCreateCountSearchResults(allResults);
      setCreateCountShowSearchResults(allResults.length > 0);
    } else {
      setCreateCountSearchResults([]);
      setCreateCountShowSearchResults(false);
    }
    return;
  }

  // Filter by search term AND current category
  let categoryFiltered = createCountProducts;
  if (createCountSelectedCategory?.categoryId === "no-category") {
    // Filter products with no category
    categoryFiltered = createCountProducts.filter(product => {
      const hasNoCategory = !product.category || 
                           product.category.trim() === '' || 
                           product.category.toUpperCase() === 'NO CATEGORY' ||
                           product.category.toUpperCase() === 'NO CATEGORY';
      return hasNoCategory;
    });
  } else if (createCountSelectedCategory?.categoryId !== "all") {
    categoryFiltered = createCountProducts.filter(product => 
      product.category === createCountSelectedCategory?.categoryName
    );
  }

  const filtered = categoryFiltered.filter(product =>
    product.productName?.toLowerCase().includes(createCountSearchTerm.toLowerCase()) ||
    product.sku?.includes(createCountSearchTerm) ||
    product.category?.toLowerCase().includes(createCountSearchTerm.toLowerCase())
  );

  // Filter out already selected items
  const filteredResults = filtered.filter(product =>
    !createCountSelectedItems.some(item => item.productId === product.productId)
  );

  setCreateCountSearchResults(filteredResults);
  setCreateCountShowSearchResults(filteredResults.length > 0);
}, [createCountSearchTerm, createCountProducts, createCountSelectedItems, createCountType, createCountSelectedCategory]);
  // Handle click outside to close search results and category dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.create-count-search-container');
      const searchResults = document.querySelector('.create-count-search-results-dropdown');
      const categoryDropdown = document.querySelector('.create-count-category-dropdown');
      const categoryBtn = document.querySelector('.create-count-category-btn');
      
      if (
        searchContainer && 
        searchResults && 
        !searchContainer.contains(event.target) && 
        !searchResults.contains(event.target)
      ) {
        setCreateCountShowSearchResults(false);
      }
      
      // Close category dropdown when clicking outside
      if (
        createCountIsCategoryDropdownOpen &&
        categoryDropdown &&
        !categoryDropdown.contains(event.target) &&
        categoryBtn &&
        !categoryBtn.contains(event.target)
      ) {
        setCreateCountIsCategoryDropdownOpen(false);
      }
    };

    // Add event listener only when search results are shown or category dropdown is open
    if (createCountShowSearchResults || createCountIsCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [createCountShowSearchResults, createCountIsCategoryDropdownOpen]);

  const handleCreateCountToggleTempProduct = (product) => {
    if (!createCountIsSubscribedAdmin) {
      setCreateCountShowSubscriptionModal(true);
      return;
    }

    const isAlreadySelected = createCountSelectedItems.some(
      item => item.productId === product.productId
    );
    
    if (isAlreadySelected) {
      toast.info('This product is already added to the count.');
      return;
    }

    const isCurrentlySelected = createCountTempSelectedProducts.some(
      p => p.productId === product.productId
    );
    
    if (isCurrentlySelected) {
      // Remove from temp selection
      setCreateCountTempSelectedProducts(prev => 
        prev.filter(p => p.productId !== product.productId)
      );
    } else {
      // Add to temp selection
      setCreateCountTempSelectedProducts(prev => [...prev, product]);
    }
  };

  const handleCreateCountAddSelectedProducts = () => {
    if (!createCountIsSubscribedAdmin) {
      setCreateCountShowSubscriptionModal(true);
      return;
    }

    if (createCountTempSelectedProducts.length === 0) {
      toast.error('No products selected.');
      return;
    }

    // Add all temp selected products to the main selected items
    const newSelectedItems = [...createCountSelectedItems, ...createCountTempSelectedProducts];
    setCreateCountSelectedItems(newSelectedItems);
    
    // Clear temp selection and search
    setCreateCountTempSelectedProducts([]);
    setCreateCountShowSearchResults(false);
    setCreateCountSearchTerm('');
    
    toast.success(`Added ${createCountTempSelectedProducts.length} product(s) to count.`);
  };

  const handleCreateCountClearSearchSelection = () => {
    setCreateCountTempSelectedProducts([]);
  };

  const handleCreateCountSelectAllSearchResults = () => {
    if (createCountType === 'Full') return;
    setCreateCountTempSelectedProducts(createCountSearchResults);
  };

  const handleCreateCountRemoveProduct = (productId) => {
    const newSelectedItems = createCountSelectedItems.filter(item => item.productId !== productId);
    setCreateCountSelectedItems(newSelectedItems);
  };

  const handleCreateCountSaveAndCount = () => {
    if (!createCountIsSubscribedAdmin) {
      setCreateCountShowSubscriptionModal(true);
      return;
    }

    // Validate items
    if (createCountSelectedItems.length === 0 && createCountType === 'Partial') {
      toast.error('Please add at least one item to the inventory count.');
      return;
    }

    // Prepare count data WITH PRICE INCLUDED
    const countData = {
      notes: createCountNotes,
      type: createCountType,
      items: createCountType === 'Full' 
        ? createCountProducts.map(product => ({
            productId: product.productId,
            productName: product.productName,
            sku: product.sku,
            category: product.category,
            expectedStock: product.stock || 0,
            price: product.price || 0,
            cost: product.cost || 0,
            storeId: createCountSelectedStore?.storeId
          }))
        : createCountSelectedItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            category: item.category,
            expectedStock: item.stock || 0,
            price: item.price || 0,
            cost: item.cost || 0,
            storeId: createCountSelectedStore?.storeId
          })),
      storeId: createCountSelectedStore?.storeId,
      storeName: createCountSelectedStore?.storeName,
      createdBy: createCountEmail,
      dateCreated: new Date().toISOString()
    };

    console.log('Navigating with count data (WITH PRICE):', countData);
    
    // Navigate to counting screen with the data
    navigate('/count-stock', { state: countData });
  };

  const handleCreateCountCancel = () => {
    navigate('/counts');
  };
const handleClearSearch = () => {
  setCreateCountSearchTerm('');
  // Show all products based on selected category
  if (createCountType === 'Partial') {
    let baseProducts;
    if (createCountSelectedCategory?.categoryId === "all") {
      baseProducts = createCountProducts;
    } else if (createCountSelectedCategory?.categoryId === "no-category") {
      // Filter products with no category
      baseProducts = createCountProducts.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory;
      });
    } else {
      baseProducts = createCountProducts.filter(product => 
        product.category === createCountSelectedCategory?.categoryName
      );
    }
    
    const allResults = baseProducts.filter(product =>
      !createCountSelectedItems.some(item => item.productId === product.productId)
    );
    setCreateCountSearchResults(allResults);
    setCreateCountShowSearchResults(true);
  }
};

const handleSearchFocus = () => {
  if (createCountType === 'Partial' && !createCountLoading) {
    // Show all products based on selected category
    let baseProducts;
    if (createCountSelectedCategory?.categoryId === "all") {
      baseProducts = createCountProducts;
    } else if (createCountSelectedCategory?.categoryId === "no-category") {
      // Filter products with no category
      baseProducts = createCountProducts.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory;
      });
    } else {
      baseProducts = createCountProducts.filter(product => 
        product.category === createCountSelectedCategory?.categoryName
      );
    }
    
    const filteredResults = baseProducts.filter(product =>
      !createCountSelectedItems.some(item => item.productId === product.productId)
    );
    
    if (filteredResults.length > 0) {
      setCreateCountSearchResults(filteredResults);
      setCreateCountShowSearchResults(true);
    }
  }
};

  const getTotalSelectedCount = () => {
    return createCountTempSelectedProducts.length;
  };

  return (
    <div className="create-count-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Products Loading Modal */}
      {createCountLoading && (
        <div className="create-count-loading-modal">
          <div className="create-count-loading-modal-content">
            <div className="create-count-loading-spinner">
              <FaSpinner className="create-count-loading-icon" />
            </div>
            <h3 className="create-count-loading-title">Loading Products</h3>
            <p className="create-count-loading-message">
              Please wait while we load products from the selected store...
            </p>
            <div className="create-count-loading-progress">
              <div className="create-count-loading-progress-bar"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="create-count-sidebar-toggle-wrapper">
        <button 
          className="create-count-sidebar-toggle"
          onClick={toggleCreateCountSidebar}
          style={{ left: createCountSidebarOpen ? '280px' : '80px' }}
        >
          {createCountSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
        
      <Sidebar isOpen={createCountSidebarOpen} toggleSidebar={toggleCreateCountSidebar} />
      
      <div className={`create-count-content ${createCountSidebarOpen ? 'create-count-shifted' : 'create-count-collapsed'}`}>
        <div className="create-count-container">
          <div className="create-count-header">
            <h2>Create inventory count</h2>
            <div className="create-count-progress">
              <span className="create-count-progress-text">
                {createCountType === 'Full' 
                  ? `${createCountProducts.length} / ${createCountTotalProducts}` 
                  : `${createCountSelectedItems.length} / ${createCountTotalProducts}`}
              </span>
            </div>
          </div>

          {/* Top Section - Store and Notes side by side */}
          <div className="create-count-top-section">
            {/* Store Selection */}
            <div className="create-count-store-section">
              <label className="create-count-section-label">Store:</label>
              <div className="create-count-store-selector">
                <FaStore className="create-count-store-icon" />
                <select 
                  className="create-count-store-select"
                  value={createCountSelectedStore?.storeId || ''}
                  onChange={(e) => {
                    const store = createCountStores.find(s => s.storeId === e.target.value);
                    setCreateCountSelectedStore(store);
                  }}
                  disabled={createCountLoading}
                >
                  {createCountStores.map(store => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.storeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes Section */}
            <div className="create-count-notes-section">
              <label className="create-count-section-label">Notes</label>
              <textarea
                className="create-count-notes-input"
                value={createCountNotes}
                onChange={(e) => setCreateCountNotes(e.target.value)}
                placeholder="Enter notes for this count..."
                rows="1"
                disabled={createCountLoading}
              />
            </div>
          </div>

          {/* Type Selection */}
          <div className="create-count-type-section">
            <label className="create-count-section-label">Type</label>
            <div className="create-count-type-options">
              <label className="create-count-type-option">
                <input
                  type="radio"
                  name="createCountType"
                  value="Partial"
                  checked={createCountType === 'Partial'}
                  onChange={(e) => setCreateCountType(e.target.value)}
                  disabled={createCountLoading}
                />
                <span className="create-count-type-label">Partial</span>
              </label>
              <label className="create-count-type-option">
                <input
                  type="radio"
                  name="createCountType"
                  value="Full"
                  checked={createCountType === 'Full'}
                  onChange={(e) => setCreateCountType(e.target.value)}
                  disabled={createCountLoading}
                />
                <span className="create-count-type-label">Full</span>
              </label>
            </div>
            <div className="create-count-type-description">
              {createCountType === 'Full' 
                ? 'All items will be counted automatically.' 
                : 'Select specific items to count.'}
            </div>
          </div>

          {/* Items Section */}
          <div className="create-count-items-section">
            <div className="create-count-items-header">
              <h3 className="create-count-section-label">Items</h3>
              {createCountType === 'Partial' && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Category Filter Button */}
                  <div className="create-count-category-selector">
                    <button 
                      className="create-count-category-btn"
                      onClick={() => setCreateCountIsCategoryDropdownOpen(!createCountIsCategoryDropdownOpen)}
                      disabled={createCountLoading}
                    >
                      <FaFilter style={{ color: '#5694e6' }} />
                      <span style={{ flex: 1, textAlign: 'left' }}>
                        {createCountSelectedCategory?.categoryName || 'All Categories'}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '10px' }}>▼</span>
                    </button>
               {createCountIsCategoryDropdownOpen && (
  <div className="create-count-category-dropdown">
    {createCountIsLoadingCategories ? (
      <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
        Loading categories...
      </div>
    ) : (
      <>
        {/* All Categories option */}
        <div
          className={`create-count-category-dropdown-item ${createCountSelectedCategory?.categoryId === 'all' ? 'selected' : ''}`}
          onClick={() => filterProductsByCategory({ categoryId: 'all', categoryName: 'All Categories' })}
        >
          All Categories
          {createCountSelectedCategory?.categoryId === 'all' && (
            <FaCheck className="create-count-category-check" />
          )}
        </div>
        
        {/* No Category option */}
        <div
          className={`create-count-category-dropdown-item ${createCountSelectedCategory?.categoryId === 'no-category' ? 'selected' : ''}`}
          onClick={() => filterProductsByCategory({ categoryId: 'no-category', categoryName: 'No Category' })}
        >
          No Category
          {createCountSelectedCategory?.categoryId === 'no-category' && (
            <FaCheck className="create-count-category-check" />
          )}
        </div>
        
        {/* Regular categories */}
        {createCountCategories
          .filter(cat => cat.categoryId !== 'all' && cat.categoryId !== 'no-category')
          .map(category => (
            <div
              key={category.categoryId}
              className={`create-count-category-dropdown-item ${createCountSelectedCategory?.categoryId === category.categoryId ? 'selected' : ''}`}
              onClick={() => filterProductsByCategory(category)}
            >
              {category.categoryName}
              {createCountSelectedCategory?.categoryId === category.categoryId && (
                <FaCheck className="create-count-category-check" />
              )}
            </div>
          ))
        }
      </>
    )}
  </div>
)}
                  </div>
                  
                  <div className="create-count-search-container">
                    <div className="create-count-search-input-wrapper">
                      <FaSearch className="create-count-search-icon" />
                      <input
                        type="text"
                        className="create-count-search-input"
                        placeholder={createCountLoading ? "Loading products..." : "Search item by name, SKU, or category..."}
                        value={createCountSearchTerm}
                        onChange={(e) => setCreateCountSearchTerm(e.target.value)}
                        onFocus={handleSearchFocus}
                        disabled={createCountLoading}
                      />
                      {createCountSearchTerm && !createCountLoading && (
                        <button 
                          className="create-count-clear-search-btn"
                          onClick={handleClearSearch}
                        >
                          <FaTimesCircle />
                        </button>
                      )}
                    </div>
                    
                    {createCountShowSearchResults && !createCountLoading && (
                      <div className="create-count-search-results-dropdown">
                        <div className="create-count-search-actions-header">
                          <button 
                            className="create-count-select-all-btn"
                            onClick={handleCreateCountSelectAllSearchResults}
                          >
                            <FaCheck /> Select All
                          </button>
                          <button 
                            className="create-count-clear-selection-btn"
                            onClick={handleCreateCountClearSearchSelection}
                          >
                            <FaTimesCircle /> Clear
                          </button>
                          <button 
                            className="create-count-close-popup-btn"
                            onClick={() => setCreateCountShowSearchResults(false)}
                          >
                            <FaTimes /> Close
                          </button>
                        </div>
                        
                        <div className="create-count-search-results-list">
                          {createCountSearchResults.length > 0 ? (
                            createCountSearchResults.map(product => {
                              const isTempSelected = createCountTempSelectedProducts.some(
                                p => p.productId === product.productId
                              );
                              const isAlreadySelected = createCountSelectedItems.some(
                                item => item.productId === product.productId
                              );
                              
                              return (
                                <div 
                                  key={product.productId}
                                  className={`create-count-search-result-item ${isTempSelected ? 'create-count-search-result-item-selected' : ''} ${isAlreadySelected ? 'create-count-search-result-item-added' : ''}`}
                                  onClick={(e) => {
                                    if (e.target.type !== 'checkbox' && !isAlreadySelected) {
                                      handleCreateCountToggleTempProduct(product);
                                    }
                                  }}
                                >
                                  <div className="create-count-result-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={isTempSelected || isAlreadySelected}
                                      onChange={() => handleCreateCountToggleTempProduct(product)}
                                      disabled={isAlreadySelected}
                                    />
                                  </div>
                                  <div className="create-count-result-product-info">
                                    <div className="create-count-result-product-name">
                                      {product.productName}
                                      {isAlreadySelected && (
                                        <span className="create-count-already-selected-badge">Already Added</span>
                                      )}
                                    </div>
                                    <div className="create-count-result-product-details">
                                      SKU: {product.sku} | Category: {product.category || 'No Category'} | Stock: {product.stock || 0}
                                    </div>
                                  </div>
                                  <div className="create-count-result-product-stock">
                                    <div>Price: ${product.price?.toFixed(2) || 0}</div>
                                    <div>Cost: ${product.cost?.toFixed(2) || 0}</div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="create-count-no-results">No products found</div>
                          )}
                        </div>
                        
                        {createCountTempSelectedProducts.length > 0 && (
                          <div className="create-count-search-actions-footer">
                            <button 
                              className="create-count-add-selected-btn"
                              onClick={handleCreateCountAddSelectedProducts}
                            >
                              <FaCheck /> Add Selected ({getTotalSelectedCount()})
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Items Table */}
            <div className="create-count-items-table-container">
              <div className="create-count-items-table-header">
                <div className="create-count-table-header-cell">Item</div>
                <div className="create-count-table-header-cell">Expected Stock</div>
                <div className="create-count-table-header-cell">Actions</div>
              </div>
              
              <div className="create-count-items-table-body">
                {createCountType === 'Full' ? (
                  // Show all products for Full count
                  createCountLoading ? (
                    <div className="create-count-loading-message">Loading products...</div>
                  ) : createCountProducts.length > 0 ? (
                    createCountProducts.map(product => (
                      <div key={product.productId} className="create-count-item-row">
                        <div className="create-count-item-info">
                          <div className="create-count-item-name">{product.productName}</div>
                          <div className="create-count-item-details">
                            SKU: {product.sku} | Category: {product.category || 'No Category'}
                          </div>
                        </div>
                        <div className="create-count-item-expected">{product.stock || 0}</div>
                        <div className="create-count-item-actions">
                          <button className="create-count-remove-btn" disabled>
                            <FaTimesCircle />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="create-count-empty-message">
                      <FaBox className="create-count-empty-icon" />
                      <p>No products found in this store</p>
                    </div>
                  )
                ) : (
                  // Show only selected items for Partial count
                  createCountSelectedItems.length > 0 ? (
                    createCountSelectedItems.map(item => (
                      <div key={item.productId} className="create-count-item-row">
                        <div className="create-count-item-info">
                          <div className="create-count-item-name">{item.productName}</div>
                          <div className="create-count-item-details">
                            SKU: {item.sku} | Category: {item.category || 'No Category'}
                          </div>
                        </div>
                        <div className="create-count-item-expected">{item.stock || 0}</div>
                        <div className="create-count-item-actions">
                          <button 
                            className="create-count-remove-btn"
                            onClick={() => handleCreateCountRemoveProduct(item.productId)}
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="create-count-empty-message">
                      <FaBox className="create-count-empty-icon" />
                      <p>No items selected. Use the search above to add items.</p>
                      {createCountProducts.length === 0 && !createCountLoading && (
                        <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                          No products available for this store.
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Selection Info */}
            {createCountType === 'Partial' && createCountSelectedItems.length > 0 && (
              <div className="create-count-selection-info">
                {createCountSelectedItems.length} item{createCountSelectedItems.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="create-count-action-buttons">
            <button 
              className="create-count-cancel-btn" 
              onClick={handleCreateCountCancel}
              disabled={createCountLoading}
            >
              CANCEL
            </button>
            <button 
              className="create-count-save-count-btn" 
              onClick={handleCreateCountSaveAndCount}
              disabled={createCountLoading || (createCountSelectedItems.length === 0 && createCountType === 'Partial')}
            >
              {createCountLoading ? 'LOADING...' : 'SAVE & COUNT'}
            </button>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={createCountShowSubscriptionModal}
        onClose={() => setCreateCountShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default CreateCountScreen;