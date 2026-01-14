import React, { useState, useEffect } from 'react';
import '../Css/StockTransferDetailsScreen.css';
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
  FaFilePdf,
  FaFileCsv,
  FaExchangeAlt
} from "react-icons/fa";
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StockTransferDetailsScreen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null);
  
  const navigate = useNavigate();
  const { transferId } = useParams();

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
    if (email && transferId) {
      fetchTransferDetails();
    }
  }, [email, transferId]);

  const fetchTransferDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `https://nexuspos.onrender.com/api/stock-transfer/${transferId}?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transfer details: ${response.status}`);
      }

      const result = await response.json();
      setTransferData(result.data);
    } catch (error) {
      console.error("Error fetching transfer details:", error);
      toast.error("Failed to load transfer details");
      setTransferData(null);
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleBack = () => {
    navigate('/stock-transfers');
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'transferred':
        return 'transfer-details-status-completed';
      case 'pending':
      case 'in-progress':
        return 'transfer-details-status-pending';
      case 'cancelled':
        return 'transfer-details-status-cancelled';
      default:
        return 'transfer-details-status-pending';
    }
  };

  const calculateNewStock = (item) => {
    return (item.existingStock || 0) - (item.transferQuantity || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!transferData) {
      toast.error('No transfer data to export');
      return;
    }

    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stock Transfer ${transferData.transferNumber}</title>
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
            <h1>Stock Transfer</h1>
            <h2>Transfer Number: ${transferData.transferNumber || 'N/A'}</h2>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Date Created:</div>
              <div>${formatFirebaseDate(transferData.dateCreated)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">From Store:</div>
              <div>${transferData.fromStoreName || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">To Store:</div>
              <div>${transferData.toStoreName || 'N/A'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Created By:</div>
              <div>${transferData.createdBy || 'N/A'}</div>
            </div>
            ${transferData.reference ? `<div class="info-row"><div class="info-label">Reference:</div><div>${transferData.reference}</div></div>` : ''}
            ${transferData.notes ? `<div class="info-row"><div class="info-label">Notes:</div><div>${transferData.notes}</div></div>` : ''}
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Transfer Qty</th>
                <th>New Stock</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${transferData.items?.map(item => `
                <tr>
                  <td>${item.productName || ''}</td>
                  <td>${item.sku || ''}</td>
                  <td>${item.existingStock || 0}</td>
                  <td>${item.transferQuantity || 0}</td>
                  <td>${calculateNewStock(item)}</td>
                  <td>$${(item.unitCost || 0).toFixed(2)}</td>
                  <td>$${(item.totalValue || 0).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td>${transferData.items?.reduce((sum, item) => sum + (item.transferQuantity || 0), 0) || 0}</td>
                <td></td>
                <td></td>
                <td>$${(transferData.totalValue || 0).toFixed(2)}</td>
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

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
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

  const handleExportCSV = () => {
    if (!transferData) {
      toast.error('No transfer data to export');
      return;
    }

    try {
      const headers = [
        'Product Name',
        'SKU',
        'Category',
        'Current Stock',
        'Transfer Quantity',
        'New Stock',
        'Unit Cost',
        'Total Value'
      ];

      const dataRows = transferData.items?.map(item => [
        item.productName || '',
        item.sku || '',
        item.category || '',
        (item.existingStock || 0).toString(),
        (item.transferQuantity || 0).toString(),
        calculateNewStock(item).toString(),
        (item.unitCost || 0).toFixed(2),
        (item.totalValue || 0).toFixed(2)
      ]) || [];

      const totalTransfer = transferData.items?.reduce((sum, item) => sum + (item.transferQuantity || 0), 0) || 0;
      dataRows.push([
        'TOTAL',
        '',
        '',
        '',
        totalTransfer.toString(),
        '',
        '',
        (transferData.totalValue || 0).toFixed(2)
      ]);

      const csvContent = [
        `Stock Transfer: ${transferData.transferNumber || ''}`,
        `Date: ${formatFirebaseDate(transferData.dateCreated)}`,
        `From: ${transferData.fromStoreName || ''}`,
        `To: ${transferData.toStoreName || ''}`,
        '',
        headers.join(','),
        ...dataRows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Transfer-${transferData.transferNumber || 'details'}.csv`);
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
    <div className="transfer-details-main-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="transfer-details-sidebar-toggle-wrapper">
        <button 
          className="transfer-details-sidebar-toggle"
          onClick={toggleSidebar}
          style={{ left: sidebarOpen ? '280px' : '80px' }}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`transfer-details-content ${sidebarOpen ? 'transfer-details-shifted' : 'transfer-details-collapsed'}`}>
        <div className="transfer-details-container">
          <div className="transfer-details-header">
            <div className="transfer-details-title-section">
              <h2>Stock Transfer Details</h2>
              <div className="transfer-details-actions">
                <button className="transfer-details-action-btn" onClick={handlePrint}>
                  <FaPrint />
                  Print
                </button>
                <button className="transfer-details-action-btn" onClick={handleExportPDF}>
                  <FaFilePdf />
                  PDF
                </button>
                <button className="transfer-details-action-btn" onClick={handleExportCSV}>
                  <FaFileCsv />
                  CSV
                </button>
              </div>
            </div>
            
            <div className="transfer-details-id-section">
              <div className="transfer-details-id">
                {loading ? 'Loading...' : transferData?.transferNumber || 'TRF-XXXX'}
              </div>
              <div className={`transfer-details-status ${getStatusBadgeClass(transferData?.status)}`}>
                {transferData?.status || 'Loading'}
              </div>
              <button className="transfer-details-back-button" onClick={handleBack}>
                <FaChevronLeft />
                Back to List
              </button>
            </div>
          </div>

          {loading ? (
            <div className="transfer-details-loading">
              <p>Loading transfer details...</p>
            </div>
          ) : transferData ? (
            <>
              <div className="transfer-details-summary">
                <div className="transfer-details-summary-grid">
                  <div className="transfer-details-summary-item">
                    <div className="transfer-details-summary-label">
                      <FaCalendarAlt /> Date Created:
                    </div>
                    <div className="transfer-details-summary-value">
                      {formatFirebaseDate(transferData.dateCreated)}
                    </div>
                  </div>
                  
                  <div className="transfer-details-summary-item">
                    <div className="transfer-details-summary-label">
                      <FaUser /> Created By:
                    </div>
                    <div className="transfer-details-summary-value">
                      {transferData.createdBy || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="transfer-details-summary-item">
                    <div className="transfer-details-summary-label">
                      <FaStore /> From Store:
                    </div>
                    <div className="transfer-details-summary-value">
                      {transferData.fromStoreName || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="transfer-details-summary-item">
                    <div className="transfer-details-summary-label">
                      <FaStore /> To Store:
                    </div>
                    <div className="transfer-details-summary-value">
                      {transferData.toStoreName || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="transfer-details-summary-item">
                    <div className="transfer-details-summary-label">
                      <FaFileInvoice /> Reference:
                    </div>
                    <div className="transfer-details-summary-value">
                      {transferData.reference || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="transfer-details-summary-item full-width">
                    <div className="transfer-details-summary-label">
                      <FaFileAlt /> Notes:
                    </div>
                    <div className="transfer-details-summary-value">
                      {transferData.notes || 'No notes'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="transfer-details-items-section">
                <div className="transfer-details-items-header">
                  <h3>Items Transferred</h3>
                  <div className="transfer-details-items-count">
                    {transferData.items?.length || 0} items
                    <span className="transfer-details-total-value">
                      Total: ${transferData.totalValue?.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="transfer-details-items-table-container">
                  <div className="transfer-details-items-table-header">
                    <div className="transfer-details-table-header-cell">Item</div>
                    <div className="transfer-details-table-header-cell">SKU</div>
                    <div className="transfer-details-table-header-cell">Current Stock</div>
                    <div className="transfer-details-table-header-cell">Transfer Qty</div>
                    <div className="transfer-details-table-header-cell">New Stock</div>
                    <div className="transfer-details-table-header-cell">Unit Cost</div>
                    <div className="transfer-details-table-header-cell">Total Value</div>
                  </div>
                  
                  <div className="transfer-details-items-table-body">
                    {transferData.items?.map((item, index) => {
                      const newStock = calculateNewStock(item);
                      
                      return (
                        <div key={index} className="transfer-details-item-row">
                          <div className="transfer-details-item-info">
                            <div className="transfer-details-item-name">{item.productName}</div>
                            <div className="transfer-details-item-details">
                              Category: {item.category}
                            </div>
                          </div>
                          <div className="transfer-details-item-sku">
                            {item.sku}
                          </div>
                          <div className="transfer-details-item-current-stock">
                            {item.existingStock || 0}
                          </div>
                          <div className="transfer-details-item-transfer">
                            -{item.transferQuantity || 0}
                          </div>
                          <div className="transfer-details-item-new-stock">
                            <span className="transfer-details-new-stock-value">
                              {newStock}
                            </span>
                          </div>
                          <div className="transfer-details-item-unit-cost">
                            ${(item.unitCost || 0).toFixed(2)}
                          </div>
                          <div className="transfer-details-item-total">
                            ${(item.totalValue || 0).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="transfer-details-totals-row">
                      <div className="transfer-details-total-label">Total</div>
                      <div className="transfer-details-total-sku"></div>
                      <div className="transfer-details-total-current"></div>
                      <div className="transfer-details-total-transfer">
                        {transferData.items?.reduce((sum, item) => sum + (item.transferQuantity || 0), 0)}
                      </div>
                      <div className="transfer-details-total-new"></div>
                      <div className="transfer-details-total-unit"></div>
                      <div className="transfer-details-total-value-cell">
                        ${transferData.totalValue?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="transfer-details-empty">
              <FaBox className="transfer-details-empty-icon" />
              <p>No transfer data found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockTransferDetailsScreen;