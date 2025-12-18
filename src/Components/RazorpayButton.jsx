import React, { useState } from 'react';
import { toast } from 'react-toastify';
const razorpayKey =
  import.meta.env.RAZORPAY_LIVE_KEY ||
  import.meta.env.RAZORPAY_TEST_KEY;

const RazorpayButton = ({ planId, couponCode, onPaymentSuccess, onPaymentError, disabled }) => {
  const [loading, setLoading] = useState(false);

  // User info
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userdata = JSON.parse(localStorage.getItem('userLocationData') || '{}');
  const token = localStorage.getItem('token');


  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    if (!token) {
      toast.error('Please log in first.');
      onPaymentError?.({ error: 'User not logged in', orderId: null });
      return;
    }

    setLoading(true);
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setLoading(false);
      toast.error('Failed to load Razorpay SDK.');
      onPaymentError?.({ error: 'Razorpay SDK load failed', orderId: null });
      return;
    }

    try {
      const apiBaseUrl = 'https://api.nearprop.com';

      // 🔹 Step 1: Initiate payment from backend
      const response = await fetch(`${apiBaseUrl}/api/subscriptions/payment/initiate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          couponCode: couponCode || null,
          paymentMethod: 'RAZORPAY',
        }),
      });

      const result = await response.json();
      console.log('----------------------------------------payment initiate response', result);
      if (!response.ok || !result.success || !result.data?.paymentToken) {
        alert("server error, please try again later")
        console.error('Payment initiation error:', result);
        toast.error(result.message || 'Payment initiation failed');
        onPaymentError?.({ error: result.message || 'Payment initiation failed', orderId: null });
        throw new Error(result.message || 'Payment initiation failed');
      }

      const { paymentToken, amount, currency, referenceId } = result.data;

      // 🔹 Step 2: Handle FREE plan directly
      if (amount == 0) {
        const freePlanRes = await fetch(`${apiBaseUrl}/api/subscriptions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            autoRenew: false,
            districtId: userdata?.districtId || 332,
            paymentMethod: 'FREE',
            paymentReferenceId: 'FREE_PLAN',
            couponCode: couponCode || '',
          }),
        });

        const freePlanResult = await freePlanRes.json();
        console.log("----------------------------------------freePlanResult", freePlanResult);

        if (freePlanResult?.success) {
          toast.success(freePlanResult.message || 'Free plan activated successfully!');

          onPaymentSuccess?.({
            paymentId: 'FREE_PLAN',
            orderId: freePlanResult?.data?.paymentReference || referenceId
          });
        } else {
          console.error('Free plan activation error:', freePlanResult);
          toast.error(freePlanResult.message || 'server error, please try again later');
          throw new Error(freePlanResult.message || 'server error, please try again later');
        }


        setLoading(false);
        return;
      }

      // 🔹 Step 3: Razorpay checkout options
      // rzp_test_JT7p2CBMbVuKMN  tickview testing key
      const options = {
        key: "rzp_live_RPI3GizN9Sz64W",               //'rzp_test_LoJiA2mTb0THiq',
        amount: Math.round(amount * 100),
        currency,
        name: 'NearProp',
        description: `Subscription Plan: ${planId} | Ref: ${referenceId}`,
        prefill: {
          name: userInfo?.name || '',
          email: userInfo.email || '',
          contact: userInfo.mobileNumber || '',
        },
        theme: { color: '#00a0c0ff' },

        handler: async function (response) {
          try {
            // Confirm subscription with backend
            const subscriptionRes = await fetch(`${apiBaseUrl}/api/subscriptions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                planId,
                autoRenew: false,
                districtId: userdata?.districtId || 332,
                paymentMethod: 'RAZORPAY',
                paymentReferenceId: response.razorpay_payment_id,
                couponCode: couponCode || '',
              }),
            });

            const subscriptionResult = await subscriptionRes.json();
            console.log("----------------------------------------rozor pay resposnse", subscriptionResult);
            if (subscriptionResult?.success) {
              toast.success('Subscription created successfully!');
              onPaymentSuccess?.({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              });
            } else {
              console.error('Subscription creation error:', subscriptionResult);
              throw new Error(subscriptionResult.message || 'Subscription creation failed');
            }
          } catch (error) {
            console.error('Subscription creation error:', error);
            toast.error(`Subscription creation failed: ${error.message}`);
            onPaymentError?.({
              error: error.message,
              orderId: response.razorpay_order_id,
            });
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        alert("server error, please try again later")
        onPaymentError?.({
          error: response.error.description,
          orderId: response.error.metadata?.order_id || null,
        });
      });

      rzp.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(`Payment error: ${error.message}`);
      onPaymentError?.({ error: error.message, orderId: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading}
      style={{
        backgroundColor: disabled || loading ? '#ccc' : '#4b2c92',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        fontSize: '16px',
        borderRadius: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
};

export default RazorpayButton;
