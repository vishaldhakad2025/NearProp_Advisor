import React from 'react';
import './ReelItem.css';

const ReelItem = ({ videoUrl }) => {
  return (
    <div className="reel-item">
      <video width="300" controls>
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default ReelItem;
