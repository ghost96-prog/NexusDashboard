import React from "react";
import { useNavigate } from "react-router-dom";
import "../Css/WelcomeScreen.css";
import welcomeImage from "../assets/adaptive2.png"; // Update the path to your image file
const WelcomeScreen = (props) => {
  const navigate = useNavigate();

  const onButtonClick = () => {
    navigate("/login");
  };
  const onButtonClickBackoffice = () => {
    navigate("/loginBackOffice");
  };

  return (
    <div className="mainContainer">
      <div className="titleContainerWelcome">
        <img src={welcomeImage} alt="Welcome" className="welcomeImage" />
        <div className="buttonContainer">
          <input
            className="inputButtonvirtual"
            type="button"
            value="VIRTUAL FISCALISATION"
            title="Coming Soon"
            disabled
          />
        </div>
        <div className="buttonContainer">
          <input
            className="inputButtonRegister"
            type="button"
            onClick={onButtonClickBackoffice}
            value="BACK OFFICE"
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
