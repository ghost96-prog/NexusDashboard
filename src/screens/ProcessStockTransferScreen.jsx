import React, { useState, useEffect } from 'react';
import '../Css/ProcessStockTransferScreen.css';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaCheck,
  FaTimesCircle,
  FaStore,
  FaExchangeAlt,
  FaBox,
  FaDollarSign,
  FaExclamationTriangle
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProcessStockTransferScreen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

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
    if (location.state?.transferData) {
      setTransferData(location.state.transferData);
      
      fetchAllProducts();
      
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
      navigate('/stock-transfers');
    }
  }, [location, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const calculateNewStock = (item) => {
    return (item.existingStock || 0) - (item.transferQuantity || 0);
  };

  const getProductById = (productId) => {
    return allProducts.find(product => product.productId === productId);
  };

  const generateInventoryId = () => {
    const timestamp = new Date().getTime().toString(36);
    const randomString = Math.random().toString(36).substr(2, 5);
    return `${timestamp}${randomString}`.toUpperCase();
  };

  const saveTransferToBackend = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error('No token found');
      
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId || "";

      console.log('Saving transfer to backend:', transferData.transferNumber);

      const transferDataToSave = {
        ...transferData,
        userId: userId,
        dateCreated: new Date().toISOString(),
        status: 'Draft'
      };

      const response = await fetch(
        `https://nexuspos.onrender.com/api/stock-transfer/create?email=${encodeURIComponent(userEmail)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(transferDataToSave)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save transfer: ${errorText}`);
      }

      const result = await response.json();
      console.log('Transfer saved to backend:', result.data.transferNumber);
      return result.data;
      
    } catch (error) {
      console.error('Error saving transfer to backend:', error);
      throw error;
    }
  };

  const updateProductsAndInventory = async (savedTransfer) => {
    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId || "";

      const productUpdatePromises = [];
      const inventoryUpdatePromises = [];

      // Update FROM store products (deduct stock)
      for (const item of savedTransfer.items) {
        const existingProduct = getProductById(item.productId);
        
        if (!existingProduct) {
          console.error(`Product ${item.productId} not found in cache`);
          continue;
        }

        const newStock = calculateNewStock(item);

        // FROM STORE PRODUCT UPDATE (deduct stock)
        const fromProductUpdateData = {
          productName: existingProduct.productName,
          category: existingProduct.category || "",
          categoryId: existingProduct.categoryId || "",
          productType: existingProduct.productType || "Each",
          sku: existingProduct.sku || "",
          userId: userId,
          lowStockNotification: existingProduct.lowStockNotification || 0,
          trackStock: existingProduct.trackStock !== false,
          editType: "Stock Transfer Out",
          stock: parseFloat(newStock),
          productId: item.productId,
          price: parseFloat(existingProduct.price || 0),
          cost: parseFloat(existingProduct.cost || 0),
          currentDate: new Date().toISOString(),
          barcode: existingProduct.barcode || "",
          createdBy: existingProduct.createdBy || "",
          roleOfEditor: existingProduct.roleOfEditor || "Owner",
          storeId: savedTransfer.fromStoreId,
          appCreated: existingProduct.appCreated || null,
          adminSynced: existingProduct.adminSynced || false
        };

        const fromProductPromise = fetch(
          `https://nexuspos.onrender.com/api/productRouter/product-updates?email=${encodeURIComponent(userEmail)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fromProductUpdateData),
          }
        ).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update product ${fromProductUpdateData.productName}:`, errorText);
            throw new Error(`Failed to update product ${fromProductUpdateData.productName}`);
          }
          return response.json();
        });

        productUpdatePromises.push(fromProductPromise);

        // FROM STORE INVENTORY UPDATE
        const fromInventoryId = generateInventoryId();
        const fromInventoryUpdateData = {
          productName: existingProduct.productName,
          inventoryId: fromInventoryId,
          productId: item.productId,
          roleOfEditor: "Owner",
          createdBy: "Web App",
          userId: userId,
          EditorId: userId,
          currentDate: new Date().toISOString(),
          stockBefore: parseFloat(existingProduct.stock || 0),
          stockAfter: parseFloat(newStock),
          typeOfEdit: "Stock Transfer Out",
          synchronized: false,
          editedBy: "adminApp",
          transferNumber: savedTransfer.transferNumber,
          storeName: savedTransfer.fromStoreName,
          notes: `Transfer ${savedTransfer.transferNumber} - Transferred ${item.transferQuantity} units to ${savedTransfer.toStoreName}`,
          difference: -item.transferQuantity,
          priceImpact: -item.totalValue,
          costBefore: parseFloat(existingProduct.cost || 0),
          costAfter: parseFloat(existingProduct.cost || 0),
          priceBefore: parseFloat(existingProduct.price || 0),
          priceAfter: parseFloat(existingProduct.price || 0),
          deviceId: "web-app",
          pos: "owner",
          posId: userId,
          productType: existingProduct.productType || "Each",
          storeId: savedTransfer.fromStoreId,
          stockSynced: false,
          stockUpdated: ""
        };

        const fromInventoryPromise = fetch(
          `https://nexuspos.onrender.com/api/inventoryRouter/inventory-updates?email=${encodeURIComponent(userEmail)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fromInventoryUpdateData),
          }
        ).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to create inventory update for ${fromInventoryUpdateData.productName}:`, errorText);
          }
          return response.json();
        });

        inventoryUpdatePromises.push(fromInventoryPromise);

        // Check if product exists in TO store, if not create it
        const toStoreProduct = allProducts.find(p => 
          p.productId === item.productId && p.storeId === savedTransfer.toStoreId
        );

        if (toStoreProduct) {
          // Update existing product in TO store (add stock)
          const toStockAfter = (parseFloat(toStoreProduct.stock) || 0) + (item.transferQuantity || 0);
          
          const toProductUpdateData = {
            productName: toStoreProduct.productName,
            category: toStoreProduct.category || "",
            categoryId: toStoreProduct.categoryId || "",
            productType: toStoreProduct.productType || "Each",
            sku: toStoreProduct.sku || "",
            userId: userId,
            lowStockNotification: toStoreProduct.lowStockNotification || 0,
            trackStock: toStoreProduct.trackStock !== false,
            editType: "Stock Transfer In",
            stock: parseFloat(toStockAfter),
            productId: item.productId,
            price: parseFloat(toStoreProduct.price || 0),
            cost: parseFloat(toStoreProduct.cost || 0),
            currentDate: new Date().toISOString(),
            barcode: toStoreProduct.barcode || "",
            createdBy: toStoreProduct.createdBy || "",
            roleOfEditor: toStoreProduct.roleOfEditor || "Owner",
            storeId: savedTransfer.toStoreId,
            appCreated: toStoreProduct.appCreated || null,
            adminSynced: toStoreProduct.adminSynced || false
          };

          const toProductPromise = fetch(
            `https://nexuspos.onrender.com/api/productRouter/product-updates?email=${encodeURIComponent(userEmail)}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(toProductUpdateData),
            }
          ).then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Failed to update TO store product ${toProductUpdateData.productName}:`, errorText);
            }
            return response.json();
          });

          productUpdatePromises.push(toProductPromise);

          // TO STORE INVENTORY UPDATE
          const toInventoryId = generateInventoryId();
          const toInventoryUpdateData = {
            productName: toStoreProduct.productName,
            inventoryId: toInventoryId,
            productId: item.productId,
            roleOfEditor: "Owner",
            createdBy: "Web App",
            userId: userId,
            EditorId: userId,
            currentDate: new Date().toISOString(),
            stockBefore: parseFloat(toStoreProduct.stock || 0),
            stockAfter: parseFloat(toStockAfter),
            typeOfEdit: "Stock Transfer In",
            synchronized: false,
            editedBy: "adminApp",
            transferNumber: savedTransfer.transferNumber,
            storeName: savedTransfer.toStoreName,
            notes: `Transfer ${savedTransfer.transferNumber} - Received ${item.transferQuantity} units from ${savedTransfer.fromStoreName}`,
            difference: item.transferQuantity,
            priceImpact: item.totalValue,
            costBefore: parseFloat(toStoreProduct.cost || 0),
            costAfter: parseFloat(toStoreProduct.cost || 0),
            priceBefore: parseFloat(toStoreProduct.price || 0),
            priceAfter: parseFloat(toStoreProduct.price || 0),
            deviceId: "web-app",
            pos: "owner",
            posId: userId,
            productType: toStoreProduct.productType || "Each",
            storeId: savedTransfer.toStoreId,
            stockSynced: false,
            stockUpdated: ""
          };

          const toInventoryPromise = fetch(
            `https://nexuspos.onrender.com/api/inventoryRouter/inventory-updates?email=${encodeURIComponent(userEmail)}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(toInventoryUpdateData),
            }
          );

          inventoryUpdatePromises.push(toInventoryPromise);
        }
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

  const markTransferAsCompleted = async (savedTransfer) => {
    try {
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token);
      const userEmail = decoded.email;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/stock-transfer/${savedTransfer.transferNumber}/complete?email=${encodeURIComponent(userEmail)}`,
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
        throw new Error(`Failed to complete transfer: ${errorText}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Error marking transfer as completed:', error);
      throw error;
    }
  };

  const handleProcessTransfer = async () => {
    if (!transferData || processing) return;

    if (!productsLoaded) {
      toast.error('Products are still loading. Please wait...');
      return;
    }

    setProcessing(true);
    
    try {
      // 1. Save transfer to backend
      toast.info('Saving transfer to server...');
      const savedTransfer = await saveTransferToBackend();

      // 2. Update products and inventory
      toast.info('Updating products and inventory...');
      await updateProductsAndInventory(savedTransfer);

      // 3. Mark transfer as completed
      toast.info('Completing transfer...');
      await markTransferAsCompleted(savedTransfer);

      // Clear local storage
      if (transferData.localId) {
        localStorage.removeItem(transferData.localId);
        const existingTransfers = JSON.parse(localStorage.getItem('localTransfers') || '[]');
        const updatedTransfers = existingTransfers.filter(trf => trf.id !== transferData.localId);
        localStorage.setItem('localTransfers', JSON.stringify(updatedTransfers));
      }

      toast.success('Stock transfer processed successfully!');
      
      setTimeout(() => {
        navigate('/stock-transfers');
      }, 1500);

    } catch (error) {
      console.error('Error processing transfer:', error);
      toast.error(`Failed to process transfer: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/stock-transfers');
  };

  if (!transferData) {
    return (
      <div className="transfer-process-loading">
        <p>Loading transfer data...</p>
      </div>
    );
  }

  return (
    <div className="transfer-process-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="transfer-process-sidebar-toggle-wrapper">
        <button 
          className="transfer-process-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: sidebarOpen ? '280px' : '80px' }}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
        
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`transfer-process-content ${sidebarOpen ? 'transfer-process-shifted' : 'transfer-process-collapsed'}`}>
        <div className="transfer-process-container">
          <div className="transfer-process-header">
            <h2>Process Stock Transfer</h2>
            <div className="transfer-process-status">
              <span className="transfer-process-status-text">
                Ready to Process Transfer
              </span>
            </div>
          </div>

          <div className="transfer-process-summary">
            <div className="transfer-process-summary-item">
              <FaExchangeAlt className="transfer-process-summary-icon" />
              <div className="transfer-process-summary-content">
                <span className="transfer-process-summary-label">Transfer #:</span>
                <span className="transfer-process-summary-value">{transferData.transferNumber}</span>
              </div>
            </div>
            <div className="transfer-process-summary-item">
              <FaStore className="transfer-process-summary-icon" />
              <div className="transfer-process-summary-content">
                <span className="transfer-process-summary-label">From:</span>
                <span className="transfer-process-summary-value">{transferData.fromStoreName}</span>
              </div>
            </div>
            <div className="transfer-process-summary-item">
              <FaStore className="transfer-process-summary-icon" />
              <div className="transfer-process-summary-content">
                <span className="transfer-process-summary-label">To:</span>
                <span className="transfer-process-summary-value">{transferData.toStoreName}</span>
              </div>
            </div>
            <div className="transfer-process-summary-item">
              <FaDollarSign className="transfer-process-summary-icon" />
              <div className="transfer-process-summary-content">
                <span className="transfer-process-summary-label">Total Value:</span>
                <span className="transfer-process-summary-value">${transferData.totalValue?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="transfer-process-warning">
            <FaExclamationTriangle className="transfer-process-warning-icon" />
            <p>This will deduct stock from the source store. This action cannot be undone.</p>
          </div>

          <div className="transfer-process-items-section">
            <div className="transfer-process-items-header">
              <h3>Items to Transfer</h3>
              <span className="transfer-process-items-count">
                {transferData.items?.length || 0} items
              </span>
            </div>

            <div className="transfer-process-items-table-container">
              <div className="transfer-process-items-table-header">
                <div className="transfer-process-table-header-cell">Item</div>
                <div className="transfer-process-table-header-cell">Current Stock</div>
                <div className="transfer-process-table-header-cell">Transfer Qty</div>
                <div className="transfer-process-table-header-cell">New Stock</div>
                <div className="transfer-process-table-header-cell">Unit Cost</div>
                <div className="transfer-process-table-header-cell">Total Value</div>
              </div>
              
              <div className="transfer-process-items-table-body">
                {transferData.items?.map((item, index) => {
                  const newStock = calculateNewStock(item);
                  
                  return (
                    <div key={item.productId} className="transfer-process-item-row">
                      <div className="transfer-process-item-info">
                        <div className="transfer-process-item-name">{item.productName}</div>
                        <div className="transfer-process-item-details">
                          SKU: {item.sku}
                        </div>
                      </div>
                      <div className="transfer-process-item-current-stock">
                        {item.existingStock || 0}
                      </div>
                      <div className="transfer-process-item-transfer">
                        -{item.transferQuantity || 0}
                      </div>
                      <div className="transfer-process-item-new-stock">
                        <span className={newStock < (item.existingStock || 0) ? 'transfer-process-negative' : ''}>
                          {newStock}
                        </span>
                      </div>
                      <div className="transfer-process-item-unit-cost">
                        ${(item.unitCost || 0).toFixed(2)}
                      </div>
                      <div className="transfer-process-item-total">
                        ${(item.totalValue || 0).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="transfer-process-confirmation">
            <div className="transfer-process-confirmation-item">
              <span className="transfer-process-confirmation-label">Total Items:</span>
              <span className="transfer-process-confirmation-value">{transferData.items?.length || 0}</span>
            </div>
            <div className="transfer-process-confirmation-item">
              <span className="transfer-process-confirmation-label">Total Quantity:</span>
              <span className="transfer-process-confirmation-value">
                {transferData.items?.reduce((sum, item) => sum + (item.transferQuantity || 0), 0)}
              </span>
            </div>
            <div className="transfer-process-confirmation-item">
              <span className="transfer-process-confirmation-label">Total Value:</span>
              <span className="transfer-process-confirmation-value">
                ${transferData.totalValue?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="transfer-process-action-buttons">
            <button 
              className="transfer-process-cancel-btn" 
              onClick={handleCancel}
              disabled={processing}
            >
              <FaTimesCircle />
              CANCEL
            </button>
            <button 
              className="transfer-process-confirm-btn" 
              onClick={handleProcessTransfer}
              disabled={processing || isLoadingProducts || !productsLoaded}
            >
              {processing ? (
                <>
                  <div className="transfer-process-spinner"></div>
                  PROCESSING...
                </>
              ) : isLoadingProducts ? (
                'LOADING PRODUCTS...'
              ) : !productsLoaded ? (
                'PRODUCTS NOT LOADED'
              ) : (
                <>
                  <FaCheck />
                  PROCESS TRANSFER
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessStockTransferScreen;