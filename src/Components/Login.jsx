// import React, { useEffect, useRef, useState } from "react";
// import { useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { FaMobileAlt } from "react-icons/fa";
// import gsap from "gsap";
// import loginImg from "../assets/login.jpg";
// import "./Login.css";
// import { sendOtp } from "../redux/slices/authSlice";

// const Login = () => {
//   const [mobileNumber, setMobileNumber] = useState("");
//   const [countryCode, setCountryCode] = useState("+91"); // ✅ default India
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const formRef = useRef(null);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   useEffect(() => {
//     gsap.fromTo(
//       formRef.current,
//       { opacity: 0, y: 50 },
//       { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
//     );
//   }, []);

//   // ✅ Validation: ensure entered number is only 10 digits
//   const validateMobile = (number) => /^[6-9]\d{9}$/.test(number);

//   const handleSendOtp = async (e) => {
//     e.preventDefault();

//     if (!validateMobile(mobileNumber)) {
//       setError("Enter a valid 10-digit mobile number");
//       return;
//     }

//     // ✅ Always attach country code
//     const fullNumber = `${countryCode}${mobileNumber}`;

//     setLoading(true);
//     try {
//       console.log("Sending OTP for:", fullNumber);
//       const result = await dispatch(sendOtp(fullNumber)).unwrap();

//       sessionStorage.setItem("mobileNumber", fullNumber);
//       localStorage.setItem("tempToken", "otp-sent");

//       navigate("/verify-otp", { state: { mobileNumber: fullNumber } });
//     } catch (err) {
//       setError(err.message || "Error sending OTP. Please try again later.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-container">
//       <div className="login-box">
//         <div className="login-img-wrap">
//           <img
//             src={loginImg}
//             alt="Advisor Login"
//             className="login-img"
//             loading="lazy"
//           />
//         </div>

//         <form className="login-form" ref={formRef} onSubmit={handleSendOtp}>
//           <h2 className="login-title">Advisor Login</h2>
//              {error && <p className="login-error-text">{error}</p>}
//           <p className="login-subtext">
//             Please sign in with your registered mobile number to access your
//             dashboard.
//           </p>

//           <div className="login-input-group flex">
//             {/* ✅ Country Code Dropdown */}
//             <select
//               value={countryCode}
//               onChange={(e) => setCountryCode(e.target.value)}
//               className="border rounded-l px-2 py-2 bg-white text-sm"
//             >
//               {/* <option value="">-</option> */}
//               <option value="+91">🇮🇳 +91</option>
//               <option value="+1">🇺🇸 +1</option>
//               <option value="+44">🇬🇧 +44</option>
//               <option value="+61">🇦🇺 +61</option>
//               <option value="+971">🇦🇪 +971</option>
//             </select>

//             {/* ✅ Input for 10-digit number only */}
//             <div className="flex items-center flex-1  rounded-r" style={{marginLeft:'30px'}}>
//               {/* <FaMobileAlt className="login-input-icon" /> */}
//               <input
//                 type="text"
//                 value={mobileNumber}
//                 onChange={(e) => {
//                   const value = e.target.value.replace(/\D/g, ""); // digits only
//                   setMobileNumber(value);
//                   setError("");
//                 }}
//                 placeholder="Enter mobile number"
//                 className="login-input-field flex-1"
//                 maxLength={10}
//                 inputMode="numeric"
//               />
//             </div>
//           </div>

//           <button
//             type="submit"
//             className="login-btn-primary"
//             disabled={loading}
//           >
//             {loading ? "Sending..." : "Sign In"}
//           </button>

//           <div className="login-help-text">
//             Need help? Contact{" "}
//             <a href="mailto:contact@nearprop.com">support</a>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default Login;



import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaMobileAlt } from "react-icons/fa";
import gsap from "gsap";
import loginImg from "../assets/login.jpg";
import "./Login.css";
import { sendOtp } from "../redux/slices/authSlice";

/* ✅ TOAST */
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );
  }, []);

  const validateMobile = (number) => /^[6-9]\d{9}$/.test(number);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!validateMobile(mobileNumber)) {
      setError("Enter a valid 10-digit mobile number");
      toast.error("❌ Enter a valid 10-digit mobile number");
      return;
    }

    const fullNumber = `${countryCode}${mobileNumber}`;
    setLoading(true);

    try {
      console.log("Sending OTP for:", fullNumber);
      await dispatch(sendOtp(fullNumber)).unwrap();

      /* ✅ SUCCESS TOAST */
      toast.success("✅ OTP sent successfully!");

      sessionStorage.setItem("mobileNumber", fullNumber);
      localStorage.setItem("tempToken", "otp-sent");

      navigate("/verify-otp", { state: { mobileNumber: fullNumber } });
    } catch (err) {
      setError(err.message || "Error sending OTP. Please try again later.");

      /* ❌ ERROR TOAST */
      toast.error(
        err?.message || "❌ Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* ✅ TOAST CONTAINER */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />

      <div className="login-box">
        <div className="login-img-wrap">
          <img
            src={loginImg}
            alt="Advisor Login"
            className="login-img"
            loading="lazy"
          />
        </div>

        <form className="login-form" ref={formRef} onSubmit={handleSendOtp}>
          <h2 className="login-title">Advisor Login</h2>

          {error && <p className="login-error-text">{error}</p>}

          <p className="login-subtext">
            Please sign in with your registered mobile number to access your
            dashboard.
          </p>

          <div className="login-input-group flex">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="border rounded-l px-2 py-2 bg-white text-sm"
            >
              <option value="+91">🇮🇳 +91</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
              <option value="+971">🇦🇪 +971</option>
            </select>

            <div
              className="flex items-center flex-1 rounded-r"
              style={{ marginLeft: "30px" }}
            >
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setMobileNumber(value);
                  setError("");
                }}
                placeholder="Enter mobile number"
                className="login-input-field flex-1"
                maxLength={10}
                inputMode="numeric"
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-btn-primary"
            disabled={loading}
          >
            {loading ? "Sending..." : "Sign In"}
          </button>

          <div className="login-help-text">
            Need help? Contact{" "}
            <a href="mailto:contact@nearprop.com">support</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
