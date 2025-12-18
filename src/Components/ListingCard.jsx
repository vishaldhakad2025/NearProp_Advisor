import React from 'react';

const ListingCard = ({ listing, updateStatus }) => {
  const { category, quantity, status } = listing;

  return (
    <div className={`card ${status}`}>
      <h3>{category}</h3>
      <p>Quantity: {quantity}</p>
      <p>Status: {status}</p>
      {status === 'active' && (
        <button onClick={() => updateStatus(listing.id, 'sold')}>Mark as Sold</button>
      )}
    </div>
  );
};

export default ListingCard;
