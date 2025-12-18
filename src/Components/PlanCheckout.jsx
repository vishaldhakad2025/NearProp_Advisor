import React, { useState } from "react";
import RazorpayButton from "./RazorpayButton";
import "./CouponValidator.css"; // reuse your css

const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || "https://api.nearprop.com",
  apiPrefix: "api",
};

function PlanCheckout({ plan, onPaymentSuccess, onPaymentError }) {
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const discountedPrice = plan.price - (plan.price * discountPercent) / 100;
  const taxAmount = discountedPrice * 0.18;
  const finalPrice = discountedPrice + taxAmount;

  const handleValidate = async () => {
    if (!couponCode.trim()) return; // ✅ allow empty (optional)

    setStatus("loading");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in.");

      const url = `${API_CONFIG.baseUrl}/${API_CONFIG.apiPrefix}/subscriptions/validate-coupon?planId=${plan.id}&couponCode=${encodeURIComponent(couponCode)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.data?.valid) {
        const original = data.data.originalPrice;
        const final = data.data.finalPrice;
        const discount = ((original - final) / original) * 100;
        setDiscountPercent(discount);
        setMessage(`Coupon applied! You saved ₹${(original - final).toFixed(2)}`);
        setStatus("success");
      } else {
        setDiscountPercent(0);
        setMessage(data.data?.message || "Invalid coupon.");
        setStatus("error");
      }
    } catch (err) {
      setMessage("Error validating coupon: " + err.message);
      setStatus("error");
    }
  };

  const handlePaymentSuccess = ({ paymentId, orderId }) => {
    setIsPaymentProcessing(false);
    onPaymentSuccess?.({ paymentId, orderId, planId: plan.id });
  };

  const handlePaymentError = ({ error, orderId }) => {
    setIsPaymentProcessing(false);
    onPaymentError?.({ error, orderId });
  };

  return (
    <div className="coupon-container">
      <h3>Checkout</h3>
      <h4>{plan.name}</h4>
      <p className="price">₹{plan.price} / {plan.durationDays} days</p>

      {/* ✅ Optional Coupon Section */}
      <div className="coupon-form">
        <input
          type="text"
          placeholder="Enter coupon (optional)"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          disabled={status === "loading" || isPaymentProcessing}
        />
        <button onClick={handleValidate} disabled={status === "loading" || isPaymentProcessing}>
          {status === "loading" ? "Validating..." : "Apply"}
        </button>
      </div>
      {message && <p className={`coupon-message ${status}`}>{message}</p>}

      {/* ✅ Always show bill summary */}
      <div className="bill-summary">
        <h4>Billing Summary</h4>
        <ul>
          <li><span>Base Price:</span> ₹{plan.price.toFixed(2)}</li>
          <li><span>Discount:</span> -₹{((plan.price * discountPercent) / 100).toFixed(2)}</li>
          <li><span>Tax (18%):</span> ₹{taxAmount.toFixed(2)}</li>
          <li className="total"><span>Total:</span> ₹{finalPrice.toFixed(2)}</li>
        </ul>

        <div style={{ marginTop: "20px" }}>
          <RazorpayButton
            planId={plan.id}
            couponCode={couponCode || null} // ✅ null if no coupon
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            disabled={isPaymentProcessing}
          />
        </div>
      </div>
    </div>
  );
}

export default PlanCheckout;
