import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyVisits, fetchPropertyVisits, updateVisitStatus } from '../redux/slices/visitSlice';
import { initWebSocket, closeWebSocket } from '../Components/websocketService';
import './VisitSchedule.css';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaRupeeSign, FaBed, FaBath, FaClock } from 'react-icons/fa';

const VisitSchedule = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const userName = useSelector((state) => state.auth.user?.name || 'Unknown');
  const { myVisits, propertyVisits, loading, error } = useSelector((state) => state.visits);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const pendingActions = useRef(new Set());

  useEffect(() => {
    if (token) {
      dispatch(fetchMyVisits({ token }));
      dispatch(fetchPropertyVisits({ token }));
    }

    let cleanupWebSocket = () => {};
    if (token) {
      cleanupWebSocket = initWebSocket(token, dispatch, (payload) => {
        if (payload.id && payload.status && !payload.updatedBy?.includes(userName)) {
          setNotifications((prev) => [
            ...prev,
            { id: Date.now(), message: `Visit ${payload.id} ${payload.status.toLowerCase()} by ${payload.updatedBy || 'Seller'}` },
          ]);
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== Date.now()));
          }, 5000);
        }
      }, true);
    }

    return () => {
      console.log('Cleaning up WebSocket in VisitSchedule');
      cleanupWebSocket();
      closeWebSocket();
    };
  }, [dispatch, token, userName]);

  const handleStatusChange = (id, status) => {
    if (pendingActions.current.has(`${id}-${status}`)) return;
    pendingActions.current.add(`${id}-${status}`);
    dispatch(updateVisitStatus({ id, status, token, userName }))
      .finally(() => pendingActions.current.delete(`${id}-${status}`));
  };

  const handleRefresh = () => {
    if (token) {
      dispatch(fetchMyVisits({ token }));
      dispatch(fetchPropertyVisits({ token }));
    }
  };

  const getStatusDisplay = (status, updatedBy) => {
    switch (status) {
      case 'PENDING': return 'Awaiting Seller Confirmation';
      case 'CONFIRMED': return `Confirmed by ${updatedBy || 'Seller'}`;
      case 'CANCELLED': return `Cancelled by ${updatedBy || 'Seller'}`;
      default: return status;
    }
  };

  const renderVisitCard = (visit, isPropertyVisit = false) => (
    <div key={visit.id} className={`visit-card ${visit.status.toLowerCase()}`}>
      <div className="property-thumb-wrapper">
        <img
          src={visit.property.imageUrls?.[0] || '/assets/default-property.png'}
          alt="Property"
          className="property-thumb"
        />
      </div>
      <div className="visit-info">
        <h3>{visit.property.title || 'Untitled Property'}</h3>
        <div className="visit-meta">
          <p><FaCalendarAlt /> {new Date(visit.scheduledTime).toLocaleString()}</p>
          <p className={`status-badge ${visit.status.toLowerCase()}`}>
            {getStatusDisplay(visit.status, visit.updatedBy)}
          </p>
          {isPropertyVisit && <p><strong>Visitor:</strong> {visit.user?.name || 'N/A'}</p>}
        </div>
        <div className="button-group">
          {isPropertyVisit && visit.status === 'PENDING' && (
            <>
              <button className="btn-confirm" onClick={() => handleStatusChange(visit.id, 'CONFIRMED')}>
                Confirm
              </button>
              <button className="btn-cancel" onClick={() => handleStatusChange(visit.id, 'CANCELLED')}>
                Cancel
              </button>
            </>
          )}
          <button className="btn-view" onClick={() => setSelectedVisit(visit)}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="visit-schedule">
      {/* Notifications (uncomment if needed later) */}
      {/* <div className="notifications">...</div> */}

      <div className="section">
        <div className="section-header">
          <h2>Visits Scheduled on My Properties</h2>
          <button className="refresh-button" onClick={handleRefresh}>
            <span>↻</span> Refresh
          </button>
        </div>

        {loading && <p className="loading-text">Loading visits...</p>}
        {error && <p className="error-text">Error: {typeof error === 'object' ? JSON.stringify(error) : error}</p>}

        {propertyVisits.length === 0 ? (
          <div className="empty-state">
            <p>No visits scheduled on your properties yet.</p>
          </div>
        ) : (
          <div className="visits-grid">
            {propertyVisits.map((visit) => renderVisitCard(visit, true))}
          </div>
        )}
      </div>

      {/* My Visits Section (uncomment when needed) */}
      {/* <div className="section"> ... </div> */}

      {selectedVisit && (
        <div className="modal-backdrop" onClick={() => setSelectedVisit(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVisit(null)}>
              <FaTimes />
            </button>

            <div className="modal-header">
              <span className="property-type">
                {selectedVisit.property.type?.replaceAll('_', ' ') || 'Property'}
              </span>
              <h2>{selectedVisit.property.title || 'Untitled Property'}</h2>
            </div>

            <div className="modal-body">
              <p className="description">
                <strong>Description:</strong> {selectedVisit.property.description || 'No description available.'}
              </p>

              <p className="address">
                <FaMapMarkerAlt /> {selectedVisit.property.address || 'N/A'}, {selectedVisit.property.city || ''}, {selectedVisit.property.state || ''} - {selectedVisit.property.pincode || 'N/A'}
              </p>

              <div className="key-details">
                <p><FaRupeeSign /> <strong>Price:</strong> ₹{(selectedVisit.property.price || 0).toLocaleString()}</p>
                <p><strong>Area:</strong> {selectedVisit.property.area ? `${selectedVisit.property.area} sqft` : 'N/A'}</p>

                {["APARTMENT", "MULTI_FAMILY_HOME", "SINGLE_FAMILY_HOME", "STUDIO", "VILLA", "HOUSE"].includes(selectedVisit.property.type) && (
                  <p>
                    <FaBed /> {selectedVisit.property.bedrooms || 0} Beds &nbsp; | &nbsp;
                    <FaBath /> {selectedVisit.property.bathrooms || 0} Baths
                  </p>
                )}
              </div>

              <div className="visit-details">
                <p><FaClock /> <strong>Scheduled:</strong> {new Date(selectedVisit.scheduledTime).toLocaleString()}</p>
                <p><strong>Visitor:</strong> {selectedVisit.user?.name || 'N/A'}</p>
                <p className={`status-badge large ${selectedVisit.status.toLowerCase()}`}>
                  {getStatusDisplay(selectedVisit.status, selectedVisit.updatedBy)}
                </p>
              </div>

              {selectedVisit.notes && (
                <div className="notes-section">
                  <strong>Notes from Visitor:</strong>
                  <p className="notes-text">{selectedVisit.notes}</p>
                </div>
              )}

              {selectedVisit.property.imageUrls?.length > 0 && (
                <div className="modal-images">
                  {selectedVisit.property.imageUrls.map((url, i) => (
                    <img key={i} src={url} alt={`Property ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>

            <button className="modal-close-btn" onClick={() => setSelectedVisit(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitSchedule;