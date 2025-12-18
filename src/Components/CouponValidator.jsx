import React, { useState, useEffect } from 'react';
import './CouponValidator.css';
import RazorpayButton from './RazorpayButton';

// ✅ Use Vite env variable prefix VITE_ and import.meta.env
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.nearprop.com',
  apiPrefix: 'api',
};

function CouponValidator({ planId, planPrice, onPaymentSuccess, onPaymentError }) {
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

const locationData = JSON.parse(localStorage.getItem("userLocationData"));
console.log(locationData.districtId); 
const districtId = locationData.districtId;
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found for fetching coupons');
          return;
        }
        const response = await fetch(
          `${API_CONFIG.baseUrl}/${API_CONFIG.apiPrefix}/admin/coupons/active?page=0&size=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        if (response.ok && Array.isArray(result.data?.content)) {
          console.log('Fetched coupons:', JSON.stringify(result.data.content, null, 2));
          setAvailableCoupons(result.data.content);
        } else {
          console.error('Invalid coupons response:', result);
        }
      } catch (error) {
        console.error('Failed to fetch coupons:', error);
      }
    };

    fetchCoupons();
  }, []);

  const handleValidate = async (codeToValidate = couponCode) => {
    if (!codeToValidate.trim()) {
      setMessage('Please enter a coupon code.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found. Please log in.');
      }
      const url = `${API_CONFIG.baseUrl}/${API_CONFIG.apiPrefix}/subscriptions/validate-coupon?planId=${planId}&couponCode=${encodeURIComponent(codeToValidate)}`;
      console.log('Validating coupon with URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Invalid JSON response from /validate-coupon:', text);
        setMessage('Invalid server response.');
        setStatus('error');
        return;
      }

      console.log('Coupon validation response:', JSON.stringify(data, null, 2));

      if (response.ok && data.data?.valid) {
        const original = data.data.originalPrice;
        const final = data.data.finalPrice;
        const discount = ((original - final) / original) * 100;
        setCouponCode(data.data.code);
        setDiscountPercent(discount);
        setMessage(`Coupon Applied: ₹${(original - final).toFixed(2)} OFF`);
        setStatus('success');
      } else {
        setDiscountPercent(0);
        setMessage(data.data?.message || 'Invalid coupon.');
        setStatus('error');
      }
    } catch (err) {
      console.error('Coupon validation failed:', err);
      setMessage('Error validating coupon: ' + err.message);
      setStatus('error');
    }
  };

  const handlePaymentSuccess = ({ paymentId, orderId }) => {
    setIsPaymentProcessing(false);
    setPaymentMessage(`Payment successful! Payment ID: ${paymentId}, Order ID: ${orderId}`);
    onPaymentSuccess?.({ paymentId, orderId ,planId});
    console.log(paymentId,orderId,planId)
  };

  const handlePaymentError = ({ error, orderId }) => {
    setIsPaymentProcessing(false);
    setPaymentMessage(`Payment failed: ${error}, Order ID: ${orderId || 'N/A'}`);
    onPaymentError?.({ error, orderId });
  };

  const discountedPrice = planPrice - (planPrice * discountPercent) / 100;
  const taxAmount = discountedPrice * 0.18;
  const finalPrice = discountedPrice + taxAmount;

  return (
    <div className="coupon-container">
      <h3>Have a Coupon?</h3>
      <div className="coupon-form">
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          disabled={status === 'loading' || isPaymentProcessing}
        />
        <button
          onClick={() => handleValidate()}
          disabled={status === 'loading' || isPaymentProcessing}
        >
          {status === 'loading' ? 'Validating...' : 'Apply'}
        </button>
      </div>

     
      {message && <p className={`coupon-message ${status}`}>{message}</p>}
      {paymentMessage && (
        <p className={`coupon-message ${paymentMessage.includes('successful') ? 'success' : 'error'}`}>
          {paymentMessage}
        </p>
      )}

      {status === 'success' && (
        <div className="bill-summary">
          <h4>Billing Summary</h4>
          <ul>
            <li><span>Base Price:</span> ₹{planPrice.toFixed(2)}</li>
            <li><span>Discount:</span> -₹{((planPrice * discountPercent) / 100).toFixed(2)}</li>
            <li><span>Tax (18%):</span> ₹{taxAmount.toFixed(2)}</li>
            <li className="total"><span>Total:</span> ₹{finalPrice.toFixed(2)}</li>
          </ul>

          <div style={{ marginTop: '20px' }}>
            <RazorpayButton
              planId={planId}
              couponCode={couponCode}
              districtId={districtId || null} 
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              disabled={isPaymentProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CouponValidator;