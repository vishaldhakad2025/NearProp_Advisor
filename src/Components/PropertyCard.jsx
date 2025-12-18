import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './PropertyCard.css';

function PropertyCard({
  id,
  title,
  content,
  type,
  status,
  price,
  bedrooms,
  landArea,
  image,
  quantity,
  onEdit,
}) {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/property/${id}`, {
      state: {
        property: {
          id,
          title,
          content,
          type,
          status,
          price,
          bedrooms,
          landArea,
          image,
          quantity,
        },
      },
    });
  };

  return (
    <div className="property-card">
      <div className="property-card__image-wrapper">
        <img src={image} alt={title} className="property-card__image" />
        <div className="property-card__tags-over-image">
          <span className="tag tag-type">{type}</span>
          <span className={`tag tag-status ${status.toLowerCase()}`}>{status}</span>
        </div>
      </div>

      <div className="property-card__details">
        <h3 className="property-card__title">{title}</h3>
        <p className="property-card__description">{content}</p>

        <div className="property-card__info-grid">
          <span><strong>₹{price.toLocaleString()}</strong></span>
          <span>{bedrooms} BHK</span>
          <span>{landArea} sqft</span>
          <span>Qty: {quantity}</span>
        </div>

        <div className="property-card__buttons" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline-primary" size="sm" className="card-btn" onClick={handleView}>
            View
          </Button>
          <Button variant="primary" size="sm" className="card-btn" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;
