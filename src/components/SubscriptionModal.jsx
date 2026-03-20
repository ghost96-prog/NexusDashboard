import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaCrown, FaStar, FaChevronDown, FaClipboardList, FaTruck } from "react-icons/fa";
import "../Css/SubscriptionModal.css";

const SubscriptionModal = ({ isOpen, onClose, onSubscribe, currentStatus }) => {
  if (!isOpen) return null;

  const handleWhatsAppClick = () => {
    const phoneNumber = "+263783556354";
    const message =
      "Hello! I'd like to inquire about the admin subscription for NexusPOS.";

    const whatsappUrl = `https://wa.me/${phoneNumber.replace(
      /\D/g,
      ""
    )}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCallClick = () => {
    window.open("tel:+263783556354");
  };

  const handleSubscribe = () => {
    // Store in localStorage that subscription is active
    localStorage.setItem("nexuspos_admin_subscribed", "true");
    localStorage.setItem("nexuspos_subscription_timestamp", Date.now().toString());
    if (onSubscribe) {
      onSubscribe(true);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-premium"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header with Gradient */}
        <div className="modal-header-premium">
          <div className="premium-badge">
            <FaCrown className="crown-icon" />
            <span>Premium Feature</span>
          </div>
          <h2 className="gradient-title">Unlock Advanced Features</h2>
          <button className="close-button-premium" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="modal-scroll-container">
          <div className="modal-body-premium">
            <p className="premium-text">
              This feature requires an <strong>Admin Subscription</strong> to
              access advanced inventory and stock management capabilities.
            </p>
            <div className="pricing-info">
              <h3 className="pricing-title">Subscription Plans</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4>Basic</h4>
                  <div className="pricemm">$29 Unlimited Access</div>
                  <p className="labelm">Essential inventory management</p>
                </div>
              </div>
            </div>
            <div className="feature-details">
              <h3 className="features-title">Premium Features Included:</h3>
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  <strong>Inventory Counts</strong> - Track and manage stock counts
                  <FaClipboardList style={{ marginLeft: '8px', color: '#5694e6' }} />
                </div>
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  <strong>Goods Received (GRVs)</strong> - Manage incoming inventory
                  <FaTruck style={{ marginLeft: '8px', color: '#5694e6' }} />
                </div>
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Unlimited remote product creation and editing
                </div>
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Real-time stock synchronization
                </div>
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Automated low stock notifications
                </div>
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Stock adjustment and reconciliation
                </div>
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Multi-store inventory management
                </div>
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Advanced reporting and analytics
                </div>
              </div>
            </div>

            <div className="support-section">
              <p className="support-text">
                Contact our dedicated support team to choose the perfect plan
                for your business:
              </p>

              <div className="contact-buttons">
                <button
                  className="whatsapp-button"
                  onClick={handleWhatsAppClick}
                >
                  <FaWhatsapp className="whatsapp-icon" />
                  WhatsApp Our Team
                </button>

                <button className="call-button" onClick={handleCallClick}>
                  📞 Call Directly
                </button>
              </div>

              <div className="contact-info">
                <span className="phone-number">+263 783 556 354</span>
                <span className="available-text">
                  Available 24/7 • Quick Response
                </span>
              </div>
            </div>

            {/* Demo Subscription Button - For testing purposes */}
            <div className="demo-subscription-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <button 
                className="demo-subscribe-button"
                onClick={handleSubscribe}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Activate Subscription (Demo)
              </button>
              <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>
                Click to activate subscription. Contact support for permanent activation.
              </p>
            </div>

            <div className="scroll-indicator">
              <FaChevronDown className="scroll-arrow" />
              <span>Scroll for more information</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-premium">
          <button className="understand-button" onClick={onClose}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;