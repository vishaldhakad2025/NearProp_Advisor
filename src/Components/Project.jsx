
import React, { useState, useEffect } from 'react';
import './Project.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { toastError, toastSuccess } from '../utils/toast';
import LocationStep from './LocationStep';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDistricts } from '../redux/slices/districtSlice';
import { v4 as uuidv4 } from 'uuid';

const API_CONFIG = {
  baseUrl: 'https://api.nearprop.com',
  apiPrefix: 'api',
};
let tokens = localStorage.getItem('token')
console.log("------------------------token token------------", tokens);

function Project() {
  const location = useLocation();
  const [token, setToken] = useState(tokens);
  const { property, isEditMode = false } = location.state || {};
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const districtsState = useSelector((state) => state.districts.districts);
  const districts = districtsState?.list || [];

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    status: '',
    label: '',
    price: '',
    rentPrice: '',
    enablePricePlaceholder: false,
    pricePrefix: '',
    afterPrice: '',
    secondPrice: '',
    mediaFiles: [],
    videoUrl: '', // Keep this for potential URL input (if API supports it)
    video: null,
    bedrooms: 0,
    bathrooms: 0,
    area: '',
    sizePostfix: '',
    landArea: '',
    landAreaPostfix: '',
    garages: 0,
    garageSize: '',
    yearBuilt: '',
    placeName: '',
    availability: '',
    securityFeatures: [],
    streetNumber: '',
    renovated: '',
    luxuriousFeatures: [],
    amenities: [],
    additionalDetails: [{ title: '', value: '' }],
    features: [],
    unitType: '',
    unitCount: 0,
    stock: 0,
    note: '',
    privateNote: '',
    map: {
      latitude: '',
      longitude: '',
      address: '',
      state: '',
      city: '',
      area: '',
      pincode: '',
      districtId: '',
    },
    virtualTour: '',
  });
  const [existingMedia, setExistingMedia] = useState([]);
  const [existingFloorPlanImages, setExistingFloorPlanImages] = useState([]);
  const [subListings, setSubListings] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [deletedMedia, setDeletedMedia] = useState([]);
  const [deletedVideo, setDeletedVideo] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [errors, setErrors] = useState({});

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 2MB
  const MAX_video_SIZE = 10 * 1024 * 1024; // 5mb
  const MAX_MEDIA_FILES = 5;
  // console.log("------------------------token------------", token);  
  useEffect(() => {
    dispatch(fetchDistricts());
  }, [dispatch]);
  useEffect(() => {
    // Get token on mount
    const savedToken = localStorage.getItem("token") || token;
    if (savedToken) {
      setToken(savedToken);
    } else {
      console.warn("⚠️ No token found in localStorage");
      // If no token, maybe redirect to login
      navigate("/login");
    }
  }, [navigate]);

  // console.log(property, isEditMode);
  // Pre-populate form in edit mode
  useEffect(() => {
    if (isEditMode && property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        type: property.type || '',
        status: property.status || '',
        label: property.label || '',
        price: property.price || '',
        rentPrice: property.rentPrice || '',
        enablePricePlaceholder: property.enablePricePlaceholder || false,
        pricePrefix: property.pricePrefix || '',
        afterPrice: property.afterPrice || '',
        secondPrice: property.secondPrice || '',
        mediaFiles: [],
        videoUrl: property.videoUrl || '',
        video: null,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        area: property.area || '',
        sizePostfix: property.sizePostfix || '',
        landArea: property.landArea || '',
        landAreaPostfix: property.landAreaPostfix || '',
        garages: property.garages || 0,
        garageSize: property.garageSize || '',
        yearBuilt: property.yearBuilt || '',
        placeName: property.placeName || '',
        availability: property.availability || '',
        securityFeatures: property.securityFeatures || [],
        streetNumber: property.streetNumber || '',
        renovated: property.renovated || '',
        luxuriousFeatures: property.luxuriousFeatures || [],
        amenities: property.amenities || [],
        additionalDetails:
          Object.entries(property.additionalDetails || {}).map(([title, value]) => ({
            title,
            value,
          })) || [{ title: '', value: '' }],
        features: property.features || [],
        unitType: property.unitType || '',
        unitCount: property.unitCount || 0,
        stock: property.stock || 0,
        note: property.note || '',
        privateNote: property.privateNote || '',
        map: {
          latitude: property.latitude || '',
          longitude: property.longitude || '',
          address: property.address || '',
          state: property.state || '',
          city: property.city || '',
          area: property.area || '',
          pincode: property.pincode || '',
          districtId: property.districtId || '',
        },
        virtualTour: property.virtualTour || '',
      });
      setExistingMedia(property.imageUrls || []);
      setExistingFloorPlanImages(property.floorPlans?.map((plan) => plan.planImage || '') || []);
      setSubListings(property.subListings || []);
      setFloorPlans(
        property.floorPlans?.map((plan) => ({
          floorPlanTitle: plan.floorPlanTitle || '',
          floorBedrooms: plan.floorBedrooms || 0,
          floorBathrooms: plan.floorBathrooms || 0,
          floorPrice: plan.floorPrice || '',
          floorPricePostfix: plan.floorPricePostfix || '',
          planSize: plan.planSize || '',
          planImage: null,
          planDescription: plan.planDescription || '',
          existingImageUrl: plan.planImage || '',
        })) || []
      );
      setGdprConsent(true);
      setDeletedVideo(null);
    }
  }, [isEditMode, property]);

  // Validation function that returns errors and missing fields
  const validateForm = (currentStep, showToast = false) => {
    const newErrors = {};
    const missingFields = [];

    if (currentStep >= 1) {
      if (!formData.title) {
        newErrors.title = 'Property title is required';
        missingFields.push('Property Title');
      }
      if (!formData.description) {
        newErrors.description = 'Description is required';
        missingFields.push('Description');
      }
      if (!formData.type) {
        newErrors.type = 'Property type is required';
        missingFields.push('Type');
      }
      if (!formData.status) {
        newErrors.status = 'Status is required';
        missingFields.push('Status');
      }
      if (!formData.price) {
        newErrors.price = 'Price is required';
        missingFields.push('Price');
      }
      if (!formData.area) {
        newErrors.area = 'Area is required';
        missingFields.push('Area');
      }
      if (['APARTMENT', 'VILLA', 'HOUSE', 'STUDIO', 'PG_HOSTEL', 'SINGLE_FAMILY_HOME', 'MULTI_FAMILY_HOME'].includes(formData.type)) {
        if (formData.bedrooms <= 0) {
          newErrors.bedrooms = 'At least one bedroom is required';
          missingFields.push('Bedrooms');
        }
        if (formData.bathrooms <= 0) {
          newErrors.bathrooms = 'At least one bathroom is required';
          missingFields.push('Bathrooms');
        }
      }
    }

    if (currentStep >= 2) {
      if (!formData.placeName) {
        newErrors.placeName = 'Nearby landmark is required';
        missingFields.push('Nearby Landmark');
      }
    }

    if (currentStep >= 3) {
      if (!isEditMode && formData.mediaFiles.length === 0 && existingMedia.length === 0) {
        newErrors.mediaFiles = 'At least one media file is required';
        missingFields.push('Media Files');
      }
    }

    if (currentStep >= 5) {
      if (!formData.map.districtId) {
        newErrors.districtId = 'District is required';
        missingFields.push('District');
      }
      if (!formData.map.latitude || !formData.map.longitude) {
        newErrors.location = 'Please select a location on the map or via search';
        missingFields.push('Location');
      }
      if (!formData.map.address) {
        newErrors.address = 'Address is required';
        missingFields.push('Address');
      }
      if (!formData.map.city) {
        newErrors.city = 'City is required';
        missingFields.push('City');
      }
    }

    // setErrors(newErrors);
    if (showToast && missingFields.length > 0) {
      toastError(`Please fill the following required fields: ${missingFields.join(', ')}`);
    }
    return Object.keys(newErrors).length === 0;
  };

  // Handle stepper click
  const handleStepClick = (stepIndex) => {
    if (validateForm(stepIndex, true)) {
      setStep(stepIndex);
    }
  };

  // Handle Next button click
  const handleNext = (val) => {
    if (validateForm(step, true)) {
      setStep(val);
    }
  };

  // Handle input changes and clear errors
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const fileArray = Array.from(files);
      if (name === 'mediaFiles') {
        if (fileArray.length + existingMedia.length > MAX_MEDIA_FILES) {
          setErrors((prev) => ({
            ...prev,
            mediaFiles: `Cannot upload more than ${MAX_MEDIA_FILES} files (including existing).`,
          }));
          toastError(`Cannot upload more than ${MAX_MEDIA_FILES} files (including existing).`);
          return;
        }
        for (const file of fileArray) {
          if (file.size > MAX_FILE_SIZE) {
            setErrors((prev) => ({ ...prev, mediaFiles: `File ${file.name} exceeds 5MB limit.` }));
            toastError(`File ${file.name} exceeds 5MB limit.`);
            return;
          }
        }
        setFormData((prev) => ({ ...prev, mediaFiles: fileArray }));
        setErrors((prev) => ({ ...prev, mediaFiles: '' }));
      }
      else if (name == 'video') {
        const file = files[0];
        if (file) {
          if (file.size > MAX_video_SIZE) {
            setErrors((prev) => ({ ...prev, video: `Video file ${file.name} exceeds 5MB limit.` }));
            toastError(`Video file ${file.name} exceeds 5MB limit.`);
            return;
          }
          setFormData((prev) => ({ ...prev, video: file }));
          setErrors((prev) => ({ ...prev, video: '' }));
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Re-validate form silently to update button state
    validateForm(step, false);
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    validateForm(step, false);
  };

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    validateForm(step, false);
  };

  const handleCounter = (field, delta) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    validateForm(step, false);
  };

  const handleAdditionalDetailChange = (index, field, value) => {
    setFormData((prev) => {
      const newDetails = [...prev.additionalDetails];
      newDetails[index][field] = value;
      return { ...prev, additionalDetails: newDetails };
    });
    validateForm(step, false);
  };

  const handleAddAdditionalDetail = () => {
    setFormData((prev) => ({
      ...prev,
      additionalDetails: [...prev.additionalDetails, { title: '', value: '' }],
    }));
  };

  const handleRemoveExistingMedia = (index) => {
    setDeletedMedia((prev) => [...prev, existingMedia[index]]);
    setExistingMedia((prev) => prev.filter((_, i) => i !== index));
    validateForm(step, false);
  };
  // console.log('-==============//////////////////////////////////////////formatData in Project:', formData.mediaFiles, existingMedia);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gdprConsent) {
      setSubmissionStatus('Please consent to GDPR agreement before submitting.');
      toastError('Please consent to GDPR agreement before submitting.');
      return;
    }
    if (!token) {
      setSubmissionStatus('Authentication token missing. Please log in.');
      toastError('Authentication token missing. Please log in.');
      return;
    }
    // if (!validateForm(5, true)) {
    //   setStep(1);
    //   setSubmissionStatus('Please fill in all required fields correctly.');
    //   return;
    // }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      const flatFields = [
        'title', 'description', 'type', 'status', 'label', 'price', 'rentPrice',
        'enablePricePlaceholder', 'pricePrefix', 'afterPrice', 'secondPrice',
        'bedrooms', 'bathrooms', 'area', 'sizePostfix', 'landArea', 'landAreaPostfix',
        'garages', 'garageSize', 'yearBuilt', 'placeName', 'availability',
        'streetNumber', 'renovated', 'unitType', 'unitCount', 'stock',
        'note', 'privateNote', 'virtualTour'
      ];

      flatFields.forEach((field) => {
        if (formData[field] !== undefined && formData[field] !== null) {
          formDataToSend.append(field, formData[field]);
        }
      });

      formDataToSend.append('agreementAccepted', gdprConsent);
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));
      formDataToSend.append('features', JSON.stringify(formData.features));
      formDataToSend.append('securityFeatures', JSON.stringify(formData.securityFeatures));
      formDataToSend.append('luxuriousFeatures', JSON.stringify(formData.luxuriousFeatures));

      const additionalDetailsObject = formData.additionalDetails.reduce((acc, item) => {
        if (item.title && item.value) {
          acc[item.title.trim()] = item.value.trim();
        }
        return acc;
      }, {});
      formDataToSend.append('additionalDetails', JSON.stringify(additionalDetailsObject));

      if (formData.map) {
        const mapFields = ['latitude', 'longitude', 'address', 'state', 'city', 'area', 'pincode', 'districtId'];
        mapFields.forEach((key) => {
          if (formData.map[key] !== undefined && formData.map[key] !== null) {
            formDataToSend.append(key, formData.map[key]);
          }
        });
      }

      // console.log('/////////////////////////////////////////Media files to upload:', formData.mediaFiles);
      if (formData.mediaFiles.length > 0) {
        formData.mediaFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });
      }

      if (isEditMode) {
        formDataToSend.append('existingImages', JSON.stringify(existingMedia));
        formDataToSend.append('deletedImages', JSON.stringify(deletedMedia));
      }

      // In handleSubmit function (around line 300)
      if (formData.video) { // [CHANGE]: Append video file
        formDataToSend.append('video', formData.video);
        console.log("------------------------video", formData.video)
      }
      // [CHANGE]: Optionally keep videoUrl if the API supports it
      if (formData.videoUrl) {
        formDataToSend.append('videoUrl', formData.videoUrl);
      }

      if (subListings.length > 0) {
        formDataToSend.append('subListings', JSON.stringify(subListings));
      }

      if (floorPlans.length > 0) {
        floorPlans.forEach((plan, index) => {
          formDataToSend.append(`floorPlans[${index}][floorPlanTitle]`, plan.floorPlanTitle);
          formDataToSend.append(`floorPlans[${index}][floorBedrooms]`, plan.floorBedrooms);
          formDataToSend.append(`floorPlans[${index}][floorBathrooms]`, plan.floorBathrooms);
          formDataToSend.append(`floorPlans[${index}][floorPrice]`, plan.floorPrice);
          formDataToSend.append(`floorPlans[${index}][floorPricePostfix]`, plan.floorPricePostfix);
          formDataToSend.append(`floorPlans[${index}][planSize]`, plan.planSize);
          formDataToSend.append(`floorPlans[${index}][planDescription]`, plan.planDescription);
          if (plan.planImage) {
            formDataToSend.append(`floorPlans[${index}][planImage]`, plan.planImage);
          }
          if (plan.existingImageUrl) {
            formDataToSend.append(`floorPlans[${index}][existingImageUrl]`, plan.existingImageUrl);
          }
        });
      }

      if (isEditMode && property?.id) {
        formDataToSend.append('propertyId', property.id);
      }

      const url = isEditMode
        ? `${API_CONFIG.baseUrl}/${API_CONFIG.apiPrefix}/property-updates`
        : `${API_CONFIG.baseUrl}/${API_CONFIG.apiPrefix}/properties/form`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
        credentials: 'include',
      });

      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { message: await response.text() };
      }

      if (!response.ok) {
        let errorMessage = `Failed to ${isEditMode ? 'update' : 'submit'}: ${response.status} ${response.statusText}`;
        if (response.status === 413) {
          errorMessage = 'Request too large. Please reduce the size or number of uploaded files (max 5 files, 2MB each).';
        } else if (response.status === 400 && responseData.message) {
          if (responseData.message.includes('maximum number of properties') || responseData.message.includes('subscription plan')) {
            errorMessage = 'You’ve reached your subscription plan property limit.';
          } else {
            errorMessage = responseData.message;
          }
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
        }
        throw new Error(errorMessage);
      }

      setSubmissionStatus(isEditMode ? 'Property updated successfully. Waiting for admin approval' : 'Property submitted successfully!');
      toastSuccess(isEditMode ? 'Property updated successfully. Waiting for admin approval.' : 'Property submitted successfully!');

      if (!isEditMode) {
        setFormData({
          title: '',
          description: '',
          type: '',
          status: '',
          label: '',
          price: '',
          rentPrice: '',
          enablePricePlaceholder: false,
          pricePrefix: '',
          afterPrice: '',
          secondPrice: '',
          mediaFiles: [],
          videoUrl: '',
          bedrooms: 0,
          bathrooms: 0,
          area: '',
          sizePostfix: '',
          landArea: '',
          landAreaPostfix: '',
          garages: 0,
          garageSize: '',
          yearBuilt: '',
          placeName: '',
          availability: '',
          securityFeatures: [],
          streetNumber: '',
          renovated: '',
          luxuriousFeatures: [],
          amenities: [],
          additionalDetails: [{ title: '', value: '' }],
          features: [],
          unitType: '',
          unitCount: 0,
          stock: 0,
          note: '',
          privateNote: '',
          map: {
            latitude: '',
            longitude: '',
            address: '',
            state: '',
            city: '',
            area: '',
            pincode: '',
            districtId: '',
          },
          virtualTour: '',
        });
        setSubListings([]);
        setFloorPlans([]);
        setExistingMedia([]);
        setExistingFloorPlanImages([]);
        setDeletedMedia([]);
        setGdprConsent(false);
        setErrors({});
        setStep(1);
      }
      navigate('/Property');
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error.message.includes('Failed to fetch')
        ? 'Network issue. Please check your connection "Try Again Please".'
        : error.message;
      setSubmissionStatus(errorMessage);
      toastError(`Submission failed: ${errorMessage} try again `);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOptionForm = (field, values, setVisible) => (
    <div className="modal-overlay">
      <div className="modal-box">
        {values.map((item) => (
          <label key={item} className="modal-option">
            <input
              type="checkbox"
              name={field}
              value={item}
              checked={formData[field].includes(item)}
              onChange={() => handleCheckboxChange(field, item)}
              aria-label={`Select ${item} for ${field}`}
            />
            {item.replace(/_/g, ' ')}
          </label>
        ))}
        <div className="modal-actions">
          <button onClick={() => setVisible(false)} aria-label="Cancel selection">Cancel</button>
          <button onClick={() => setVisible(false)} aria-label="Confirm selection">OK</button>
        </div>
      </div>
    </div>
  );

  const handleRemoveFeature = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== value),
    }));
    validateForm(step, false);
  };

  const featuresByType = {
    PLOT: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'BOUNDARY_WALL', 'ROAD_ACCESS'],
    APARTMENT: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'WIFI', 'BALCONY', 'MODULAR_KITCHEN', 'HARDWOOD_FLOORS', 'AIR_CONDITIONING', 'GYM', 'LAUNDRY', 'LIFT'],
    VILLA: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'WIFI', 'BALCONY', 'MODULAR_KITCHEN', 'SWIMMING_POOL', 'LAWN', 'BARBEQUE', 'GARAGE'],
    HOUSE: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'WIFI', 'BALCONY', 'MODULAR_KITCHEN', 'HARDWOOD_FLOORS', 'AIR_CONDITIONING', 'LAWN', 'GARAGE'],
    SHOP: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'WIFI', 'WASHROOM', 'STORAGE', 'SHUTTER'],
    LAND: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'IRRIGATION', 'ROAD_ACCESS'],
    OFFICE_SPACE: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'WIFI', 'MEETING_ROOM', 'PANTRY', 'LIFT', 'FURNISHED'],
    WAREHOUSE: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'LOADING_DOCK', 'STORAGE', 'FIRE_SAFETY'],
    MULTI_FAMILY_HOME: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'WIFI', 'BALCONY', 'GARAGE', 'STORAGE', 'SEPARATE_METERS'],
    STUDIO: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'MODULAR_KITCHEN', 'FURNISHED', 'WIFI'],
    PG_HOSTEL: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN', 'WIFI', 'CANTEEN', 'LAUNDRY', 'SHARED_KITCHEN', 'SECURITY'],
    DEFAULT: ['PARKING', 'SECURITY', 'WATER_SUPPLY', 'ELECTRICITY_CONNECTION', 'GARDEN'],
  };

  return (
    <div className="add-property-page">
      <div className="property-management-container">
        <h2 className="add-property-heading">{isEditMode ? 'Edit Property' : 'Add Property'}</h2>
        <div className="progress-bar">
          <div style={{ width: `${(step / 5) * 100}%` }} className="progress-fill"></div>
        </div>
        <form onSubmit={handleSubmit} className="property-container animate-slide-up">
          <div className="stepper-header">
            {['Basic Details', 'Property Details', 'Media Upload', 'Features', 'Location'].map((label, i) => (
              <div
                key={i}
                className={`stepper-item ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}
                onClick={() => handleStepClick(i + 1)}
              >
                <div className="step-circle">{i + 1}</div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="form-step animated-step">
              <h2>Basic Details</h2>

              <div className="property-management-form-group">
                <label>
                  Property Title <span className="required-field">*</span>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g., Luxurious 3 BHK Apartment"
                    value={formData.title}
                    onChange={handleChange}
                    className={errors.title ? 'error-filed' : ''}
                    required
                    aria-label="Property Title"
                  />
                  {errors.title && <span className="error-message-filed">{errors.title}</span>}
                </label>
              </div>
              <div className="property-management-form-group">
                <label>
                  Property Description <span className="required-field">*</span>
                  <textarea
                    name="description"
                    placeholder="e.g., Spacious apartment with modern amenities..."
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className={errors.description ? 'error-filed' : ''}
                    required
                    aria-label="Property Description"
                  />
                  {errors.description && <span className="error-message-filed">{errors.description}</span>}
                </label>
              </div>
              <div className="detail-row">
                <div className="dropdown-section">
                  <label>
                    Type <span className="required-field">*</span>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={(e) => handleSelectChange('type', e.target.value)}
                      className={errors.type ? 'error-filed type-select' : 'type-select'}
                      required
                      disabled={isEditMode}
                      aria-label="Property Type"
                    >
                      <option value="">Select Property Type</option>
                      {[
                        'COMMERCIAL', 'OFFICE_SPACE', 'SHOP', 'WAREHOUSE',
                        'APARTMENT', 'MULTI_FAMILY_HOME',
                        'SINGLE_FAMILY_HOME', 'STUDIO', 'VILLA', 'HOUSE',
                        'PLOT', 'FARMLAND', 'LAND'
                      ].map((option) => (
                        <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                      ))}
                    </select>
                    {errors.type && <span className="error-message-filed">{errors.type}</span>}
                  </label>
                </div>
                <div className="dropdown-section">
                  <label>
                    Status <span className="required-field">*</span>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={(e) => handleSelectChange('status', e.target.value)}
                      className={errors.status ? 'error-filed type-select' : 'type-select'}
                      required
                      disabled={isEditMode}
                      aria-label="Property Status"
                    >
                      <option value="">Select Status</option>
                      {['FOR_RENT', 'FOR_SALE'].map((option) => (
                        <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                      ))}
                    </select>
                    {errors.status && <span className="error-message-filed">{errors.status}</span>}
                  </label>
                </div>
                <div className="dropdown-section">
                  <label>
                    Label
                    <select
                      name="label"
                      value={formData.label}
                      className={errors.label ? 'error-filed type-select' : 'type-select'}
                      onChange={(e) => handleSelectChange('label', e.target.value)}
                      aria-label="Property Label"
                    >
                      <option value="">Select Label</option>
                      {['GOLDEN_OFFER', 'HOT_OFFER',"PREMIUM"].map((option) => (
                        <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>


              <div className="detail-row">
                <div className="property-management-form-group">
                  <label>
                    Price <span className="required-field">*</span>
                    <input
                      type="number"
                      name="price"
                      placeholder="e.g., 5000000 (in INR)"
                      value={formData.price}
                      onChange={handleChange}
                      className={errors.price ? 'error-filed' : ''}
                      required
                      min="0"

                      aria-label="Property Price"
                    />
                    {errors.price && <span className="error-message-filed">{errors.price}</span>}
                  </label>
                </div>
                <div className="property-management-form-group">
                  <label>
                    Second Price (optional)
                    <input
                      type="number"
                      name="secondPrice"
                      placeholder="e.g., 4500000 (in INR)"
                      value={formData.secondPrice}
                      onChange={handleChange}
                      min="0"
                      aria-label="Second Price"
                    />
                  </label>
                </div>
              </div>

              {['APARTMENT', 'VILLA', 'HOUSE', 'STUDIO', 'PG_HOSTEL', 'SINGLE_FAMILY_HOME', 'MULTI_FAMILY_HOME'].includes(formData.type) && (

                <div className="detail-row">
                  <div className="property-management-form-group">
                    <label>
                      Bedrooms <span className="required-field">*</span>
                      <div className="counter-control">
                        <button type="button" onClick={() => handleCounter('bedrooms', -1)} aria-label="Decrease Bedrooms">-</button>
                        <input type="number" name="bedrooms" value={formData.bedrooms} readOnly aria-label="Number of Bedrooms" />
                        <button type="button" onClick={() => handleCounter('bedrooms', 1)} aria-label="Increase Bedrooms">+</button>
                      </div>
                      {errors.bedrooms && <span className="error-message-filed">{errors.bedrooms}</span>}
                    </label>
                  </div>
                  <div className="property-management-form-group">
                    <label>
                      Bathrooms <span className="required-field">*</span>
                      <div className="counter-control">
                        <button type="button" onClick={() => handleCounter('bathrooms', -1)} aria-label="Decrease Bathrooms">-</button>
                        <input type="number" name="bathrooms" value={formData.bathrooms} readOnly aria-label="Number of Bathrooms" />
                        <button type="button" onClick={() => handleCounter('bathrooms', 1)} aria-label="Increase Bathrooms">+</button>
                      </div>
                      {errors.bathrooms && <span className="error-message-filed">{errors.bathrooms}</span>}
                    </label>
                  </div>
                </div>

              )}

              <div className="detail-row">
                <div className="property-management-form-group">
                  <label>
                    Area <span className="required-field">*</span>
                    <input
                      type="number"
                      name="area"
                      placeholder="e.g., 1200"
                      value={formData.area}
                      onChange={handleChange}
                      className={errors.area ? 'error-filed' : ''}
                      required
                      disabled={isEditMode}
                      min="0"
                      aria-label="Property Area"
                    />
                    {errors.area && <span className="error-message-filed">{errors.area}</span>}
                  </label>
                </div>
                <div className="property-management-form-group">
                  <label>
                    Area Unit
                    <select name="sizePostfix" disabled={isEditMode} value={formData.sizePostfix} onChange={handleChange} aria-label="Area Unit">
                      <option value="">Select Unit</option>
                      <option value="sqft">Sq. Ft.</option>
                      <option value="sqmt">Sq. M.</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-navigation">
                <button
                  type="button"
                  onClick={() => handleNext(2)}
                  disabled={!validateForm(1, false)}
                  aria-label="Next Step"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <div className="form-step animated-step">
              <h2>Property Details</h2>

              <div className="property-management-form-group">
                <label>
                  Nearby Landmark <span className="required-field">*</span>
                  <input
                    type="text"
                    name="placeName"
                    placeholder="e.g., Near City Mall"
                    value={formData.placeName}
                    onChange={handleChange}
                    className={errors.placeName ? 'error-filed' : ''}
                    required
                    aria-label="Nearby Landmark"
                  />
                  {errors.placeName && <span className="error-message-filed">{errors.placeName}</span>}
                </label>
              </div>

              <div className="property-management-form-group">
                <label>
                  Public Note
                  <textarea
                    name="note"
                    rows="4"
                    placeholder="e.g., Perfect for a family..."
                    value={formData.note}
                    onChange={handleChange}
                    aria-label="Public Note"
                  />
                </label>
              </div>
              {['APARTMENT', 'VILLA', 'HOUSE', 'STUDIO'].includes(formData.type) && (
                <>
                  <div className="detail-row">
                    {/* <div className="property-management-form-group">
                        <label>
                          Garages
                          <div className="counter-control">
                            <button type="button" onClick={() => handleCounter('garages', -1)} aria-label="Decrease Garages">-</button>
                            <input type="number" name="garages" value={formData.garages} readOnly aria-label="Number of Garages" />
                            <button type="button" onClick={() => handleCounter('garages', 1)} aria-label="Increase Garages">+</button>
                          </div>
                        </label>
                      </div> */}


                    <div className="property-management-form-group">
                      <label>
                        Garage Size
                        <input
                          type="number"
                          name="garageSize"
                          placeholder="e.g., 400"
                          value={formData.garageSize}
                          onChange={handleChange}
                          min="0"
                          aria-label="Garage Size"
                        />
                      </label>
                    </div>
                    <div className="property-management-form-group">
                      <label>
                        Area Unit
                        <select name="sizePostfix" disabled={isEditMode} value={formData.sizePostfix} onChange={handleChange} aria-label="Area Unit">
                          <option value="">Select Unit</option>
                          <option value="sqft">Sq. Ft.</option>
                          <option value="sqmt">Sq. M.</option>
                        </select>
                      </label>
                    </div>


                    <div className="property-management-form-group">
                      <label>
                        Year Built
                        <input
                          type="number"
                          name="yearBuilt"
                          placeholder="e.g., 2020"
                          value={formData.yearBuilt}
                          onChange={handleChange}
                          min="1800"
                          max={new Date().getFullYear()}
                          aria-label="Year Built"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="property-management-form-group">
                    <label>
                      Street / Building Number
                      <input
                        type="text"
                        name="streetNumber"
                        placeholder="e.g., 123A"
                        value={formData.streetNumber}
                        onChange={handleChange}
                        aria-label="Street or Building Number"
                      />
                    </label>
                  </div>
                  <div className="property-management-form-group">
                    <label>
                      Renovated
                      <select name="renovated" value={formData.renovated} onChange={handleChange} aria-label="Renovation Status">
                        <option value="">Select Renovation Status</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="no_idea">No Idea</option>
                      </select>
                    </label>
                  </div>
                  {formData.additionalDetails.map((item, index) => (
                    <div key={index} className="detail-row">
                      <div className="property-management-form-group">
                        <input
                          type="text"
                          placeholder="e.g., Parking"
                          value={item.title}
                          onChange={(e) => handleAdditionalDetailChange(index, 'title', e.target.value)}
                          aria-label={`Additional Detail Title ${index + 1}`}
                        />
                      </div>
                      <div className="property-management-form-group">
                        <input
                          type="text"
                          placeholder="e.g., 2 Cars"
                          value={item.value}
                          onChange={(e) => handleAdditionalDetailChange(index, 'value', e.target.value)}
                          aria-label={`Additional Detail Value ${index + 1}`}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddAdditionalDetail}
                    className="add-more-btn"
                    aria-label="Add New Detail"
                  >
                    Add New
                  </button>
                </>
              )}

              <div className="form-navigation">
                <button type="button" onClick={() => setStep(1)} aria-label="Previous Step">Back</button>
                <button
                  type="button"
                  onClick={() => handleNext(3)}
                  disabled={!validateForm(2, false)}
                  aria-label="Next Step"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Media Upload */}
          {step === 3 && (
            <div className="form-step animated-step">
              <h2>Media Upload</h2>
              {isEditMode && existingMedia.length > 0 && (
                <div className="existing-media">

                  <div className="media-list">
                    {existingMedia.map((media, index) => (
                      <div key={index} className="media-item">
                        <img src={media} alt={`Existing media ${index + 1}`} style={{ maxWidth: '100px', maxHeight: '100px' }} />
                        <button
                          type="button"
                          className="remove-option"
                          onClick={() => handleRemoveExistingMedia(index)}
                          aria-label={`Remove media ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p>{formData.mediaFiles.length + existingMedia.length}/{MAX_MEDIA_FILES} files selected</p>
              {errors.mediaFiles && <span className="error-message-filed">{errors.mediaFiles}</span>}

              <div className="property-management-form-group">
                <label>
                  Upload Media <span className="required-field">*</span> {"(5MB limit)"}
                  <input
                    type="file"
                    name="mediaFiles"
                    accept="image/*,video/*"

                    multiple
                    onChange={handleChange}
                    aria-label="Upload Media Files"
                  />
                </label>
              </div>
              {/* {(isEditMode && formData.videoUrl) || formData.video ? (
                <div className="existing-media">
                  <h3>Video Preview</h3>
                  <div className="media-list">
                    <div className="media-item">
                      <video
                        src={formData.video ? URL.createObjectURL(formData.video) : formData.videoUrl}
                        controls
                        style={{ maxWidth: '280px', maxHeight: '200px' }}
                        alt="Video preview"
                      />
                     
                    </div>
                  </div>
                </div>
              ) : null} */}

              {/* <div className="property-management-form-group">
                <label>
                  Video File
                  <input
                    type="file"
                    name="video"
                    disabled={isEditMode}
                    accept="video/*" 
                    onChange={handleChange}
                    // [CHANGE]: Removed value={formData.vodeo} as file inputs don't use value
                    aria-label="Upload Video File"
                  />
                </label>
              </div> */}
              <div className="form-navigation">
                <button type="button" onClick={() => setStep(2)} aria-label="Previous Step">Back</button>
                <button
                  type="button"
                  onClick={() => handleNext(4)}
                  disabled={!validateForm(3, false)}
                  aria-label="Next Step"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Features */}
          {step === 4 && (
            <div className="form-step animated-step">
              <h2>Property Features of <span className="animated-step-type">{formData.type.replace(/_/g, ' ').toLowerCase()}</span></h2>
              <div className="features-list">
                {(featuresByType[formData.type] || featuresByType.DEFAULT).map((feature) => (
                  <label key={feature} className="features-list">
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleCheckboxChange('features', feature)}
                      aria-label={`Feature ${feature.replace(/_/g, ' ')}`}
                    />
                    {feature.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
              <div className="form-navigation">
                <button type="button" onClick={() => setStep(3)} aria-label="Previous Step">Back</button>
                <button
                  type="button"
                  onClick={() => handleNext(5)}
                  disabled={!validateForm(4, false)}
                  aria-label="Next Step"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Location & Submission */}
          {step === 5 && (
            <div className="form-step animated-step">
              <LocationStep
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                districts={districts}
                prevStep={() => setStep(4)}
                nextStep={handleSubmit}
                handleChange={handleChange}
                setErrors={setErrors}
                isEditMode={isEditMode}
                validateForm={(showToast) => validateForm(5, showToast)}
              />
              <div className="gdpr-section d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  id="gdpr"
                  className='gdpr-inp'
                  checked={gdprConsent}
                  onChange={(e) => {
                    setGdprConsent(e.target.checked);
                    validateForm(5, false);
                  }}
                  aria-label="GDPR Consent"
                />
                <label htmlFor="gdpr">
                  I consent to having the website store my submitted information.
                </label>
              </div>
              {errors.location && <span className="error-message-filed">{errors.location}</span>}
              {submissionStatus && (
                <p className={submissionStatus.includes('success') ? 'text-green-600' : 'text-red-600'}>
                  {submissionStatus}
                </p>
              )}
              <div className="form-navigation">
                <button type="button" onClick={() => setStep(4)} aria-label="Previous Step">Back</button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting || !gdprConsent || !validateForm(5, false)}
                  aria-label="Submit Property"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Project;