import React, { useState, useEffect } from 'react';
import '../Css/CreateStockTransferScreen.css';
import { useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaSearch,
  FaPlus,
  FaTimesCircle,
  FaStore,
  FaBox,
  FaCheck,
  FaWeight,
  FaMapMarkerAlt,
  FaSpinner,
  FaSyncAlt,
  FaFilter
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const CreateStockTransferScreen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [email, setEmail] = useState(null);
  const [fromStore, setFromStore] = useState(null);
  const [toStoreName, setToStoreName] = useState('');
  const [stores, setStores] = useState([]);
  const [reference, setReference] = useState('');
  const [searchSelected, setSearchSelected] = useState(new Set());
  
  // New state for category filtering
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  const navigate = useNavigate();

  // Format number with 2 decimal places
  const formatDecimal = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toFixed(2);
  };

  // Format number for display
  const formatDisplay = (value, productType) => {
    if (value === '' || value === null || value === undefined) return '';
    if (productType === 'Weight') {
      const num = parseFloat(value);
      if (isNaN(num)) return '';
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      });
    } else {
      const num = parseInt(value);
      return isNaN(num) ? '' : num.toString();
    }
  };

  // Parse input value
  const parseInputValue = (value, productType) => {
    if (value === '') return '';
    
    if (productType === 'Weight') {
      const cleaned = value.replace(/[^\d.,]/g, '').replace(/,/g, '.');
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      return cleaned;
    } else {
      return value.replace(/[^\d]/g, '');
    }
  };

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
      fetchStores();
    }
  }, [email]);

  useEffect(() => {
    if (fromStore) {
      fetchProducts();
      fetchCategories(); // Fetch categories when store changes
    }
  }, [fromStore]);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/storeRouter/stores?email=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
        toast.error("Failed to fetch stores.");
        return;
      }

      const data = await response.json();
      setStores(data || []);
      
      if (data.length > 0) {
        setFromStore(data[0]);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("An error occurred while fetching stores.");
    }
  };

  const fetchProducts = async () => {
    try {
      NProgress.start();
      setProductsLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        NProgress.done();
        setProductsLoading(false);
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/productRouter/products?email=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
        toast.error("Failed to fetch products.");
        NProgress.done();
        setProductsLoading(false);
        return;
      }

      const responseData = await response.json();
      
      // Filter products for current user
      const filteredProducts = responseData.data.filter(product => 
        product.userId === userId 
      );

      filteredProducts.sort((a, b) => 
        a.productName?.localeCompare(b.productName || '')
      );

      setProducts(filteredProducts);
      NProgress.done();
      setProductsLoading(false);
      
      toast.success(`Loaded ${filteredProducts.length} products`);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("An error occurred while fetching products.");
      NProgress.done();
      setProductsLoading(false);
    }
  };

  // Fetch categories function - UPDATED to include "No Category"
  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
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
        // Add "All Categories" and "No Category" options at the beginning
        const allCategories = [
          { categoryId: "all", categoryName: "All Categories" },
          { categoryId: "no-category", categoryName: "No Category" },
          ...data.data
        ];
        setCategories(allCategories);
        setSelectedCategory(allCategories[0]); // Default to "All Categories"
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("An error occurred while fetching categories.");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Filter products by category function - UPDATED to handle "No Category"
  const filterProductsByCategory = (category) => {
    setSelectedCategory(category);
    setIsCategoryDropdownOpen(false);
    
    // Filter products based on selected category
    let filteredResults;
    
    if (category.categoryId === "all") {
      // Show all products not already added
      filteredResults = products.filter(product =>
        !selectedItems.some(item => item.productId === product.productId)
      );
    } else if (category.categoryId === "no-category") {
      // Filter products with no category (null, empty, or "No Category")
      filteredResults = products.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory && !selectedItems.some(item => item.productId === product.productId);
      });
    } else {
      // Filter by selected category
      filteredResults = products.filter(product =>
        product.category === category.categoryName &&
        !selectedItems.some(item => item.productId === product.productId)
      );
    }
    
    setSearchResults(filteredResults);
    setShowSearchResults(true);
    setSearchTerm(''); // Clear search term when filtering by category
  };

  // Handle search when term changes - UPDATED to handle "No Category"
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim() === '') {
      // Show products based on selected category
      let baseProducts;
      if (selectedCategory?.categoryId === "all") {
        baseProducts = products;
      } else if (selectedCategory?.categoryId === "no-category") {
        // Filter products with no category
        baseProducts = products.filter(product => {
          const hasNoCategory = !product.category || 
                               product.category.trim() === '' || 
                               product.category.toUpperCase() === 'NO CATEGORY' ||
                               product.category.toUpperCase() === 'NO CATEGORY';
          return hasNoCategory;
        });
      } else {
        baseProducts = products.filter(product => 
          product.category === selectedCategory?.categoryName
        );
      }
      
      const allResults = baseProducts.filter(product =>
        !selectedItems.some(item => item.productId === product.productId)
      );
      setSearchResults(allResults);
      setShowSearchResults(allResults.length > 0);
      return;
    }

    // Filter by search term AND current category
    let categoryFiltered = products;
    if (selectedCategory?.categoryId === "no-category") {
      // Filter products with no category
      categoryFiltered = products.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory;
      });
    } else if (selectedCategory?.categoryId !== "all") {
      categoryFiltered = products.filter(product => 
        product.category === selectedCategory?.categoryName
      );
    }

    const filtered = categoryFiltered.filter(product =>
      (product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toString().includes(searchTerm) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !selectedItems.some(item => item.productId === product.productId)
    );

    setSearchResults(filtered);
    setShowSearchResults(filtered.length > 0);
  };

  // Handle click outside to close search results and category dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.transfer-create-search-container');
      const searchResults = document.querySelector('.transfer-create-search-results-dropdown');
      const categoryDropdown = document.querySelector('.transfer-create-category-dropdown');
      const categoryBtn = document.querySelector('.transfer-create-category-btn');
      
      if (
        searchContainer && 
        searchResults && 
        !searchContainer.contains(event.target) && 
        !searchResults.contains(event.target)
      ) {
        // Just hide the results, don't clear selections
        setShowSearchResults(false);
      }
      
      // Close category dropdown when clicking outside
      if (
        isCategoryDropdownOpen &&
        categoryDropdown &&
        !categoryDropdown.contains(event.target) &&
        categoryBtn &&
        !categoryBtn.contains(event.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    // Add event listener only when search results are shown or category dropdown is open
    if (showSearchResults || isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults, isCategoryDropdownOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSearchSelectToggle = (productId) => {
    const newSelected = new Set(searchSelected);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSearchSelected(newSelected);
  };

  const handleAddSelectedProducts = () => {
    if (searchSelected.size === 0) {
      toast.error('No products selected.');
      return;
    }

    // Get ALL products that are selected, not just from search results
    const selectedProducts = products.filter(product => 
      searchSelected.has(product.productId) && 
      !selectedItems.some(item => item.productId === product.productId) // Check not already added
    );

    if (selectedProducts.length === 0) {
      toast.error('All selected products are already added to transfer.');
      setSearchSelected(new Set());
      return;
    }

    const newItems = selectedProducts.map(product => ({
      ...product,
      transferQuantity: '',
      unitCost: formatDecimal(product.cost || 0),
      totalValue: 0,
      existingStock: product.stock || 0
    }));

    const updatedSelectedItems = [...selectedItems, ...newItems];
    setSelectedItems(updatedSelectedItems);
    
    setSearchSelected(new Set());
    setShowSearchResults(false);
    setSearchTerm('');
    
    toast.success(`Added ${newItems.length} product(s) to transfer.`);
  };

  const handleSelectProduct = (product) => {
    const isAlreadySelected = selectedItems.some(
      item => item.productId === product.productId
    );
    
    if (isAlreadySelected) {
      toast.info('This product is already added to the transfer.');
      return;
    }

    const newItem = {
      ...product,
      transferQuantity: '',
      unitCost: formatDecimal(product.cost || 0),
      totalValue: 0,
      existingStock: product.stock || 0
    };

    const newSelectedItems = [...selectedItems, newItem];
    setSelectedItems(newSelectedItems);
    
    setShowSearchResults(false);
    setSearchTerm('');
    
    toast.success(`Added "${product.productName}" to transfer.`);
  };

  const handleRemoveProduct = (productId) => {
    const newSelectedItems = selectedItems.filter(item => item.productId !== productId);
    setSelectedItems(newSelectedItems);
  };

  const handleQuantityChange = (productId, value) => {
    const item = selectedItems.find(item => item.productId === productId);
    if (!item) return;

    const parsedValue = parseInputValue(value, item.productType);
    
    let displayValue = parsedValue;
    if (item.productType === 'Weight' && parsedValue.includes('.')) {
      displayValue = parsedValue;
    }
    
    setSelectedItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? {
              ...item,
              transferQuantity: parsedValue,
              totalValue: (parseFloat(parsedValue) || 0) * (parseFloat(item.unitCost) || 0)
            }
          : item
      )
    );
  };

  const calculateTotalValue = () => {
    return selectedItems.reduce((total, item) => total + (parseFloat(item.totalValue) || 0), 0);
  };

  const hasInvalidQuantities = () => {
    return selectedItems.some(item => {
      const quantity = parseFloat(item.transferQuantity) || 0;
      const availableStock = parseFloat(item.existingStock) || 0;
      return quantity <= 0 || quantity > availableStock;
    });
  };

  const handleSaveAndProcess = async () => {
    if (!fromStore) {
      toast.error('Please select a source store.');
      return;
    }

    if (!toStoreName.trim()) {
      toast.error('Please enter destination store name.');
      return;
    }

    if (toStoreName.trim().toLowerCase() === fromStore.storeName.toLowerCase()) {
      toast.error('Source and destination stores cannot be the same.');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to transfer.');
      return;
    }

    if (hasInvalidQuantities()) {
      toast.error('Please enter valid quantity (greater than 0 and not exceeding available stock) for all items.');
      return;
    }

    // Prepare transfer data
    const transferData = {
      transferNumber: `TRF-${Date.now()}`,
      reference: reference,
      fromStoreId: fromStore.storeId,
      fromStoreName: fromStore.storeName,
      toStoreName: toStoreName.trim(),
      notes: notes,
      items: selectedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productType: item.productType,
        sku: item.sku,
        category: item.category,
        existingStock: item.existingStock || 0,
        transferQuantity: parseFloat(item.transferQuantity) || 0,
        unitCost: parseFloat(item.unitCost) || 0,
        totalValue: parseFloat(item.totalValue) || 0,
        storeId: fromStore.storeId,
        currentPrice: parseFloat(item.price) || 0,
        currentCost: parseFloat(item.cost) || 0,
        currentStock: item.existingStock || 0,
        EditorId: item.EditorId || '',
        adminSynced: item.adminSynced || false
      })),
      totalValue: calculateTotalValue(),
      createdBy: email,
      dateCreated: new Date().toISOString(),
      status: 'Draft',
      userId: selectedItems[0]?.userId || ''
    };

    console.log('Transfer Data to save locally:', transferData);
    
    // Save to localStorage
    try {
      setLoading(true);
      const localTransferId = `local-transfer-${Date.now()}`;
      transferData.localId = localTransferId;
      
      localStorage.setItem(localTransferId, JSON.stringify(transferData));
      
      const existingTransfers = JSON.parse(localStorage.getItem('localTransfers') || '[]');
      existingTransfers.push({
        id: localTransferId,
        transferNumber: transferData.transferNumber,
        fromStoreName: transferData.fromStoreName,
        toStoreName: transferData.toStoreName,
        totalValue: transferData.totalValue,
        status: 'Draft',
        dateCreated: new Date().toISOString(),
        itemsCount: transferData.items.length
      });
      localStorage.setItem('localTransfers', JSON.stringify(existingTransfers));
      
      toast.success('Transfer saved locally!');
      
      setTimeout(() => {
        setLoading(false);
        navigate('/process-stock-transfer', { 
          state: { 
            transferData: transferData,
            isLocal: true
          } 
        });
      }, 500);
      
    } catch (error) {
      console.error('Error saving transfer locally:', error);
      toast.error('Failed to save transfer locally.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/stock-transfers');
  };

  const handleClearSearchSelection = () => {
    setSearchSelected(new Set());
  };

  const handleSelectAllSearchResults = () => {
    const allIds = new Set(searchResults.map(product => product.productId));
    setSearchSelected(allIds);
  };

  const getProductTypeIcon = (productType) => {
    return productType === 'Weight' ? <FaWeight title="Weight Product" style={{ color: '#059669', marginLeft: '4px' }} /> : null;
  };

  // Clear search input but keep popup open showing all items - UPDATED to handle "No Category"
  const handleClearSearch = () => {
    setSearchTerm('');
    // Show ALL products that are not already added to transfer based on selected category
    let baseProducts;
    if (selectedCategory?.categoryId === "all") {
      baseProducts = products;
    } else if (selectedCategory?.categoryId === "no-category") {
      // Filter products with no category
      baseProducts = products.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory;
      });
    } else {
      baseProducts = products.filter(product => 
        product.category === selectedCategory?.categoryName
      );
    }
    
    const allResults = baseProducts.filter(product =>
      !selectedItems.some(item => item.productId === product.productId)
    );
    setSearchResults(allResults);
    setShowSearchResults(true);
  };

  // Handle search input focus - UPDATED to handle "No Category"
  const handleSearchFocus = () => {
    if (productsLoading) {
      toast.info('Please wait for products to load.');
      return;
    }
    
    // Show all items not yet added based on selected category
    let baseProducts;
    if (selectedCategory?.categoryId === "all") {
      baseProducts = products;
    } else if (selectedCategory?.categoryId === "no-category") {
      // Filter products with no category
      baseProducts = products.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory;
      });
    } else {
      baseProducts = products.filter(product => 
        product.category === selectedCategory?.categoryName
      );
    }
    
    const filteredResults = baseProducts.filter(product =>
      !selectedItems.some(item => item.productId === product.productId)
    );
    
    if (filteredResults.length > 0) {
      setSearchResults(filteredResults);
      setShowSearchResults(true);
    }
  };

  // Get ALL selected products count (even if not in current search results)
  const getTotalSelectedCount = () => {
    // Count all selected products that aren't already added to transfer
    const allSelectedProducts = products.filter(product => 
      searchSelected.has(product.productId) && 
      !selectedItems.some(item => item.productId === product.productId)
    );
    return allSelectedProducts.length;
  };

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    handleSearch(value);
  };

  // Effect to update search results when products, selected items, or selected category change
  useEffect(() => {
    if (showSearchResults) {
      handleSearch(searchTerm);
    }
  }, [products, selectedItems, selectedCategory]);

  return (
    <div className="transfer-create-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Products Loading Modal */}
      {productsLoading && (
        <div className="transfer-create-loading-modal">
          <div className="transfer-create-loading-modal-content">
            <div className="transfer-create-loading-spinner">
              <FaSyncAlt className="transfer-create-loading-icon" />
            </div>
            <h3 className="transfer-create-loading-title">Loading Products</h3>
            <p className="transfer-create-loading-message">
              Please wait while we load products from the selected store...
            </p>
            <div className="transfer-create-loading-progress">
              <div className="transfer-create-loading-progress-bar"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Loading Modal */}
      {loading && (
        <div className="transfer-create-loading-modal">
          <div className="transfer-create-loading-modal-content">
            <div className="transfer-create-loading-spinner">
              <FaSpinner className="transfer-create-loading-icon" />
            </div>
            <h3 className="transfer-create-loading-title">Saving Transfer</h3>
            <p className="transfer-create-loading-message">
              Please wait while we save your transfer...
            </p>
            <div className="transfer-create-loading-progress">
              <div className="transfer-create-loading-progress-bar"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="transfer-create-sidebar-toggle-wrapper">
        <button 
          className="transfer-create-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: sidebarOpen ? '280px' : '80px' }}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
        
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`transfer-create-content ${sidebarOpen ? 'transfer-create-shifted' : 'transfer-create-collapsed'}`}>
        <div className="transfer-create-container">
          <div className="transfer-create-header">
            <h2>Create Stock Transfer</h2>
            <div className="transfer-create-progress">
              <span className="transfer-create-progress-text">
                {selectedItems.length} items selected
              </span>
            </div>
          </div>

          <div className="transfer-create-top-section">
            <div className="transfer-create-store-section">
              <label className="transfer-create-section-label">From Store *</label>
              <div className="transfer-create-store-selector">
                <FaStore className="transfer-create-store-icon" />
                <select 
                  className="transfer-create-store-select"
                  value={fromStore?.storeId || ''}
                  onChange={(e) => {
                    const store = stores.find(s => s.storeId === e.target.value);
                    setFromStore(store);
                  }}
                  disabled={productsLoading}
                >
                  <option value="">Select source store</option>
                  {stores.map(store => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.storeName}
                    </option>
                  ))}
                </select>
                {productsLoading && (
                  <div className="transfer-create-store-loading">
                    <FaSpinner className="transfer-create-store-loading-icon" />
                  </div>
                )}
              </div>
            </div>

            <div className="transfer-create-store-section">
              <label className="transfer-create-section-label">To Store *</label>
              <div className="transfer-create-store-selector">
                <FaMapMarkerAlt className="transfer-create-store-icon" />
                <div className="transfer-create-store-input-wrapper">
                  <input
                    type="text"
                    className="transfer-create-store-input"
                    value={toStoreName}
                    onChange={(e) => setToStoreName(e.target.value)}
                    placeholder="Enter destination store name"
                    required
                    disabled={productsLoading}
                  />
                </div>
              </div>
            </div>

            <div className="transfer-create-reference-section">
              <label className="transfer-create-section-label">Reference</label>
              <input
                type="text"
                className="transfer-create-reference-input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Enter transfer reference"
                disabled={productsLoading}
              />
            </div>
          </div>

          <div className="transfer-create-middle-section">
            <div className="transfer-create-notes-section">
              <label className="transfer-create-section-label">Notes</label>
              <textarea
                className="transfer-create-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes for this transfer..."
                rows="2"
                disabled={productsLoading}
              />
            </div>
          </div>

          <div className="transfer-create-items-section">
            <div className="transfer-create-items-header">
              <h3 className="transfer-create-section-label">Items to Transfer</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Category Filter Button - UPDATED with proper structure */}
                <div className="transfer-create-category-selector">
                  <button 
                    className="transfer-create-category-btn"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  >
                    <FaFilter style={{ color: '#059669' }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      {selectedCategory?.categoryName || 'All Categories'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>▼</span>
                  </button>
                  
                  {isCategoryDropdownOpen && (
                    <div className="transfer-create-category-dropdown">
                      {isLoadingCategories ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                          Loading categories...
                        </div>
                      ) : (
                        <>
                          {/* All Categories option */}
                          <div
                            className={`transfer-create-category-dropdown-item ${selectedCategory?.categoryId === 'all' ? 'selected' : ''}`}
                            onClick={() => filterProductsByCategory({ categoryId: 'all', categoryName: 'All Categories' })}
                          >
                            All Categories
                            {selectedCategory?.categoryId === 'all' && (
                              <FaCheck className="transfer-create-category-check" />
                            )}
                          </div>
                          
                          {/* No Category option */}
                          <div
                            className={`transfer-create-category-dropdown-item ${selectedCategory?.categoryId === 'no-category' ? 'selected' : ''}`}
                            onClick={() => filterProductsByCategory({ categoryId: 'no-category', categoryName: 'No Category' })}
                          >
                            No Category
                            {selectedCategory?.categoryId === 'no-category' && (
                              <FaCheck className="transfer-create-category-check" />
                            )}
                          </div>
                          
                          {/* Regular categories */}
                          {categories
                            .filter(cat => cat.categoryId !== 'all' && cat.categoryId !== 'no-category')
                            .map(category => (
                              <div
                                key={category.categoryId}
                                className={`transfer-create-category-dropdown-item ${selectedCategory?.categoryId === category.categoryId ? 'selected' : ''}`}
                                onClick={() => filterProductsByCategory(category)}
                              >
                                {category.categoryName}
                                {selectedCategory?.categoryId === category.categoryId && (
                                  <FaCheck className="transfer-create-category-check" />
                                )}
                              </div>
                            ))
                          }
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="transfer-create-search-container">
                  <div className="transfer-create-search-input-wrapper">
                    <FaSearch className="transfer-create-search-icon" />
                    <input
                      type="text"
                      className="transfer-create-search-input"
                      placeholder={productsLoading ? "Loading products..." : "Search item by name, SKU, or category..."}
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={handleSearchFocus}
                      disabled={productsLoading}
                    />
                    {searchTerm && !productsLoading && (
                      <button 
                        className="transfer-create-clear-search-btn"
                        onClick={handleClearSearch}
                      >
                        <FaTimesCircle />
                      </button>
                    )}
                    {productsLoading && (
                      <div className="transfer-create-search-loading">
                        <FaSpinner className="transfer-create-search-loading-icon" />
                      </div>
                    )}
                  </div>
                  
                  {showSearchResults && !productsLoading && (
                    <div className="transfer-create-search-results-dropdown">
                      <div className="transfer-create-search-actions-header">
                        <button 
                          className="transfer-create-select-all-btn"
                          onClick={handleSelectAllSearchResults}
                        >
                          <FaCheck /> Select All
                        </button>
                        <button 
                          className="transfer-create-clear-selection-btn"
                          onClick={handleClearSearchSelection}
                        >
                          <FaTimesCircle /> Clear
                        </button>
                        <button 
                          className="transfer-create-close-popup-btn"
                          onClick={() => setShowSearchResults(false)}
                        >
                          <FaTimes /> Close
                        </button>
                      </div>
                      
                      <div className="transfer-create-search-results-list">
                        {searchResults.length > 0 ? (
                          searchResults.map(product => {
                            const isSelected = searchSelected.has(product.productId);
                            const isAlreadyAdded = selectedItems.some(item => item.productId === product.productId);
                            
                            return (
                              <div 
                                key={product.productId}
                                className={`transfer-create-search-result-item ${isSelected ? 'transfer-create-search-result-selected' : ''} ${isAlreadyAdded ? 'transfer-create-search-result-added' : ''}`}
                                onClick={(e) => {
                                  if (e.target.type !== 'checkbox' && !isAlreadyAdded && !productsLoading) {
                                    handleSearchSelectToggle(product.productId);
                                  }
                                }}
                              >
                                <div className="transfer-create-result-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => !productsLoading && handleSearchSelectToggle(product.productId)}
                                    disabled={isAlreadyAdded || productsLoading}
                                  />
                                </div>
                                <div className="transfer-create-result-product-info">
                                  <div className="transfer-create-result-product-name">
                                    {product.productName}
                                    {getProductTypeIcon(product.productType)}
                                    {isAlreadyAdded && (
                                      <span className="transfer-create-already-added-badge">Already Added</span>
                                    )}
                                  </div>
                                  <div className="transfer-create-result-product-details">
                                    SKU: {product.sku} | Category: {product.category || 'No Category'} | Available: {product.stock || 0}
                                  </div>
                                </div>
                                <div className="transfer-create-result-product-price">
                                  <div>Price: ${formatDecimal(product.price)}</div>
                                  <div>Cost: ${formatDecimal(product.cost)}</div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="transfer-create-no-results">No products found</div>
                        )}
                      </div>
                      
                      {searchSelected.size > 0 && (
                        <div className="transfer-create-search-actions-footer">
                          <button 
                            className="transfer-create-add-selected-btn"
                            onClick={handleAddSelectedProducts}
                            disabled={productsLoading}
                          >
                            <FaPlus /> Add Selected ({getTotalSelectedCount()})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="transfer-create-items-table-container">
              <div className="transfer-create-items-table-header">
                <div className="transfer-create-table-header-cell">Item</div>
                <div className="transfer-create-table-header-cell">Available Stock</div>
                <div className="transfer-create-table-header-cell">Qty to Transfer</div>
                <div className="transfer-create-table-header-cell">Unit Cost</div>
                <div className="transfer-create-table-header-cell">Total Value</div>
                <div className="transfer-create-table-header-cell">Actions</div>
              </div>
              
              <div className="transfer-create-items-table-body">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <div key={item.productId} className="transfer-create-item-row">
                      <div className="transfer-create-item-info">
                        <div className="transfer-create-item-name">
                          {item.productName}
                          {getProductTypeIcon(item.productType)}
                        </div>
                        <div className="transfer-create-item-details">
                          SKU: {item.sku} 
                        </div>
                      </div>
                      <div className="transfer-create-item-available-stock">
                        {formatDisplay(item.existingStock, item.productType)}
                      </div>
                      <div className="transfer-create-item-quantity">
                        <input
                          type="text"
                          inputMode={item.productType === 'Weight' ? 'decimal' : 'numeric'}
                          className="transfer-create-quantity-input"
                          value={item.transferQuantity}
                          onChange={(e) => !productsLoading && handleQuantityChange(item.productId, e.target.value)}
                          placeholder={item.productType === 'Weight' ? '0.00' : '0'}
                          disabled={productsLoading}
                        />
                      </div>
                      <div className="transfer-create-item-unit-cost">
                        ${formatDecimal(item.unitCost)}
                      </div>
                      <div className="transfer-create-item-total">
                        ${formatDecimal(item.totalValue)}
                      </div>
                      <div className="transfer-create-item-actions">
                        <button 
                          className="transfer-create-remove-btn"
                          onClick={() => !productsLoading && handleRemoveProduct(item.productId)}
                          disabled={productsLoading}
                        >
                          <FaTimesCircle />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="transfer-create-empty-message">
                    <FaBox className="transfer-create-empty-icon" />
                    <p>{productsLoading ? 'Loading products...' : 'No items added. Use the search above to add items.'}</p>
                    {products.length === 0 && !productsLoading && (
                      <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                        No products available for this store.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {selectedItems.length > 0 && (
                <div className="transfer-create-totals-row">
                  <div className="transfer-create-total-label">
                    Total Value:
                  </div>
                  <div className="transfer-create-total-spacer-1"></div>
                  <div className="transfer-create-total-spacer-2"></div>
                  <div className="transfer-create-total-spacer-3"></div>
                  <div className="transfer-create-total-value">
                    ${formatDecimal(calculateTotalValue())}
                  </div>
                  <div className="transfer-create-total-spacer-4"></div>
                </div>
              )}
            </div>
          </div>

          <div className="transfer-create-action-buttons">
            <button 
              className="transfer-create-cancel-btn" 
              onClick={handleCancel}
              disabled={productsLoading || loading}
            >
              CANCEL
            </button>
            <button 
              className="transfer-create-save-btn" 
              onClick={handleSaveAndProcess}
              disabled={productsLoading || loading || selectedItems.length === 0 || !fromStore || !toStoreName.trim() || hasInvalidQuantities()}
            >
              {loading ? (
                <>
                  <FaSpinner className="transfer-create-save-spinner" />
                  SAVING...
                </>
              ) : productsLoading ? (
                <>
                  <FaSpinner className="transfer-create-save-spinner" />
                  LOADING...
                </>
              ) : (
                'SAVE & PROCESS'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStockTransferScreen;