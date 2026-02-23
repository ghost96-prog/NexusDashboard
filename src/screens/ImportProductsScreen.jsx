import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import {
  FaFileCsv,
  FaFileUpload,
  FaDownload,
  FaTimes,
  FaCheckCircle,
  FaSpinner,
  FaArrowLeft,
  FaCloudUploadAlt
} from "react-icons/fa";
import "../Css/ImportProductsScreen.css";

const ImportProductsScreen = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [existingProducts, setExistingProducts] = useState([]);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    created: 0,
    updated: 0,
    failed: 0
  });

  useEffect(() => {
    fetchExistingProducts();
  }, []);

  const fetchExistingProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingProducts(false);
        return;
      }

      const decoded = jwtDecode(token);
      const userEmail = decoded.email;
      const userId = decoded.userId;

      const response = await fetch(
        `https://nexuspos.onrender.com/api/productRouter/products?email=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        const userProducts = responseData.data.filter(p => p.userId === userId);
        setExistingProducts(userProducts);
        console.log(`Loaded ${userProducts.length} existing products`);
      }
    } catch (error) {
      console.error("Error fetching existing products:", error);
      toast.error("Failed to load products data");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const expectedHeaders = [
    "Product SKU",
    "Product Name", 
    "Category",
    "Product Type",
    "Product Id",
    "Low Stock",
    "Track Stock",
    "Price",
    "Cost",
    "Stock"
  ];

  const downloadTemplate = () => {
    const templateData = [
      {
        "Product SKU": "10001",
        "Product Name": "EXAMPLE PRODUCT",
        "Category": "EXAMPLE CATEGORY",
        "Product Type": "Each",
        "Product Id": "",
        "Low Stock": "10",
        "Track Stock": "TRUE",
        "Price": "19.99",
        "Cost": "12.50",
        "Stock": "100"
      },
      {
        "Product SKU": "BEEF-001",
        "Product Name": "BEEF STEAK",
        "Category": "BUTCHERY",
        "Product Type": "Weight",
        "Product Id": "",
        "Low Stock": "5.00",
        "Track Stock": "TRUE",
        "Price": "12.99",
        "Cost": "8.50",
        "Stock": "50.50"
      },
      {
        "Product SKU": "ABC-123-XYZ",
        "Product Name": "IMPORTED WINE",
        "Category": "BEVERAGES",
        "Product Type": "Each",
        "Product Id": "",
        "Low Stock": "5",
        "Track Stock": "TRUE",
        "Price": "45.99",
        "Cost": "32.50",
        "Stock": "25"
      }
    ];

    const csv = Papa.unparse({
      fields: expectedHeaders,
      data: templateData
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "product_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template downloaded successfully!");
  };

  const validateCSV = (data) => {
    const errors = [];
    
    const headers = Object.keys(data[0] || {});
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    }
    
    data.forEach((row, index) => {
      const rowNum = index + 2;
      
      if (!row["Product Name"]?.trim()) {
        errors.push(`Row ${rowNum}: Product Name is required`);
      }
      
      const productType = row["Product Type"]?.trim();
      if (!productType || !["Each", "Weight"].includes(productType)) {
        errors.push(`Row ${rowNum}: Product Type must be "Each" or "Weight"`);
      }
      
      const price = parseFloat(row["Price"]);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: Price must be a valid positive number`);
      }
      
      const cost = parseFloat(row["Cost"]);
      if (isNaN(cost) || cost < 0) {
        errors.push(`Row ${rowNum}: Cost must be a valid positive number`);
      }
      
      const stock = parseFloat(row["Stock"]);
      if (isNaN(stock) || stock < 0) {
        errors.push(`Row ${rowNum}: Stock must be a valid positive number`);
      }
      
      const lowStock = parseFloat(row["Low Stock"]);
      if (isNaN(lowStock) || lowStock < 0) {
        errors.push(`Row ${rowNum}: Low Stock must be a valid positive number`);
      }
      
      const trackStock = row["Track Stock"];
      if (!["TRUE", "FALSE", "true", "false"].includes(trackStock)) {
        errors.push(`Row ${rowNum}: Track Stock must be "TRUE" or "FALSE"`);
      }
    });
    
    return errors;
  };

  const onDrop = useCallback((acceptedFiles) => {
    setErrors([]);
    setCsvData([]);
    setImportProgress({
      current: 0,
      total: 0,
      created: 0,
      updated: 0,
      failed: 0
    });
    
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }
    
    setFile(file);
    setFileName(file.name);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let data = results.data.filter((row) => {
          return Object.values(row).some((value) => value?.toString().trim() !== "");
        });
        
        const validationErrors = validateCSV(data);
        
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          toast.error(`Found ${validationErrors.length} validation errors`);
        } else {
          setCsvData(data);
          toast.success(`File loaded successfully. ${data.length} products found.`);
        }
      },
      error: (error) => {
        toast.error("Error parsing CSV file");
        console.error(error);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const generateCategoryId = () => {
    const timestamp = new Date().getTime().toString(16);
    const randomString = Math.random().toString(36).substr(2, 8);
    return timestamp + randomString;
  };

  const generateProductId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const generateInventoryId = (length) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const createProductsFromCSV = async () => {
    setIsUploading(true);
    if (!file || csvData.length === 0) return;
    
    // Check if products are still loading
    if (existingProducts.length === 0) {
      toast.error("Products data is still loading. Please wait a moment and try again.");
      return;
    }
    
    setImportProgress({
      current: 0,
      total: csvData.length,
      created: 0,
      updated: 0,
      failed: 0
    });
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing.");
        setIsUploading(false);
        return;
      }

      const decoded = jwtDecode(token);
      const userId = decoded.userId;
      const userEmail = decoded.email;
      
      // FRESH FETCH - Get latest products before starting import
      console.log("Fetching latest products before import...");
      await fetchExistingProducts();
      
      if (existingProducts.length === 0) {
        toast.error("Failed to load products data. Please try again.");
        setIsUploading(false);
        return;
      }
      
      // Create lookup maps for existing products
      const existingProductsBySKU = new Map();
      const existingProductsById = new Map();
      
      existingProducts.forEach(product => {
        if (product.sku) {
          existingProductsBySKU.set(product.sku, product);
        }
        if (product.productId) {
          existingProductsById.set(product.productId, product);
        }
      });
      
      // Check for empty SKUs and validate duplicates/updates
      let hasEmptySKU = false;
      const csvSKUSet = new Set(); // For checking duplicates WITHIN the CSV file
      
      for (const item of csvData) {
        const importedSKU = item["Product SKU"]?.trim();
        const importedProductId = item["Product Id"]?.trim();
        
        // Check for empty SKU
        if (importedSKU === "") {
          hasEmptySKU = true;
          break;
        }
        
        // Check for duplicates within the CSV file
        if (csvSKUSet.has(importedSKU)) {
          toast.error(`Duplicate SKU found in CSV: "${importedSKU}". Please ensure all SKUs in the file are unique.`);
          setIsUploading(false);
          return;
        }
        csvSKUSet.add(importedSKU);
        
        // Check against existing products in database
        if (existingProductsBySKU.has(importedSKU)) {
          const existingProduct = existingProductsBySKU.get(importedSKU);
          
          // If Product ID is provided, verify it matches the existing product
          if (importedProductId) {
            if (existingProduct.productId !== importedProductId) {
              // SKU exists but belongs to a DIFFERENT product
              toast.error(`SKU "${importedSKU}" already belongs to product "${existingProduct.productName}" (ID: ${existingProduct.productId}). Cannot use same SKU for different products.`);
              setIsUploading(false);
              return;
            }
            // SKU and Product ID match - this is valid for update
            console.log(`Update detected for product: ${existingProduct.productName} (SKU: ${importedSKU})`);
          } else {
            // SKU exists but no Product ID provided
            toast.error(`SKU "${importedSKU}" already exists. Please provide the Product ID if you want to update this product.`);
            setIsUploading(false);
            return;
          }
        }
        
        // Also check if Product ID exists but belongs to a different SKU
        if (importedProductId && existingProductsById.has(importedProductId)) {
          const existingProduct = existingProductsById.get(importedProductId);
          if (existingProduct.sku !== importedSKU) {
            toast.error(`Product ID "${importedProductId}" already exists with a different SKU "${existingProduct.sku}". Cannot change SKU of existing product.`);
            setIsUploading(false);
            return;
          }
        }
      }
      
      if (hasEmptySKU) {
        toast.error("Some products have empty SKUs. Please provide SKUs for all products.");
        setIsUploading(false);
        return;
      }
      
      // Process in chunks
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < csvData.length; i += chunkSize) {
        chunks.push(csvData.slice(i, i + chunkSize));
      }
      
      const categoryMap = new Map();
      let processedCount = 0;
      let failedCount = 0;
      let createdCount = 0;
      let updatedCount = 0;
      const totalProducts = csvData.length;
      
      for (const chunk of chunks) {
        // Handle categories first
        for (const item of chunk) {
          const categoryName = item["Category"].toUpperCase();
          
          if (!categoryMap.has(categoryName)) {
            const categoryId = generateCategoryId();
            categoryMap.set(categoryName, categoryId);
            
            const newCategory = {
              categoryId,
              categoryName,
              currentDate: new Date(),
              items: 0,
            };
            
            // Save category to server
            try {
              const response = await fetch(
                `https://nexuspos.onrender.com/api/categoryRouter/category-updates?email=${encodeURIComponent(userEmail)}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify(newCategory),
                }
              );
              
              if (!response.ok) {
                console.error("Error adding category to server");
              }
            } catch (error) {
              console.error("Error pushing category to server:", error);
            }
          }
        }
        
        // Create products
        for (const item of chunk) {
          const categoryName = item["Category"].toUpperCase();
          const categoryId = categoryMap.get(categoryName);
          const sku = item["Product SKU"]?.trim() || "";
          const providedProductId = item["Product Id"]?.trim();
          
          // Determine if this is an update and find existing product
          let existingProduct = null;
          let productId = providedProductId;
          let isUpdate = false;
          
          // Strategy 1: Find by Product ID if provided
          if (providedProductId && existingProductsById.has(providedProductId)) {
            existingProduct = existingProductsById.get(providedProductId);
            productId = providedProductId; // Use the provided ID
            isUpdate = true;
            console.log(`Found by Product ID: ${existingProduct.productName}`);
          }
          // Strategy 2: Find by SKU if no Product ID or ID not found
          else if (sku && existingProductsBySKU.has(sku)) {
            existingProduct = existingProductsBySKU.get(sku);
            productId = existingProduct.productId; // Use the existing product's ID
            isUpdate = true;
            console.log(`Found by SKU: ${existingProduct.productName}`);
          }
          // Strategy 3: New product
          else {
            productId = providedProductId || generateProductId();
            isUpdate = false;
            console.log(`New product: ${item["Product Name"]}`);
          }
          
          const product = {
            productName: item["Product Name"].toUpperCase(),
            category: categoryName,
            categoryId: categoryId,
            productType: item["Product Type"],
            sku: sku,
            lowStockNotification: Number(item["Low Stock"]),
            trackStock: item["Track Stock"].toUpperCase() === "TRUE",
            price: Number(item["Price"]),
            cost: Number(item["Cost"]),
            stock: Number(item["Stock"]),
            userId: userId,
            productId: productId,
            roleOfEditor: "Admin",
            storeId: "",
            createdBy: 'Web User',
            EditorId: userId,
            currentDate: new Date().toISOString(),
          };
          
          // Calculate stock before for inventory tracking
          let stockBefore = 0;
          if (existingProduct) {
            stockBefore = Number(existingProduct.stock) || 0;
          }
          
          // Save product to server
          try {
            const response = await fetch(
              `https://nexuspos.onrender.com/api/productRouter/product-updates?email=${encodeURIComponent(userEmail)}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(product),
              }
            );
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Failed to save product");
            }
            
            // Create inventory update
            const inventoryUpdateData = {
              productName: product.productName,
              inventoryId: generateInventoryId(16),
              productId: product.productId,
              roleOfEditor: "Owner",
              createdBy: "Web User",
              EditorId: userId,
              userId: userId,
              editedBy: isUpdate ? "adminApp" : "",
              currentDate: product.currentDate,
              stockBefore: stockBefore,
              stockAfter: product.stock,
              typeOfEdit: isUpdate ? "Override" : "Create",
              synchronized: false,
            };
            
            // Save inventory update
            await fetch(
              `https://nexuspos.onrender.com/api/inventoryRouter/inventory-updates?email=${encodeURIComponent(userEmail)}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(inventoryUpdateData),
              }
            );
            
            // Update counters
            processedCount++;
            if (isUpdate) {
              updatedCount++;
            } else {
              createdCount++;
            }
            
            // Update progress
            setImportProgress({
              current: processedCount,
              total: totalProducts,
              created: createdCount,
              updated: updatedCount,
              failed: failedCount
            });
            
            console.log(`Progress: ${processedCount}/${totalProducts} (Created: ${createdCount}, Updated: ${updatedCount}, Failed: ${failedCount})`);
            
          } catch (error) {
            console.error(`Error saving product ${product.productName}:`, error);
            failedCount++;
            
            // Update progress even on failure
            setImportProgress({
              current: processedCount,
              total: totalProducts,
              created: createdCount,
              updated: updatedCount,
              failed: failedCount
            });
            
            toast.error(`Failed to save product: ${product.productName}`);
          }
        }
      }
      
      setIsUploading(false);
      
      if (failedCount > 0) {
        toast.warning(
          <div>
            <strong>Import completed with issues:</strong><br />
            Total: {totalProducts} | ✅ Created: {createdCount} | ✏️ Updated: {updatedCount} | ❌ Failed: {failedCount}
          </div>
        );
      } else {
        setIsSuccess(true);
        toast.success(
          <div>
            <strong>Successfully imported all products!</strong><br />
            Total: {totalProducts} | ✅ Created: {createdCount} | ✏️ Updated: {updatedCount}
          </div>
        );
      }
      
      // Refresh the existing products list after import
      await fetchExistingProducts();
      
      setTimeout(() => {
        setFile(null);
        setFileName(null);
        setCsvData([]);
        setIsSuccess(false);
        setImportProgress({
          current: 0,
          total: 0,
          created: 0,
          updated: 0,
          failed: 0
        });
        navigate("/products");
      }, 3000);
      
    } catch (error) {
      setIsUploading(false);
      toast.error(`Upload failed: ${error.message}`);
      console.error("Error in createProductsFromCSV:", error);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileName(null);
    setCsvData([]);
    setErrors([]);
    setImportProgress({
      current: 0,
      total: 0,
      created: 0,
      updated: 0,
      failed: 0
    });
  };

  return (
    <div className="import-products-container">
      <div className="import-products-header">
        <button 
          className="import-back-btn"
          onClick={() => navigate("/products")}
        >
          <FaArrowLeft />
          Back to Products
        </button>
        <h1>Import Products</h1>
        <p>Upload a CSV file to import multiple products at once</p>
        <button 
          className="download-template-btn"
          onClick={downloadTemplate}
        >
          <FaDownload />
          Download CSV Template
        </button>
      </div>
      
      <div className="import-main-content">
        <div className="dropzone-section">
          <div 
            {...getRootProps()} 
            className={`dropzone ${isDragActive ? "active" : ""} ${file ? "has-file" : ""}`}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="file-selected">
                <FaFileCsv className="file-icon" />
                <div className="file-info">
                  <h4>{fileName}</h4>
                  <p>{csvData.length} products loaded</p>
                  <button 
                    className="clear-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    disabled={isUploading}
                  >
                    <FaTimes /> Remove File
                  </button>
                </div>
              </div>
            ) : (
              <div className="dropzone-content">
                <FaCloudUploadAlt className="upload-icon" />
                <h3>Drag & drop your CSV file here</h3>
                <p>or click to browse files</p>
                <p className="file-requirements">Only CSV files accepted</p>
              </div>
            )}
          </div>
          
          {file && !isUploading && !isSuccess && (
            <button 
              className="import-action-btn"
              onClick={createProductsFromCSV}
              disabled={errors.length > 0 || existingProducts.length === 0}
              title={existingProducts.length === 0 ? "Loading products data..." : ""}
            >
              <FaFileUpload />
              {errors.length > 0 ? "Fix Errors First" : 
               existingProducts.length === 0 ? "Loading..." : "Import Products"}
            </button>
          )}
          
          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                ></div>
              </div>
              
              <div className="progress-stats">
                <p className="progress-main">
                  Processing {importProgress.current} of {importProgress.total} products
                </p>
                <div className="progress-breakdown">
                  <span className="stat-created">✅ Created: {importProgress.created}</span>
                  <span className="stat-updated">✏️ Updated: {importProgress.updated}</span>
                  {importProgress.failed > 0 && (
                    <span className="stat-failed">❌ Failed: {importProgress.failed}</span>
                  )}
                </div>
              </div>
              
              <div className="progress-percentage">
                {Math.round((importProgress.current / importProgress.total) * 100)}%
              </div>
              
              <FaSpinner className="spinner" />
            </div>
          )}
          
          {isSuccess && (
            <div className="success-message">
              <FaCheckCircle />
              <span>Import completed successfully!</span>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div className="validation-errors">
            <h4><FaTimes /> Validation Errors ({errors.length})</h4>
            <div className="errors-list">
              {errors.slice(0, 10).map((error, index) => (
                <div key={index} className="error-item">
                  {error}
                </div>
              ))}
              {errors.length > 10 && (
                <p className="more-errors">... and {errors.length - 10} more errors</p>
              )}
            </div>
          </div>
        )}

        {csvData.length > 0 && errors.length === 0 && (
          <div className="preview-section">
            <h3>Preview ( {csvData.length} products)</h3>
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    {expectedHeaders.map(header => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {expectedHeaders.map(header => (
                        <td key={header} title={row[header] || ""}>
                          {row[header] || <span className="empty-cell">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="preview-note">
              Showing {csvData.length} products. All data will be validated before import.
            </p>
          </div>
        )}
      </div>

      <div className="import-instructions">
        <div className="instructions-card">
          <h3><FaFileCsv /> How to Import Products</h3>
          <ol>
            <li>Download the template below to see the required format</li>
            <li>Fill in your product data (leave Product Id empty for new products)</li>
            <li>Drag & drop your CSV file or click to browse</li>
            <li>Review validation and click "Import Products"</li>
          </ol>
        </div>
      </div>

      <div className="import-notes">
        <div className="note-card">
          <h4>Important Notes:</h4>
          <ul>
            <li><strong>Product Id:</strong> Leave empty for new products</li>
            <li><strong>Product Type:</strong> Must be "Each" or "Weight"</li>
            <li><strong>Weight Products / Measured items:</strong> Use decimals for stock (e.g., 50.50)</li>
            <li><strong>Each Products:</strong> Use whole numbers for stock</li>
            <li><strong>Track Stock:</strong> Use "TRUE" or "FALSE"</li>
            <li><strong>SKU:</strong> Can be any alphanumeric value (letters, numbers, hyphens, etc.) and must be unique</li>
            <li>All names will be converted to UPPERCASE</li>
            <li>Categories are created automatically if they don't exist</li>
          </ul>
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ImportProductsScreen;