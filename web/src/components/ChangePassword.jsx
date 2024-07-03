import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      const response = await axios.post("/api/change-wifi-password", {
        currentPassword,
        newPassword,
      });
      if (response.data.success) {
        toast.success("WiFi password changed successfully");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to change WiFi password"
      );
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Change WiFi Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="currentPassword" className="form-label">
            Current Password
          </label>
          <input
            type="password"
            className="form-control"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">
            New Password
          </label>
          <input
            type="password"
            className="form-control"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm New Password
          </label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          <i className="bi bi-check-lg me-2"></i>Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
