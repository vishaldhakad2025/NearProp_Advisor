import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchDistricts } from '../redux/slices/districtSlice';
import { toastError } from '../utils/toast';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyAepBinSy2JxyEvbidFz_AnFYFsFlFqQo4";
const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const LocationStep = ({ formData, setFormData, errors, districts, isEditMode, handleChange, setErrors }) => {
  const [marker, setMarker] = useState(
    formData.map.latitude && formData.map.longitude
      ? { lat: parseFloat(formData.map.latitude), lng: parseFloat(formData.map.longitude) }
      : null
  );
  const [mapUrl, setMapUrl] = useState('');
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const dispatch = useDispatch();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  useEffect(() => {
    dispatch(fetchDistricts());
  }, [dispatch]);

  // Parse Google Maps URL
  const parseGoogleMapsUrl = (url) => {
    if (!url) {
      setErrors((prev) => ({ ...prev, mapUrl: '' }));
      return;
    }
    try {
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = url.match(regex);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        setMarker({ lat, lng });
        reverseGeocode(lat, lng);
        setErrors((prev) => ({ ...prev, mapUrl: '' }));
      } else {
        setErrors((prev) => ({ ...prev, mapUrl: 'Invalid Google Maps URL' }));
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, mapUrl: 'Error parsing URL' }));
    }
  };

  const reverseGeocode = useCallback(
    (lat, lng) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const addressComponents = results[0].address_components;
          let city = '';
          let state = '';
          let pincode = '';
          let districtName = '';

          addressComponents.forEach((comp) => {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
            if (comp.types.includes('postal_code')) pincode = comp.long_name;
            if (comp.types.includes('administrative_area_level_2')) districtName = comp.long_name;
          });

          let matchedDistrict = districts.find((d) => d.name.toLowerCase() === districtName.toLowerCase());
          if (!matchedDistrict) {
            matchedDistrict = districts.find((d) => districtName.toLowerCase().includes(d.name.toLowerCase()));
          }
          if (!matchedDistrict) {
            matchedDistrict = districts.find((d) => d.name.toLowerCase().includes(districtName.toLowerCase()));
          }

          setFormData((prev) => ({
            ...prev,
            map: {
              ...prev.map,
              address: results[0].formatted_address,
              city,
              state,
              pincode,
              districtId: matchedDistrict ? matchedDistrict.id : prev.map.districtId,
              latitude: lat.toString(),
              longitude: lng.toString(),
            },
          }));
          setErrors((prev) => ({ ...prev, location: '', address: '', city: '', districtId: '' }));
        }
      });
    },
    [setFormData, districts]
  );

  const handleMapClick = useCallback(
    (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
      setMapUrl('');
    },
    [reverseGeocode]
  );

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        componentRestrictions: { country: 'in' },
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarker({ lat, lng });
        reverseGeocode(lat, lng);
        setMapUrl('');
      });
    }
  }, [isLoaded, reverseGeocode]);

  const handleMapInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      map: { ...prev.map, [name]: value },
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="form-step animated-step">
      <h2>📍 Location & Submission</h2>
      <div className="property-management-form-group">
        <label>
          Paste Google Maps URL (optional)
          <input
            type="url"
            value={mapUrl}
            onChange={(e) => {
              setMapUrl(e.target.value);
              parseGoogleMapsUrl(e.target.value);
            }}
            placeholder="e.g.,https://www.google.com/maps/search/https:%2F%2Fmaps.app.goo.gl%2F1ebTkr5gyTSEqr417/@22.6486672,75.8620732,13z?entry=ttu&g_ep=EgoyMDI1MDkyMi4wIKXMDSoASAFQAw%3D%3D"
            className={errors.mapUrl ? 'error-filed' : ''}
          />
          {errors.mapUrl && <span className="error-message-filed">{errors.mapUrl}</span>}
        </label>
      </div>
      <div className="property-management-form-group">
        <label>Or Search City / District</label>
        <input
          type="text"
          placeholder="Start typing city or district..."
          ref={inputRef}
          className="autocomplete-input"
        />
      </div>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={marker || defaultCenter}
          zoom={marker ? 14 : 5}
          onClick={handleMapClick}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      ) : (
        <p>Loading map...</p>
      )}
      <div className="detail-row">
        <div className="property-management-form-group">
          <label>
            Address <span className="required-field">*</span>
            <input
              type="text"
              name="address"
              placeholder="e.g., 123 Main Street"
              value={formData.map.address}
              onChange={handleMapInputChange}
              className={errors.address ? 'error-filed' : ''}
              disabled={isEditMode}
              required
            />
            {errors.address && <span className="error-message-filed">{errors.address}</span>}
          </label>
        </div>
        <div className="property-management-form-group">
          <label>
            City <span className="required-field">*</span>
            <input
              type="text"
              name="city"
              placeholder="e.g., Mumbai"
              value={formData.map.city}
              onChange={handleMapInputChange}
              className={errors.city ? 'error-filed' : ''}
              disabled={isEditMode}
              required
            />
            {errors.city && <span className="error-message-filed">{errors.city}</span>}
          </label>
        </div>
      </div>
      <div className="detail-row">
        <div className="property-management-form-group">
          <label>
            State
            <input
              type="text"
              name="state"
              placeholder="e.g., Maharashtra"
              value={formData.map.state}
              disabled={isEditMode}
              onChange={handleMapInputChange}
            />
          </label>
        </div>
        <div className="property-management-form-group">
          <label>
            Pincode
            <input
              type="text"
              name="pincode"
              placeholder="e.g., 400001"
              value={formData.map.pincode}
              disabled={isEditMode}
              onChange={handleMapInputChange}
            />
          </label>
        </div>
      </div>
      <div className="property-management-form-group">
        <label>
          District <span className="required-field">*</span>
          <select
            name="districtId"
            value={formData.map.districtId}
            onChange={handleMapInputChange}
            className={errors.districtId ? 'error-filed' : ''}
            disabled={isEditMode}
            required
          >
            <option value="">Select District</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          {errors.districtId && <span className="error-message-filed">{errors.districtId}</span>}
        </label>
      </div>
    </div>
  );
};

export default LocationStep;