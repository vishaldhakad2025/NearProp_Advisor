// src/App.jsx
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './redux/store'; // Ensure this points to your store.js
import Header from './Components/Header';
import Footer from './Components/Footer';
import DashboardOverview from './Components/DashboardOverview';
import PropertyManagement from './Components/PropertyManagement';
import BulkListingPage from './Components/BulkListingPage';
import DeveloperProfile from './Components/DeveloperProfile';
import Project from './Components/Project';
import InquiryList from './Components/InquiryList';
import Banner from './Components/Banner';
import PropertyDetails from './Components/PropertyDetails';
import Login from './Components/Login';
import OtpVerify from './Components/OtpVerify';
import NotFound from './feature/NotFound';
import ChatPanel from './Components/ChatPanel';
import FeedPage from './Components/FeedPage';
import ReelsPage from './Components/ReelsPage';
import SubscriptionManagement from './Components/SubscriptionManagement';
import VisitSchedule from './Components/VisitSchedule';
import ErrorBoundary from './Components/Errorboundary'; // Import ErrorBoundary
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import queryString from 'query-string';  // Import this

import { fetchUserProfile } from './redux/slices/authSlice';
import axiosInstance from './utils/axiosInstance';

// ProtectedRoute component to restrict access
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

// AppContent component to handle logic and routes
function AppContent() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);

  // Hide Header and Footer on login and OTP verification pages
  const hideHeaderFooter = location.pathname === '/' || location.pathname === '/verify-otp';

  useEffect(() => {
    const processTokenFromUrl = async () => {
      const params = queryString.parse(location.search);
      const urlToken = params.token;

      if (urlToken) {
        localStorage.setItem('token', urlToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`;
        try {
          const profileAction = await dispatch(fetchUserProfile());
          if (fetchUserProfile.fulfilled.match(profileAction)) {
            const { id, roles } = profileAction.payload;
            localStorage.setItem('userId', id);
            localStorage.setItem('roles', JSON.stringify(roles));
            navigate(location.pathname, { replace: true }); // Clean URL
          } else {
            throw new Error('Profile fetch failed');
          }
        } catch (error) {
          console.error('Invalid or expired token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('roles');
          axiosInstance.defaults.headers.common['Authorization'] = undefined;
          navigate('/');
        }
      } else {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          dispatch(fetchUserProfile());
        }
      }
    };

    processTokenFromUrl();
  }, [dispatch, location.search, navigate]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, user]);

  return (
    <div className="page-wrapper">
      {!hideHeaderFooter && (
        <ErrorBoundary navigate={navigate}>
          <Header />
        </ErrorBoundary>
      )}
      <main className="content">
        <Routes>
          <Route path="/" element={<Login />} />
                    <Route path="/verify-otp" element={<OtpVerify />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
          <Route path="/chatpanel" element={<ProtectedRoute><ChatPanel /></ProtectedRoute>} />
          <Route path="/property" element={<ProtectedRoute><PropertyManagement /></ProtectedRoute>} />
          <Route
            path="/property/:id"
            element={
              <ErrorBoundary navigate={navigate}>
                <ProtectedRoute>
                  <PropertyDetails />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />
          <Route path="/feedpage" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/reel" element={<ProtectedRoute><ReelsPage /></ProtectedRoute>} />
          <Route path="/bulklistingpage" element={<ProtectedRoute><BulkListingPage /></ProtectedRoute>} />
          <Route path="/developerprofile" element={<ProtectedRoute><DeveloperProfile /></ProtectedRoute>} />
          <Route path="/project" element={<ProtectedRoute><Project /></ProtectedRoute>} />
          <Route path="/inquirylist" element={<ProtectedRoute><InquiryList /></ProtectedRoute>} />
          <Route path="/banner" element={<ProtectedRoute><Banner /></ProtectedRoute>} />
          <Route path="/VisitSchedule" element={<ProtectedRoute><VisitSchedule /></ProtectedRoute>} />
          <Route path="/SubscriptionManagement" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;