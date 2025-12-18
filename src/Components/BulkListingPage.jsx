import React, { useState } from 'react';
import './bulkListing.css';

function BulkListingPage({ addProperty }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: '',
    status: '',
    price: '',
    bedrooms: 0,
    landArea: '',
    image: '',
    quantity: 0, // ✅ NEW FIELD
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleNumberChange = (e, field) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    setFormData((prevData) => ({ ...prevData, [field]: value }));
  };

  const incrementField = (field) => {
    setFormData((prevData) => ({ ...prevData, [field]: prevData[field] + 1 }));
  };

  const decrementField = (field) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: Math.max(0, prevData[field] - 1),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addProperty(formData);
    setFormData({
      title: '',
      content: '',
      type: '',
      status: '',
      price: '',
      bedrooms: 0,
      landArea: '',
      image: '',
      quantity: 0, // reset quantity
    });
  };

  return (
    <form className="property-form" onSubmit={handleSubmit} noValidate>
      {/* Row 1 */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="title">PROPERTY TITLE</label>
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter property title"
            required
            className="property-form__input"
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">PROPERTY TYPE</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="property-form__select"
          >
            <option value="" disabled>Select Type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">STATUS</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="property-form__select"
          >
            <option value="" disabled>Select Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Row 2 */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="price">PRICE</label>
          <div className="property-form__input-group">
            <span className="property-form__prefix">₹</span>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Enter price"
              required
              className="property-form__input"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bedrooms">BEDROOMS</label>
          <div className="property-form__input-group bedrooms-group">
            <button type="button" onClick={() => decrementField('bedrooms')} className="property-form__button">−</button>
            <input
              type="number"
              id="bedrooms"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={(e) => handleNumberChange(e, 'bedrooms')}
              min="0"
              className="property-form__input"
            />
            <button type="button" onClick={() => incrementField('bedrooms')} className="property-form__button">+</button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="landArea">LAND AREA (sq ft)</label>
          <input
            type="number"
            id="landArea"
            name="landArea"
            value={formData.landArea}
            onChange={handleChange}
            placeholder="Enter land area"
            required
            className="property-form__input"
            min="0"
          />
        </div>
      </div>

      {/* ✅ Row 3: Quantity */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quantity">QUANTITY</label>
          <div className="property-form__input-group bedrooms-group">
            <button type="button" onClick={() => decrementField('quantity')} className="property-form__button">−</button>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={(e) => handleNumberChange(e, 'quantity')}
              min="0"
              className="property-form__input"
            />
            <button type="button" onClick={() => incrementField('quantity')} className="property-form__button">+</button>
          </div>
        </div>
      </div>

      {/* Full width fields */}
      <div className="form-group full-width">
        <label htmlFor="content">DESCRIPTION</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Enter description"
          required
          className="property-form__textarea"
        />
      </div>

      <div className="form-group full-width">
        <label htmlFor="image">IMAGE URL</label>
        <input
          type="url"
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="Enter image URL"
          required
          className="property-form__input"
        />
      </div>

      <button type="submit" className="property-form__submit">
        ADD PROPERTY
      </button>
    </form>
  );
}

export default BulkListingPage;
