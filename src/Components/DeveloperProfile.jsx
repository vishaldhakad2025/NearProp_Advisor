import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./devProfile.css";
import { fetchUserProfile } from "../redux/slices/authSlice";
import ProfileUpdateModal from "./ProfileUpdateModal";

const DeveloperProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading } = useSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);


  const features = [
    {
      title: "Bulk Property Listing",
      desc: "List multiple flats or plots by category with expiry and Aadhaar verification.",
      action: "Add Property",
      path: "/project",
      role: "ADVISOR",
    },
    {
      title: "Property Management",
      desc: "Edit or delete properties with admin approval workflow.",
      action: "My Properties",
      path: "/Property",
      role: "ADVISOR",
    },
    {
      title: "Chat Panel",
      desc: "View and manage customer Chat with date-wise tracking.",
      action: "View Chat",
      path: "/ChatPanel",
      role: "ADVISOR",
    },
    {
      title: "Advisor Dashboard",
      desc: "Track your subscriptions, earnings, and project performance.",
      action: "View Dashboard",
      path: "/dashboard",
      role: "ADVISOR",
    },
  ];

  if (loading || !user) return <div>Loading...</div>;

  const filteredFeatures = features.filter((f) =>
    user.roles?.some((role) => role.toLowerCase() === f.role.toLowerCase())
  );

  // ✅ Utility: Redirect with Role & Token
  const redirectToDashboard = (role, token) => {
    const tokenPart = token ? `?token=${token}` : '';
    if (!tokenPart) {
      alert("Something went wrong. Please try again.");
      return;
    }

    const urls = {
      DEVELOPER: "https://developerdashboard.nearprop.com/dashboard",
      ADVISOR: "https://propertyadviser.nearprop.com/dashboard",
      SELLER: "https://sellerdashboard.nearprop.com/landing",
      ADMIN: "https://admindashboard.nearprop.com/dashboard",
      WEBSITE: "https://nearprop.in/",
    };

    const url = `${urls[role.toUpperCase()]}${tokenPart}`;
    if (!url) {
      alert("Invalid role selected.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };





  return (
    <div className="dev-main-container">
      {/* Sidebar */}
      <div className="dev-sidebar">
        <img
          src={user.profileImageUrl || "https://via.placeholder.com/100"}
          alt="Profile"
          className="dev-logo"
        />
        <button className="sidebar-btn" onClick={() => setIsModalOpen(true)}>
          Edit Profile
        </button>
        <h2>{user.name}</h2>
        <p>{user.email}</p>

        <div className="badge-group">
          {user.roles?.includes("DEVELOPER") && (
            <span className="badge sub">Developer</span>
          )}
          {user.roles?.includes("SELLER") && (
            <span className="badge sub">Seller</span>
          )}
          <span className="badge verified">Verified</span>
        </div>

        <div className="stats">
          <p>
            <strong>Permanent ID:</strong> {user.permanentId}
          </p>
          <p>
            <strong>Phone:</strong> {user.phoneNumber}
          </p>
        </div>

        {/* // 🔗 Role-based redirect buttons (inside JSX) */}
        <div className="sidebar-links">
          <button
            className="sidebar-btn"
            onClick={() => redirectToDashboard("WEBSITE", localStorage.getItem("token"))}
          >
            Website
          </button>



          {user.roles?.includes("SELLER") && (
            <button
              className="sidebar-btn"
              onClick={() => redirectToDashboard("SELLER", localStorage.getItem("token"))}
            >
              Seller Dashboard
            </button>
          )}

          {user.roles?.includes("DEVELOPER") && (
            <button
              className="sidebar-btn"
              onClick={() => redirectToDashboard("DEVELOPER", localStorage.getItem("token"))}
            >
              Developer Dashboard
            </button>
          )}

          {user.roles?.includes("ADMIN") && (
            <button
              className="sidebar-btn"
              onClick={() => redirectToDashboard("ADMIN", localStorage.getItem("token"))}
            >
              ⚙️ Admin Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="dev-content">
        <h1>Welcome, {user.name?.split(" ")[0]}</h1>
        <h2>Tools & Features for You</h2>
        <div className="features-grid">
          {filteredFeatures.length > 0 ? (
            filteredFeatures.map((f, i) => (
              <div className="feature-card" key={i}>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <button onClick={() => navigate(f.path)}>{f.action}</button>
              </div>
            ))
          ) : (
            <p className="no-features">
              No features available for your role. Contact support if this is
              unexpected.
            </p>
          )}
        </div>
      </div>
      <ProfileUpdateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
};

export default DeveloperProfile;
