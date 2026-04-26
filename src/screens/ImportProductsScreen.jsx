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

// Change fetchExistingProducts to return the data
const fetchExistingProducts = async () => {
  try {
    setIsLoadingProducts(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoadingProducts(false);
      return [];
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
      return userProducts;
    }
    return [];
  } catch (error) {
    console.error("Error fetching existing products:", error);
    toast.error("Failed to load products data");
    return [];
  } finally {
    setIsLoadingProducts(false);
  }
};


const createProductsFromCSV = async () => {
  setIsUploading(true);
  if (!file || csvData.length === 0) return;

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
    const freshProducts = await fetchExistingProducts();

    if (freshProducts.length === 0) {
      // Only block if fetch actually failed (not just empty store)
      // We'll allow empty stores to proceed
      console.log("No existing products found - this may be a new store, proceeding with import.");
    }

    // Create lookup maps from freshProducts directly (not stale state)
    const existingProductsBySKU = new Map();
    const existingProductsById = new Map();

    freshProducts.forEach(product => {
      if (product.sku) {
        existingProductsBySKU.set(product.sku, product);
      }
      if (product.productId) {
        existingProductsById.set(product.productId, product);
      }
    });

    // Validate CSV data before processing
    let hasEmptySKU = false;
    const csvSKUSet = new Set();

    for (const item of csvData) {
      const importedSKU = item["Product SKU"]?.trim();
      const importedProductId = item["Product Id"]?.trim();

      if (importedSKU === "") {
        hasEmptySKU = true;
        break;
      }

      if (csvSKUSet.has(importedSKU)) {
        toast.error(`Duplicate SKU found in CSV: "${importedSKU}". Please ensure all SKUs in the file are unique.`);
        setIsUploading(false);
        return;
      }
      csvSKUSet.add(importedSKU);

      if (importedProductId) {
        if (existingProductsById.has(importedProductId)) {
          const existingProduct = existingProductsById.get(importedProductId);

          if (existingProduct.sku !== importedSKU) {
            if (existingProductsBySKU.has(importedSKU)) {
              const skuProduct = existingProductsBySKU.get(importedSKU);
              if (skuProduct.productId !== importedProductId) {
                toast.error(`Cannot change SKU to "${importedSKU}" for product ID "${importedProductId}" because this SKU is already used by product "${skuProduct.productName}" (ID: ${skuProduct.productId})`);
                setIsUploading(false);
                return;
              }
            }
            console.log(`SKU will be updated for product ${existingProduct.productName} from "${existingProduct.sku}" to "${importedSKU}"`);
          }
        } else if (existingProductsBySKU.has(importedSKU)) {
          const existingProduct = existingProductsBySKU.get(importedSKU);
          toast.error(`Cannot create new product with SKU "${importedSKU}" because it's already used by product "${existingProduct.productName}" (ID: ${existingProduct.productId}). Please use a unique SKU for this new product.`);
          setIsUploading(false);
          return;
        }
      } else {
        if (existingProductsBySKU.has(importedSKU)) {
          const existingProduct = existingProductsBySKU.get(importedSKU);
          toast.error(`Cannot create new product with SKU "${importedSKU}" because it already exists for product "${existingProduct.productName}" (ID: ${existingProduct.productId}). Please use a different unique SKU for this new product.`);
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

      // Process products
      for (const item of chunk) {
        try {
          const categoryName = item["Category"].toUpperCase();
          const categoryId = categoryMap.get(categoryName);
          const newSKU = item["Product SKU"]?.trim() || "";
          const providedProductId = item["Product Id"]?.trim();

          let existingProduct = null;
          let productId = providedProductId;
          let isUpdate = false;
          let oldSKU = null;

          if (providedProductId) {
            if (existingProductsById.has(providedProductId)) {
              existingProduct = existingProductsById.get(providedProductId);
              productId = providedProductId;
              isUpdate = true;
              oldSKU = existingProduct.sku;
              console.log(`UPDATE by ID: ${existingProduct.productName} (${providedProductId})`);
            } else {
              isUpdate = false;
              console.log(`CREATE NEW with provided ID: ${providedProductId} for product ${item["Product Name"]}`);
            }
          } else {
            productId = generateProductId();
            isUpdate = false;
            console.log(`CREATE NEW (generated ID): ${item["Product Name"]} with SKU: ${newSKU}`);
          }

          if (isUpdate && oldSKU && oldSKU !== newSKU) {
            console.log(`Updating SKU for product ${existingProduct.productName} from "${oldSKU}" to "${newSKU}"`);
            existingProductsBySKU.delete(oldSKU);

            if (existingProductsBySKU.has(newSKU)) {
              const conflictingProduct = existingProductsBySKU.get(newSKU);
              if (conflictingProduct.productId !== productId) {
                throw new Error(`Cannot change SKU to "${newSKU}" - it is already used by product "${conflictingProduct.productName}"`);
              }
            }
          }

          let stockBefore = 0;
          if (existingProduct) {
            stockBefore = Number(existingProduct.stock) || 0;
          }

          const product = {
            productName: item["Product Name"].toUpperCase(),
            category: categoryName,
            categoryId: categoryId,
            productType: item["Product Type"],
            sku: newSKU,
            lowStockNotification: Number(item["Low Stock"]),
            trackStock: item["Track Stock"].toUpperCase() === "TRUE",
            price: Number(item["Price"] || 0),
            cost: Number(item["Cost"] || 0),
            stock: Number(item["Stock"]),
            userId: userId,
            productId: productId,
            roleOfEditor: "Admin",
            storeId: "",
            createdBy: 'Web User',
            EditorId: userId,
            currentDate: new Date().toISOString(),
          };

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

          if (isUpdate) {
            existingProductsBySKU.set(newSKU, { ...existingProduct, sku: newSKU, ...product });
            existingProductsById.set(productId, { ...existingProduct, sku: newSKU, ...product });
            updatedCount++;
          } else {
            existingProductsBySKU.set(newSKU, { ...product });
            existingProductsById.set(productId, { ...product });
            createdCount++;
          }

          processedCount++;

          setImportProgress({
            current: processedCount,
            total: totalProducts,
            created: createdCount,
            updated: updatedCount,
            failed: failedCount
          });

          console.log(`Progress: ${processedCount}/${totalProducts} (Created: ${createdCount}, Updated: ${updatedCount}, Failed: ${failedCount})`);

        } catch (error) {
          console.error(`Error saving product:`, error);
          failedCount++;

          setImportProgress({
            current: processedCount,
            total: totalProducts,
            created: createdCount,
            updated: updatedCount,
            failed: failedCount
          });

          toast.error(`Failed to save product: ${error.message}`);
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
    
    // Price - allow empty (set to 0)
    const priceValue = row["Price"]?.trim();
    if (priceValue === "") {
      row["Price"] = "0";
    } else {
      const price = parseFloat(priceValue);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: Price must be a valid positive number or empty`);
      }
    }
    
    // Cost - allow empty (set to 0)
    const costValue = row["Cost"]?.trim();
    if (costValue === "") {
      row["Cost"] = "0";
    } else {
      const cost = parseFloat(costValue);
      if (isNaN(cost) || cost < 0) {
        errors.push(`Row ${rowNum}: Cost must be a valid positive number or empty`);
      }
    }
    
    // Stock - allow empty (set to 0)
    const stockValue = row["Stock"]?.trim();
    if (stockValue === "") {
      row["Stock"] = "0";
    } else {
      const stock = parseFloat(stockValue);
      if (isNaN(stock) || stock < 0) {
        errors.push(`Row ${rowNum}: Stock must be a valid positive number or empty`);
      }
    }
    
    // Low Stock - allow empty (set to 0)
    const lowStockValue = row["Low Stock"]?.trim();
    if (lowStockValue === "") {
      row["Low Stock"] = "0";
    } else {
      const lowStock = parseFloat(lowStockValue);
      if (isNaN(lowStock) || lowStock < 0) {
        errors.push(`Row ${rowNum}: Low Stock must be a valid positive number or empty`);
      }
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

const createProductsFromCSVold = async () => {
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
    
    // Validate CSV data before processing
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
      
      // Case 1: Product ID provided
      if (importedProductId) {
        // If Product ID exists, it must match the SKU (either same SKU or SKU not used elsewhere)
        if (existingProductsById.has(importedProductId)) {
          const existingProduct = existingProductsById.get(importedProductId);
          
          // If SKU is different from existing, check if new SKU is available
          if (existingProduct.sku !== importedSKU) {
            // Check if the new SKU is already used by a DIFFERENT product
            if (existingProductsBySKU.has(importedSKU)) {
              const skuProduct = existingProductsBySKU.get(importedSKU);
              if (skuProduct.productId !== importedProductId) {
                toast.error(`Cannot change SKU to "${importedSKU}" for product ID "${importedProductId}" because this SKU is already used by product "${skuProduct.productName}" (ID: ${skuProduct.productId})`);
                setIsUploading(false);
                return;
              }
            }
            // SKU is available or belongs to the same product - this is fine (SKU update)
            console.log(`SKU will be updated for product ${existingProduct.productName} from "${existingProduct.sku}" to "${importedSKU}"`);
          }
        }
        // If Product ID doesn't exist, that's fine - we'll create new product with this ID
        // But need to check if SKU is already used by another product
        else if (existingProductsBySKU.has(importedSKU)) {
          const existingProduct = existingProductsBySKU.get(importedSKU);
          toast.error(`Cannot create new product with SKU "${importedSKU}" because it's already used by product "${existingProduct.productName}" (ID: ${existingProduct.productId}). Please use a unique SKU for this new product.`);
          setIsUploading(false);
          return;
        }
      }
      // Case 2: No Product ID provided - this is a new product creation
      else {
        // If SKU exists, throw error - SKU must be unique for new products
        if (existingProductsBySKU.has(importedSKU)) {
          const existingProduct = existingProductsBySKU.get(importedSKU);
          toast.error(`Cannot create new product with SKU "${importedSKU}" because it already exists for product "${existingProduct.productName}" (ID: ${existingProduct.productId}). Please use a different unique SKU for this new product.`);
          setIsUploading(false);
          return;
        }
        // SKU doesn't exist - this is a valid new product
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
      
      // Process products
      for (const item of chunk) {
        try {
          const categoryName = item["Category"].toUpperCase();
          const categoryId = categoryMap.get(categoryName);
          const newSKU = item["Product SKU"]?.trim() || "";
          const providedProductId = item["Product Id"]?.trim();
          
          // Determine if this is an update or new product
          let existingProduct = null;
          let productId = providedProductId;
          let isUpdate = false;
          let oldSKU = null;
          
          // Case 1: Product ID provided
          if (providedProductId) {
            // Check if product exists with this ID
            if (existingProductsById.has(providedProductId)) {
              // UPDATE: Product exists with this ID
              existingProduct = existingProductsById.get(providedProductId);
              productId = providedProductId;
              isUpdate = true;
              oldSKU = existingProduct.sku;
              console.log(`UPDATE by ID: ${existingProduct.productName} (${providedProductId})`);
            } else {
              // CREATE NEW: Product ID provided but doesn't exist - create new with this ID
              isUpdate = false;
              console.log(`CREATE NEW with provided ID: ${providedProductId} for product ${item["Product Name"]}`);
            }
          }
          // Case 2: No Product ID provided - this MUST be a new product creation
          else {
            // CREATE NEW: Generate new ID
            productId = generateProductId();
            isUpdate = false;
            console.log(`CREATE NEW (generated ID): ${item["Product Name"]} with SKU: ${newSKU}`);
          }
          
          // If this is an update and SKU is changing, handle the SKU change
          if (isUpdate && oldSKU && oldSKU !== newSKU) {
            console.log(`Updating SKU for product ${existingProduct.productName} from "${oldSKU}" to "${newSKU}"`);
            
            // Remove old SKU from lookup map to avoid conflicts
            existingProductsBySKU.delete(oldSKU);
            
            // Double-check new SKU is not used by another product
            if (existingProductsBySKU.has(newSKU)) {
              const conflictingProduct = existingProductsBySKU.get(newSKU);
              if (conflictingProduct.productId !== productId) {
                throw new Error(`Cannot change SKU to "${newSKU}" - it is already used by product "${conflictingProduct.productName}"`);
              }
            }
          }
          
          // Calculate stock before for inventory tracking
          let stockBefore = 0;
          if (existingProduct) {
            stockBefore = Number(existingProduct.stock) || 0;
          }
          
const product = {
  productName: item["Product Name"].toUpperCase(),
  category: categoryName,
  categoryId: categoryId,
  productType: item["Product Type"],
  sku: newSKU,
  lowStockNotification: Number(item["Low Stock"]),
  trackStock: item["Track Stock"].toUpperCase() === "TRUE",
  price: Number(item["Price"] || 0),  // MODIFIED: Default to 0 if empty
  cost: Number(item["Cost"] || 0),     // MODIFIED: Default to 0 if empty
  stock: Number(item["Stock"]),
  userId: userId,
  productId: productId,
  roleOfEditor: "Admin",
  storeId: "",
  createdBy: 'Web User',
  EditorId: userId,
  currentDate: new Date().toISOString(),
};
          
          // Save product to server
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
          
          // Update the lookup maps
          if (isUpdate) {
            // Update existing product in maps
            existingProductsBySKU.set(newSKU, {
              ...existingProduct,
              sku: newSKU,
              ...product
            });
            // Keep the ID map updated
            existingProductsById.set(productId, {
              ...existingProduct,
              sku: newSKU,
              ...product
            });
            updatedCount++;
          } else {
            // Add new product to lookup maps
            const newProduct = {
              ...product,
            };
            existingProductsBySKU.set(newSKU, newProduct);
            existingProductsById.set(productId, newProduct);
            createdCount++;
          }
          
          processedCount++;
          
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
          console.error(`Error saving product:`, error);
          failedCount++;
          
          // Update progress even on failure
          setImportProgress({
            current: processedCount,
            total: totalProducts,
            created: createdCount,
            updated: updatedCount,
            failed: failedCount
          });
          
          toast.error(`Failed to save product: ${error.message}`);
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
disabled={errors.length > 0 || isLoadingProducts}
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