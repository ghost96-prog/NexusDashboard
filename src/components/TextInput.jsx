import React, { useEffect, useState, useRef } from "react";
import "../Css/LoginScreen.css";

const TextInput = ({
  type,
  value,
  onChange,
  onBlur,
  label,
  error,
  autoComplete,
  showPassword,
  togglePasswordVisibility,
}) => {
  const [isLabelActive, setIsLabelActive] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Check if browser autofilled input
    if (inputRef.current && inputRef.current.value) {
      setIsLabelActive(true);
    }
  }, []);

  useEffect(() => {
    setIsLabelActive(!!value);
  }, [value]);

  return (
    <div className="inputFieldContainerfiscal">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        onBlur={onBlur}
        className={`inputFieldfiscal ${error && "inputError"}`}
      />
      <label
        className={`inputLabelfiscal ${
          isLabelActive ? "inputLabelActive" : ""
        }`}
      >
        {label}
      </label>
      {label === "Enter Password" && (
        <span className="passwordToggle" onClick={togglePasswordVisibility}>
          {showPassword ? "🙈" : "👁️"}
        </span>
      )}
      {error && <span className="errorMessagefiscal">{error}</span>}
    </div>
  );
};

export default TextInput;
