// src/UploadForm.js
import React, { useState } from "react";

const UploadForm = ({ onAddMember }) => {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [name, setName] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleLinkChange = (e) => {
    setLink(e.target.value);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const resetForm = () => {
    setFile(null);
    setLink("");
    setName("");
    document.getElementById("upload-form").reset(); // Clear the file input
  };

  const handleUpload = () => {
    if (file && name) {
      const reader = new FileReader();

      reader.onload = (e) => {
        onAddMember(e.target.result, link, name);
        resetForm();
      };

      reader.readAsDataURL(file);
    } else {
      alert("Please fill in the name and upload a photo.");
    }
  };

  return (
    <div className="upload-form">
      <form id="upload-form">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Enter name"
        />
        <input
          type="text"
          value={link}
          onChange={handleLinkChange}
          placeholder="Enter link URL (optional)"
        />
        <button type="button" onClick={handleUpload}>
          Upload Photo
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
