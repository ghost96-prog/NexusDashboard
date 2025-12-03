import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/WelcomeScreen.css";
import welcomeImage from "../assets/adaptive2.png";

const WelcomeScreen = () => {
  const [rotatedLogos, setRotatedLogos] = useState([]);
  const navigate = useNavigate();

  // Generate random positions and rotations for background logos
  useEffect(() => {
    const logos = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      rotation: Math.random() * 360 - 180,
      size: 60 + Math.random() * 80,
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0.08 + Math.random() * 0.07,
      blur: 0.5 + Math.random() * 1.5
    }));
    setRotatedLogos(logos);
  }, []);

  const renderBackgroundLogos = () => (
    <div className="nexus-backgroundLogosContainer">
      {rotatedLogos.map(logo => (
        <div
          key={logo.id}
          className="nexus-backgroundLogo"
          style={{
            left: `${logo.x}%`,
            top: `${logo.y}%`,
            width: `${logo.size}px`,
            height: `${logo.size}px`,
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))`,
            borderRadius: '20%',
            transform: `rotate(${logo.rotation}deg)`,
            opacity: logo.opacity,
            filter: `blur(${logo.blur}px)`,
          }}
        />
      ))}
    </div>
  );

  const onButtonClickBackoffice = () => {
    navigate("/loginBackOffice");
  };

  return (
    <div className="nexus-mainContainer">
      {/* Background Animated Elements */}
      {renderBackgroundLogos()}
      
      {/* Main Card with Glass Effect */}
      <div className="nexus-titleContainerWelcome">
        {/* Coming Soon Badge */}
        
        {/* Logo and Welcome Section */}
        <img src={welcomeImage} alt="Welcome" className="nexus-welcomeImage" />
        
        <h1 className="nexus-welcomeTitle">Welcome to NEXUS POS</h1>
        
        <p className="nexus-welcomeSubtitle">Stock Management System</p>
        
        <div className="nexus-taglineContainer">
          <span className="nexus-sparkle">✨</span>
          <span className="nexus-taglineText">Smart • Secure • Efficient</span>
          <span className="nexus-sparkle">✨</span>
        </div>

        {/* Buttons Section */}
        <div className="nexus-buttonContainer">
          <button
            className="nexus-inputButtonvirtual"
            type="button"
            title="Coming Soon"
            disabled
          >
            <span className="nexus-buttonIcon">🚌</span>
            VIRTUAL FISCALISATION
            <span className="nexus-chevron">→</span>
          </button>
        </div>

        <div className="nexus-buttonContainer">
          <button
            className="nexus-inputButtonRegister"
            type="button"
            onClick={onButtonClickBackoffice}
          >
            <span className="nexus-buttonIcon">🏢</span>
            BACK OFFICE
            <span className="nexus-chevron">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;