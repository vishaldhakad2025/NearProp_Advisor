import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchReels,
  likeReel,
  shareReel,
  commentOnReel,
  followOnReel,
  toggleSaveReel,
} from '../redux/slices/reelSlice';
import { fetchUserProfile } from '../redux/slices/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookmark,
  faComment,
  faShare,
  faThumbsUp,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import Tooltip from '@mui/material/Tooltip';
import { toast } from 'react-toastify';
import UploadReelFlow from './UploadReelFlow';
import './FeedPage.css';
import debounce from 'lodash/debounce';

function FeedPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { reels, loading, error, uploadLimit } = useSelector((state) => state.reel);
  const { user } = useSelector((state) => state.auth);
  const [pausedVideo, setPausedVideo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shareModal, setShareModal] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareLinks, setShareLinks] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [activeCommentReelId, setActiveCommentReelId] = useState(null);
  const [normalReelUploaded, setNormalReelUploaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      if (scrollY > windowHeight * 0.5) {
        setActiveCommentReelId(null);
      }
    };

    window.addEventListener('scroll', handleScroll);

    if (token) {
      dispatch(fetchReels({ latitude: 37.7749, longitude: -122.4194, radiusKm: 10, page: 0, size: 20, token }));
      dispatch(fetchUserProfile());
    } else {
      toast.error('Please log in to view reels');
      navigate('/login');
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [dispatch, token, navigate]);

  const debouncedComment = useCallback(
    debounce((reelId, message, token) => {
      dispatch(commentOnReel({ reelId, message, token }))
        .then(() => {
          setCommentText('');
          setActiveCommentReelId(reelId);
          toast.success('Comment added');
        })
        .catch((err) => {
          console.error('Comment error:', err);
          toast.error('Failed to comment');
        });
    }, 500, { leading: true, trailing: false }),
    [dispatch]
  );

  const handleComment = (reelId) => {
    if (!token) {
      toast.error('You must be logged in to comment');
      return;
    }
    if (!commentText.trim()) {
      toast.warning('Comment cannot be empty');
      return;
    }
    if (!user?.name) {
      toast.error('User profile not loaded. Please try again.');
      return;
    }
    debouncedComment(reelId, commentText, token);
  };

  const togglePlayPause = (e, id) => {
    const video = e.target;
    if (video.paused) {
      video.play();
      setPausedVideo(null);
    } else {
      video.pause();
      setPausedVideo(id);
    }
  };

  const handleLike = (reel) => {
    dispatch(likeReel({ reelId: reel.id, liked: reel.liked, token }))
      .then(({ payload }) => {
        toast.success(payload.actionType === 'POST' ? 'Liked' : 'Unliked');
      })
      .catch(() => toast.error('Failed to like reel'));
  };

  const handleSave = (reel) => {
    dispatch(toggleSaveReel({ reelId: reel.id, saved: reel.saved, token }))
      .then(() => {
        toast.success(reel.saved ? 'Unsaved' : 'Saved');
        navigate('/saved-reels');
      })
      .catch(() => toast.error('Failed to save reel'));
  };

  const handleFollow = (reel) => {
    dispatch(followOnReel({ reelId: reel.id, followed: reel.owner.followed, token }))
      .then(({ payload }) => {
        toast.success(payload.actionType === 'POST' ? 'Followed' : 'Unfollowed');
      })
      .catch(() => toast.error('Failed to follow user'));
  };

  const handleShare = (reel) => {
    const shareableLink = reel.videoUrl;
    setShareUrl(shareableLink);
    const encodedLink = encodeURIComponent(shareableLink);
    const platforms = [
      { name: 'WhatsApp', url: `https://wa.me/?text=${encodedLink}` },
      { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` },
      { name: 'Twitter', url: `https://twitter.com/intent/tweet?url=${encodedLink}&text=Check%20this%20out!` },
    ];
    setShareLinks(platforms);
    setShareModal(reel.id);
    toast.success('Select platform to share');
  };

  const handlePlatformShare = (url) => {
    navigator.clipboard.writeText(shareUrl);
    window.open(url, '_blank');
    toast.success('Link copied to clipboard');
    setShareModal(null);
  };

  const toggleCommentSection = (reelId) => {
    setActiveCommentReelId((prev) => (prev === reelId ? null : reelId));
    setCommentText('');
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const handleUploadSuccess = (isNormalUpload) => {
    if (isNormalUpload) {
      setNormalReelUploaded(true);
    }
    setShowModal(false);
  };

  if (error) {
    return (
      <div className="error">
        {error}
        <button
          className="btn btn-primary"
          onClick={() => dispatch(fetchReels({ latitude: 37.7749, longitude: -122.4194, radiusKm: 10, page: 0, size: 20, token }))}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="shorts-container">
      {/* <button
        className="saved-reels-btn"
        onClick={() => navigate('/saved-reels')}
      >
        <FontAwesomeIcon icon={faBookmark} /> Saved Reels
      </button> */}
      <button
        className="fixed-add-reel-btn"
        onClick={() => {
          if (!normalReelUploaded || uploadLimit?.canUpload) {
            setShowModal(true);
          } else {
            toast.error('You have already uploaded a normal reel or reached the limit');
          }
        }}
      >
        {normalReelUploaded || uploadLimit?.canUpload ? 'Upload More Reels' : 'Add Reel'}
      </button>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : reels.length === 0 ? (
        <p className="no-reels">No reels available.</p>
      ) : (
        <div className="reels-grid">
          {reels.map((reel) => (
            <div key={reel.id} className="shorts-card">
              <video
                className="shorts-video"
                src={reel.videoUrl}
                loop
                muted
                autoPlay
                onClick={(e) => togglePlayPause(e, reel.id)}
              />
              {pausedVideo === reel.id && <div className="paused-indicator">⏸</div>}

              <div className="shorts-overlay">
                <div className="user-profile">
                  <img
                    src={reel.owner?.profileImageUrl || 'https://via.placeholder.com/40'}
                    alt={reel.owner?.name || 'User'}
                    className="profile-image"
                  />
                  <p className="shorts-user">@{reel.owner?.name || 'Unknown'}</p>
                  <button
                    className="follow-button"
                    onClick={() => handleFollow(reel)}
                  >
                    {reel.owner?.followed ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
                <h3 className="shorts-heading">{reel.title}</h3>
                <p className="shorts-description">Property ID: {reel.propertyId || 'N/A'}</p>
                {reel.propertyId && (
                  <button
                    className="btn btn-primary view-property-button"
                    onClick={() => handleViewProperty(reel.propertyId)}
                  >
                    View Property
                  </button>
                )}
              </div>

              <div className="shorts-actions">
                <Tooltip title={reel.liked ? 'Unlike' : 'Like'}>
                  <div className="action-item" onClick={() => handleLike(reel)}>
                    <FontAwesomeIcon icon={faThumbsUp} size="lg" color={reel.liked ? '#00c4b4' : '#666'} />
                    <span className="action-count">{reel.likeCount || 0}</span>
                  </div>
                </Tooltip>
                <Tooltip title="Comment">
                  <div className="action-item" onClick={() => toggleCommentSection(reel.id)}>
                    <FontAwesomeIcon icon={faComment} size="lg" />
                    <span className="action-count">{reel.commentCount || 0}</span>
                  </div>
                </Tooltip>
                <Tooltip title="Share">
                  <div className="action-item" onClick={() => handleShare(reel)}>
                    <FontAwesomeIcon icon={faShare} size="lg" />
                    <span className="action-count">{reel.shareCount || 0}</span>
                  </div>
                </Tooltip>
                {/* <Tooltip title={reel.saved ? 'Unsave' : 'Save'}>
                  <div className="action-item" onClick={() => handleSave(reel)}>
                    <FontAwesomeIcon icon={faBookmark} size="lg" color={reel.saved ? '#00c4b4' : '#666'} />
                    <span className="action-count">{reel.saveCount || 0}</span>
                  </div>
                </Tooltip> */}
              </div>

              {activeCommentReelId === reel.id && (
                <div className="comment-modal-overlay" onClick={() => setActiveCommentReelId(null)}>
                  <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="comment-close-btn" onClick={() => setActiveCommentReelId(null)}>
                      ×
                    </button>
                    <div className="existing-comments">
                      {reel.comments?.length > 0 ? (
                        reel.comments.map((c) => (
                          <div key={c.id} className="comment-item">
                            <strong>{c.user?.name || 'User'}:</strong> {c.comment}
                            <small>{new Date(c.createdAt).toLocaleDateString()}</small>
                          </div>
                        ))
                      ) : (
                        <p className="no-comments">No comments yet</p>
                      )}
                    </div>
                    <div className="add-comment">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button className="btn btn-primary" onClick={() => handleComment(reel.id)}>
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {shareModal === reel.id && (
                <div className="share-modal">
                  <h3>Share this Reel</h3>
                  <ul>
                    {shareLinks.map((platform) => (
                      <li key={platform.name}>
                        <button className="btn btn-secondary" onClick={() => handlePlatformShare(platform.url)}>
                          {platform.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button className="btn btn-primary" onClick={() => setShareModal(null)}>
                    Close
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="reel-form-modal">
          <div className="reel-form">
            <h2>Upload New Reel</h2>
            <UploadReelFlow token={token} onUploadSuccess={handleUploadSuccess} onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedPage;