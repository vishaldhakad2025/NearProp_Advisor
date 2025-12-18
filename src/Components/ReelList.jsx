// ReelList.jsx
import React from 'react';

const ReelList = ({ reels }) => {
  return (
    <div>
      {reels?.length > 0 ? (
        reels.map((reel, index) => (
          <div key={index}>
            <video src={reel.videoUrl} controls />
          </div>
        ))
      ) : (
        <p>No reels available</p>
      )}
    </div>
  );
};

export default ReelList;
