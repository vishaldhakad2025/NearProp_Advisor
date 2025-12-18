
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchReels,
  uploadReel,
} from '../redux/slices/reelSlice';

import './Reels.css';

const ReelsPage = () => {
  const dispatch = useDispatch();
  const { reels, loading } = useSelector((state) => state.reel);
  const [videoFile, setVideoFile] = useState(null);
  const [title, setTitle] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const token = localStorage.getItem('token');

  const location = {
    latitude: 37.7749,
    longitude: -122.4194,
    radiusKm: 10,
  };

  const handleUpload = async () => {
    if (!videoFile || !title || !propertyId) return alert("All fields required");
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', title);
    formData.append('propertyId', propertyId);
    dispatch(uploadReel({ formData, token }));
  };

  useEffect(() => {
    dispatch(fetchReels({ ...location, token }));
  }, [dispatch]);

  return (
    <div className="reels-page">
      <div className="upload-section">
        <h2>Upload New Reel</h2>
        <input type="file" onChange={(e) => setVideoFile(e.target.files[0])} />
        <input type="text" placeholder="Reel Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="text" placeholder="Property ID" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} />
        <button onClick={handleUpload}>Upload Reel</button>
      </div>

      <h2 className="section-title">Reels Feed</h2>
      <div className="reel-feed">
        {loading ? (
          <p>Loading reels...</p>
        ) : (
        reels && reels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} token={token} />
          ))
        )}
      </div>
    </div>
  );
};

export default ReelsPage;
