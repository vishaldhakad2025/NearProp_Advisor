
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Button } from '@mui/material';
import Banner from './Banner';
import axiosInstance from '../utils/axiosInstance';
import axios from 'axios';
import { fetchDistricts, fetchDashboard } from '../redux/slices/districtSlice';
import { fetchUserProfile } from '../redux/slices/authSlice';
import { getCurrentPosition, fetchAddressFromGoogle, fetchDistrictIdFromGoogle, getDistrictIdByName } from '../utils/locationService';
import SubscriptionPopup from './SubscriptionPopup';
import './DashboardOverview.css';

const GOOGLE_MAP_KEY = 'AIzaSyAepBinSy2JxyEvbidFz_AnFYFsFlFqQo4';
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.nearprop.com',
  apiPrefix: 'api',
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const earningsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Monthly Revenue (in Cr)',
      data: [2.5, 3.0, 3.5, 2.8, 4.0, 4.5],
      borderColor: '#4A3AFF',
      backgroundColor: 'rgba(74, 58, 255, 0.2)',
      fill: true,
    },
  ],
};

const flatStats = {
  labels: ['Sold', 'Available', 'Reserved'],
  datasets: [
    {
      label: 'Flat Inventory',
      data: [80, 40, 10],
      backgroundColor: ['#FF7043', '#36A2EB', '#FFCE56'],
      borderWidth: 1,
    },
  ],
};

