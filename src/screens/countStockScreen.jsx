import React, { useState, useEffect, useRef } from 'react';
import '../Css/CountStockScreen.css';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaStore,
  FaCheck,
  FaChevronLeft,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaTrash,
  FaSearch,
  FaSave,
  FaPlay
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SubscriptionModal from '../components/SubscriptionModal';

const CountStockScreen = () => {
  const [countedSidebarOpen, setCountedSidebarOpen] = useState(false);
  const [countedCurrentItem, setCountedCurrentItem] = useState(null);
  const [countedCurrentQuantity, setCountedCurrentQuantity] = useState('');
  const [countedItems, setCountedItems] = useState([]);
  const [countedIsSubscribedAdmin, setCountedIsSubscribedAdmin] = useState(false);
  const [countedShowSubscriptionModal, setCountedShowSubscriptionModal] = useState(false);
  const [countedNotes, setCountedNotes] = useState('');
  const [countedStoreName, setCountedStoreName] = useState('');
  const [countedStoreId, setCountedStoreId] = useState('');
  const [countedShowConfirmModal, setCountedShowConfirmModal] = useState(false);
  const [countedShowCompletionModal, setCountedShowCompletionModal] = useState(false);
  const [countedEmail, setCountedEmail] = useState('');
  const [countedLoading, setCountedLoading] = useState(false);
  const [countedTotalItems, setCountedTotalItems] = useState(0);
  const [countedCompletedItems, setCountedCompletedItems] = useState(0);
  const [completedCountData, setCompletedCountData] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [countId, setCountId] = useState(null);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [countType, setCountType] = useState('Partial');
  
  // Add state for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Add state for search
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const countInputRef = useRef(null);

  // Fetch all products on screen load
  const fetchAllProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        navigate('/login');
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/productRouter/products?email=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAllProducts(data.data || []);
        setProductsLoaded(true);
        console.log(`Loaded ${data.data?.length || 0} products`);
      } else {
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error loading products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Load data from navigation state and initialize with products
  useEffect(() => {
    if (location.state) {
      const { notes, items, storeName, storeId, type, countId: existingCountId, isDraft } = location.state;
      setCountedNotes(notes || '');
      setCountedStoreName(storeName || '');
      setCountedStoreId(storeId || '');
      setCountType(type || 'Partial');
      
      // If we have an existing count ID (draft), set it
      if (existingCountId) {
        setCountId(existingCountId);
        setIsDraftMode(true);
      }
      
      // Initialize items with counted quantity as expected stock (starting point)
      const initializedItems = items.map(item => ({
        ...item,
        counted: item.counted || item.expectedStock || 0,
        difference: item.difference || 0,
        priceDifference: item.priceDifference || 0,
        countedQuantity: item.countedQuantity !== undefined ? item.countedQuantity : (item.expectedStock?.toString() || ''),
        isCounted: item.isCounted || false,
        price: item.price || 0,
        cost: item.cost || 0
      }));
      
      setCountedItems(initializedItems);
      setCountedTotalItems(initializedItems.length);
      
      // Count completed items
      const completed = initializedItems.filter(item => item.isCounted).length;
      setCountedCompletedItems(completed);
      
      // Set first uncounted item as current if there are items
      if (initializedItems.length > 0) {
        const firstUncounted = initializedItems.find(item => !item.isCounted) || initializedItems[0];
        setCountedCurrentItem(firstUncounted);
        setCountedCurrentQuantity(firstUncounted.countedQuantity || firstUncounted.expectedStock?.toString() || '');
      }
    }
  }, [location.state]);

  // Fetch email from token and products
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setCountedEmail(decoded.email);
      
      // Fetch products immediately after getting email
      fetchAllProducts();
    } catch (error) {
      toast.error("Invalid authentication token.");
    }
  }, [navigate]);

  // Fetch subscription status
  useEffect(() => {
    if (countedEmail) {
      fetchCountedAdminSubscriptionStatus();
    }
  }, [countedEmail]);

  const fetchCountedAdminSubscriptionStatus = async () => {
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
        setCountedIsSubscribedAdmin(data.isSubscribedAdmin);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  // Helper function to get product from local cache
  const getProductById = (productId) => {
    return allProducts.find(product => product.productId === productId);
  };

  // Filter items based on search query
  const filteredItems = searchQuery
    ? countedItems.filter(item =>
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : countedItems;

  // Optimized update function - NO PRODUCT FETCHING
  const updateProductsAndCreateInventory = async (countData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId || "";

      console.log('Starting product updates from cache for', countData.items.length, 'items');

      // Process items with differences
      const itemsWithDifferences = countData.items.filter(item => item.difference !== 0);
      console.log(`Processing ${itemsWithDifferences.length} items with differences`);

      if (itemsWithDifferences.length === 0) {
        console.log('No items with differences to update');
        return true;
      }

      // Prepare batch updates
      const productUpdates = [];
      const inventoryUpdates = [];

      for (const item of itemsWithDifferences) {
        const existingProduct = getProductById(item.productId);
        
        if (!existingProduct) {
          console.error(`Product ${item.productId} not found in cache`);
          continue;
        }

        console.log(`Processing item: ${item.productId}, diff: ${item.difference}`);

        // Prepare product update
        const updatedProductData = {
          productName: existingProduct.productName,
          category: existingProduct.category || "",
          categoryId: existingProduct.categoryId || "",
          productType: existingProduct.productType || "Each",
          sku: existingProduct.sku || "",
          userId: userId,
          lowStockNotification: existingProduct.lowStockNotification || 0,
          trackStock: existingProduct.trackStock !== false,
          editType: "Stock Count",
          stock: parseFloat(item.counted || 0),
          productId: item.productId,
          price: existingProduct.price || 0,
          cost: existingProduct.cost || 0,
          currentDate: new Date().toISOString(),
        };

        productUpdates.push(updatedProductData);

        // Prepare inventory update
        const inventoryId = generateInventoryId();
        const inventoryUpdateData = {
          productName: existingProduct.productName,
          inventoryId: inventoryId,
          productId: item.productId,
          roleOfEditor: "OWNER",
          createdBy: "Web App",
          userId: userId,
          EditorId: userId,
          currentDate: new Date().toISOString(),
          stockBefore: parseFloat(existingProduct.stock || 0),
          stockAfter: parseFloat(item.counted || 0),
          typeOfEdit: "Stock Count",
          synchronized: false,
          editedBy: "adminApp",
          countId: countData.countId,
          storeName: countData.storeName,
          notes: countData.notes,
          difference: item.difference,
          priceImpact: item.priceDifference
        };

        inventoryUpdates.push(inventoryUpdateData);
      }

      // Send updates in parallel
      const updatePromises = [];
      
      // Update products
      for (const productUpdate of productUpdates) {
        const promise = fetch(
          `https://nexuspos.onrender.com/api/productRouter/product-updates?email=${encodeURIComponent(userEmail)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productUpdate),
          }
        ).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update product ${productUpdate.productId}:`, errorText);
          }
          return response;
        });
        
        updatePromises.push(promise);
      }

      // Create inventory updates
      for (const inventoryUpdate of inventoryUpdates) {
        const promise = fetch(
          `https://nexuspos.onrender.com/api/inventoryRouter/inventory-updates?email=${encodeURIComponent(userEmail)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(inventoryUpdate),
          }
        ).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to create inventory update for ${inventoryUpdate.productId}:`, errorText);
          }
          return response;
        });
        
        updatePromises.push(promise);
      }

      // Wait for updates with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Update timeout after 15 seconds')), 15000);
      });

      await Promise.race([
        Promise.allSettled(updatePromises),
        timeoutPromise
      ]);
      
      console.log('All product updates completed');
      return true;
      
    } catch (error) {
      console.error("Error in product updates:", error);
      throw error;
    }
  };

  // Save draft function
  const handleSaveDraft = () => {
    if (!countedIsSubscribedAdmin) {
      setCountedShowSubscriptionModal(true);
      return;
    }

    if (!productsLoaded) {
      toast.error('Products are still loading. Please wait...');
      return;
    }

    if (countedItems.length === 0) {
      toast.error('No items to save. Add items to save a draft.');
      return;
    }

    // Generate a draft ID if this is a new draft
    const draftId = countId || `DRAFT-${Date.now()}`;
    
    // Prepare count data
    const countData = {
      countId: draftId,
      notes: countedNotes,
      storeName: countedStoreName,
      storeId: countedStoreId,
      type: countType,
      items: countedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        category: item.category,
        expectedStock: item.expectedStock || 0,
        counted: item.counted || 0,
        difference: item.difference || 0,
        priceDifference: item.priceDifference || 0,
        price: item.price || 0,
        cost: item.cost || 0,
        countedQuantity: item.countedQuantity || '',
        isCounted: item.isCounted || false
      })),
      createdBy: countedEmail,
      dateCreated: new Date().toISOString(),
      status: 'Draft',
      totalDifference: calculatedTotals.totalDifference,
      totalPriceDifference: calculatedTotals.totalPriceDifference,
      totalItems: countedTotalItems,
      completedItems: countedCompletedItems
    };

    // Save to localStorage
    try {
      // Save the count data
      localStorage.setItem(draftId, JSON.stringify(countData));
      
      // Update the list of drafts
      const existingDrafts = JSON.parse(localStorage.getItem('inventoryCountDrafts') || '[]');
      const draftIndex = existingDrafts.findIndex(d => d.id === draftId);
      
      const draftInfo = {
        id: draftId,
        countId: draftId,
        notes: countedNotes,
        storeName: countedStoreName,
        dateCreated: new Date().toISOString(),
        status: 'Draft',
        totalItems: countedTotalItems,
        completedItems: countedCompletedItems
      };
      
      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = draftInfo;
      } else {
        existingDrafts.push(draftInfo);
      }
      
      localStorage.setItem('inventoryCountDrafts', JSON.stringify(existingDrafts));
      
      setCountId(draftId);
      setIsDraftMode(true);
      toast.success('Draft saved successfully!');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft.');
    }
  };

  // Function to show delete confirmation modal
  const handleShowDeleteModal = (item) => {
    if (!countedIsSubscribedAdmin) {
      setCountedShowSubscriptionModal(true);
      return;
    }

    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Function to confirm deletion
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    const productId = itemToDelete.productId;
    const updatedItems = countedItems.filter(item => item.productId !== productId);
    
    // Update the items list
    setCountedItems(updatedItems);
    setCountedTotalItems(updatedItems.length);
    
    // Update completed items count
    const completed = updatedItems.filter(item => item.isCounted).length;
    setCountedCompletedItems(completed);
    
    // If we removed the current item, set a new current item
    if (countedCurrentItem && countedCurrentItem.productId === productId) {
      if (updatedItems.length > 0) {
        const nextItem = updatedItems.find(item => !item.isCounted) || updatedItems[0];
        setCountedCurrentItem(nextItem);
        setCountedCurrentQuantity(nextItem.countedQuantity || nextItem.expectedStock?.toString() || '');
      } else {
        setCountedCurrentItem(null);
        setCountedCurrentQuantity('');
      }
    }
    
    toast.success(`${itemToDelete.productName} removed from count`);
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Function to cancel deletion
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Function to handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Function to clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const toggleCountedSidebar = () => {
    setCountedSidebarOpen(!countedSidebarOpen);
  };

  const handleCountedQuantityChange = (value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setCountedCurrentQuantity(value);
    }
  };

  const handleCountedAddToCounted = () => {
    if (!countedIsSubscribedAdmin) {
      setCountedShowSubscriptionModal(true);
      return;
    }

    if (!countedCurrentQuantity || countedCurrentQuantity === '') {
      toast.error('Please enter a valid quantity.');
      return;
    }

    const quantity = parseFloat(countedCurrentQuantity);
    if (isNaN(quantity)) {
      toast.error('Please enter a valid number.');
      return;
    }
    
    const updatedItems = countedItems.map(item => {
      if (item.productId === countedCurrentItem.productId) {
        const counted = quantity;
        const difference = counted - (item.expectedStock || 0);
        const price = parseFloat(item.price) || 0;
        const priceDifference = difference * price;
        
        return {
          ...item,
          counted,
          difference,
          priceDifference,
          countedQuantity: countedCurrentQuantity,
          isCounted: true
        };
      }
      return item;
    });

    setCountedItems(updatedItems);
    
    const completed = updatedItems.filter(item => item.isCounted).length;
    setCountedCompletedItems(completed);
    
    setCountedCurrentQuantity('');
    
    const nextUncountedItem = updatedItems.find(item => !item.isCounted);
    
    if (nextUncountedItem) {
      setCountedCurrentItem(nextUncountedItem);
      setCountedCurrentQuantity(nextUncountedItem.countedQuantity || nextUncountedItem.expectedStock?.toString() || '');
      toast.success(`Counted ${quantity} of ${countedCurrentItem.productName}`);
    } else {
      setCountedCurrentItem(null);
      toast.success('All items counted!');
    }

    if (countInputRef.current && nextUncountedItem) {
      countInputRef.current.focus();
    }
  };

  const handleCountedManualUpdate = async (productId, value) => {
    if (!countedIsSubscribedAdmin) {
      setCountedShowSubscriptionModal(true);
      return;
    }

    const quantity = value === '' ? 0 : parseFloat(value);
    if (isNaN(quantity)) return;

    const updatedItems = countedItems.map(item => {
      if (item.productId === productId) {
        const counted = quantity;
        const difference = counted - (item.expectedStock || 0);
        const price = parseFloat(item.price) || 0;
        const priceDifference = difference * price;
        
        return {
          ...item,
          counted,
          difference,
          priceDifference,
          countedQuantity: value,
          isCounted: value !== '' // Counted if any value is entered (even 0)
        };
      }
      return item;
    });

    setCountedItems(updatedItems);
    
    const completed = updatedItems.filter(item => item.isCounted).length;
    setCountedCompletedItems(completed);
  };

  const calculatedTotals = countedItems.reduce(
    (acc, item) => {
      return {
        totalDifference: acc.totalDifference + (item.difference || 0),
        totalPriceDifference: acc.totalPriceDifference + (item.priceDifference || 0)
      };
    },
    { totalDifference: 0, totalPriceDifference: 0 }
  );

  const handleCountedComplete = () => {
    if (!countedIsSubscribedAdmin) {
      setCountedShowSubscriptionModal(true);
      return;
    }

    if (!productsLoaded) {
      toast.error('Products are still loading. Please wait...');
      return;
    }

    // Check if any items haven't been counted yet (countedQuantity is empty or undefined)
    const uncountedItems = countedItems.filter(item => 
      item.countedQuantity === undefined || 
      item.countedQuantity === '' || 
      item.countedQuantity === null
    );

    if (uncountedItems.length > 0) {
      toast.error(`Please enter a count for ${uncountedItems.length} item(s) before completing.`);
      return;
    }

    if (countedItems.length === 0) {
      toast.error('No items to count. Add items to complete the count.');
      return;
    }

    setCountedShowConfirmModal(true);
  };

  const handleCountedConfirmComplete = async () => {
    setCountedLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      // Generate a new count ID if this wasn't a draft
      const finalCountId = countId && countId.startsWith('DRAFT-') 
        ? `IC${Date.now().toString().slice(-6)}` 
        : countId || `IC${Date.now().toString().slice(-6)}`;

      // 1. Build the count data object
      const countData = {
        countId: finalCountId,
        notes: countedNotes,
        storeName: countedStoreName,
        storeId: countedStoreId,
        type: countType,
        items: countedItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          category: item.category,
          expectedStock: item.expectedStock || 0,
          counted: item.counted || 0,
          difference: item.difference || 0,
          priceDifference: item.priceDifference || 0,
          price: item.price || 0,
          cost: item.cost || 0,
          countedQuantity: item.countedQuantity || '',
          isCounted: item.isCounted || false
        })),
        createdBy: userEmail,
        dateCreated: new Date().toISOString(),
        dateCompleted: new Date().toISOString(),
        status: 'Completed',
        totalDifference: calculatedTotals.totalDifference,
        totalPriceDifference: calculatedTotals.totalPriceDifference,
        totalItems: countedTotalItems,
        completedItems: countedCompletedItems
      };

      console.log('Starting count completion process...');

      // 2. Start operations in parallel
      const operations = [];

      // Save the inventory count
      const saveCountOperation = (async () => {
        console.log('Saving inventory count to server...');
        const saveResponse = await fetch(
          `https://nexuspos.onrender.com/api/inventoryCounts?email=${encodeURIComponent(userEmail)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(countData)
          }
        );

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          throw new Error(`Failed to save inventory count: ${errorText}`);
        }

        return await saveResponse.json();
      })();
      operations.push(saveCountOperation);

      // Update products and inventory (only if there are differences)
      const itemsWithDifferences = countData.items.filter(item => item.difference !== 0);
      if (itemsWithDifferences.length > 0) {
        console.log(`Updating ${itemsWithDifferences.length} products with differences`);
        const updateProductsOperation = updateProductsAndCreateInventory(countData);
        operations.push(updateProductsOperation);
      }

      // 3. Wait for all operations to complete
      const results = await Promise.allSettled(operations);

      // 4. Check for errors
      const errors = results.filter(result => result.status === 'rejected');
      if (errors.length > 0) {
        console.error('Errors during count completion:', errors);
        const errorMessages = errors.map(e => e.reason?.message || 'Unknown error').join(', ');
        throw new Error(`Some operations failed: ${errorMessages}`);
      }

      // 5. Remove draft from localStorage if it was a draft
      if (countId && countId.startsWith('DRAFT-')) {
        localStorage.removeItem(countId);
        
        // Update drafts list
        const existingDrafts = JSON.parse(localStorage.getItem('inventoryCountDrafts') || '[]');
        const updatedDrafts = existingDrafts.filter(d => d.id !== countId);
        localStorage.setItem('inventoryCountDrafts', JSON.stringify(updatedDrafts));
      }

      // 6. Update UI state
      setCountedShowConfirmModal(false);
      setCountedShowCompletionModal(true);
      setCompletedCountData(countData);
      toast.success('Inventory count completed successfully!');

    } catch (error) {
      console.error('Error in handleCountedConfirmComplete:', error);
      
      let errorMessage = 'Failed to complete inventory count';
      if (error.message.includes('timeout')) {
        errorMessage = 'Operation timed out. Count may have been partially saved.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
      setCountedShowConfirmModal(true);
    } finally {
      setCountedLoading(false);
    }
  };

  const generateInventoryId = () => {
    const timestamp = new Date().getTime().toString(36);
    const randomString = Math.random().toString(36).substr(2, 5);
    const inventoryId = `${timestamp}${randomString}`;
    return inventoryId.toUpperCase();
  };

  const handleCountedCancel = () => {
    if (countedCompletedItems > 0) {
      if (window.confirm('You have unsaved counts. Do you want to save a draft before leaving?')) {
        handleSaveDraft();
      }
      navigate('/counts');
    } else {
      navigate('/counts');
    }
  };

  const handleCountedBack = () => {
    navigate('/create-counts', { state: location.state });
  };

  return (
    <div className="counted-main-container">
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      {/* Sidebar Toggle Button */}
      <div className="counted-sidebar-toggle-wrapper">
        <button 
          className="counted-sidebar-toggle"
          onClick={toggleCountedSidebar}
          style={{ left: countedSidebarOpen ? '280px' : '80px' }}
        >
          {countedSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      {/* Toolbar */}
      <div className="counted-toolbar">
        <div className="counted-toolbar-content">
          <h1 className="counted-toolbar-title">
            {isDraftMode ? 'Draft: ' : ''}Count Stock
            {isDraftMode && <span className="counted-draft-badge">DRAFT</span>}
          </h1>
          <div className="counted-toolbar-subtitle">
            Real-time inventory count for {countedStoreName || 'selected store'}
          </div>
        </div>
        <div className="counted-toolbar-actions">
          <button 
            className="counted-back-btn"
            onClick={handleCountedBack}
          >
            <FaChevronLeft />
            Back
          </button>
        </div>
      </div>
      
      <Sidebar isOpen={countedSidebarOpen} toggleSidebar={toggleCountedSidebar} />
      
      <div className={`counted-content ${countedSidebarOpen ? 'counted-shifted' : 'counted-collapsed'}`}>
        <div className="counted-container">
          {/* Loading Overlay */}
          {isLoadingProducts && (
            <div className="counted-loading-overlay">
              <div className="counted-loading-spinner">
                <FaSpinner className="spinning" />
                <p>Loading products...</p>
              </div>
            </div>
          )}
          
          <div className="counted-header">
            <h2>{isDraftMode ? 'Continue Draft Count' : 'Count stock'}</h2>
            <div className="counted-progress">
              <span className="counted-progress-text">
                {countedCompletedItems} / {countedTotalItems}
              </span>
            </div>
          </div>

          {/* Store Info */}
          <div className="counted-store-info">
            <FaStore className="counted-store-icon" />
            <span className="counted-store-name">{countedStoreName || 'No store selected'}</span>
            {countedNotes && (
              <span className="counted-notes">Notes: {countedNotes}</span>
            )}
            {!productsLoaded && !isLoadingProducts && (
              <span className="counted-warning">⚠️ Products not loaded</span>
            )}
          </div>

          {/* Start Section - Only show when no current item */}
          {!countedCurrentItem && countedItems.length > 0 && (
            <div className="counted-start-section">
              <div className="counted-start-card">
                <h3>Ready to Start Counting</h3>
                <p>Begin counting items in your inventory. Click Start to begin with the first item.</p>
                <button 
                  className="counted-start-button"
                  onClick={() => {
                    if (countedItems.length > 0) {
                      const firstUncounted = countedItems.find(item => !item.isCounted) || countedItems[0];
                      setCountedCurrentItem(firstUncounted);
                      setCountedCurrentQuantity(firstUncounted.countedQuantity || firstUncounted.expectedStock?.toString() || '');
                    }
                  }}
                >
                  Start Counting
                </button>
                <div className="counted-resume-text">
                  {countedCompletedItems} items already counted
                </div>
              </div>
            </div>
          )}

          {/* Counted Items Table */}
          <div className="counted-items-section">
            <div className="counted-items-header">
              <div className="counted-items-header-left">
                <h3>Counted Items</h3>
                <div className="counted-items-count">
                  {countedCompletedItems} of {countedTotalItems} completed
                  {allProducts.length > 0 && (
                    <span className="counted-products-loaded"> ({allProducts.length} products loaded)</span>
                  )}
                </div>
              </div>
              
              {/* Search Input */}
              <div className="counted-search-container">
                <div className="counted-search-input-wrapper">
                  <FaSearch className="counted-search-icon" />
                  <input
                    type="text"
                    className="counted-search-input"
                    placeholder="Search by product name, SKU, or category..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {searchQuery && (
                    <button 
                      className="counted-search-clear"
                      onClick={handleClearSearch}
                      title="Clear search"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="counted-search-results">
                    Found {filteredItems.length} of {countedItems.length} items
                  </div>
                )}
              </div>
            </div>
            
            {countedItems.length > 0 ? (
              <>
                <div className="counted-items-table-container">
                  <div className="counted-items-table-header">
                    <div className="counted-table-header-cell">Item</div>
                    <div className="counted-table-header-cell">Expected stock</div>
                    <div className="counted-table-header-cell">Counted</div>
                    <div className="counted-table-header-cell">Difference</div>
                    <div className="counted-table-header-cell">Price difference</div>
                    <div className="counted-table-header-cell">Actions</div>
                  </div>
                  
                  <div className="counted-items-table-body">
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <div key={item.productId} className="counted-item-row">
                          <div className="counted-item-info">
                            <div className="counted-item-name">{item.productName}</div>
                            <div className="counted-item-details-small">
                              SKU: {item.sku}
                            </div>
                          </div>
                          <div className="counted-item-expected">{item.expectedStock || 0}</div>
                          <div className="counted-item-counted">
                            <input
                              type="text"
                              className="counted-count-input"
                              value={item.countedQuantity || ''}
                              onChange={(e) => handleCountedManualUpdate(item.productId, e.target.value)}
                              placeholder={item.expectedStock?.toString() || '0'}
                            />
                          </div>
                          <div className={`counted-item-difference ${(item.difference || 0) < 0 ? 'counted-negative' : (item.difference || 0) > 0 ? 'counted-positive' : ''}`}>
                            {item.difference || 0}
                          </div>
                          <div className={`counted-item-cost-difference ${(item.priceDifference || 0) < 0 ? 'counted-negative' : (item.priceDifference || 0) > 0 ? 'counted-positive' : ''}`}>
                            ${Math.abs(item.priceDifference || 0).toFixed(2)}
                          </div>
                          <div className="counted-item-actions">
                            <button
                              className="counted-remove-btn"
                              onClick={() => handleShowDeleteModal(item)}
                              title="Remove from count"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="counted-no-search-results">
                        <FaExclamationTriangle className="counted-no-search-icon" />
                        <p>No items found for "{searchQuery}"</p>
                        <button 
                          className="counted-clear-search-btn"
                          onClick={handleClearSearch}
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                    
                    {/* Totals Row - Only show if there are items */}
                    {filteredItems.length > 0 && (
                      <div className="counted-totals-row">
                        <div className="counted-total-label">Total</div>
                        <div className="counted-total-expected"></div>
                        <div className="counted-total-counted"></div>
                        <div className={`counted-total-difference ${calculatedTotals.totalDifference < 0 ? 'counted-negative' : calculatedTotals.totalDifference > 0 ? 'counted-positive' : ''}`}>
                          {calculatedTotals.totalDifference}
                        </div>
                        <div className={`counted-total-cost-difference ${calculatedTotals.totalPriceDifference < 0 ? 'counted-negative' : calculatedTotals.totalPriceDifference > 0 ? 'counted-positive' : ''}`}>
                          ${Math.abs(calculatedTotals.totalPriceDifference).toFixed(2)}
                        </div>
                        <div className="counted-total-actions"></div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="counted-no-items">
                <FaExclamationTriangle className="counted-no-items-icon" />
                <p>No items to count. Please go back and add items.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="counted-action-buttons">
            <button className="counted-cancel-btn" onClick={handleCountedCancel}>
              CANCEL
            </button>
            <div className="counted-action-group">
              <button 
                className="counted-draft-btn"
                onClick={handleSaveDraft}
                disabled={countedItems.length === 0 || isLoadingProducts}
              >
                <FaSave />
                {isDraftMode ? 'UPDATE DRAFT' : 'SAVE DRAFT'}
              </button>
              <button 
                className="counted-complete-btn" 
                onClick={handleCountedComplete}
                disabled={
                  countedItems.length === 0 || 
                  countedItems.some(item => 
                    item.countedQuantity === undefined || 
                    item.countedQuantity === '' || 
                    item.countedQuantity === null
                  ) ||
                  isLoadingProducts || 
                  !productsLoaded
                }
              >
                <FaPlay />
                COMPLETE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="counted-modal-overlay">
          <div className="counted-delete-modal">
            <div className="counted-modal-header">
              <h3>Remove Item</h3>
              <button 
                className="counted-modal-close"
                onClick={handleCancelDelete}
              >
                <FaTimesCircle />
              </button>
            </div>
            <div className="counted-modal-body">
              <div className="counted-delete-warning-icon">
                <FaExclamationTriangle />
              </div>
              <p>Are you sure you want to remove this item from the count?</p>
              <div className="counted-item-to-delete">
                <strong>{itemToDelete.productName}</strong>
                <div className="counted-item-details">
                  SKU: {itemToDelete.sku} • Expected: {itemToDelete.expectedStock || 0}
                </div>
                {itemToDelete.countedQuantity && (
                  <div className="counted-item-counted-info">
                    Counted: {itemToDelete.countedQuantity}
                  </div>
                )}
              </div>
              <div className="counted-warning-message">
                This action cannot be undone.
              </div>
            </div>
            <div className="counted-modal-footer">
              <button 
                className="counted-modal-cancel"
                onClick={handleCancelDelete}
              >
                KEEP ITEM
              </button>
              <button 
                className="counted-modal-delete"
                onClick={handleConfirmDelete}
              >
                REMOVE ITEM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {countedShowConfirmModal && (
        <div className="counted-modal-overlay">
          <div className="counted-confirm-modal">
            <div className="counted-modal-header">
              <h3>Confirm inventory count</h3>
              <button 
                className="counted-modal-close"
                onClick={() => setCountedShowConfirmModal(false)}
              >
                <FaTimesCircle />
              </button>
            </div>
            <div className="counted-modal-body">
              <p>Please confirm changes. This action cannot be undone.</p>
              <div className="counted-warning-message">
                <FaExclamationTriangle />
                <span>Stock level of {countedTotalItems} item{countedTotalItems !== 1 ? 's' : ''} will be updated.</span>
              </div>
            </div>
            <div className="counted-modal-footer">
              <button 
                className="counted-modal-cancel"
                onClick={() => setCountedShowConfirmModal(false)}
                disabled={countedLoading}
              >
                CANCEL
              </button>
              <button 
                className="counted-modal-confirm"
                onClick={handleCountedConfirmComplete}
                disabled={countedLoading}
              >
                {countedLoading ? 'PROCESSING...' : 'CONFIRM COUNT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {countedShowCompletionModal && (
        <div className="counted-modal-overlay">
          <div className="counted-completion-modal">
            <div className="counted-modal-header">
              <h3>Count Completed Successfully!</h3>
              <button 
                className="counted-modal-close"
                onClick={() => {
                  setCountedShowCompletionModal(false);
                  navigate('/counts');
                }}
              >
                <FaTimesCircle />
              </button>
            </div>
            <div className="counted-modal-body">
              <div className="counted-success-icon">✓</div>
              <p>Your inventory count has been saved and completed.</p>
              <div className="counted-summary">
                <div className="counted-summary-item">
                  <span>Total Items:</span>
                  <strong>{countedTotalItems}</strong>
                </div>
                <div className="counted-summary-item">
                  <span>Total Difference:</span>
                  <strong className={calculatedTotals.totalDifference < 0 ? 'counted-negative' : calculatedTotals.totalDifference > 0 ? 'counted-positive' : ''}>
                    {calculatedTotals.totalDifference}
                  </strong>
                </div>
                <div className="counted-summary-item">
                  <span>Price Impact:</span>
                  <strong className={calculatedTotals.totalPriceDifference < 0 ? 'counted-negative' : calculatedTotals.totalPriceDifference > 0 ? 'counted-positive' : ''}>
                    ${Math.abs(calculatedTotals.totalPriceDifference).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
            <div className="counted-modal-footer">
              <button 
                className="counted-modal-done"
                onClick={() => {
                  setCountedShowCompletionModal(false);
                  navigate(`/inventory-count/${completedCountData.countId}`, { 
                    state: { countData: completedCountData } 
                  });
                }}
              >
                VIEW INVENTORY COUNT
              </button>
            </div>
          </div>
        </div>
      )}

      <SubscriptionModal
        isOpen={countedShowSubscriptionModal}
        onClose={() => setCountedShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default CountStockScreen;