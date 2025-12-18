import React from 'react';
import './Banner.css';

function Banner({ user }) {
  // console.log("-----------------------kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk----", user);

  // get name or fallback to username / email
  const displayName = user?.name || user?.username || user?.email || "User";

  return (
    <div className="banner">
      <div className="banner-overlay">
        <div className="banner-content animate">
          <h1>Welcome {displayName} 👋</h1>
          {/* <p>Effortlessly manage Sellers, Advisors, and Developers all in one place.</p> */}
          {/* <button className="cta-button">Get Started</button> */}
        </div>
      </div>
    </div>
  );
}

export default Banner;
