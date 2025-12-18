import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { FaKey } from "react-icons/fa";
import gsap from "gsap";
import { toast } from "react-hot-toast";
import { sendOtp, verifyOtp } from "../redux/slices/authSlice";

const OtpVerify = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resendCount, setResendCount] = useState(0);
  const [timer, setTimer] = useState(30);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);
  const { loading, error: authError } = useSelector((state) => state.auth);

  const mobileNumber =
    location.state?.mobileNumber || sessionStorage.getItem("mobileNumber");

  useEffect(() => {
    if (!mobileNumber) {
      setError("Mobile number not provided. Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    }
    setError(null);
  }, [mobileNumber, navigate]);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 }
      );
    }
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP");
      return;
    }

    try {
      const result = await dispatch(verifyOtp({ mobileNumber, otp })).unwrap();

      if (result.roles && result.roles.includes("ADVISOR")) {
        localStorage.setItem("token", result.token || "verified-token");
        setError("");
        setResendCount(0);
        toast.success("Login Successful! Welcome to Advisor Dashboard");
        navigate("/dashboard");
      } else {
        setError("You do not have access to the Advisor Dashboard");
        toast.error("Access Denied: You are not an Advisor");
      }
    } catch (err) {
      console.error("OTP verification failed:", err);

      // Backend se aane wala exact message extract karo
      let displayError = "Invalid OTP. Try again.";

      // Structure: err.error.message (jaise aapke response mein hai)
      if (err?.error?.message) {
        displayError = err.error.message;
      } else if (err?.message) {
        displayError = err.message;
      } else if (typeof err === "string") {
        displayError = err;
      }

      // "Error occurred" ko avoid karo — sirf detailed message dikhao
      if (displayError.includes("Error occurred")) {
        // Agar sirf generic "Error occurred" hai, to detailed message dhundho
        if (err?.error?.message && err.error.message.includes("Invalid OTP code for mobile:")) {
          displayError = err.error.message;
        } else {
          displayError = "Invalid OTP. Please try again.";
        }
      }

      // Toast mein sirf detailed invalid OTP message dikhao
      const toastMessage = displayError.includes("Invalid OTP code for mobile:")
        ? displayError
        : "Invalid OTP. Please try again.";

      setError(displayError);
      toast.error(toastMessage);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    if (resendCount >= 3) {
      setError("Maximum resend limit reached. Try again later.");
      return;
    }
    try {
      await dispatch(sendOtp(mobileNumber)).unwrap();
      setResendCount((prev) => prev + 1);
      setTimer(30);
      setError("");
      toast.success("OTP Resent Successfully!");
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      const errMsg = err?.message || err?.error || "Failed to resend OTP";
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-box" ref={formRef}>
        <h2 className="otp-title">Verify OTP</h2>
        
        <p className="otp-subtext">OTP sent to {mobileNumber || "N/A"}</p>

        <form onSubmit={handleVerify}>
          <div className="otp-input-group">
            <FaKey className="otp-input-icon" />
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="Enter 6-digit OTP"
              className="otp-input-field"
              disabled={loading || !mobileNumber}
              maxLength={6}
              inputMode="numeric"
            />
          </div>

          {(error || authError) && (
            <p className="otp-error-text">{error || authError}</p>
          )}
          <button
            type="submit"
            className="otp-btn-primary"
            disabled={loading || !mobileNumber}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="otp-resend-text">
          {timer > 0 ? (
            <p>Resend OTP in {timer}s</p>
          ) : resendCount < 3 ? (
            <button
              onClick={handleResendOtp}
              className="otp-resend-btn"
              disabled={loading || !mobileNumber}
            >
              Resend OTP
            </button>
          ) : (
            <p className="otp-error-text">Max 3 attempts reached</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;