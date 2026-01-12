import React, { useState, useEffect } from 'react';
import '../Css/GoodsReceivedDetailsScreen.css';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaStore,
  FaChevronLeft,
  FaFileInvoice,
  FaBox,
  FaDollarSign,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaPrint,
  FaDownload,
  FaFilePdf,
  FaFileCsv
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GoodsReceivedDetailsScreen = () => {
  const [detailsSidebarOpen, setDetailsSidebarOpen] = useState(false);
  const [grvData, setGrvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null);
  
  const navigate = useNavigate();
  const { grvId } = useParams();

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
    if (email && grvId) {
      fetchGRVDetails();
    }
  }, [email, grvId]);

  const fetchGRVDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `https://nexuspos.onrender.com/api/grv/${grvId}?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch GRV details: ${response.status}`);
      }

      const result = await response.json();
      setGrvData(result.data);
    } catch (error) {
      console.error("Error fetching GRV details:", error);
      toast.error("Failed to load GRV details");
      setGrvData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatFirebaseDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date;
      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (!date || isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recent';
    }
  };

  const toggleDetailsSidebar = () => {
    setDetailsSidebarOpen(!detailsSidebarOpen);
  };

  const handleBack = () => {
    navigate('/goods-received');
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'processed':
        return 'grv-details-status-completed';
      case 'pending':
        return 'grv-details-status-pending';
      case 'draft':
      default:
        return 'grv-details-status-draft';
    }
  };

  // Calculate new stock total for each item
  const calculateNewStock = (item) => {
    return (item.existingStock || 0) + (item.receivedQuantity || 0);
  };

  // Calculate total new stock for all items
  const calculateTotalNewStock = () => {
    if (!grvData?.items) return 0;
    return grvData.items.reduce((total, item) => total + calculateNewStock(item), 0);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Simple PDF export without external libraries
  const handleExportPDF = () => {
    if (!grvData) {
      toast.error('No GRV data to export');
      return;
    }

    try {
      // Create a printable HTML page
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>GRV ${grvData.grNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2c3e50; }
            .info-section { margin-bottom: 20px; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { font-weight: bold; width: 150px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th { background-color: #34495e; color: white; padding: 10px; text-align: left; }
            .table td { padding: 8px; border-bottom: 1px solid #ddd; }
            .total-row { font-weight: bold; background-color: #f8f9fa; }
            .footer { margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Goods Received Voucher</h1>
            <h2>GR Number: ${grvData.grNumber || 'N/A'}</h2>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Date Created:</div>
              <div>${formatFirebaseDate(grvData.dateCreated)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Supplier:</div>
              <div>${grvData.supplierName || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Store:</div>
              <div>${grvData.storeName || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Created By:</div>
              <div>${grvData.createdBy || 'N/A'}</div>
            </div>
            ${grvData.poNumber ? `<div class="info-row"><div class="info-label">PO Number:</div><div>${grvData.poNumber}</div></div>` : ''}
            ${grvData.deliveryNote ? `<div class="info-row"><div class="info-label">Delivery Note:</div><div>${grvData.deliveryNote}</div></div>` : ''}
            ${grvData.notes ? `<div class="info-row"><div class="info-label">Notes:</div><div>${grvData.notes}</div></div>` : ''}
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Existing Stock</th>
                <th>Received Qty</th>
                <th>New Stock Total</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>New Price</th>
                <th>New Cost</th>
              </tr>
            </thead>
            <tbody>
              ${grvData.items?.map(item => `
                <tr>
                  <td>${item.productName || ''}</td>
                  <td>${item.existingStock || 0}</td>
                  <td>${item.receivedQuantity || 0}</td>
                  <td>${calculateNewStock(item)}</td>
                  <td>$${(item.unitPrice || 0).toFixed(2)}</td>
                  <td>$${(item.totalPrice || 0).toFixed(2)}</td>
                  <td>$${(item.newPrice || 0).toFixed(2)}</td>
                  <td>$${(item.newCost || 0).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
              <tr class="total-row">
                <td>TOTAL</td>
                <td></td>
                <td>${grvData.items?.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0) || 0}</td>
                <td>${calculateTotalNewStock()}</td>
                <td></td>
                <td>$${(grvData.totalValue || 0).toFixed(2)}</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>NexusPOS Inventory Management System</p>
          </div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait a moment then trigger print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      
      toast.success('PDF ready for printing/saving!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Export to CSV function
  const handleExportCSV = () => {
    if (!grvData) {
      toast.error('No GRV data to export');
      return;
    }

    try {
      // Prepare headers
      const headers = [
        'Product Name',
        'SKU',
        'Category',
        'Existing Stock',
        'Received Quantity',
        'New Stock Total',
        'Unit Price',
        'Total Price',
        'New Price',
        'New Cost'
      ];

      // Prepare data rows
      const dataRows = grvData.items?.map(item => [
        item.productName || '',
        item.sku || '',
        item.category || '',
        (item.existingStock || 0).toString(),
        (item.receivedQuantity || 0).toString(),
        calculateNewStock(item).toString(),
        (item.unitPrice || 0).toFixed(2),
        (item.totalPrice || 0).toFixed(2),
        (item.newPrice || 0).toFixed(2),
        (item.newCost || 0).toFixed(2)
      ]) || [];

      // Add totals row
      const totalReceived = grvData.items?.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0) || 0;
      dataRows.push([
        'TOTAL',
        '',
        '',
        '',
        totalReceived.toString(),
        calculateTotalNewStock().toString(),
        '',
        (grvData.totalValue || 0).toFixed(2),
        '',
        ''
      ]);

      // Combine headers and data
      const csvContent = [
        `Goods Received Voucher: ${grvData.grNumber || ''}`,
        `Date: ${formatFirebaseDate(grvData.dateCreated)}`,
        `Supplier: ${grvData.supplierName || ''}`,
        `Store: ${grvData.storeName || ''}`,
        '',
        headers.join(','),
        ...dataRows.map(row => row.join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `GRV-${grvData.grNumber || 'details'}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully!');
      
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="grv-details-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="grv-details-sidebar-toggle-wrapper">
        <button 
          className="grv-details-sidebar-toggle"
          onClick={toggleDetailsSidebar}
          style={{ left: detailsSidebarOpen ? '280px' : '80px' }}
        >
          {detailsSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={detailsSidebarOpen} toggleSidebar={toggleDetailsSidebar} />
      
      <div className={`grv-details-content ${detailsSidebarOpen ? 'grv-details-shifted' : 'grv-details-collapsed'}`}>
        <div className="grv-details-container">
          <div className="grv-details-header">
            <div className="grv-details-title-section">
              <h2>Goods Received Voucher Details</h2>
              <div className="grv-details-actions">
                <button className="grv-details-action-btn" onClick={handlePrint}>
                  <FaPrint />
                  Print
                </button>
                <button className="grv-details-action-btn" onClick={handleExportPDF}>
                  <FaFilePdf />
                  PDF
                </button>
                <button className="grv-details-action-btn" onClick={handleExportCSV}>
                  <FaFileCsv />
                  CSV
                </button>
              </div>
            </div>
            
            <div className="grv-details-id-section">
              <div className="grv-details-id">
                {loading ? 'Loading...' : grvData?.grNumber || 'GRV-XXXX'}
              </div>
              <div className={`grv-details-status ${getStatusBadgeClass(grvData?.status)}`}>
                {grvData?.status || 'Loading'}
              </div>
              <button className="grv-details-back-button" onClick={handleBack}>
                <FaChevronLeft />
                Back to List
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grv-details-loading">
              <p>Loading GRV details...</p>
            </div>
          ) : grvData ? (
            <>
              <div className="grv-details-summary">
                <div className="grv-details-summary-grid">
                  <div className="grv-details-summary-item">
                    <div className="grv-details-summary-label">
                      <FaCalendarAlt /> Date Created:
                    </div>
                    <div className="grv-details-summary-value">
                      {formatFirebaseDate(grvData.dateCreated)}
                    </div>
                  </div>
                  
                  <div className="grv-details-summary-item">
                    <div className="grv-details-summary-label">
                      <FaUser /> Created By:
                    </div>
                    <div className="grv-details-summary-value">
                      {grvData.createdBy || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="grv-details-summary-item">
                    <div className="grv-details-summary-label">
                      <FaStore /> Store:
                    </div>
                    <div className="grv-details-summary-value">
                      {grvData.storeName || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="grv-details-summary-item">
                    <div className="grv-details-summary-label">
                      <FaFileInvoice /> Supplier:
                    </div>
                    <div className="grv-details-summary-value">
                      {grvData.supplierName || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="grv-details-summary-item">
                    <div className="grv-details-summary-label">
                      <FaFileInvoice /> PO Number:
                    </div>
                    <div className="grv-details-summary-value">
                      {grvData.poNumber || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="grv-details-summary-item">
                    <div className="grv-details-summary-label">
                      <FaFileAlt /> Delivery Note:
                    </div>
                    <div className="grv-details-summary-value">
                      {grvData.deliveryNote || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="grv-details-summary-item full-width">
                    <div className="grv-details-summary-label">
                      <FaFileAlt /> Notes:
                    </div>
                    <div className="grv-details-summary-value">
                      {grvData.notes || 'No notes'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grv-details-items-section">
                <div className="grv-details-items-header">
                  <h3>Items Received</h3>
                  <div className="grv-details-items-count">
                    {grvData.items?.length || 0} items
                    <span className="grv-details-total-value">
                      Total: ${grvData.totalValue?.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="grv-details-items-table-container">
                  <div className="grv-details-items-table-header">
                    <div className="grv-details-table-header-cell">Item</div>
                    <div className="grv-details-table-header-cell">Existing Stock</div>
                    <div className="grv-details-table-header-cell">Received Qty</div>
                    <div className="grv-details-table-header-cell">New Stock Total</div>
                    <div className="grv-details-table-header-cell">Unit Price</div>
                    <div className="grv-details-table-header-cell">Total</div>
                    <div className="grv-details-table-header-cell">New Price</div>
                    <div className="grv-details-table-header-cell">New Cost</div>
                  </div>
                  
                  <div className="grv-details-items-table-body">
                    {grvData.items?.map((item, index) => {
                      const newStockTotal = calculateNewStock(item);
                      const priceIncreased = item.newPrice > item.unitPrice;
                      const costIncreased = item.newCost > item.unitCost;
                      
                      return (
                        <div key={index} className="grv-details-item-row">
                          <div className="grv-details-item-info">
                            <div className="grv-details-item-name">{item.productName}</div>
                            <div className="grv-details-item-details">
                              SKU: {item.sku} | Category: {item.category}
                            </div>
                          </div>
                          <div className="grv-details-item-existing-stock">
                            {item.existingStock || 0}
                          </div>
                          <div className="grv-details-item-received">
                            +{item.receivedQuantity || 0}
                          </div>
                          <div className="grv-details-item-new-stock">
                            <span className="grv-details-new-stock-value">
                              {newStockTotal}
                            </span>
                          </div>
                          <div className="grv-details-item-unit-price">
                            ${(item.unitPrice || 0).toFixed(2)}
                          </div>
                          <div className="grv-details-item-total">
                            ${(item.totalPrice || 0).toFixed(2)}
                          </div>
                          <div className="grv-details-item-new-price">
                            ${(item.newPrice || 0).toFixed(2)}
                            {priceIncreased && <span className="grv-details-price-up"> ↑</span>}
                            {item.newPrice < item.unitPrice && <span className="grv-details-price-down"> ↓</span>}
                          </div>
                          <div className="grv-details-item-new-cost">
                            ${(item.newCost || 0).toFixed(2)}
                            {costIncreased && <span className="grv-details-cost-up"> ↑</span>}
                            {item.newCost < item.unitCost && <span className="grv-details-cost-down"> ↓</span>}
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="grv-details-totals-row">
                      <div className="grv-details-total-label">Total</div>
                      <div className="grv-details-total-existing"></div>
                      <div className="grv-details-total-received">
                        {grvData.items?.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0)}
                      </div>
                      <div className="grv-details-total-new-stock">
                        {calculateTotalNewStock()}
                      </div>
                      <div className="grv-details-total-unit-price"></div>
                      <div className="grv-details-total-value-cell">
                        ${grvData.totalValue?.toFixed(2)}
                      </div>
                      <div className="grv-details-total-new-price"></div>
                      <div className="grv-details-total-new-cost"></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grv-details-empty">
              <FaBox className="grv-details-empty-icon" />
              <p>No GRV data found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoodsReceivedDetailsScreen;