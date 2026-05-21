import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import {
  uploadReel,
  checkUploadLimit,
  initiatePayment,
  verifyPayment,
  clearPayment,
} from "../redux/slices/reelSlice";
import axiosInstance from "../utils/axiosInstance";
import { getMyProperties } from "../redux/slices/propertySlice";
import { fetchUserProfile } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
const razorpayKey =
  import.meta.env.VITE_RAZORPAY_KEY ||
  import.meta.env.VITE_RAZORPAY_LIVE_KEY ||
  import.meta.env.VITE_RAZORPAY_TEST_KEY ||
  import.meta.env.RAZORPAY_KEY ||
  import.meta.env.RAZORPAY_LIVE_KEY ||
  import.meta.env.RAZORPAY_TEST_KEY;


const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const UploadReelFlow = ({ token, onUploadSuccess, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { uploadLimit, paymentData, paymentVerified, loading, error } =
    useSelector((state) => state.reel);
  const { user } = useSelector((state) => state.auth);
  const { myProperties = [], loading: propertyLoading } = useSelector(
    (state) => state.property
  ); // ✅ fixed state path

  const [newReel, setNewReel] = useState({
    title: "",
    video: null,
    propertyId: "",
  });

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setNewReel((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // ✅ Fetch user properties on load
  useEffect(() => {
    dispatch(getMyProperties({ page: 0, size: 50 }));
    dispatch(fetchUserProfile());

  }, [dispatch]);

  const checkUploadLimitHandler = async () => {
    const { title, video, propertyId } = newReel;

    if (!title.trim() || !video) {
      toast.error("Title and video are required");
      return;
    }

    if (propertyId.trim()) {
      try {
        const res = await dispatch(
          checkUploadLimit({ propertyId, token })
        ).unwrap();

        if (res.canUpload && !res.paymentRequired) {
          handleFinalUpload();
        } else if (res.paymentRequired) {
          toast.info(`Limit exceeded. ₹${res.reelPrice} payment required.`);
        } else {
          toast.error("Upload limit reached for this property");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error checking upload limit");
      }
    } else {
      handleFinalUpload();
    }
  };

  const initiatePaymentHandler = async () => {
    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      toast.error("Failed to load Razorpay SDK");
      return;
    }

    try {
      const basePrice = parseFloat(uploadLimit.reelPrice || 0);
      const gstRate = 0.18;
      const gstAmount = basePrice * gstRate;
      const finalAmount = parseFloat((basePrice + gstAmount).toFixed(2));

      const payload = {
        amount: basePrice,
        currency: "INR",
        paymentType: "REEL_PURCHASE",
        propertyId: newReel.propertyId,
      };

      const paymentRes = await dispatch(
        initiatePayment({ payload, token })
      ).unwrap();
      const { gatewayOrderId, referenceId } = paymentRes;

      if (!razorpayKey) {
        throw new Error('Razorpay key is missing. Please set VITE_RAZORPAY_KEY in your .env file.');
      }

      const options = {
        key: razorpayKey,
        amount: finalAmount * 100,
        currency: "INR",
        name: "Reel Upload Payment",
        description: `(${gatewayOrderId}) Upload reels (₹${basePrice} + 18% GST)`,

        handler: async function (response) {
          try {
            await dispatch(
              verifyPayment({
                referenceId,
                gatewayTransactionId: response.razorpay_payment_id,
                gatewayOrderId: response.razorpay_order_id,
                paymentSignature: response.razorpay_signature,
                token,
              })
            ).unwrap();
            toast.success("Payment verified. Uploading reel...");
            await handleFinalUpload();
          } catch (err) {
            console.error(err);
            toast.error("Payment verification failed");
          }
        },

        theme: { color: "#3399cc" },
        prefill: {
          name: user?.name || user?.username || "User",
          email: user?.email || "user@example.com",
          contact: user?.phoneNumber || user?.mobileNumber || "9999999999",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      toast.error("Payment initiation failed");
    }
  };

  const handleFinalUpload = async () => {
    const { title, video, propertyId } = newReel;
    // console.log("--------------------------", title, video, propertyId)

    if (!title.trim() || !video) {
      toast.error("Title and video are required");
      return;
    }

    if (propertyId.trim() && uploadLimit?.paymentRequired && !paymentVerified) {
      toast.error("Payment verification required");
      return;
    }
    if (video.size > 50 * 1024 * 1024) {
      toast.error("Video size is too large. Please upload a video under 50MB.");
      return;
    }
    try {


      // Upload reel
      const formData = new FormData();
      formData.append("video", video);
      formData.append("title", title);
      if (propertyId.trim()) {
        formData.append("propertyId", propertyId);
      }
      // console.log("----extra reel upload-----")
      const res = await dispatch(uploadReel({ formData, token })).unwrap();
      console.log("reesl upload", res);

      toast.success("Reel uploaded successfully");
      setNewReel({ title: "", video: null, propertyId: "" });

      dispatch(clearPayment());
      onUploadSuccess(true);
      onClose();
      // navigate(propertyId ? `/property/${propertyId}` : "Property")
    } catch (err) {
      console.error("axios-error", err);
      if (err?.response?.status === 413) {
        toast.error("Video is too large. Please upload a smaller file.");
      } else {
        toast.error(err?.message || "Reel upload failed");
      }
    }
  };


  return (
    <div>
      {uploadLimit?.message && (
        <p className="upload-limit-message">{uploadLimit.message}</p>
      )}
      <ToastContainer />
      <div className="form-group">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={newReel.title}
          onChange={handleInputChange}
        />
      </div>

      {/* ✅ Property dropdown */}
      <div className="form-group">
        <select
          name="propertyId"
          value={newReel.propertyId}
          onChange={handleInputChange}
        >
          <option value="">Select Property </option>
          {propertyLoading ? (
            <option disabled>Loading...</option>
          ) : (
            myProperties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.title || `Property ${prop.id}`}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="form-group">
        <input
          type="file"
          name="video"
          accept="video/*"
          onChange={handleInputChange}
        />
      </div>

      <div className="form-buttons">
        {!uploadLimit?.paymentRequired ? (
          <button
            className="btn btn-primary"
            onClick={checkUploadLimitHandler}
            disabled={loading}
          >
            {loading ? "Checking..." : "Upload"}
          </button>
        ) : !paymentData ? (
          <button
            className="btn btn-warning"
            onClick={initiatePaymentHandler}
            disabled={loading}
          >
            {loading ? "Initiating..." : `Pay ₹${uploadLimit.reelPrice} to Upload`}
          </button>
        ) : (
          <button
            className="btn btn-warning"
            onClick={handleFinalUpload}
            disabled={loading}
          >
            Complete Payment
          </button>
        )}

        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default UploadReelFlow;
