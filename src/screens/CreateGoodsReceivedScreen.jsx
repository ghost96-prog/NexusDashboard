import React, { useState, useEffect } from 'react';
import '../Css/CreateGoodsReceivedScreen.css';
import { useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaSearch,
  FaPlus,
  FaMinus,
  FaTimesCircle,
  FaStore,
  FaFileInvoice,
  FaBox,
  FaDollarSign,
  FaCheck,
  FaWeight,
  FaSpinner,
  FaFilter
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const CreateGoodsReceivedScreen = () => {
  const [grvSidebarOpen, setGrvSidebarOpen] = useState(false);
  const [grvNotes, setGrvNotes] = useState('');
  const [grvSearchTerm, setGrvSearchTerm] = useState('');
  const [grvShowSearchResults, setGrvShowSearchResults] = useState(false);
  const [grvSelectedItems, setGrvSelectedItems] = useState([]);
  const [grvSearchResults, setGrvSearchResults] = useState([]);
  const [grvProducts, setGrvProducts] = useState([]);
  const [grvLoading, setGrvLoading] = useState(false);
  const [grvEmail, setGrvEmail] = useState(null);
  const [grvSelectedStore, setGrvSelectedStore] = useState(null);
  const [grvStores, setGrvStores] = useState([]);
  const [grvSupplierName, setGrvSupplierName] = useState('');
  const [grvPoNumber, setGrvPoNumber] = useState('');
  const [grvDeliveryNote, setGrvDeliveryNote] = useState('');
  const [grvSearchSelected, setGrvSearchSelected] = useState(new Set());
  const [showProductsLoading, setShowProductsLoading] = useState(false);
  const [productsLoadingMessage, setProductsLoadingMessage] = useState('Loading products...');
  
  // New state for category filtering
  const [grvCategories, setGrvCategories] = useState([]);
  const [grvSelectedCategory, setGrvSelectedCategory] = useState(null);
  const [grvIsCategoryDropdownOpen, setGrvIsCategoryDropdownOpen] = useState(false);
  const [grvIsLoadingCategories, setGrvIsLoadingCategories] = useState(false);
  
  const navigate = useNavigate();

  // Format number with 2 decimal places
  const formatDecimal = (value) => {
    if (value === '' || value === null || value === undefined) return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toFixed(2);
  };

  // Format number for display (with commas for weight)
  const formatDisplay = (value, productType) => {
    if (value === '' || value === null || value === undefined) return '';
    if (productType === 'Weight') {
      // For weight, allow decimals and format with commas for thousands
      const num = parseFloat(value);
      if (isNaN(num)) return '';
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      });
    } else {
      // For Each, just show as integer
      const num = parseInt(value);
      return isNaN(num) ? '' : num.toString();
    }
  };

  // Parse input value (allow comma for weight products)
  const parseInputValue = (value, productType) => {
    if (value === '') return '';
    
    if (productType === 'Weight') {
      // Remove all non-digit, comma, or dot characters, then replace comma with dot
      const cleaned = value.replace(/[^\d.,]/g, '').replace(/,/g, '.');
      // Ensure only one decimal point
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      return cleaned;
    } else {
      // For Each, only allow digits
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
      setGrvEmail(decoded.email);
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, [navigate]);

  useEffect(() => {
    if (grvEmail) {
      fetchGrvStores();
    }
  }, [grvEmail]);

  useEffect(() => {
    if (grvSelectedStore) {
      fetchGrvProducts();
      fetchGrvCategories(); // Fetch categories when store changes
    }
  }, [grvSelectedStore]);

  const fetchGrvStores = async () => {
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
      setGrvStores(data || []);
      
      if (data.length > 0) {
        setGrvSelectedStore(data[0]);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("An error occurred while fetching stores.");
    }
  };

  const fetchGrvProducts = async () => {
    try {
      NProgress.start();
      setShowProductsLoading(true);
      setProductsLoadingMessage('Loading products...');
      setGrvLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        NProgress.done();
        setShowProductsLoading(false);
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId;

      setProductsLoadingMessage('Connecting to server...');

      const response = await fetch(
        `https://nexuspos.onrender.com/api/productRouter/products?email=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
        toast.error("Failed to fetch products.");
        NProgress.done();
        setShowProductsLoading(false);
        return;
      }

      setProductsLoadingMessage('Processing product data...');

      const responseData = await response.json();
      
      // Filter products for the current user and selected store
      const filteredProducts = responseData.data.filter(product => 
        product.userId === userId
      );

      filteredProducts.sort((a, b) => 
        a.productName?.localeCompare(b.productName || '')
      );

      setGrvProducts(filteredProducts);
      setGrvLoading(false);
      setShowProductsLoading(false);
      NProgress.done();
      
      toast.success(`Loaded ${filteredProducts.length} products`);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("An error occurred while fetching products.");
      setGrvLoading(false);
      setShowProductsLoading(false);
      NProgress.done();
    }
  };

  // Fetch categories function - UPDATED to include "No Category"
  const fetchGrvCategories = async () => {
    try {
      setGrvIsLoadingCategories(true);
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
        setGrvCategories(allCategories);
        setGrvSelectedCategory(allCategories[0]); // Default to "All Categories"
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("An error occurred while fetching categories.");
    } finally {
      setGrvIsLoadingCategories(false);
    }
  };

  // Filter products by category function - UPDATED to handle "No Category"
  const filterProductsByCategory = (category) => {
    setGrvSelectedCategory(category);
    setGrvIsCategoryDropdownOpen(false);
    
    // Filter products based on selected category
    let filteredResults;
    
    if (category.categoryId === "all") {
      // Show all products not already added
      filteredResults = grvProducts.filter(product =>
        !grvSelectedItems.some(item => item.productId === product.productId)
      );
    } else if (category.categoryId === "no-category") {
      // Filter products with no category (null, empty, or "No Category")
      filteredResults = grvProducts.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory && !grvSelectedItems.some(item => item.productId === product.productId);
      });
    } else {
      // Filter by selected category
      filteredResults = grvProducts.filter(product =>
        product.category === category.categoryName &&
        !grvSelectedItems.some(item => item.productId === product.productId)
      );
    }
    
    setGrvSearchResults(filteredResults);
    setGrvShowSearchResults(true);
    setGrvSearchTerm(''); // Clear search term when filtering by category
  };

  // Handle search when term changes - UPDATED to handle "No Category"
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim() === '') {
      // Show products based on selected category
      let baseProducts;
      if (grvSelectedCategory?.categoryId === "all") {
        baseProducts = grvProducts;
      } else if (grvSelectedCategory?.categoryId === "no-category") {
        // Filter products with no category
        baseProducts = grvProducts.filter(product => {
          const hasNoCategory = !product.category || 
                               product.category.trim() === '' || 
                               product.category.toUpperCase() === 'NO CATEGORY' ||
                               product.category.toUpperCase() === 'NO CATEGORY';
          return hasNoCategory;
        });
      } else {
        baseProducts = grvProducts.filter(product => 
          product.category === grvSelectedCategory?.categoryName
        );
      }
      
      const allResults = baseProducts.filter(product =>
        !grvSelectedItems.some(item => item.productId === product.productId)
      );
      setGrvSearchResults(allResults);
      setGrvShowSearchResults(allResults.length > 0);
      return;
    }

    // Filter by search term AND current category
    let categoryFiltered = grvProducts;
    if (grvSelectedCategory?.categoryId === "no-category") {
      // Filter products with no category
      categoryFiltered = grvProducts.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory;
      });
    } else if (grvSelectedCategory?.categoryId !== "all") {
      categoryFiltered = grvProducts.filter(product => 
        product.category === grvSelectedCategory?.categoryName
      );
    }

    const filtered = categoryFiltered.filter(product =>
      (product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toString().includes(searchTerm) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !grvSelectedItems.some(item => item.productId === product.productId)
    );

    setGrvSearchResults(filtered);
    setGrvShowSearchResults(filtered.length > 0);
  };

  // Handle click outside to close search results and category dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.grv-create-search-container');
      const searchResults = document.querySelector('.grv-create-search-results-dropdown');
      const categoryDropdown = document.querySelector('.grv-create-category-dropdown');
      const categoryBtn = document.querySelector('.grv-create-category-btn');
      
      if (
        searchContainer && 
        searchResults && 
        !searchContainer.contains(event.target) && 
        !searchResults.contains(event.target)
      ) {
        // Just hide the results, don't clear selections
        setGrvShowSearchResults(false);
      }
      
      // Close category dropdown when clicking outside
      if (
        grvIsCategoryDropdownOpen &&
        categoryDropdown &&
        !categoryDropdown.contains(event.target) &&
        categoryBtn &&
        !categoryBtn.contains(event.target)
      ) {
        setGrvIsCategoryDropdownOpen(false);
      }
    };

    // Add event listener only when search results are shown
    if (grvShowSearchResults || grvIsCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [grvShowSearchResults, grvIsCategoryDropdownOpen]);

  const toggleGrvSidebar = () => {
    setGrvSidebarOpen(!grvSidebarOpen);
  };

  // Handle multi-select toggle in search results
  const handleSearchSelectToggle = (productId) => {
    const newSelected = new Set(grvSearchSelected);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setGrvSearchSelected(newSelected);
  };

  // Add selected products from search to GRV
  const handleAddSelectedProducts = () => {
    if (grvSearchSelected.size === 0) {
      toast.error('No products selected.');
      return;
    }

    // Get ALL products that are selected, not just from search results
    const selectedProducts = grvProducts.filter(product => 
      grvSearchSelected.has(product.productId) && 
      !grvSelectedItems.some(item => item.productId === product.productId) // Check not already added
    );

    if (selectedProducts.length === 0) {
      toast.error('All selected products are already added to GRV.');
      setGrvSearchSelected(new Set());
      return;
    }

    const newItems = selectedProducts.map(product => ({
      ...product,
      receivedQuantity: '',
      unitCost: formatDecimal(product.cost || 0), // NON-EDITABLE - display only
      totalPrice: 0,
      newPrice: formatDecimal(product.price || 0),
      newCost: formatDecimal(product.cost || 0), // EDITABLE - used for calculations
      existingStock: product.stock || 0
    }));

    const updatedSelectedItems = [...grvSelectedItems, ...newItems];
    setGrvSelectedItems(updatedSelectedItems);
    
    // Clear search selection and close popup
    setGrvSearchSelected(new Set());
    setGrvShowSearchResults(false);
    setGrvSearchTerm('');
    
    toast.success(`Added ${newItems.length} product(s) to GRV.`);
  };

  // Single product selection
  const handleGrvSelectProduct = (product) => {
    const isAlreadySelected = grvSelectedItems.some(
      item => item.productId === product.productId
    );
    
    if (isAlreadySelected) {
      toast.info('This product is already added to the GRV.');
      return;
    }

    const newItem = {
      ...product,
      receivedQuantity: '',
      unitCost: formatDecimal(product.cost || 0), // NON-EDITABLE - display only
      totalPrice: 0,
      newPrice: formatDecimal(product.price || 0),
      newCost: formatDecimal(product.cost || 0), // EDITABLE - used for calculations
      existingStock: product.stock || 0
    };

    const newSelectedItems = [...grvSelectedItems, newItem];
    setGrvSelectedItems(newSelectedItems);
    
    setGrvShowSearchResults(false);
    setGrvSearchTerm('');
    
    toast.success(`Added "${product.productName}" to GRV.`);
  };

  const handleGrvRemoveProduct = (productId) => {
    const newSelectedItems = grvSelectedItems.filter(item => item.productId !== productId);
    setGrvSelectedItems(newSelectedItems);
  };

  const handleQuantityChange = (productId, value) => {
    const item = grvSelectedItems.find(item => item.productId === productId);
    if (!item) return;

    const parsedValue = parseInputValue(value, item.productType);
    
    // For weight products, ensure we keep decimal if user enters it
    let displayValue = parsedValue;
    if (item.productType === 'Weight' && parsedValue.includes('.')) {
      // Keep the decimal format for display
      displayValue = parsedValue;
    }
    
    setGrvSelectedItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? {
              ...item,
              receivedQuantity: parsedValue, // Store the raw parsed value
              // Use NEW COST for calculation (editable field)
              totalPrice: (parseFloat(parsedValue) || 0) * (parseFloat(item.newCost) || 0)
            }
          : item
      )
    );
  };

  const handlePriceChange = (productId, priceType, value) => {
    // For prices, always allow decimal with 2 places
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    } else if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setGrvSelectedItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? {
              ...item,
              [priceType === 'unitCost' ? 'unitCost' : 
               priceType === 'newPrice' ? 'newPrice' : 
               'newCost']: value,
              // Update total when newCost changes
              totalPrice: priceType === 'newCost' 
                ? (parseFloat(item.receivedQuantity) || 0) * (parseFloat(value) || 0)
                : item.totalPrice
            }
          : item
      )
    );
  };

  const calculateTotalValue = () => {
    return grvSelectedItems.reduce((total, item) => total + (parseFloat(item.totalPrice) || 0), 0);
  };

  // Check if any item has invalid quantity (0 or empty)
  const hasInvalidQuantities = () => {
    return grvSelectedItems.some(item => {
      const quantity = parseFloat(item.receivedQuantity) || 0;
      return quantity <= 0;
    });
  };

  // Check if any item has invalid NEW cost (0 or empty)
  const hasInvalidUnitPrices = () => {
    return grvSelectedItems.some(item => {
      const newCost = parseFloat(item.newCost) || 0;
      return newCost <= 0;
    });
  };

  const handleGrvSaveAndProcess = async () => {
    if (!grvSupplierName.trim()) {
      toast.error('Please enter supplier name.');
      return;
    }

    if (grvSelectedItems.length === 0) {
      toast.error('Please add at least one item to the GRV.');
      return;
    }

    // Check for invalid quantities
    if (hasInvalidQuantities()) {
      toast.error('Please enter valid quantity (greater than 0) for all items.');
      return;
    }

    // Check for invalid NEW costs
    if (hasInvalidUnitPrices()) {
      toast.error('Please enter valid cost (greater than 0) for all items.');
      return;
    }

    // Prepare GRV data with correct structure
    const grvData = {
      grNumber: `GRV-${Date.now()}`,
      poNumber: grvPoNumber,
      supplierName: grvSupplierName,
      deliveryNote: grvDeliveryNote,
      notes: grvNotes,
      items: grvSelectedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productType: item.productType,
        sku: item.sku,
        category: item.category,
        existingStock: item.existingStock || 0,
        receivedQuantity: parseFloat(item.receivedQuantity) || 0,
        unitCost: parseFloat(item.unitCost) || 0,
        newCost: parseFloat(item.newCost) || 0,
        totalPrice: parseFloat(item.totalPrice) || 0,
        newPrice: parseFloat(item.newPrice) || 0,
        storeId: grvSelectedStore?.storeId,
        currentPrice: parseFloat(item.price) || 0,
        currentCost: parseFloat(item.cost) || 0,
        currentStock: item.existingStock || 0,
        EditorId: item.EditorId || '',
        adminSynced: item.adminSynced || false
      })),
      totalValue: calculateTotalValue(),
      storeId: grvSelectedStore?.storeId,
      storeName: grvSelectedStore?.storeName,
      createdBy: grvEmail,
      dateCreated: new Date().toISOString(),
      status: 'Draft',
      userId: grvSelectedItems[0]?.userId || ''
    };

    console.log('GRV Data to save locally:', grvData);
    
    // OPTION A: Save to localStorage (temporary)
    try {
      // Generate a local ID
      const localGrvId = `local-grv-${Date.now()}`;
      grvData.localId = localGrvId;
      
      // Save to localStorage
      localStorage.setItem(localGrvId, JSON.stringify(grvData));
      
      // Also save to a list of GRVs in localStorage
      const existingGrvs = JSON.parse(localStorage.getItem('localGrvs') || '[]');
      existingGrvs.push({
        id: localGrvId,
        grNumber: grvData.grNumber,
        supplierName: grvData.supplierName,
        totalValue: grvData.totalValue,
        status: 'Draft',
        dateCreated: new Date().toISOString(),
        itemsCount: grvData.items.length
      });
      localStorage.setItem('localGrvs', JSON.stringify(existingGrvs));
      
      toast.success('GRV saved locally!');
      
      // Navigate to Process screen with local data
      navigate('/process-grv', { 
        state: { 
          grvData: grvData, // Pass the full data
          isLocal: true // Flag to indicate it's local
        } 
      });
      
    } catch (error) {
      console.error('Error saving GRV locally:', error);
      toast.error('Failed to save GRV locally.');
    }
  };

  const handleGrvCancel = () => {
    navigate('/goods-received');
  };

  // Clear all search selections
  const handleClearSearchSelection = () => {
    setGrvSearchSelected(new Set());
  };

  // Select all in search results
  const handleSelectAllSearchResults = () => {
    const allIds = new Set(grvSearchResults.map(product => product.productId));
    setGrvSearchSelected(allIds);
  };

  // Get product type icon
  const getProductTypeIcon = (productType) => {
    return productType === 'Weight' ? <FaWeight title="Weight Product" style={{ color: '#5694e6', marginLeft: '4px' }} /> : null;
  };

  // Clear search input but keep popup open showing all items - UPDATED to handle "No Category"
  const handleClearSearch = () => {
    setGrvSearchTerm('');
    // Show ALL products that are not already added to GRV based on selected category
    let baseProducts;
    if (grvSelectedCategory?.categoryId === "all") {
      baseProducts = grvProducts;
    } else if (grvSelectedCategory?.categoryId === "no-category") {
      // Filter products with no category
      baseProducts = grvProducts.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory;
      });
    } else {
      baseProducts = grvProducts.filter(product => 
        product.category === grvSelectedCategory?.categoryName
      );
    }
    
    const allResults = baseProducts.filter(product =>
      !grvSelectedItems.some(item => item.productId === product.productId)
    );
    setGrvSearchResults(allResults);
    setGrvShowSearchResults(true);
  };

  // Handle search input focus - UPDATED to handle "No Category"
  const handleSearchFocus = () => {
    // Show all items not yet added based on selected category
    let baseProducts;
    if (grvSelectedCategory?.categoryId === "all") {
      baseProducts = grvProducts;
    } else if (grvSelectedCategory?.categoryId === "no-category") {
      // Filter products with no category
      baseProducts = grvProducts.filter(product => {
        const hasNoCategory = !product.category || 
                             product.category.trim() === '' || 
                             product.category.toUpperCase() === 'NO CATEGORY' ||
                             product.category.toUpperCase() === 'NO CATEGORY';
        return hasNoCategory;
      });
    } else {
      baseProducts = grvProducts.filter(product => 
        product.category === grvSelectedCategory?.categoryName
      );
    }
    
    const filteredResults = baseProducts.filter(product =>
      !grvSelectedItems.some(item => item.productId === product.productId)
    );
    
    if (filteredResults.length > 0) {
      setGrvSearchResults(filteredResults);
      setGrvShowSearchResults(true);
    }
  };

  // Get ALL selected products count (even if not in current search results)
  const getTotalSelectedCount = () => {
    // Count all selected products that aren't already added to GRV
    const allSelectedProducts = grvProducts.filter(product => 
      grvSearchSelected.has(product.productId) && 
      !grvSelectedItems.some(item => item.productId === product.productId)
    );
    return allSelectedProducts.length;
  };

  // Handle search input change
  const handleSearchChange = (value) => {
    setGrvSearchTerm(value);
    handleSearch(value);
  };

  // Effect to update search results when products, selected items, or selected category change
  useEffect(() => {
    if (grvShowSearchResults) {
      handleSearch(grvSearchTerm);
    }
  }, [grvProducts, grvSelectedItems, grvSelectedCategory]);

  return (
    <div className="grv-create-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Products Loading Modal */}
      {showProductsLoading && (
        <div className="grv-create-loading-modal">
          <div className="grv-create-loading-modal-content">
            <div className="grv-create-loading-spinner">
              <FaSpinner className="grv-create-loading-icon" />
            </div>
            <h3 className="grv-create-loading-title">Loading Products</h3>
            <p className="grv-create-loading-message">{productsLoadingMessage}</p>
            <div className="grv-create-loading-progress">
              <div className="grv-create-loading-progress-bar"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grv-create-sidebar-toggle-wrapper">
        <button 
          className="grv-create-sidebar-toggle"
          onClick={toggleGrvSidebar}
          style={{ left: grvSidebarOpen ? '280px' : '80px' }}
        >
          {grvSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
        
      <Sidebar isOpen={grvSidebarOpen} toggleSidebar={toggleGrvSidebar} />
      
      <div className={`grv-create-content ${grvSidebarOpen ? 'grv-create-shifted' : 'grv-create-collapsed'}`}>
        <div className="grv-create-container">
          <div className="grv-create-header">
            <h2>Create Goods Received Voucher</h2>
            <div className="grv-create-progress">
              <span className="grv-create-progress-text">
                {grvSelectedItems.length} items selected
              </span>
            </div>
          </div>

          <div className="grv-create-top-section">
            <div className="grv-create-supplier-section">
              <label className="grv-create-section-label">Supplier Name *</label>
              <div className="grv-create-supplier-input-wrapper">
                <FaFileInvoice className="grv-create-supplier-icon" />
                <input
                  type="text"
                  className="grv-create-supplier-input"
                  value={grvSupplierName}
                  onChange={(e) => setGrvSupplierName(e.target.value)}
                  placeholder="Enter supplier name"
                  required
                />
              </div>
            </div>

            <div className="grv-create-po-section">
              <label className="grv-create-section-label">PO Number</label>
              <input
                type="text"
                className="grv-create-po-input"
                value={grvPoNumber}
                onChange={(e) => setGrvPoNumber(e.target.value)}
                placeholder="Enter purchase order number"
              />
            </div>
          </div>

          <div className="grv-create-middle-section">
            <div className="grv-create-store-section">
              <label className="grv-create-section-label">Store:</label>
              <div className="grv-create-store-selector">
                <FaStore className="grv-create-store-icon" />
                <select 
                  className="grv-create-store-select"
                  value={grvSelectedStore?.storeId || ''}
                  onChange={(e) => {
                    const store = grvStores.find(s => s.storeId === e.target.value);
                    setGrvSelectedStore(store);
                  }}
                >
                  {grvStores.map(store => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.storeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grv-create-delivery-section">
              <label className="grv-create-section-label">Delivery Note</label>
              <input
                type="text"
                className="grv-create-delivery-input"
                value={grvDeliveryNote}
                onChange={(e) => setGrvDeliveryNote(e.target.value)}
                placeholder="Enter delivery note number"
              />
            </div>

            <div className="grv-create-notes-section">
              <label className="grv-create-section-label">Notes</label>
              <textarea
                className="grv-create-notes-input"
                value={grvNotes}
                onChange={(e) => setGrvNotes(e.target.value)}
                placeholder="Enter notes for this GRV..."
                rows="2"
              />
            </div>
          </div>

          <div className="grv-create-items-section">
            <div className="grv-create-items-header">
              <h3 className="grv-create-section-label">Items Received</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Category Filter Button */}
                <div className="grv-create-category-selector" style={{ position: 'relative' }}>
                  <button 
                    className="grv-create-category-btn"
                    onClick={() => setGrvIsCategoryDropdownOpen(!grvIsCategoryDropdownOpen)}
                  >
                    <FaFilter style={{ color: '#5694e6' }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      {grvSelectedCategory?.categoryName || 'All Categories'}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>▼</span>
                  </button>
                  
                  {grvIsCategoryDropdownOpen && (
                    <div className="grv-create-category-dropdown">
                      {grvIsLoadingCategories ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                          Loading categories...
                        </div>
                      ) : (
                        <>
                          {/* All Categories option */}
                          <div
                            className={`grv-create-category-dropdown-item ${grvSelectedCategory?.categoryId === 'all' ? 'selected' : ''}`}
                            onClick={() => filterProductsByCategory({ categoryId: 'all', categoryName: 'All Categories' })}
                          >
                            All Categories
                            {grvSelectedCategory?.categoryId === 'all' && (
                              <FaCheck className="grv-create-category-check" />
                            )}
                          </div>
                          
                          {/* No Category option */}
                          <div
                            className={`grv-create-category-dropdown-item ${grvSelectedCategory?.categoryId === 'no-category' ? 'selected' : ''}`}
                            onClick={() => filterProductsByCategory({ categoryId: 'no-category', categoryName: 'No Category' })}
                          >
                            No Category
                            {grvSelectedCategory?.categoryId === 'no-category' && (
                              <FaCheck className="grv-create-category-check" />
                            )}
                          </div>
                          
                          {/* Regular categories */}
                          {grvCategories
                            .filter(cat => cat.categoryId !== 'all' && cat.categoryId !== 'no-category')
                            .map(category => (
                              <div
                                key={category.categoryId}
                                className={`grv-create-category-dropdown-item ${grvSelectedCategory?.categoryId === category.categoryId ? 'selected' : ''}`}
                                onClick={() => filterProductsByCategory(category)}
                              >
                                {category.categoryName}
                                {grvSelectedCategory?.categoryId === category.categoryId && (
                                  <FaCheck className="grv-create-category-check" />
                                )}
                              </div>
                            ))
                          }
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grv-create-search-container">
                  <div className="grv-create-search-input-wrapper">
                    <FaSearch className="grv-create-search-icon" />
                    <input
                      type="text"
                      className="grv-create-search-input"
                      placeholder="Search item by name, SKU, or category..."
                      value={grvSearchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={handleSearchFocus}
                    />
                    {grvSearchTerm && (
                      <button 
                        className="grv-create-clear-search-btn"
                        onClick={handleClearSearch}
                      >
                        <FaTimesCircle />
                      </button>
                    )}
                  </div>
                  
                  {grvShowSearchResults && (
                    <div className="grv-create-search-results-dropdown">
                      <div className="grv-create-search-actions-header">
                        <button 
                          className="grv-create-select-all-btn"
                          onClick={handleSelectAllSearchResults}
                        >
                          <FaCheck /> Select All
                        </button>
                        <button 
                          className="grv-create-clear-selection-btn"
                          onClick={handleClearSearchSelection}
                        >
                          <FaTimesCircle /> Clear
                        </button>
                        <button 
                          className="grv-create-close-popup-btn"
                          onClick={() => setGrvShowSearchResults(false)}
                        >
                          <FaTimes /> Close
                        </button>
                      </div>
                      
                      <div className="grv-create-search-results-list">
                        {grvSearchResults.length > 0 ? (
                          grvSearchResults.map(product => {
                            const isSelected = grvSearchSelected.has(product.productId);
                            const isAlreadyAdded = grvSelectedItems.some(item => item.productId === product.productId);
                            
                            return (
                              <div 
                                key={product.productId}
                                className={`grv-create-search-result-item ${isSelected ? 'grv-create-search-result-selected' : ''} ${isAlreadyAdded ? 'grv-create-search-result-added' : ''}`}
                                onClick={(e) => {
                                  if (e.target.type !== 'checkbox' && !isAlreadyAdded) {
                                    handleSearchSelectToggle(product.productId);
                                  }
                                }}
                              >
                                <div className="grv-create-result-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSearchSelectToggle(product.productId)}
                                    disabled={isAlreadyAdded}
                                  />
                                </div>
                                <div className="grv-create-result-product-info">
                                  <div className="grv-create-result-product-name">
                                    {product.productName}
                                    {getProductTypeIcon(product.productType)}
                                    {isAlreadyAdded && (
                                      <span className="grv-create-already-added-badge">Already Added</span>
                                    )}
                                  </div>
                                  <div className="grv-create-result-product-details">
                                    SKU: {product.sku} | Category: {product.category || 'No Category'} | Stock: {product.stock || 0}
                                  </div>
                                </div>
                                <div className="grv-create-result-product-price">
                                  <div>Price: ${formatDecimal(product.price)}</div>
                                  <div>Cost: ${formatDecimal(product.cost)}</div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="grv-create-no-results">No products found</div>
                        )}
                      </div>
                      
                      {grvSearchSelected.size > 0 && (
                        <div className="grv-create-search-actions-footer">
                          <button 
                            className="grv-create-add-selected-btn"
                            onClick={handleAddSelectedProducts}
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

            <div className="grv-create-items-table-container">
              <div className="grv-create-items-table-header">
                <div className="grv-create-table-header-cell">Item</div>
                <div className="grv-create-table-header-cell">Existing Stock</div>
                <div className="grv-create-table-header-cell">Qty Received</div>
                <div className="grv-create-table-header-cell">Unit Cost</div>
                <div className="grv-create-table-header-cell">Total</div>
                <div className="grv-create-table-header-cell">New Selling Price</div>
                <div className="grv-create-table-header-cell">Original Cost</div>
                <div className="grv-create-table-header-cell">Actions</div>
              </div>
              
              <div className="grv-create-items-table-body">
                {grvSelectedItems.length > 0 ? (
                  grvSelectedItems.map((item, index) => (
                    <div key={item.productId} className="grv-create-item-row">
                      <div className="grv-create-item-info">
                        <div className="grv-create-item-name">
                          {item.productName}
                          {getProductTypeIcon(item.productType)}
                        </div>
                        <div className="grv-create-item-details">
                          SKU: {item.sku} 
                        </div>
                      </div>
                      <div className="grv-create-item-existing-stock">
                        {formatDisplay(item.existingStock, item.productType)}
                      </div>
                      <div className="grv-create-item-quantity">
                        <input
                          type="text"
                          inputMode={item.productType === 'Weight' ? 'decimal' : 'numeric'}
                          className="grv-create-quantity-input"
                          value={item.receivedQuantity}
                          onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                          placeholder={item.productType === 'Weight' ? '0.00' : '0'}
                        />
                      </div>
                      {/* UNIT COST - EDITABLE (comes after Qty Received) */}
                      <div className="grv-create-item-unit-cost">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="grv-create-price-input"
                          value={item.newCost}
                          onChange={(e) => handlePriceChange(item.productId, 'newCost', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grv-create-item-total">
                        {formatDecimal(item.totalPrice)}
                      </div>
                      <div className="grv-create-item-new-price">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="grv-create-price-input"
                          value={item.newPrice}
                          onChange={(e) => handlePriceChange(item.productId, 'newPrice', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      {/* COST - NON-EDITABLE (original cost) */}
                      <div className="grv-create-item-cost">
                        {formatDecimal(item.cost)}
                      </div>
                      <div className="grv-create-item-actions">
                        <button 
                          className="grv-create-remove-btn"
                          onClick={() => handleGrvRemoveProduct(item.productId)}
                        >
                          <FaTimesCircle />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grv-create-empty-message">
                    <FaBox className="grv-create-empty-icon" />
                    <p>No items added. Use the search above to add items.</p>
                    {grvProducts.length === 0 && (
                      <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                        No products available for this store.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {grvSelectedItems.length > 0 && (
                <div className="grv-create-totals-row">
                  {/* Spacer for Item column (flex: 2) */}
                  <div className="grv-create-total-label">
                    Total Value:
                  </div>
                  
                  {/* Spacer for Existing Stock column */}
                  <div className="grv-create-total-spacer-1"></div>
                  
                  {/* Spacer for Qty Received column */}
                  <div className="grv-create-total-spacer-2"></div>
                  
                  {/* Spacer for Unit Cost column */}
                  <div className="grv-create-total-spacer-3"></div>
                  
                  {/* Total Value aligned with Total column (5th column) */}
                  <div className="grv-create-total-value">
                    ${formatDecimal(calculateTotalValue())}
                  </div>
                  
                  {/* Spacer for New Selling Price column */}
                  <div className="grv-create-total-spacer-4"></div>
                  
                  {/* Spacer for Cost column */}
                  <div className="grv-create-total-spacer-5"></div>
                  
                  {/* Spacer for Actions column */}
                  <div className="grv-create-total-spacer-6"></div>
                </div>
              )}
            </div>
          </div>

          <div className="grv-create-action-buttons">
            <button className="grv-create-cancel-btn" onClick={handleGrvCancel}>
              CANCEL
            </button>
            <button 
              className="grv-create-save-btn" 
              onClick={handleGrvSaveAndProcess}
              disabled={grvLoading || grvSelectedItems.length === 0 || !grvSupplierName.trim() || hasInvalidQuantities() || hasInvalidUnitPrices()}
            >
              {grvLoading ? 'SAVING...' : 'SAVE & PROCESS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGoodsReceivedScreen;