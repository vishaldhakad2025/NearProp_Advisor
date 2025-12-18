import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./SubscriptionPopup.css";
import { FaTimes } from "react-icons/fa";

const SubscriptionPopup = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    onClose(); // Close dialog first
    navigate("/SubscriptionManagement"); // Then navigate
  };

  return (
    <Dialog open={open} fullWidth maxWidth="sm" className="subscription-dialog">
      <DialogTitle className="subscription-title">
        !No Active Subscription{" "}
        <IconButton aria-label="close" onClick={onClose} className="close-btn">
          <FaTimes />
        </IconButton>
      </DialogTitle>

      <DialogContent className="subscription-content">
        <p className="subscription-message">
          🚨 You don’t have an active subscription.
          <br />
          Please purchase a plan to continue using the dashboard.
        </p>
        <div className="subscription-actions">
          <Button
            variant="contained"
            color="primary"
            onClick={handleNavigate}
            fullWidth
            className="subscription-btn"
          >
            View Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPopup;
