import React from "react";
import { FaWhatsapp, FaCrown, FaStar, FaChevronDown } from "react-icons/fa";
import "../Css/SubscriptionModal.css";

const SubscriptionModal = ({ isOpen, onClose }) => {
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
          <h2 className="gradient-title">Unlock Access</h2>
          <button className="close-button-premium" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="modal-scroll-container">
          <div className="modal-body-premium">
            <p className="premium-text">
              This feature requires an <strong>Admin Subscription</strong> to
              access advanced product management capabilities.
            </p>
            <div className="pricing-info">
              <h3 className="pricing-title">Subscription Plans</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4>Basic</h4>
                  <div className="pricem">$29 Unlimited Access</div>
                  <p className="labelm">Essential product management</p>
                </div>
              </div>
            </div>
            <div className="feature-details">
              <h3 className="features-title">What You Get:</h3>
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Unlimited remote product creation and editing
                </div>

                {/* <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Bulk product operations and imports
                </div> */}
                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Real-time stock synchronization
                </div>

                <div className="benefit-item">
                  <span className="checkmark">✓</span>
                  Automated low stock notifications
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
