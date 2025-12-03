// LoginScreen.jsx - Nexus POS with Blurry Background Logos
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/LoginScreen.css";
import welcomeImage from "../assets/adaptive2.png";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import NProgress from "nprogress";
import "react-toastify/dist/ReactToastify.css";
import "nprogress/nprogress.css";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false
  });
  const [backgroundLogos, setBackgroundLogos] = useState([]);

  // Generate random positions and rotations for background logos
  useEffect(() => {
    const logos = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      rotation: Math.random() * 360 - 180, // -180 to 180 degrees
      size: 60 + Math.random() * 100, // 60px to 160px
      x: Math.random() * 100, // 0% to 100%
      y: Math.random() * 100, // 0% to 100%
      opacity: 0.05 + Math.random() * 0.1, // 0.05 to 0.15
      blur: 1 + Math.random() * 2 // 1px to 3px blur
    }));
    setBackgroundLogos(logos);
  }, []);

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setEmailError("Invalid email format");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const onButtonClick = async () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    if (!isEmailValid || !isPasswordValid) return;

    NProgress.start();
    setLoading(true);

    try {
      const response = await fetch(
        "https://nexuspos.onrender.com/api/usersRouter/signin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.message || "Invalid email or password");
        return;
      }

      const decoded = jwtDecode(result.token);
      localStorage.setItem("token", result.token);
      
      toast.success("Login successful!");
      
      setTimeout(() => {
        navigate("/salesSummery", { state: { email: decoded.email } });
      }, 1000);
      
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
  };

  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onButtonClick();
    }
  };

  // Render background logos
  const renderBackgroundLogos = () => (
    <div className="login-background-logos-container">
      {backgroundLogos.map(logo => (
        <div
          key={logo.id}
          className="login-background-logo"
          style={{
            left: `${logo.x}%`,
            top: `${logo.y}%`,
            width: `${logo.size}px`,
            height: `${logo.size}px`,
            transform: `rotate(${logo.rotation}deg)`,
            opacity: logo.opacity,
            filter: `blur(${logo.blur}px)`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="login-screen-container">
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
      />

      {renderBackgroundLogos()}

      <div className="login-card">
        <div className="login-content">
          {/* Logo Section */}
          <div className="login-logo-section">
            <img 
              className="login-logo" 
              src={welcomeImage} 
              alt="Nexus POS Logo" 
              onError={(e) => {
                // Fallback if image doesn't load
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/65x65/1e3c72/ffffff?text=NP";
              }}
            />
            <h1 className="login-welcome-title">Welcome to Nexus POS</h1>
            <p className="login-welcome-subtitle">Sign in to BackOffice</p>

            <div className="login-tagline-container">
              <span className="login-sparkle">✨</span>
              <span className="login-tagline-text">Professional • Efficient • Secure</span>
              <span className="login-sparkle">✨</span>
            </div>
          </div>

          {/* Form Section */}
          <div className="login-form-section">
            {/* Email Input */}
            <div className="login-input-group">
              <div
                className={`login-input-wrapper ${
                  isFocused.email ? "login-input-focused" : ""
                } ${emailError ? "login-input-error" : ""}`}
              >
                <span className="login-input-icon">📧</span>
                <input
                  type="email"
                  className="login-input-field"
                  placeholder="Email address"
                  value={email}
                  onChange={handleEmailChange}
                  onFocus={() => handleFocus("email")}
                  onBlur={() => handleBlur("email")}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>
              {emailError && (
                <div className="login-error-text">{emailError}</div>
              )}
            </div>

            {/* Password Input */}
            <div className="login-input-group">
              <div
                className={`login-input-wrapper ${
                  isFocused.password ? "login-input-focused" : ""
                } ${passwordError ? "login-input-error" : ""}`}
              >
                <span className="login-input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input-field"
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  onFocus={() => handleFocus("password")}
                  onBlur={() => handleBlur("password")}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  <span className="login-toggle-icon">
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </span>
                </button>
              </div>
              {passwordError && (
                <div className="login-error-text">{passwordError}</div>
              )}
            </div>

            {/* Login Button */}
            <div className="login-button-wrapper">
              <button
                className={`login-action-button ${
                  loading ? "login-button-disabled" : ""
                }`}
                onClick={onButtonClick}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="login-spinner"></div>
                    <span className="login-button-text">SIGNING IN...</span>
                  </>
                ) : (
                  <>
                    <span className="login-button-text">SIGN IN</span>
                    <span className="login-chevron">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;