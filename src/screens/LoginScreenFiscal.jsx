// src/screens/LoginScreen.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/LoginScreenFiscal.css";
import welcomeImage from "../assets/adaptive2.png"; // Update the path to your image file
import TextInput from "../components/TextInput";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

const LoginScreenFiscal = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  console.log("====================================");
  console.log(email, password);
  console.log("====================================");

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    // Basic email format validation
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
    setPasswordError("");
    return true;
  };

  const onButtonClick = async () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    if (!isEmailValid || !isPasswordValid) return;

    NProgress.start(); // 🔵 Start progress bar
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
        toast.error("User not found or invalid email.");
        return;
      }

      const decoded = jwtDecode(result.token);
      localStorage.setItem("token", result.token);
      navigate("/receipts", { state: { email: decoded.email } });
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
      NProgress.done(); // ✅ End progress bar
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mainContainerfiscal">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="titleContainerfiscal">
        <img src={welcomeImage} alt="Welcome" className="welcomeImage" />
        <div className="label">NexusPOS Virtual Fiscalisation Device</div>
        <div className="label2">Login with NexusPOS Credentials</div>
        <div className="inputContainerfiscal">
          <TextInput
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={validateEmail}
            label="Enter Email"
            error={emailError}
          />
        </div>
        <div className="inputContainerfiscal">
          <TextInput
            type={showPassword == true ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            autoComplete="on"
            onBlur={validatePassword}
            label="Enter Password"
            error={passwordError}
            showPassword={showPassword}
            togglePasswordVisibility={togglePasswordVisibility}
          />
        </div>

        <div className="buttonContainer">
          <input
            className="inputButtonFiscal"
            type="button"
            onClick={onButtonClick}
            value="CONNECT"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginScreenFiscal;
