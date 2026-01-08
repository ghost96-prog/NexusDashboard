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
      NProgress.start(); // Start the loading bar
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
      
      // Filter products for the selected store and current user
      const filteredProducts = responseData.data.filter(product => 
        product.userId === userId
      );
    //   const filteredProducts = responseData.data.filter(product => 
    //     product.userId === userId && 
    //     (product.storeId === createCountSelectedStore.storeId)
    //   );

      // Set total products count
      setCreateCountTotalProducts(filteredProducts.length);

      // Sort products by name
      filteredProducts.sort((a, b) => 
        a.productName?.localeCompare(b.productName || '')
      );

      setCreateCountProducts(filteredProducts);
      setCreateCountLoading(false);
      NProgress.done(); // Complete the loading bar
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("An error occurred while fetching products.");
      setCreateCountLoading(false);
      NProgress.done(); // Ensure loading bar stops on error
    }
  };

  const toggleCreateCountSidebar = () => {
    setCreateCountSidebarOpen(!createCountSidebarOpen);
  };

  // Handle search input
  useEffect(() => {
    if (createCountSearchTerm.trim() === '' || createCountType === 'Full') {
      setCreateCountSearchResults([]);
      setCreateCountShowSearchResults(false);
      return;
    }

    const filtered = createCountProducts.filter(product =>
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
  }, [createCountSearchTerm, createCountProducts, createCountSelectedItems, createCountType]);

  const handleCreateCountSelectProduct = (product) => {
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

    const newSelectedItems = [...createCountSelectedItems, product];
    setCreateCountSelectedItems(newSelectedItems);
    
    setCreateCountShowSearchResults(false);
    setCreateCountSearchTerm('');
    
    toast.success(`Added "${product.productName}" to count.`);
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

  return (
    <div className="create-count-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* ONLY ADDED THIS: Sidebar Toggle Button */}
      <div className="sales-summery-sidebar-toggle-wrapper">
        <button 
          className="sales-summery-sidebar-toggle"
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
                <div className="create-count-search-container">
                  <div className="create-count-search-input-wrapper">
                    <FaSearch className="create-count-search-icon" />
                    <input
                      type="text"
                      className="create-count-search-input"
                      placeholder="Search item by name, SKU, or category..."
                      value={createCountSearchTerm}
                      onChange={(e) => setCreateCountSearchTerm(e.target.value)}
                      onFocus={() => createCountSearchTerm && setCreateCountShowSearchResults(true)}
                    />
                    {createCountSearchTerm && (
                      <button 
                        className="create-count-clear-search-btn"
                        onClick={() => {
                          setCreateCountSearchTerm('');
                          setCreateCountShowSearchResults(false);
                        }}
                      >
                        <FaTimesCircle />
                      </button>
                    )}
                  </div>
                  
                  {createCountShowSearchResults && (
                    <div className="create-count-search-results-dropdown">
                      {createCountSearchResults.length > 0 ? (
                        <>
                          {createCountSearchResults.map(product => {
                            const isTempSelected = createCountTempSelectedProducts.some(
                              p => p.productId === product.productId
                            );
                            const isAlreadySelected = createCountSelectedItems.some(
                              item => item.productId === product.productId
                            );
                            
                            return (
                              <div 
                                key={product.productId}
                                className={`create-count-search-result-item ${isTempSelected ? 'create-count-search-result-item-selected' : ''}`}
                                onClick={(e) => {
                                  // Don't toggle if clicking on checkbox
                                  if (e.target.type === 'checkbox') return;
                                  handleCreateCountToggleTempProduct(product);
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
                                    SKU: {product.sku} | Category: {product.category}
                                  </div>
                                </div>
                                <div className="create-count-result-product-stock">
                                  Stock: {product.stock || 0}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Add Selected Button */}
                          {createCountTempSelectedProducts.length > 0 && (
                            <div className="create-count-search-actions">
                              <button 
                                className="create-count-add-selected-btn"
                                onClick={handleCreateCountAddSelectedProducts}
                              >
                                <FaCheck /> Add Selected ({createCountTempSelectedProducts.length})
                              </button>
                              <button 
                                className="create-count-clear-selected-btn"
                                onClick={() => setCreateCountTempSelectedProducts([])}
                              >
                                <FaTimesCircle /> Clear
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="create-count-no-results">No products found</div>
                      )}
                    </div>
                  )}
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
                            SKU: {product.sku} | Category: {product.category}
                          </div>
                        </div>
                        <div className="create-count-item-expected">{product.stock || 0}</div>
                        <div className="create-count-item-actions">
                          <button className="create-count-remove-btn" >
                            <FaTimesCircle />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="create-count-empty-message">No products found in this store</div>
                  )
                ) : (
                  // Show only selected items for Partial count
                  createCountSelectedItems.length > 0 ? (
                    createCountSelectedItems.map(item => (
                      <div key={item.productId} className="create-count-item-row">
                        <div className="create-count-item-info">
                          <div className="create-count-item-name">{item.productName}</div>
                          <div className="create-count-item-details">
                            SKU: {item.sku} | Category: {item.category}
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
                      {createCountType === 'Partial' 
                        ? 'No items selected. Use the search above to add items.' 
                        : 'No products available for counting.'}
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
            <button className="create-count-cancel-btn" onClick={handleCreateCountCancel}>
              CANCEL
            </button>
            <button 
              className="create-count-save-count-btn" 
              onClick={handleCreateCountSaveAndCount}
              disabled={createCountSelectedItems.length === 0 && createCountType === 'Partial'}
            >
              SAVE & COUNT
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