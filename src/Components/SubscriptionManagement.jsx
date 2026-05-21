import React, { useEffect, useState } from "react";
import "./SubscriptionManagement.css";
import { useDispatch, useSelector } from "react-redux";
import { getAllSubscriptionPlans } from "../redux/slices/subscriptionPlanSlice";
import PlanCheckout from "./PlanCheckout";
import { toast, ToastContainer } from "react-toastify";

const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || "https://api.nearprop.com",
  apiPrefix: "api",
};

const SubscriptionManagement = () => {
  const dispatch = useDispatch();
  const { plans, loading } = useSelector((state) => state.subscriptionPlans);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("property");
  const [mySubscription, setMySubscription] = useState(null);

  // Fetch subscription plans + my subscription
  useEffect(() => {
    dispatch(getAllSubscriptionPlans());
    fetchMySubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const fetchMySubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_CONFIG.baseUrl}/${API_CONFIG.apiPrefix}/subscriptions/my-subscriptions?page=0&size=10&sortBy=startDate&direction=DESC`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (response.ok && result.success && result.data?.content?.length > 0) {
        setMySubscription(result.data.content[0]); // latest plan
      } else {
        setMySubscription(null);
      }
    } catch (error) {
      console.error("❌ Failed to fetch subscriptions:", error);
      setMySubscription(null);
    }
  };

  const handlePaymentSuccess = ({ paymentId, orderId }) => {
    // toast.success("Plan subscribed successfully!");
    setSelectedPlan(null);
    fetchMySubscription();
  };

  const handlePaymentError = ({ error, orderId }) => {
    toast.error(`Payment failed: ${error}`);
  };

  const renderBenefits = (plan) => [
    `List up to ${plan.maxProperties} properties`,
    `Up to ${plan.maxReelsPerProperty} reels per property`,
    `Maximum ${plan.maxTotalReels} total reels`,
    `${plan.durationDays}-day duration`,
    `${plan.type} plan`,
  ];

  // --- Derived flags (computed from API + local time) ---
  const computeSubscriptionState = (sub) => {
    if (!sub) return { isExpired: false, isInGrace: false, daysRemaining: null };

    const now = new Date();
    const endDate = sub.endDate ? new Date(sub.endDate) : null;
    // daysRemaining from API can be used (preferred). Fallback to date difference.
    const daysRemainingFromApi = typeof sub.daysRemaining === "number" ? sub.daysRemaining : null;
    const daysRemaining =
      daysRemainingFromApi !== null
        ? daysRemainingFromApi
        : endDate
          ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
          : null;

    // treat as expired if status is EXPIRED or daysRemaining <= 0 (and not flagged grace)
    const isInGrace = !!sub.isInGracePeriod;
    const isExpired = sub.status === "EXPIRED" || (daysRemaining !== null && daysRemaining <= 0 && !isInGrace);

    return { isExpired, isInGrace, daysRemaining };
  };

  const { isExpired, isInGrace, daysRemaining } = computeSubscriptionState(mySubscription);

  // Button text logic
  const getButtonText = (plan) => {
    if (!mySubscription) return "Buy Now";

    // If expired or in grace → allow renew or upgrade
    if (isExpired || isInGrace) {
      return plan.id === mySubscription.plan?.id ? "Renew Plan" : "Renew / Upgrade";
    }

    // Active subscription
    if (plan.id === mySubscription.plan?.id && mySubscription.status === "ACTIVE") {
      return "Active";
    }

    const currentPlanPrice = mySubscription.plan?.price || 0;
    if (plan.price <= currentPlanPrice) {
      return "Not Available";
    }
    return "Upgrade Plan";
  };

  // Disable logic
  const isButtonDisabled = (plan) => {
    if (!mySubscription) return false;

    // If expired or in grace -> allow all choices (renew/upgrade)
    if (isExpired || isInGrace) return false;

    const currentPlanPrice = mySubscription.plan?.price || 0;
    return (plan.id === mySubscription.plan?.id && mySubscription.status === "ACTIVE") || plan.price <= currentPlanPrice;
  };

  // Selection logic
  const handlePlanSelect = (plan) => {
    if (!mySubscription) {
      setSelectedPlan(plan);
      return;
    }

    // If expired or grace -> allow renewal / upgrade
    if (isExpired || isInGrace) {
      setSelectedPlan(plan);
      toast.info(`Selected ${plan.name} for renewal`);
      return;
    }

    const currentPlanPrice = mySubscription.plan?.price || 0;
    if (plan.id === mySubscription.plan?.id && mySubscription.status === "ACTIVE") {
      toast.info("This is your current active plan");
      return;
    }

    if (plan.price <= currentPlanPrice) {
      toast.warning("Please select a higher-tier plan to upgrade");
      return;
    }

    setSelectedPlan(plan);
    toast.info(`Selected ${plan.name} for upgrade`);
  };

  if (loading) return <div className="loading">Loading subscription plans...</div>;

  return (
    <div className="subscription-container">
      {/* Top notice + renew CTA when expired or in grace */}
      <ToastContainer />

      <h3 className="section-title">Choose a Plan</h3>

      <div className="tabs">
        <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile Plans</button>
        <button className={`tab ${activeTab === 'property' ? 'active' : ''}`} onClick={() => setActiveTab('property')}>Property (Advisor) Plans</button>
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Plans</button>
      </div>

      <div className="plans-list">
        {[...plans]
          .sort((a, b) => a.price - b.price)
          .filter(plan => {
            if (activeTab === 'profile') return plan.type_s === 'PROFILE';
            if (activeTab === 'property') return plan.type === 'ADVISOR';
            return true;
          })
          .map((plan) => {
            const isCurrentPlan = mySubscription?.plan?.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`plan-card ${isCurrentPlan && mySubscription?.status === "ACTIVE" ? "active" : ""} ${isCurrentPlan && (isExpired || isInGrace) ? "current-expired" : ""}`}
                onClick={() => handlePlanSelect(plan)}
                role="button"
                tabIndex={0}
              >
                <h4>{plan.name}</h4>
                <p className="price">₹{plan.price.toFixed(2)} / {plan.durationDays ? `${plan.durationDays} days` : "period"}</p>

                <ul className="benefit-list">
                  {renderBenefits(plan).map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>

                {/* current plan badges */}
                <div className="plan-card-footer">
                  {isCurrentPlan && mySubscription?.status === "ACTIVE" && <div className="badge small active">Current Plan</div>}
                  {isCurrentPlan && isInGrace && <div className="badge small grace">In Grace</div>}
                  {isCurrentPlan && isExpired && <div className="badge small expired">Expired</div>}

                  <button
                    className="buy-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect(plan);
                    }}
                    disabled={isButtonDisabled(plan)}
                  >
                    {getButtonText(plan)}
                  </button>
                </div>
              </div>
            );
          })}
        {([...(plans || [])].filter(plan => {
          if (activeTab === 'profile') return plan.type_s === 'PROFILE';
          if (activeTab === 'property') return plan.type === 'ADVISOR';
          return true;
        }).length === 0) && (
          <div className="no-plans">No plans available for this category.</div>
        )}
      </div>

      {mySubscription && (isExpired || isInGrace) && (
        <div className="renewal-note mt-4">
          <div className="renewal-note-left">
            <p className="renewal-note-text">
              {isExpired ? "⚠️ Your subscription has expired." : "⚠️ Your subscription is in Grace Period."}
              {typeof daysRemaining === "number" && (
                <span> ({daysRemaining > 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days past end`})</span>
              )}
            </p>
          </div>
          <div className="renewal-note-actions   plan-card-footer">
            {/* Renew current plan quickly */}
            <button
              className="renew-button"
              onClick={() => {
                setSelectedPlan(mySubscription.plan);
              }}
            >
              Renew Current Plan
            </button>
          </div>
        </div>
      )}

      {/* Summary of current plan (if exists) */}
      {mySubscription && (
        <div className="current-sub-card  mt-4">
          <div className="current-sub-left">
            <h4 className="current-plan-name">{mySubscription.plan?.name}</h4>
            <p className="current-plan-info">
              {mySubscription.plan?.description || ""}
            </p>
            <p className="current-plan-dates">
              <strong>Start:</strong>{" "}
              {mySubscription.startDate ? new Date(mySubscription.startDate).toLocaleDateString() : "N/A"}
              {" • "}
              <strong>End:</strong>{" "}
              {mySubscription.endDate ? new Date(mySubscription.endDate).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div className="current-sub-right">
            {isInGrace ? (
              <span className="badge grace">Grace Period</span>
            ) : isExpired ? (
              <span className="badge expired">Expired</span>
            ) : (
              <span className="badge active">Active</span>
            )}
            {typeof daysRemaining === "number" && (
              <div className={`days-remaining ${daysRemaining > 10 ? "safe" : daysRemaining > 0 ? "warning" : "expired"}`}>
                {daysRemaining > 0 ? `${daysRemaining} days left` : `${Math.abs(daysRemaining)} days past end`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedPlan && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => setSelectedPlan(null)}
            >
              ×
            </button>
            <PlanCheckout
              plan={selectedPlan}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