const DashboardOverview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { user } = useSelector((state) => state.auth);
  const { list: districts = [], loading: districtsLoading, error: districtsError } = useSelector((state) => state.districts?.districts || { list: [], loading: false, error: null });
  const { data, loading: dashboardLoading, error: dashboardError } = useSelector((state) => state.districts?.dashboard || { data: {}, loading: false, error: null });
  const [address, setAddress] = useState('Fetching location...');
  const [locationData, setLocationData] = useState(null);
  const [mySubscription, setMySubscription] = useState(null);
  const [subscriptionPopup, setSubscriptionPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user profile, districts, and dashboard data
  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchDistricts());
    dispatch(fetchDashboard());
  }, [dispatch]);

  // Fetch subscription
  const fetchMySubscription = async () => {
    try {
      const response = await axios.get(
        `${API_CONFIG.baseUrl}/${API_CONFIG.apiPrefix}/subscriptions/my-subscriptions?page=0&size=10&sortBy=startDate&direction=DESC`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = response.data;
      if (result.success && result.data?.content?.length > 0) {
        setMySubscription(result.data.content[0]);
        setSubscriptionPopup(false);
      } else {
        setMySubscription(null);
        setSubscriptionPopup(true);
      }
    } catch (err) {
      console.error('❌ Failed to fetch subscriptions:', err);
      setMySubscription(null);
      setSubscriptionPopup(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMySubscription();
    } else {
      setLoading(false);
      setSubscriptionPopup(true);
    }
  }, [token]);

  // Handle location
  useEffect(() => {
    const sendLocation = async () => {
      try {
        const pos = await getCurrentPosition({ timeout: 10000 });
        const { latitude: lat, longitude: lng } = pos.coords;
        const { fullAddress, houseNumber, colony } = await fetchAddressFromGoogle(lat, lng, GOOGLE_MAP_KEY);
        const { districtName } = await fetchDistrictIdFromGoogle(lat, lng, GOOGLE_MAP_KEY);
        const districtId = getDistrictIdByName(districtName, districts);

        setAddress(
          `${houseNumber ? houseNumber + ", " : ""}${colony ? colony + ", " : ""}${fullAddress}`
        );

        const res = await axiosInstance.post(
          '/api/v1/users/location',
          { latitude: lat, longitude: lng, districtId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const userLoc = {
          latitude: res.data.data.latitude,
          longitude: res.data.data.longitude,
          districtName,
          districtId: res.data.data.districtId,
        };

        localStorage.setItem('userLocationData', JSON.stringify(userLoc));
        setLocationData(userLoc);
      } catch (error) {
        console.error('❌ Location update failed:', error);
        setAddress('Unable to fetch location');
      }
    };

    if (districts?.length > 0 && token) {
      sendLocation();
    } else {
      const savedData = localStorage.getItem('userLocationData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setLocationData(parsedData);
        setAddress(
          `${parsedData.houseNumber ? parsedData.houseNumber + ", " : ""}${parsedData.colony ? parsedData.colony + ", " : ""}${parsedData.fullAddress || parsedData.districtName || 'Location not available'}`
        );
      } else {
        setAddress('Location not available');
      }
    }
  }, [districts, token]);

  // Refresh location
  const getLocation = async () => {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const { fullAddress, houseNumber, colony } = await fetchAddressFromGoogle(lat, lng, GOOGLE_MAP_KEY);
      setAddress(
        `${houseNumber ? houseNumber + ", " : ""}${colony ? colony + ", " : ""}${fullAddress}`
      );
      localStorage.setItem(
        'userLocationData',
        JSON.stringify({ latitude: lat, longitude: lng, fullAddress, houseNumber, colony })
      );
    } catch (err) {
      console.error('❌ Location fetch failed:', err);
      setAddress('Unable to fetch location');
    }
  };

  // Handle Add Property
  const handleAddProperty = () => {
    if (mySubscription) {
      navigate('/project');
    } else {
      setSubscriptionPopup(true);
    }
  };

  if (loading || districtsLoading || dashboardLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (districtsError || dashboardError) {
    return <div>Error: {districtsError || dashboardError}</div>;
  }

  return (
    <>
      <SubscriptionPopup
        open={subscriptionPopup}
        onClose={() => setSubscriptionPopup(false)}
      />
      <Banner user={user} />

      <header
        style={{
          padding: '12px 20px',
          background: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #ddd',
          justifyContent: 'space-between',
        }}
      >
        <div><span style={{ fontWeight: '500' }}>{address}</span></div>
        <button
          onClick={getLocation}
          style={{
            padding: '6px 12px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </header>

      <div className="dashboard-wrapper">
        <h2 className="dashboard-title">Property Advisor Dashboard</h2>

        <header className="landing-header">
          <section className="quick-actions">
            <button onClick={handleAddProperty}>ADD NEW PROPERTY</button>
          </section>
          <div className="header-actions">
            <Button
              className="website-btn"
              variant="contained"
              onClick={() => {
                if (token) {
                  window.open(`https://nearprop.in/?token=${token}`, '_blank', 'noopener,noreferrer');
                } else {
                  alert('Token missing, please login again.');
                }
              }}
            >
              Website NearProp
            </Button>
          </div>
        </header>

        {/* Property Summary */}
        <section className="property-summary">
          <div className="card">My Properties: <span>{data?.totalProperties || 0}</span></div>
          <div className="card">Active Properties: <span>{data?.activeProperties || 0}</span></div>
          <div className="card">Total Visits: <span>{data?.totalScheduledVisits || 0}</span></div>
          <div className="card">Reels Views: <span>{data?.totalViews || 0}</span></div>
        </section>

        {/* Quick Navigation Tiles */}
        <div className="quick-links">
          <div onClick={() => navigate('/property')} className="quick-link-card">Properties</div>
          <div onClick={() => navigate('/VisitSchedule')} className="quick-link-card">My Visits</div>
          <div onClick={() => navigate('/feedpage')} className="quick-link-card">Reels</div>
          <div onClick={() => navigate('/chatpanel')} className="quick-link-card">Chat</div>
          <div
            onClick={() => window.open('https://nearprop.in/', '_blank', 'noopener,noreferrer')}
            className="quick-link-card"
          >
            User Website NearProp
          </div>
        </div>

        {/* Analytics */}
        <section className="analytics">
          <h3>Analytics</h3>
          <div className="charts">
            <div className="chart-container">
              <h4>Monthly Revenue (in Cr)</h4>
              <Line data={earningsData} />
            </div>
            <div className="chart-container">
              <h4>Flat Inventory Overview</h4>
              <Bar data={flatStats} />
            </div>
        </div>

        <div className="renewal-stats card shadow-sm p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Plan Details</h4>
            {mySubscription && (
              <span
                className={`status-badge ${
                  mySubscription.isActive ? 'active' : mySubscription.isInGracePeriod ? 'grace' : 'expired'
                }`}
              >
                {mySubscription.isActive
                  ? 'Active'
                  : mySubscription.isInGracePeriod
                  ? 'Grace Period'
                  : 'Expired'}
              </span>
            )}
          </div>
          {mySubscription ? (
            <div className="renewal-details">
              <p>
                <strong>Plan:</strong>{' '}
                <span className="plan-name">{mySubscription.plan?.name || 'N/A'}</span>
              </p>
              <p>
                <strong>Start Date:</strong>{' '}
                {new Date(mySubscription.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>End Date:</strong>{' '}
                {new Date(mySubscription.endDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Days Remaining:</strong>{' '}
                <span
                  className={`days-badge ${
                    mySubscription.daysRemaining > 10
                      ? 'safe'
                      : mySubscription.daysRemaining > 0
                      ? 'warning'
                      : 'expired'
                  }`}
                >
                  {mySubscription.daysRemaining > 0
                    ? `${mySubscription.daysRemaining} days`
                    : 'Expired'}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-muted">No active subscription found.</p>
          )}
        </div>
      </section>
    </div>
  </>
);
};

export default DashboardOverview;
