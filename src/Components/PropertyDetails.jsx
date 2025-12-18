// src/components/PropertyDetails.jsx
import React, { useEffect, useState, useRef, lazy } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaWhatsapp, FaPhone, FaBed, FaBath, FaCar, FaRulerCombined, FaMapMarkerAlt, FaUser, FaArrowLeft, FaHeart, FaShareAlt, FaExpand, FaStar, FaCalendarAlt, FaRupeeSign, FaHome, FaBuilding, FaDoorOpen, FaTree, FaWarehouse } from "react-icons/fa";

import { getPropertyById, getAllProperties, fetchReelsByProperty } from '../redux/slices/propertySlice';
import { getReviewsByProperty, createReview, resetReviewState } from '../redux/slices/reviewSlice';
import Advertisements from './Advertisements';
import './PropertyDetails.css';

export const propertyOverviewConfig = {
  COMMERCIAL: [
    { key: "area", label: "Office Area", icon: <FaBuilding />, postfix: "Sq Ft" },
    { key: "garages", label: "Parking", icon: <FaCar /> },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  OFFICE_SPACE: [
    { key: "area", label: "Office Area", icon: <FaBuilding />, postfix: "Sq Ft" },
    { key: "garages", label: "Parking", icon: <FaCar /> },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  SHOP: [
    { key: "area", label: "Shop Area", icon: <FaDoorOpen />, postfix: "Sq Ft" },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  WAREHOUSE: [
    { key: "area", label: "Warehouse Size", icon: <FaWarehouse />, postfix: "Sq Ft" },
    { key: "garages", label: "Loading Bays", icon: <FaCar /> },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  APARTMENT: [
    { key: "bedrooms", label: "Bedrooms", icon: <FaBed /> },
    { key: "bathrooms", label: "Bathrooms", icon: <FaBath /> },
    { key: "area", label: "Area Size", icon: <FaRulerCombined />, postfix: "Sq Ft" },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  CONDO: [
    { key: "bedrooms", label: "Bedrooms", icon: <FaBed /> },
    { key: "bathrooms", label: "Bathrooms", icon: <FaBath /> },
    { key: "area", label: "Living Area", icon: <FaRulerCombined />, postfix: "Sq Ft" },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  MULTI_FAMILY_HOME: [
    { key: "bedrooms", label: "Total Bedrooms", icon: <FaBed /> },
    { key: "bathrooms", label: "Total Bathrooms", icon: <FaBath /> },
    { key: "area", label: "Total Area", icon: <FaRulerCombined />, postfix: "Sq Ft" },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  SINGLE_FAMILY_HOME: [
    { key: "bedrooms", label: "Bedrooms", icon: <FaBed /> },
    { key: "bathrooms", label: "Bathrooms", icon: <FaBath /> },
    { key: "garageSize", label: "Garage Size", icon: <FaCar />, postfix: "Sq Ft" },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  STUDIO: [
    { key: "area", label: "Studio Area", icon: <FaRulerCombined />, postfix: "Sq Ft" },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  VILLA: [
    { key: "bedrooms", label: "Bedrooms", icon: <FaBed /> },
    { key: "bathrooms", label: "Bathrooms", icon: <FaBath /> },
    { key: "area", label: "Villa Area", icon: <FaRulerCombined />, postfix: "Sq Ft" },
    { key: "garages", label: "Garage", icon: <FaCar /> },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  HOUSE: [
    { key: "bedrooms", label: "Bedrooms", icon: <FaBed /> },
    { key: "bathrooms", label: "Bathrooms", icon: <FaBath /> },
    { key: "garages", label: "Garage", icon: <FaCar /> },
    { key: "area", label: "House Area", icon: <FaRulerCombined />, postfix: "Sq Ft" },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
  PLOT: [
    { key: "landArea", label: "Plot Size", icon: <FaTree />, postfix: "Sq Ft" },
  ],
  FARMLAND: [
    { key: "landArea", label: "Farmland Area", icon: <FaTree />, postfix: "Sq Ft" },
  ],
  PG_HOSTEL: [
    { key: "bedrooms", label: "Total Beds", icon: <FaBed /> },
    { key: "bathrooms", label: "Bathrooms", icon: <FaBath /> },
    { key: "area", label: "Total Area", icon: <FaRulerCombined />, postfix: "Sq Ft" },
  ],
  DEFAULT: [
    { key: "area", label: "Area", icon: <FaRulerCombined />, postfix: "Sq Ft" },
    { key: "yearBuilt", label: "Year Built", icon: <FaCalendarAlt /> },
  ],
};
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
          <button className="btn btn-primary mt-3" onClick={() => this.props.navigate('/property')}>
            Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PropertyDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProperty: property, all: properties, reels, loading: propertyLoading } = useSelector((state) => state.property || {});
  const { reviews = [], loading: reviewsLoading = false, error: reviewsError = null, success: reviewsSuccess = false } = useSelector((state) => state.reviews || {});
  const authState = useSelector((state) => state.auth || {});
  const rooms = useSelector((state) => state.chat?.rooms || []);
  const matchedRoom = rooms.find((room) => room.propertyId === property?.id);
  const [selectedReel, setSelectedReel] = useState(null);

  const [currentImage, setCurrentImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isAgentFooterVisible, setIsAgentFooterVisible] = useState(true);
  const footerRef = useRef(null);

  useEffect(() => {
    if (id) {
      // console.log('PropertyDetails useEffect - ID:', id, 'Token:', authState?.user?.token || authState?.token);
      dispatch(getPropertyById(id));
      dispatch(fetchReelsByProperty({ propertyId: id }));
      const token = authState?.user?.token || authState?.token;
      if (token) {
        dispatch(getReviewsByProperty({ propertyId: id, token }));

      } else {
        setFormErrors({ reviews: 'Please log in to view or submit reviews.' });
      }
      dispatch(getAllProperties());
    }
    return () => {
      dispatch(resetReviewState());
    };
  }, [dispatch, id, authState]);

  useEffect(() => {
    const handleScroll = () => {
      if (footerRef.current) {
        const footerTop = footerRef.current.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        setIsAgentFooterVisible(footerTop > windowHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openChatRoom = (roomId) => {
    navigate(`/ChatPanel/${roomId}`);
  };

  console.log("property details are you see", property)

  const enrichedProperty = {
    ...property,
    imageUrls: property?.imageUrls || null,
    title: property?.title || '----',
    city: property?.city || '',
    state: property?.state || '',
    districtName: property?.districtName || '',
    price: property?.price || null,
    area: property?.area || null,
    landAreaPostfix: property?.landAreaPostfix,
    type: property?.type || '',
    status: property?.status || '',
    bedrooms: property?.bedrooms || null,
    note: property?.note || 'No additional notes',
    bathrooms: property?.bathrooms || null,
    garages: property?.garages,
    garageSize: property?.garageSize || null,
    yearBuilt: property?.yearBuilt,
    owner: property?.owner || null,
    permanentId: property?.permanentId,
    description: property?.description || '....',
    approved: property?.approved ?? true,
    featured: property?.featured ?? false,
    active: property?.active ?? true,
    subscriptionExpiry: property?.subscriptionExpiry || new Date().toISOString(),
    features: property?.features || null,
    floorPlans: property?.floorPlans || null,
    additionalDetails: property?.additionalDetails || null,
    videoUrl: property?.videoUrl || 'https://www.youtube.com/embed/-NInBEdSvp8?si=H4Qq2rmaE3bifehT',
    address: property?.address || '',
    zipCode: property?.pincode || '',
    country: property?.country || 'India',
    latitude: property?.latitude,
    longitude: property?.longitude,
  };

  const getStatus = () => {
    if (!enrichedProperty.approved) return 'Pending Verification';
    if (!enrichedProperty.active) return 'Expired';
    if (enrichedProperty.status === 'SOLD') return 'Sold';
    return 'Active';
  };

  const getTags = () => {
    const tags = [];
    if (enrichedProperty.approved) tags.push('Aadhaar Verified');
    if (enrichedProperty.active && enrichedProperty.subscriptionExpiry > new Date().toISOString()) {
      tags.push('Subscription Active');
    } else {
      tags.push('Subscription Expired');
      if (new Date(enrichedProperty.subscriptionExpiry) < new Date()) {
        tags.push('Grace Period Over');
      }
    }
    if (enrichedProperty.status === 'SOLD') tags.push('Sold');
    if (!enrichedProperty.approved) tags.push('Not Aadhaar Verified');
    if (enrichedProperty.featured) tags.push('Featured');
    return tags;
  };

  const handlePrevImage = () => {
    setCurrentImage((prev) => (prev === 0 ? enrichedProperty.imageUrls.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImage((prev) => (prev === enrichedProperty.imageUrls.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (index) => {
    setCurrentImage(index);
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (rating) => {
    setReviewForm((prev) => ({ ...prev, rating }));
  };

  const validateReviewForm = () => {
    const errors = {};
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      errors.rating = 'Please select a rating between 1 and 5';
    }
    if (!reviewForm.comment.trim()) {
      errors.comment = 'Comment is required';
    } else if (reviewForm.comment.length > 500) {
      errors.comment = 'Comment must be 500 characters or less';
    }
    return errors;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const errors = validateReviewForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const token = authState?.user?.token || authState?.token;
    if (!token) {
      setFormErrors({ submit: 'Please log in to submit a review.' });
      navigate('/login');
      return;
    }

    const reviewData = {
      propertyId: id,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
    };

    try {
      await dispatch(createReview({ token, reviewData })).unwrap();
      setReviewForm({ rating: 0, comment: '' });
      setFormErrors({});
      alert('Review submitted successfully!');
      dispatch(getReviewsByProperty({ propertyId: id, token })); // Refresh reviews
    } catch (error) {
      console.error('Review submission error:', { error, reviewData, propertyId: id, token });
      const errorMessage = error?.message || error?.errors?.join(', ') || 'Failed to submit review. Please try again or contact support.';
      setFormErrors({ submit: errorMessage });
    }
  };

  const handleShareClick = () => {
    const shareText = `
🏠 *${enrichedProperty.title}*
📍 Location: ${enrichedProperty.districtName}, ${enrichedProperty.city}, ${enrichedProperty.state}
💰 Price: ₹${typeof enrichedProperty.price === 'number' ? enrichedProperty.price.toLocaleString() : enrichedProperty.price}
🛏️ Bedrooms: ${enrichedProperty.bedrooms}
🛁 Bathrooms: ${enrichedProperty.bathrooms}
🚗 Garage: ${enrichedProperty.garages}
📏 Area: ${enrichedProperty.area} ${enrichedProperty.landAreaPostfix}
🏠 Type: ${enrichedProperty.type}
👤 Owner: ${enrichedProperty.owner.name}
🔗 View more: ${window.location.origin}/property/${id}
    `.trim();

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + enrichedProperty.imageUrls[0])}`;
    window.open(shareUrl, '_blank');
  };

  const recommendedProperties = properties
    ?.filter((p) => p.id !== id && p.status !== 'SOLD')
    .slice(0, 3)
    .map((p) => ({
      ...p,
      imageUrls: p.imageUrls || ['https://via.placeholder.com/740x400'],
      title: p.title || 'Untitled Property',
      price: p.price || 'Price on Request',
      city: p.city || 'Unknown',
      bedrooms: p.bedrooms || 'N/A',
      bathrooms: p.bathrooms || 'N/A',
    })) || [];

  const openGoogleMap = () => {
    if (enrichedProperty.latitude && enrichedProperty.longitude) {
      const googleMapsUrl = `https://www.google.com/maps?q=${enrichedProperty.latitude},${enrichedProperty.longitude}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      alert('Location data is not available for this property.');
    }
  };

  if (propertyLoading) {
    return (
      <div className=" text-center">
        loading....
      </div>
    );
  }

  if ( !propertyLoading && !property) {
    return (
      <div className="property-not-found">
        
     <p>Property not found</p>
         <button className="btn-primary" onClick={() => navigate('/property')}>
          Go Back
        </button> 
      </div>
    );
  }

  const fields = propertyOverviewConfig[property.type] || propertyOverviewConfig.DEFAULT;
  return (
    <ErrorBoundary navigate={navigate}>
      <div className="main-container">
        <div className="property-header">
          <div className="property-left">
            <div className="breadcrumbs">
              <Link to="/"><FaHome /> Home</Link> <span></span> <Link to="/property">Properties</Link> <span></span> {enrichedProperty.title}
            </div>
            <h1 className="property-title">{enrichedProperty.title}</h1>
            <p className="location"><FaMapMarkerAlt /> {enrichedProperty.address}</p>
            <div className="labels">
              {enrichedProperty.featured && <span className="label featured"><FaStar /> Featured</span>}
              <span className="label for-rent">{enrichedProperty.status}</span>
            </div>
          </div>
          <div className="property-price">
            <span className="price"><FaRupeeSign /> {enrichedProperty?.price?.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="main-layout">
          <div className="content-column">
            <div className="image-slider">
              <button className="property-nav left" onClick={handlePrevImage} aria-label="Previous Image">‹</button>
              <img src={enrichedProperty.imageUrls[currentImage]} alt={enrichedProperty.title} className="main-image" />
              <button className="property-nav right" onClick={handleNextImage} aria-label="Next Image">›</button>
              <div className="neartime-price-box">
                {enrichedProperty.price.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}
                <br />
                {enrichedProperty.area && <span className="neartime-price-per">
                  {(enrichedProperty.price / enrichedProperty.area).toFixed(2)} / {enrichedProperty.landAreaPostfix}
                </span>
                }
              </div>
              <div className="landing-overlay-icons">
                {/* <FaExpand className="landing-overlay-icons-i" style={{ fontSize: '30px' }} />
                <FaHeart className="landing-overlay-icons-i" style={{ fontSize: '30px' }} /> */}
                <FaShareAlt
                  className="landing-overlay-icons-i"
                  onClick={handleShareClick}
                  style={{ fontSize: '30px', cursor: 'pointer' }}
                  title="Share Property"
                />
              </div>
            </div>
            <div className="thumbs">
              {enrichedProperty.imageUrls.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className={`thumb ${currentImage === index ? 'active' : ''}`}
                  onClick={() => handleImageClick(index)}
                />
              ))}
            </div>

            {/* Overview Section */}
            <div className="detail-overview-container">
              <div className="detail-overview-top-bar">
                <h2>Overview</h2>
                <span>Property ID: {enrichedProperty.permanentId}</span>
              </div>

              <div className="detail-overview-grid">
                {fields.map(({ key, label, icon, postfix }) =>
                  enrichedProperty[key] ? (
                    <div key={key} className="detail-overview-item">
                      <span>
                        {icon} {enrichedProperty[key]} {postfix || ""}
                      </span>
                      <small>{label}</small>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="description-container">
              <h2>Note</h2>
              <p>{enrichedProperty.note}</p>
            </div>
            <div className="description-container">
              <h2>Description</h2>
              <p>{enrichedProperty.description}</p>
            </div>

            {/* Address Section */}
            <div className="address-section">
              <h2>Address</h2>
              <button onClick={openGoogleMap} className="google-maps-btn" aria-label="Open in Google Maps">
                Open in Google Maps
              </button>
              <div className="address-details">
                <div><strong>Address:</strong> {enrichedProperty.address}</div>
                <div><strong>City:</strong> {enrichedProperty.city}</div>
                <div><strong>State/County:</strong> {enrichedProperty.state}</div>
                <div><strong>Zip/Postal Code:</strong> {enrichedProperty.zipCode}</div>
                <div><strong>Area:</strong> {enrichedProperty.districtName}</div>
                <div><strong>Country:</strong> {enrichedProperty.country}</div>
              </div>
            </div>

            {/* Details Section */}
            <div className="details-section">
              <h2>Details</h2>
              <div className="details-grid">
                <div><strong>Property ID:</strong> <span className="property-id">{enrichedProperty.permanentId}</span></div>
                <div><strong>Price:</strong> {enrichedProperty.price.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}</div>
                <div><strong>Property Size:</strong> {enrichedProperty.area} {enrichedProperty.landAreaPostfix}</div>
                {enrichedProperty.bedrooms && <div><strong>Bedrooms:</strong> {enrichedProperty.bedrooms}</div>}
                {enrichedProperty.bathrooms && <div><strong>Bathroom:</strong> {enrichedProperty.bathrooms}</div>}
                {enrichedProperty.garages && <div><strong>Garage:</strong> {enrichedProperty.garages}</div>}
                {enrichedProperty.garageSize && <div><strong>Garage Size:</strong> {enrichedProperty.garageSize}</div>}
                {enrichedProperty.yearBuilt && <div><strong>Year Built:</strong> {enrichedProperty.yearBuilt}</div>}
                <div><strong>Property Type:</strong> {enrichedProperty.type}</div>
                <div><strong>Property Status:</strong> {enrichedProperty.status}</div>
              </div>
            </div>

            {/* Features Section */}
            <div className="features-section">
              <h2>Features</h2>
              <div className="features-list">
                {enrichedProperty.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <input type="checkbox" checked readOnly />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floor Plans Section */}
            {/* <div className="floor-plans-section">
              <h2>Floor Plans</h2>
              {enrichedProperty.floorPlans.map((plan, index) => (
                <div key={index} className="floor-plan-item">
                  <div className="plan-name">
                    <input type="radio" name="floorPlan" checked={index === 0} readOnly />
                    <span>{plan.name}</span>
                  </div>
                  <div className="plan-details">
                    <span>Size: {plan.size}</span>
                    <span>⁂ {plan.covered}</span>
                    <span>⁂ {plan.open}</span>
                    <span>Price: {plan.price}</span>
                  </div>
                </div>
              ))}
            </div> */}

            {/* Additional Details Section */}
            {/* {enrichedProperty?.additionalDetails &&   <div className="additional detail-section">
              <h2>Additional Details</h2>
              <div className="additional-details-grid">
                <div><strong>Deposit:</strong> {enrichedProperty.additionalDetails.deposit}</div>
                <div><strong>Pool Size:</strong> {enrichedProperty.additionalDetails.poolSize}</div>
                <div><strong>Last Remodel Year:</strong> {enrichedProperty.additionalDetails.lastRemodelYear}</div>
                <div><strong>Amenities:</strong> {enrichedProperty.additionalDetails.amenities}</div>
                <div><strong>Additional Rooms:</strong> Guest Bath</div>
                <div><strong>Equipment:</strong> {enrichedProperty.additionalDetails.additionalRooms.equipment}</div>
              </div>
            </div>
} */}
            {/* Gallery Section */}
            <div className="gallery-section">
              <h2>Gallery</h2>
              <div className="gallery-grid">
                {enrichedProperty.imageUrls.map((img, index) => (
                  <img key={index} src={img} alt={`Gallery ${index + 1}`} />
                ))}
              </div>
            </div>

            {/* Reels Section */}
            <div className="reels-section">
              <h2>Reels ({reels?.length || 0})</h2>
              {(!reels || reels.length === 0) ? (
                <p>No reels available for this property.</p>
              ) : (
                <div className="property-reels-grid">
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      className="reel-card"
                      onClick={() => setSelectedReel(reel)}
                    >
                      {/* If thumbnailUrl is a video preview */}
                      <video
                        src={reel?.videoUrl}
                        className="reel-thumbnail"
                        muted
                        loop
                        playsInline
                      />

                      <div className="reel-card-overlay">
                        <span className="reel-title">{reel.title}</span>
                        <span className="reel-views">{reel.viewCount} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Reel Player Modal */}
            {selectedReel && (
              <div className="reel-overlay" onClick={() => setSelectedReel(null)}>
                <div className="reel-container" onClick={(e) => e.stopPropagation()}>
                  <button className="reel-close-btn" onClick={() => setSelectedReel(null)}>×</button>
                  <video controls autoPlay className="reel-video">
                    <source src={selectedReel.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="reel-info">
                    <h3>{selectedReel.title}</h3>
                    <p>By {selectedReel.owner?.name}</p>
                    <p>{selectedReel.viewCount} views | {selectedReel.likeCount} likes</p>
                  </div>
                </div>
              </div>
            )}


            {/* Video Tour Section */}
            <div className="video-section">
              <h2>Video Tour</h2>
              <div className="video-wrapper">
                <iframe
                  src={enrichedProperty.videoUrl}
                  title="Property Video"
                  frameBorder="0"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                ></iframe>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
              <h2>Reviews</h2>
              {reviewsLoading && <p>Loading reviews...</p>}
              {reviewsError && (
                <p className="error-text">
                  {reviewsError.includes('500') ? 'Server error (500). Please try again later or contact support.' : `Error: ${reviewsError}`}
                </p>
              )}
              {formErrors.reviews && <p className="error-text">{formErrors.reviews}</p>}
              {!reviewsLoading && !reviewsError && Array.isArray(reviews) && reviews.length === 0 ? (
                <p>No reviews yet.</p>
              ) : (
                <div className="reviews-list">
                  {Array.isArray(reviews) ? (
                    reviews.map((review) => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <span>{review.user?.name || 'Anonymous'}</span>
                          <span className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={i < (review.rating || 0) ? 'filled' : ''} />
                            ))}
                          </span>
                        </div>
                        <p>{review.comment || 'No comment provided'}</p>
                        <small>{new Date(review.createdAt || Date.now()).toLocaleDateString()}</small>
                      </div>
                    ))
                  ) : (
                    <p>Invalid reviews data format.</p>
                  )}
                </div>
              )}
              {/* Review Submission Form */}
              <div className="review-form">
                <h3>Submit a Review</h3>
                <form onSubmit={handleReviewSubmit}>
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < reviewForm.rating ? 'filled' : ''}
                          onClick={() => handleRatingChange(i + 1)}
                          style={{ cursor: 'pointer', fontSize: '24px' }}
                        />
                      ))}
                    </div>
                    {formErrors.rating && <span className="error-text">{formErrors.rating}</span>}
                  </div>
                  <div className="form-group">
                    <label>Comment</label>
                    <textarea
                      name="comment"
                      value={reviewForm.comment}
                      onChange={handleReviewChange}
                      placeholder="Share your experience with this property..."
                      maxLength={500}
                    ></textarea>
                    {formErrors.comment && <span className="error-text">{formErrors.comment}</span>}
                  </div>
                  {formErrors.submit && <span className="error-text">{formErrors.submit}</span>}
                  <div className="terms">
                    By submitting this form I agree to <a href="#">Terms of Use</a>
                  </div>
                  <button type="submit" className="submit-btn" disabled={reviewsLoading}>
                    Submit Review
                  </button>
                </form>
              </div>
            </div>
            {/* Recommended Properties Section */}
            <div className="recommended-section">
              <h2>Recommended Properties</h2>
              {recommendedProperties.length === 0 ? (
                <p>No recommended properties available.</p>
              ) : (
                <div className="recommended-grid">
                  {recommendedProperties.map((prop) => (
                    <div key={prop.id} className="recommended-card">
                      <img src={prop.imageUrls[0]} alt={prop.title} className="recommended-image" />
                      <div className="recommended-content">
                        <h3>{prop.title}</h3>
                        <p>{prop.city}</p>
                        <p>{prop.price.toLocaleString('en-US', { style: 'currency', currency: 'INR' })}</p>
                        <p>
                          <FaBed /> {prop.bedrooms} | <FaBath /> {prop.bathrooms}
                        </p>
                        <button className="recommended-btn" onClick={() => navigate(`/property/${prop.id}`)}>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sidebar">
            <Advertisements />
            <div className="agent-info">
              {console.log(enrichedProperty.owner, "---------------------")}
              <img src={enrichedProperty?.owner?.profileImageUrl} onLoad={lazy} title={enrichedProperty?.owner.name} className="agent-photo" />
              <div className="agent-details">
                <div><FaUser /> {enrichedProperty.owner.name}</div>
                <div>{enrichedProperty.owner.role}</div>
                <div className="detail-agent-footer-name">

                  <a href={`tel:${enrichedProperty.owner.phone}`}>
                    <button className="detail-agent-square-btn">
                      <FaPhone />
                    </button>
                  </a>
                  <a href={`https://wa.me/${enrichedProperty.owner.phone}`} target="_blank" rel="noopener noreferrer">
                    <button className="detail-agent-square-btn">
                      <FaWhatsapp />
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-agent-footer" ref={footerRef} style={{ display: isAgentFooterVisible ? 'flex' : 'none' }}>
          <div className="detail-agent-footer-content">
            <div className="detail-agent-footer-name">
              <img src={enrichedProperty?.owner?.profileImageUrl} alt="Agent" />
              <span>{enrichedProperty.owner.name}</span>
              <a href={`tel:${enrichedProperty.owner.phone}`}>
                <button className="detail-agent-square-btn">
                  <FaPhone />
                </button>
              </a>
              <a href={`https://wa.me/${enrichedProperty.owner.phone}`} target="_blank" rel="noopener noreferrer">
                <button className="detail-agent-square-btn">
                  <FaWhatsapp />
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default PropertyDetails;