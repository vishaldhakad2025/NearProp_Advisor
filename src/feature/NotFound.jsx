// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';


const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="btn go-home-btn">Go to Dashboard</Link>
    </div>
  );
};

export default NotFound;
