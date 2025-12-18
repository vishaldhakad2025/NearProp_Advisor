import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBed,
  faShower,
  faCar,
  faUser,
  faUpRightAndDownLeftFromCenter,
  faEdit,
  faFilter,
  faTimes,
  faShareAlt,
  faMapMarkerAlt,
  faTrash,

} from '@fortawesome/free-solid-svg-icons';
import { FaTrash } from "react-icons/fa";
import './PropertyManagement.css';
import { deleteProperty, getAllProperties, getMyProperties, updatePropertyStock } from '../redux/slices/propertySlice';
import axios from 'axios';
import SubscriptionPopup from './SubscriptionPopup';
import { FaStar } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error bg-red-50 text-red-700 p-4 rounded-lg text-center">
          Error: {this.state.error?.message || 'Something went wrong'}
        </div>
      );
    }
    return this.props.children;
  }
}

// 🆕 Get user location from localStorage or Geolocation API
const getUserLocation = () => {
  try {
    const locationData = localStorage.getItem('userLocationData');
    if (!locationData) {
      console.log('No myLocation found in localStorage');
      return null;
    }
    const parsedLocation = JSON.parse(locationData);
    if (!parsedLocation.latitude || !parsedLocation.longitude) {
      console.error('Invalid myLocation data: missing latitude or longitude');
      return null;
    }
    // console.log('User location retrieved:', parsedLocation);
    return {
      latitude: parsedLocation.latitude,
      longitude: parsedLocation.longitude,
    };
  } catch (err) {
    console.error('Error parsing myLocation:', err.message);
    return null;
  }
};

// 🆕 Calculate distance between two coordinates using Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return isNaN(distance) ? null : Number(distance.toFixed(2));
}

const PropertyManagement = () => {
  const [filters, setFilters] = useState({
    category: '',
    date: '',
    search: '',
    minPrice: 0,
    maxPrice: 1000000000,
    bedrooms: '',
    myProperties: false,
  });
  const token = localStorage.getItem("token");

  const [sortByPrice, setSortByPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const userId = localStorage.getItem('userId');
  const [mySubscription, setMySubscription] = useState(null);
  const [subscriptionPopup, setSubscriptionPopup] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { all: properties = [], myProperties = [], loading } = useSelector((state) => state.property);
  // console.log("------------------------------------------------",properties)
  // 🆕 State for user location
  const [userLocation, setUserLocation] = useState(null);

  // 🆕 Fetch user location on mount
  useEffect(() => {
    const location = getUserLocation();
    setUserLocation(location);
  }, []);

  useEffect(() => {
    dispatch(getAllProperties({
      search: filters.search,
      category: filters.category,
      date: filters.date,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      bedrooms: filters.bedrooms,
      ownerId: filters.myProperties ? userId : undefined,
    }));
    if (filters.myProperties) {
      dispatch(getMyProperties({ page: currentPage }));
    }
  }, [dispatch, filters, currentPage, userId]);

  useEffect(() => {
    if (showUpdateNotification) {
      const timer = setTimeout(() => {
        setShowUpdateNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showUpdateNotification]);

  const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.nearprop.com',
    apiPrefix: 'api',
  };

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
      console.error("❌ Failed to fetch subscriptions:", err);
      setMySubscription(null);
      setSubscriptionPopup(true);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMySubscription();
    } else {
      setSubscriptionPopup(true);
    }
  }, [token]);

  const handleViewClick = (id) => {
    navigate(`/property/${id}`);
  };

  const handleAddPropertyClick = () => {
    if (mySubscription) {
      navigate('/project');
    } else {
      setSubscriptionPopup(true);
    }
  };

  const handleEditPropertyClick = (property) => {
    // console.log('Navigating with property:', property);
    navigate('/project', { state: { property, isEditMode: true } });
  };

  // const handleUpdateStockClick = (property) => {
  //   setSelectedProperty(property);
  //   setStockValue(property.stock || '');
  //   setShowStockModal(true);
  // };

  const handleStockSubmit = () => {
    if (!selectedProperty || !stockValue || isNaN(stockValue) || Number(stockValue) < 0) {
      alert('Please enter a valid stock value');
      return;
    }
    dispatch(updatePropertyStock({ propertyId: selectedProperty.id, stock: stockValue }))
      .then(() => {
        setShowStockModal(false);
        setStockValue('');
        setSelectedProperty(null);
        setShowUpdateNotification(true);
      });
  };

  const handleShareClick = (property) => {
    const shareText = `
🏠 *${property.title}*
📍 Location: ${property.placeName}, ${property.city}
💰 Price: ₹${typeof property.price === 'number' ? property.price.toLocaleString() : property.price}
🛏️ Bedrooms: ${property.beds}
🛁 Bathrooms: ${property.baths}
🚗 Parking: ${property.parking}
📏 Area: ${property.area}
🏠 Type: ${property.type}
📦 Stock: ${property.stock}
👤 Owner: ${property.owner.name}
🔗 View more: https://www.nearprop.com/property/${property.id}
    `.trim();

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(0);
  };

  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
    setCurrentPage(0);
  };

  const toggleFilterSidebar = () => {
    setIsFilterSidebarOpen((prev) => !prev);
  };

  const toggleMyProperties = () => {
    setFilters((prev) => ({
      ...prev,
      myProperties: !prev.myProperties,
    }));
    setCurrentPage(0);
  };

  const enrichedProperties = (filters.myProperties ? myProperties : properties).map((property) => {
    // 🆕 Calculate distance if user location and property coordinates are available
    const distance = userLocation && property.latitude && property.longitude
      ? getDistanceFromLatLonInKm(
        userLocation.latitude,
        userLocation.longitude,
        property.latitude,
        property.longitude
      )
      : null;

    return {
      ...property,

      approved: property.approved ?? false,
      featured: property.featured ?? false,
      active: property.active ?? true,
      subscriptionExpiry: property.subscriptionExpiry || new Date().toISOString(),
      distance, // 🆕 Add distance to property
      distanceText: distance ? `${distance} km away` : 'Distance unavailable', // 🆕 Add distance text
    };
  });



  // 🆕 Sort by distance first (if available), then by price
  const filteredProperties = filters && Object.values(filters).some(f => f)
    ? enrichedProperties.filter((property) => {
      const matchesCategory = filters.category ? property.type === filters.category : true;
      const matchesDate = filters.date
        ? filters.date === 'last7days'
          ? new Date(property.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          : new Date(property.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : true;
      const safeToLower = (str) => (str ? str.toLowerCase() : "");

      const matchesSearch = filters.search
        ? safeToLower(property.title).includes(filters.search.toLowerCase()) ||
        safeToLower(property.placeName).includes(filters.search.toLowerCase()) ||
        safeToLower(property.city).includes(filters.search.toLowerCase())
        : true;

      const matchesMinPrice = filters.minPrice !== undefined && filters.minPrice !== null
        ? Number(property.price) >= Number(filters.minPrice)
        : true;
      const matchesMaxPrice = filters.maxPrice !== undefined && filters.maxPrice !== null
        ? Number(property.price) <= Number(filters.maxPrice)
        : true;
      const matchesBedrooms = filters.bedrooms
        ? Number(property.beds) === Number(filters.bedrooms) ||
        (filters.bedrooms === '5+' && Number(property.beds) >= 5)
        : true;

      return matchesCategory && matchesDate && matchesSearch && matchesMinPrice && matchesMaxPrice && matchesBedrooms;
    })
    : enrichedProperties;


  // console.log("-------------------------",filteredProperties)
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    // 🆕 Prioritize sorting by distance if userLocation is available
    if (userLocation) {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    }
    // Fallback to existing price sorting
    if (!sortByPrice) return 0;
    const priceA = typeof a.price === 'number' ? a.price : Number.MAX_VALUE;
    const priceB = typeof b.price === 'number' ? b.price : Number.MAX_VALUE;
    return sortByPrice === 'asc' ? priceA - priceB : priceB - priceA;
  });

  const getStatus = (property) => {
    if (!property.approved) return 'Pending Verification';
    if (!property.active) return 'Expired';
    if (property.status === 'SOLD') return 'Sold';
    return 'Active';
  };

  const getTags = (property) => {
    const tags = [];
    if (property.approved) tags.push('Aadhaar Verified');
    if (property.active && property.subscriptionExpiry > new Date().toISOString()) {
      tags.push('Subscription Active');
    } else {
      tags.push('Subscription Expired');
      if (new Date(property.subscriptionExpiry) < new Date()) {
        tags.push('Grace Period Over');
      }
    }
    if (property.status === 'SOLD') tags.push('Sold');
    if (!property.approved) tags.push('Not Aadhaar Verified');
    if (property.featured) tags.push('Featured');
    if (property.distance !== null) tags.push('Nearby'); // 🆕 Add Nearby tag for properties with distance
    return tags;
  };

  const propertiesPerPage = 6;
  const totalPages = Math.ceil(sortedProperties.length / propertiesPerPage);
  const startIndex = currentPage * propertiesPerPage;
  const currentProperties = sortedProperties.slice(startIndex, startIndex + propertiesPerPage);

  const chunkedProperties = [];
  for (let i = 0; i < currentProperties.length; i += 2) {
    chunkedProperties.push(currentProperties.slice(i, i + 2));
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      dispatch(deleteProperty(id));
    }
  };
  const renderDetails = (property) => {
    const details = [];

    switch (property.type) {
      case "PLOT":
      case "FARMLAND":
        if (property.landArea) {
          details.push(
            <span key="landArea">{property.landArea} {property.landAreaPostfix || "sq ft"}</span>
          );
        }
        break;

      case "COMMERCIAL":
      case "OFFICE_SPACE":
      case "SHOP":
      case "WAREHOUSE":
        if (property.area) {
          details.push(<span key="area">{property.area} {property.sizePostfix || "sq ft"}</span>);
        }
        if (property.parking && property.parking !== "N/A") {
          details.push(
            <span key="parking"><FontAwesomeIcon icon={faCar} /> {property.parking}</span>
          );
        }
        break;

      case "APARTMENT":
      case "CONDO":
      case "MULTI_FAMILY_HOME":
      case "SINGLE_FAMILY_HOME":
      case "STUDIO":
      case "VILLA":
      case "HOUSE":
        if (property.beds) {
          details.push(
            <span key="beds"><FontAwesomeIcon icon={faBed} /> {property.beds}</span>
          );
        }
        if (property.baths) {
          details.push(
            <span key="baths"><FontAwesomeIcon icon={faShower} /> {property.baths}</span>
          );
        }
        if (property.parking && property.parking !== "N/A") {
          details.push(
            <span key="parking"><FontAwesomeIcon icon={faCar} /> {property.parking}</span>
          );
        }
        if (property.area) {
          details.push(<span key="area">{property.area} {property.sizePostfix || "sq ft"}</span>);
        }
        break;

      case "PG_HOSTEL":
        if (property.beds) {
          details.push(
            <span key="beds"><FontAwesomeIcon icon={faBed} /> {property.beds} Beds</span>
          );
        }
        if (property.baths) {
          details.push(
            <span key="baths"><FontAwesomeIcon icon={faShower} /> {property.baths}</span>
          );
        }
        if (property.area) {
          details.push(<span key="area">{property.area} {property.sizePostfix || "sq ft"}</span>);
        }
        break;

      default:
        if (property.area) {
          details.push(<span key="area">{property.area} {property.sizePostfix || "sq ft"}</span>);
        }
    }

    // 🆕 Add distance to details
    if (property.distance !== null) {
      details.push(
        <span key="distance">
          <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#0e7490' }} /> {property.distanceText}
        </span>
      );
    }

    return details;
  };

  const formatStatus = (status) => {
    switch (status) {
      case "FOR_RENT":
        return "For Rent";
      case "FOR_SALE":
        return "For Sale";
      case "AVAILABLE":
        return "Available";
      case "SOLD":
        return "Sold";
      default:
        return status;
    }
  };

  const renderProperties = (properties) => {
    return properties.map((property) => {
      const status = getStatus(property);
      const tags = getTags(property);

      return (
        <div key={property.id || property.title} className="property-card-wrapper">
          <div className="property-card">
            <div className="neartime-image-container">
              <img
                src={property.imageUrls?.[0]}
                alt={`property-${property.id}`}
                title={property.title}
                className="property-image"
              />
              {property.featured && <span className="status" title='Featured'><FaStar /></span>}

              <span
                className={`status ${property.status === "SOLD" ? "sold-badge hidden" : ""}`}
              >
                {formatStatus(property.status)}
              </span>

              <div className="landing-overlay-icons">
                <FontAwesomeIcon
                  className="landing-overlay-icons-i"
                  icon={faShareAlt}
                  onClick={() => handleShareClick(property)}
                  style={{ cursor: "pointer" }}
                  title="Share Property"
                />
                {(filters.myProperties || property.owner.id == userId) && (
                  <>
                    <FontAwesomeIcon
                      className="landing-overlay-icons-i"
                      icon={faEdit}
                      onClick={() => handleEditPropertyClick(property)}
                      style={{ cursor: "pointer" }}
                      title="Edit Property"
                    />
                    <FontAwesomeIcon
                      className="landing-overlay-icons-i"
                      icon={faTrash}
                      onClick={() => handleDelete(property.id)}
                      style={{ cursor: "pointer" }}
                      title="Delete Property"
                    />
                    
                  </>
                )}


              </div>

              <div className="neartime-price-box">
                ₹
                {typeof property.price === "number"
                  ? property.price.toLocaleString()
                  : property.price}
              </div>
            </div>

            <div className="property-content">
              <h2>{property.title}</h2>
              <div className="neartime-location">
                {property.placeName}, {property.city}
              </div>

              <div className="neartime-details">{renderDetails(property)}</div>

              <div className="neartime-type">{property.type}</div>

              <div className="neartime-footer">
                <span>
                  <FontAwesomeIcon icon={faUser} /> {property.owner?.name}
                </span>
                <span>Status: {status}</span>
              </div>

              {tags.length > 0 && (
                <div className="tags">
                  {tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleViewClick(property.id)}
                className="submit-review-btn"
              >
                View Property
              </button>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <SubscriptionPopup
          open={subscriptionPopup}
          onClose={() => setSubscriptionPopup(false)}
          onViewPlans={() => navigate("/SubscriptionManagement")}
        />

        <div className="background">
          <div className="banner-content">
            <h1 className="banner-tagline">Showcase Your Property to the World!</h1>
            <button
              className="add-property-btn"
              onClick={handleAddPropertyClick}
              aria-label="Add a new property"
            >
              + Add Property
            </button>
          </div>
        </div>

        <div className="container-p">
          <div className="header-container">
            <h1>{filters.myProperties ? 'My Properties' : 'All Properties'}</h1>
            <div className="header-actions">
              <button
                className="my-properties-btn"
                onClick={toggleMyProperties}
                aria-label={filters.myProperties ? 'Show All Properties' : 'Show My Properties'}
              >
                {filters.myProperties ? 'All Properties' : 'My Properties'}
              </button>
              {isFilterSidebarOpen && <button
                className="filter-toggle-btn"
                onClick={toggleFilterSidebar}
                aria-label="Toggle filters"
              >
                <FontAwesomeIcon icon={faFilter} /> Filters
              </button>
              }
            </div>
          </div>
          <div className="content-wrapper">
            <div className={`filter-sidebar ${isFilterSidebarOpen ? 'open' : ''}`}>
              <button
                className="filter-close-btn"
                onClick={toggleFilterSidebar}
                aria-label="Close filters"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <h3>Filter Properties</h3>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by title"
                className="search-input"
              />
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="PLOT">Plot</option>
                <option value="LAND">Land</option>
                <option value="SHOP">Shop</option>
                <option value="WAREHOUSE">Warehous</option>
                <option value="MULTI_FAMILY_HOME">MULTI FAMILY HOME</option>
                <option value="OFFICE_SPACE">OFFICE SPACE</option>
              </select>
              {/* <select
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
              >
                <option value="">All Dates</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
              </select> */}
              <div className="price-range">
                <h4>Price Range (₹)</h4>
                <div className="price-slider-container">
                  <input
                    type="range"
                    name="minPrice"
                    min="0"
                    max="1000000000"
                    step="10000"
                    value={filters.minPrice}
                    onChange={handlePriceRangeChange}
                    className="price-slider"
                  />
                  <input
                    type="range"
                    name="maxPrice"
                    min="0"
                    max="1000000000"
                    step="10000"
                    value={filters.maxPrice}
                    onChange={handlePriceRangeChange}
                    className="price-slider"
                  />
                </div>
                <div className="price-values">
                  <span>Min: ₹{filters.minPrice.toLocaleString()}</span>
                  <span>Max: ₹{filters.maxPrice.toLocaleString()}</span>
                </div>
              </div>
              {/* <select
                value={sortByPrice}
                onChange={(e) => {
                  setSortByPrice(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">Sort by Price</option>
                <option value="asc">Price: Low to High</option>
                <option value="desc">Price: High to Low</option>
              </select> */}
            </div>
            <div className="property-container">
              {showUpdateNotification && (
                <div className="update-notification">
                  Property stock updated successfully!
                </div>
              )}
              {showStockModal && (
                <div className="modal-overlay">
                  <div className="modal-box">
                    <h3>Update Stock for {selectedProperty?.title}</h3>
                    <input
                      type="number"
                      value={stockValue}
                      onChange={(e) => setStockValue(e.target.value)}
                      placeholder="Enter new stock value"
                      className="stock-input"
                      min="0"
                    />
                    <div className="modal-actions">
                      <button
                        onClick={() => setShowStockModal(false)}
                        aria-label="Cancel stock update"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleStockSubmit}
                        aria-label="Submit stock update"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* {console.log("------------", sortedProperties)} */}
              {loading ? (
                <div className="loading-wrapper">
                  <div className="spinner-icon"></div>
                </div>
              ) : sortedProperties.length === 0 ? (
                <div className="property-row">No properties found.</div>
              ) : (
                <div className="property-grid">
                  {chunkedProperties.map((row, rowIndex) => (
                    <div key={rowIndex} className="property-row">
                      {renderProperties(row)}
                    </div>
                  ))}
                </div>
              )}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={handlePreviousPage}
                    className="prev-btn"
                    disabled={currentPage === 0}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    className="next-btn"
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PropertyManagement;