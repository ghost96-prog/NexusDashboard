import React, { useState, useEffect } from 'react';
import '../Css/ProcessGoodsReceivedScreen.css';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaCheck,
  FaTimesCircle,
  FaStore,
  FaFileInvoice,
  FaBox,
  FaDollarSign,
  FaExclamationTriangle
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProcessGoodsReceivedScreen = () => {
  const [processSidebarOpen, setProcessSidebarOpen] = useState(false);
  const [grvData, setGrvData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState(null);
  const [itemUpdates, setItemUpdates] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    if (location.state?.grvData) {
      setGrvData(location.state.grvData);
      // Initialize item updates
      const updates = {};
      location.state.grvData.items?.forEach(item => {
        updates[item.productId] = {
          updatePrice: true,
          updateCost: true
        };
      });
      setItemUpdates(updates);
      
      // Fetch products
      fetchAllProducts();
      
      // Set email from token
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setEmail(decoded.email);
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
    } else {
      navigate('/goods-received');
    }
  }, [location, navigate]);

  const toggleProcessSidebar = () => {
    setProcessSidebarOpen(!processSidebarOpen);
  };

  const handleToggleUpdate = (productId, field) => {
    setItemUpdates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: !prev[productId]?.[field]
      }
    }));
  };

  const calculateNewStock = (item) => {
    return (item.existingStock || 0) + (item.receivedQuantity || 0);
  };

  // Get product from cache
  const getProductById = (productId) => {
    return allProducts.find(product => product.productId === productId);
  };

  // Generate inventory ID
  const generateInventoryId = () => {
    const timestamp = new Date().getTime().toString(36);
    const randomString = Math.random().toString(36).substr(2, 5);
    return `${timestamp}${randomString}`.toUpperCase();
  };

  // STEP 1: Save GRV to backend
  const saveGRVToBackend = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error('No token found');
      
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId || "";

      console.log('Saving GRV to backend:', grvData.grNumber);

      const grvDataToSave = {
        ...grvData,
        userId: userId,
        dateCreated: new Date().toISOString(),
        status: 'Draft'
      };

      const response = await fetch(
        `https://nexuspos.onrender.com/api/grv/create?email=${encodeURIComponent(userEmail)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(grvDataToSave)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save GRV: ${errorText}`);
      }

      const result = await response.json();
      console.log('GRV saved to backend:', result.data.grNumber);
      return result.data; // Return saved GRV data with backend ID
      
    } catch (error) {
      console.error('Error saving GRV to backend:', error);
      throw error;
    }
  };

  // STEP 2: Update products and inventory
  const updateProductsAndInventory = async (savedGrv) => {
    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId || "";

      const productUpdatePromises = [];
      const inventoryUpdatePromises = [];

      for (const item of savedGrv.items) {
        const existingProduct = getProductById(item.productId);
        
        if (!existingProduct) {
          console.error(`Product ${item.productId} not found in cache`);
          continue;
        }

        const updates = itemUpdates[item.productId] || {};
        const newStock = calculateNewStock(item);

        // Only update if checkbox is checked
        if (!updates.updateCost && !updates.updatePrice) {
          continue;
        }

        // PRODUCT UPDATE
        const productUpdateData = {
          productName: existingProduct.productName,
          category: existingProduct.category || "",
          categoryId: existingProduct.categoryId || "",
          productType: existingProduct.productType || "Each",
          sku: existingProduct.sku || "",
          userId: userId,
          lowStockNotification: existingProduct.lowStockNotification || 0,
          trackStock: existingProduct.trackStock !== false,
          editType: "Goods Received",
          stock: parseFloat(newStock),
          productId: item.productId,
          price: updates.updatePrice ? parseFloat(item.newPrice || 0) : parseFloat(existingProduct.price || 0),
          cost: updates.updateCost ? parseFloat(item.newCost || 0) : parseFloat(existingProduct.cost || 0),
          currentDate: new Date().toISOString(),
          barcode: existingProduct.barcode || "",
          createdBy: existingProduct.createdBy || "",
          roleOfEditor: existingProduct.roleOfEditor || "Owner",
          storeId: existingProduct.storeId || savedGrv.storeId,
          appCreated: existingProduct.appCreated || null,
          adminSynced: existingProduct.adminSynced || false
        };

        const productPromise = fetch(
          `https://nexuspos.onrender.com/api/productRouter/product-updates?email=${encodeURIComponent(userEmail)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productUpdateData),
          }
        ).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update product ${productUpdateData.productName}:`, errorText);
            throw new Error(`Failed to update product ${productUpdateData.productName}`);
          }
          return response.json();
        });

        productUpdatePromises.push(productPromise);

        // INVENTORY UPDATE
        const inventoryId = generateInventoryId();
        const inventoryUpdateData = {
          productName: existingProduct.productName,
          inventoryId: inventoryId,
          productId: item.productId,
          roleOfEditor: "Owner",
          createdBy: "Web App",
          userId: userId,
          EditorId: userId,
          currentDate: new Date().toISOString(),
          stockBefore: parseFloat(existingProduct.stock || 0),
          stockAfter: parseFloat(newStock),
          typeOfEdit: "Goods Received",
          synchronized: false,
          editedBy: "adminApp",
          grNumber: savedGrv.grNumber,
          storeName: savedGrv.storeName,
          notes: `GRV: ${savedGrv.grNumber} - Received ${item.receivedQuantity} units from ${savedGrv.supplierName}`,
          difference: item.receivedQuantity,
          priceImpact: item.totalPrice,
          costBefore: parseFloat(existingProduct.cost || 0),
          costAfter: updates.updateCost ? parseFloat(item.newCost || 0) : parseFloat(existingProduct.cost || 0),
          priceBefore: parseFloat(existingProduct.price || 0),
          priceAfter: updates.updatePrice ? parseFloat(item.newPrice || 0) : parseFloat(existingProduct.price || 0),
          deviceId: "web-app",
          pos: "owner",
          posId: userId,
          productType: existingProduct.productType || "Each",
          storeId: existingProduct.storeId || savedGrv.storeId,
          stockSynced: false,
          stockUpdated: ""
        };

        const inventoryPromise = fetch(
          `https://nexuspos.onrender.com/api/inventoryRouter/inventory-updates?email=${encodeURIComponent(userEmail)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(inventoryUpdateData),
          }
        ).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to create inventory update for ${inventoryUpdateData.productName}:`, errorText);
          }
          return response.json();
        });

        inventoryUpdatePromises.push(inventoryPromise);
      }

      // Wait for all updates
      await Promise.all(productUpdatePromises);
      await Promise.allSettled(inventoryUpdatePromises);
      
      return true;
      
    } catch (error) {
      console.error('Error updating products:', error);
      throw error;
    }
  };

  // STEP 3: Mark GRV as completed
  const markGRVAsCompleted = async (savedGrv) => {
    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/grv/${savedGrv.grNumber}/complete?email=${encodeURIComponent(userEmail)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'Completed',
            dateCompleted: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to complete GRV: ${errorText}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Error marking GRV as completed:', error);
      throw error;
    }
  };

  // MAIN PROCESSING FUNCTION
  const handleProcessGRV = async () => {
    if (!grvData || processing) return;

    if (!productsLoaded) {
      toast.error('Products are still loading. Please wait...');
      return;
    }

    setProcessing(true);
    
    try {
      // 1. Save GRV to backend
      toast.info('Saving GRV to server...');
      const savedGrv = await saveGRVToBackend();

      // 2. Update products and inventory
      toast.info('Updating products and inventory...');
      await updateProductsAndInventory(savedGrv);

      // 3. Mark GRV as completed
      toast.info('Completing GRV...');
      await markGRVAsCompleted(savedGrv);

      // Clear local storage
      if (grvData.localId) {
        localStorage.removeItem(grvData.localId);
        const existingGrvs = JSON.parse(localStorage.getItem('localGrvs') || '[]');
        const updatedGrvs = existingGrvs.filter(grv => grv.id !== grvData.localId);
        localStorage.setItem('localGrvs', JSON.stringify(updatedGrvs));
      }

      toast.success('GRV processed successfully!');
      
      // Navigate back to GRV list
      setTimeout(() => {
        navigate('/goods-received');
      }, 1500);

    } catch (error) {
      console.error('Error processing GRV:', error);
      toast.error(`Failed to process GRV: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/goods-received');
  };

  if (!grvData) {
    return (
      <div className="grv-process-loading">
        <p>Loading GRV data...</p>
      </div>
    );
  }

  return (
    <div className="grv-process-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="grv-process-sidebar-toggle-wrapper">
        <button 
          className="grv-process-sidebar-toggle"
          onClick={toggleProcessSidebar}
          style={{ left: processSidebarOpen ? '280px' : '80px' }}
        >
          {processSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
        
      <Sidebar isOpen={processSidebarOpen} toggleSidebar={toggleProcessSidebar} />
      
      <div className={`grv-process-content ${processSidebarOpen ? 'grv-process-shifted' : 'grv-process-collapsed'}`}>
        <div className="grv-process-container">
          <div className="grv-process-header">
            <h2>Process Goods Received</h2>
            <div className="grv-process-status">
              <span className="grv-process-status-text">
                Ready to Update Inventory
              </span>
            </div>
          </div>

          <div className="grv-process-summary">
            <div className="grv-process-summary-item">
              <FaFileInvoice className="grv-process-summary-icon" />
              <div className="grv-process-summary-content">
                <span className="grv-process-summary-label">GR Number:</span>
                <span className="grv-process-summary-value">{grvData.grNumber}</span>
              </div>
            </div>
            <div className="grv-process-summary-item">
              <FaStore className="grv-process-summary-icon" />
              <div className="grv-process-summary-content">
                <span className="grv-process-summary-label">Supplier:</span>
                <span className="grv-process-summary-value">{grvData.supplierName}</span>
              </div>
            </div>
            <div className="grv-process-summary-item">
              <FaDollarSign className="grv-process-summary-icon" />
              <div className="grv-process-summary-content">
                <span className="grv-process-summary-label">Total Value:</span>
                <span className="grv-process-summary-value">${grvData.totalValue?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grv-process-warning">
            <FaExclamationTriangle className="grv-process-warning-icon" />
            <p>Review and confirm the updates below. This will update stock levels, prices, and costs in your inventory.</p>
          </div>

          <div className="grv-process-items-section">
            <div className="grv-process-items-header">
              <h3>Item Updates</h3>
              <span className="grv-process-items-count">
                {grvData.items?.length || 0} items to update
              </span>
            </div>

            <div className="grv-process-items-table-container">
              <div className="grv-process-items-table-header">
                <div className="grv-process-table-header-cell">Item</div>
                <div className="grv-process-table-header-cell">Current Stock</div>
                <div className="grv-process-table-header-cell">Received</div>
                <div className="grv-process-table-header-cell">New Stock</div>
                <div className="grv-process-table-header-cell">Current Price</div>
                <div className="grv-process-table-header-cell">New Price</div>
                <div className="grv-process-table-header-cell">Current Cost</div>
                <div className="grv-process-table-header-cell">New Cost</div>
                <div className="grv-process-table-header-cell">Update</div>
              </div>
              
              <div className="grv-process-items-table-body">
                {grvData.items?.map((item, index) => {
                  const updates = itemUpdates[item.productId] || {};
                  const newStock = calculateNewStock(item);
                  
                  return (
                    <div key={item.productId} className="grv-process-item-row">
                      <div className="grv-process-item-info">
                        <div className="grv-process-item-name">{item.productName}</div>
                        <div className="grv-process-item-details">
                          SKU: {item.sku}
                        </div>
                      </div>
                      <div className="grv-process-item-current-stock">
                        {item.existingStock || 0}
                      </div>
                      <div className="grv-process-item-received">
                        +{item.receivedQuantity || 0}
                      </div>
                      <div className="grv-process-item-new-stock">
                        <span className={newStock > (item.existingStock || 0) ? 'grv-process-positive' : ''}>
                          {newStock}
                        </span>
                      </div>
                      <div className="grv-process-item-current-price">
                        ${(item.currentPrice || 0).toFixed(2)}
                      </div>
                      <div className="grv-process-item-new-price">
                        ${(item.newPrice || 0).toFixed(2)}
                      </div>
                      <div className="grv-process-item-current-cost">
                        ${(item.currentCost || 0).toFixed(2)}
                      </div>
                      <div className="grv-process-item-new-cost">
                        ${(item.newCost || 0).toFixed(2)}
                      </div>
                      <div className="grv-process-item-update-controls">
                        <div className="grv-process-update-checkbox">
                          <label className="grv-process-checkbox-label">
                            <input
                              type="checkbox"
                              checked={updates.updatePrice || false}
                              onChange={() => handleToggleUpdate(item.productId, 'updatePrice')}
                            />
                            <span>Price</span>
                          </label>
                        </div>
                        <div className="grv-process-update-checkbox">
                          <label className="grv-process-checkbox-label">
                            <input
                              type="checkbox"
                              checked={updates.updateCost || false}
                              onChange={() => handleToggleUpdate(item.productId, 'updateCost')}
                            />
                            <span>Cost</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grv-process-confirmation">
            <div className="grv-process-confirmation-item">
              <span className="grv-process-confirmation-label">Total Items:</span>
              <span className="grv-process-confirmation-value">{grvData.items?.length || 0}</span>
            </div>
            <div className="grv-process-confirmation-item">
              <span className="grv-process-confirmation-label">Total Quantity:</span>
              <span className="grv-process-confirmation-value">
                {grvData.items?.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0)}
              </span>
            </div>
            <div className="grv-process-confirmation-item">
              <span className="grv-process-confirmation-label">Total Value:</span>
              <span className="grv-process-confirmation-value">
                ${grvData.totalValue?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grv-process-action-buttons">
            <button 
              className="grv-process-cancel-btn" 
              onClick={handleCancel}
              disabled={processing}
            >
              <FaTimesCircle />
              CANCEL
            </button>
            <button 
              className="grv-process-confirm-btn" 
              onClick={handleProcessGRV}
              disabled={processing || isLoadingProducts || !productsLoaded}
            >
              {processing ? (
                <>
                  <div className="grv-process-spinner"></div>
                  PROCESSING...
                </>
              ) : isLoadingProducts ? (
                'LOADING PRODUCTS...'
              ) : !productsLoaded ? (
                'PRODUCTS NOT LOADED'
              ) : (
                <>
                  <FaCheck />
                  SAVE GRV & UPDATE INVENTORY
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessGoodsReceivedScreen;