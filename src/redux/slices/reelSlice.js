import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';
import axios from 'axios';
import { toastInfo } from '../../utils/toast';

// 🔹 Check Upload Limit
export const checkUploadLimit = createAsyncThunk(
  'reels/checkUploadLimit',
  async ({ propertyId, token }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/reels/check-upload-limit`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { propertyId },
      });
      console.log(res);
      return res.data.data;
    } catch (err) {
      console.error(err);
      return rejectWithValue(err.response?.data?.message || 'Failed to check upload limit');
    }
  }
);

// 🔹 Initiate Payment
export const initiatePayment = createAsyncThunk(
  'reels/initiatePayment',
  async ({ payload, token }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`/api/payments/initiate`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res);
      return res.data.data;
    } catch (err) {
      console.error(err);
      return rejectWithValue(err.response?.data?.message || 'Failed to initiate payment');
    }
  }
);

// 🔹 Verify Payment
export const verifyPayment = createAsyncThunk(
  'reels/verifyPayment',
  async ({ referenceId, gatewayTransactionId, gatewayOrderId, paymentSignature, token }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        `/api/payments/verify`,
        { referenceId, gatewayTransactionId, gatewayOrderId, paymentSignature },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("verify payment ", res);
      return res.data.data;
    } catch (err) {
      console.error(err);
      return rejectWithValue(err.response?.data?.message || 'Payment verification failed');
    }
  }
);

// 🔹 Upload Reel
// 🔹 Upload Reel
export const uploadReel = createAsyncThunk(
  'reels/uploadReel',
  async ({ formData, token }, { rejectWithValue }) => {
    try {
      const res = await axios.post('https://api.nearprop.com/api/reels', formData, {  
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(res);
      return res.data.data;
    } catch (err) {
      console.error(err);
      toastInfo("Error uploading reel. Please try again.( if check your subscription plan if expired)");
      return rejectWithValue(err.response?.data?.message || 'Failed to upload reel');
    }
  }
);

// 🔹 Fetch Reels
export const fetchReels = createAsyncThunk(
  'reels/fetchReels',
  async ({ latitude, longitude, radiusKm, page = 0, size = 20, token }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/api/reels/feed', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          size,
          sortBy: 'createdAt',
          direction: 'DESC',
        },
      });
      return res.data.data.content;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch reels');
    }
  }
);

// 🔹 Fetch Saved Reels
export const fetchSavedReels = createAsyncThunk(
  'reels/fetchSavedReels',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/api/reels/saved', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 0,
          size: 20,
          sortBy: 'createdAt',
          direction: 'DESC',
        },
      });
      return res.data.data.content;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch saved reels');
    }
  }
);

// 🔹 Toggle Like Reel
export const likeReel = createAsyncThunk(
  'reels/likeReel',
  async ({ reelId, liked, token }, { rejectWithValue }) => {
    try {
      const method = liked ? 'delete' : 'post';
      await axiosInstance({
        url: `/api/reels/${reelId}/like`,
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      return { reelId, liked: !liked, actionType: method.toUpperCase() };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to like reel');
    }
  }
);

// 🔹 Toggle Save Reel
export const toggleSaveReel = createAsyncThunk(
  'reels/toggleSaveReel',
  async ({ reelId, saved, token }, { rejectWithValue }) => {
    try {
      const method = saved ? 'delete' : 'post';
      await axiosInstance({
        url: `/api/reels/${reelId}/save`,
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      return { reelId, saved: !saved };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save reel');
    }
  }
);

// 🔹 Toggle Follow Reel Owner
export const followOnReel = createAsyncThunk(
  'reels/followOnReel',
  async ({ reelId, followed, token }, { rejectWithValue }) => {
    try {
      const method = followed ? 'delete' : 'post';
      await axiosInstance({
        url: `/api/reels/${reelId}/follow`,
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      return { reelId, followed: !followed, actionType: method.toUpperCase() };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to follow user');
    }
  }
);

// 🔹 Share Reel
export const shareReel = createAsyncThunk(
  'reels/shareReel',
  async ({ reelId, token }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`/api/reels/${reelId}/share`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { reelId, shareableLink: res.data.data?.shareableLink || '' };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to share reel');
    }
  }
);

// 🔹 Comment on Reel
export const commentOnReel = createAsyncThunk(
  'reels/commentOnReel',
  async ({ reelId, message, token }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('message', message);
      const res = await axiosInstance.post(`/api/reels/${reelId}/comment`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return { reelId, comment: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to comment on reel');
    }
  }
);

// 🔹 Slice
const reelSlice = createSlice({
  name: 'reels',
  initialState: {
    reels: [],
    savedReels: [], // Added for saved reels
    loading: false,
    error: null,
    uploadLimit: null,
    paymentData: null,
    paymentVerified: false,
  },
  reducers: {
    clearReels(state) {
      state.reels = [];
      state.savedReels = []; // Clear saved reels too
      state.error = null;
    },
    clearPayment(state) {
      state.paymentData = null;
      state.paymentVerified = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Upload Limit
      .addCase(checkUploadLimit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkUploadLimit.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadLimit = action.payload;
      })
      .addCase(checkUploadLimit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Initiate Payment
      .addCase(initiatePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentData = action.payload;
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify Payment
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentVerified = true;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

       // Upload Reel
      .addCase(uploadReel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(uploadReel.fulfilled, (state, action) => {
        state.loading = false;
        const newReel = action.payload.reel;
        if (newReel) {
          state.reels.unshift(newReel);
          state.reels = state.reels.filter((r, i, arr) => arr.findIndex(rr => rr.id === r.id) === i);
          if (state.uploadLimit && newReel?.propertyId) {
            state.uploadLimit.uploadedCount = (state.uploadLimit.uploadedCount || 0) + 1;
          }
        }
        state.paymentData = null;
        state.paymentVerified = false;
      })
      .addCase(uploadReel.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Fetch Reels (fixed: merged duplicate)
      .addCase(fetchReels.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchReels.fulfilled, (state, action) => {
        state.loading = false;
        const existingIds = new Set(state.reels.map(r => r.id));
        const merged = [...state.reels, ...action.payload.filter(r => !existingIds.has(r.id))];
        state.reels = merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      })
      .addCase(fetchReels.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Fetch Saved Reels
      .addCase(fetchSavedReels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedReels.fulfilled, (state, action) => {
        state.loading = false;
        state.savedReels = action.payload;
      })
      .addCase(fetchSavedReels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Like Reel
      .addCase(likeReel.pending, (state, action) => {
        const { reelId, liked } = action.meta.arg;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.liked = !liked;
          reel.likeCount = !liked ? (reel.likeCount || 0) + 1 : Math.max((reel.likeCount || 1) - 1, 0);
        }
        if (savedReel) {
          savedReel.liked = !liked;
          savedReel.likeCount = !liked ? (savedReel.likeCount || 0) + 1 : Math.max((savedReel.likeCount || 1) - 1, 0);
        }
      })
      .addCase(likeReel.fulfilled, (state, action) => {
        const { reelId, liked, actionType } = action.payload;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.liked = liked;
          reel.likeCount = liked ? (reel.likeCount || 0) + 1 : Math.max((reel.likeCount || 1) - 1, 0);
          reel.lastAction = { type: 'LIKE', action: actionType, timestamp: new Date().toISOString() };
        }
        if (savedReel) {
          savedReel.liked = liked;
          savedReel.likeCount = liked ? (savedReel.likeCount || 0) + 1 : Math.max((savedReel.likeCount || 1) - 1, 0);
          savedReel.lastAction = { type: 'LIKE', action: actionType, timestamp: new Date().toISOString() };
        }
      })
      .addCase(likeReel.rejected, (state, action) => {
        const { reelId, liked } = action.meta.arg;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.liked = liked;
          reel.likeCount = liked ? (reel.likeCount || 0) + 1 : Math.max((reel.likeCount || 1) - 1, 0);
        }
        if (savedReel) {
          savedReel.liked = liked;
          savedReel.likeCount = liked ? (savedReel.likeCount || 0) + 1 : Math.max((savedReel.likeCount || 1) - 1, 0);
        }
        state.error = action.payload;
      })

      // Save Reel
      .addCase(toggleSaveReel.pending, (state, action) => {
        const { reelId, saved } = action.meta.arg;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.saved = !saved;
          reel.saveCount = !saved ? (reel.saveCount || 0) + 1 : Math.max((reel.saveCount || 1) - 1, 0);
        }
        if (savedReel) {
          savedReel.saved = !saved;
          savedReel.saveCount = !saved ? (savedReel.saveCount || 0) + 1 : Math.max((savedReel.saveCount || 1) - 1, 0);
        }
      })
      .addCase(toggleSaveReel.fulfilled, (state, action) => {
        const { reelId, saved } = action.payload;
        const reel = state.reels.find((r) => r.id === reelId);
        if (reel) {
          reel.saved = saved;
          reel.saveCount = saved ? (reel.saveCount || 0) + 1 : Math.max((reel.saveCount || 1) - 1, 0);
        }
        if (saved) {
          const savedReel = state.reels.find((r) => r.id === reelId);
          if (savedReel && !state.savedReels.some((r) => r.id === reelId)) {
            state.savedReels.unshift({ ...savedReel, saved });
          }
        } else {
          state.savedReels = state.savedReels.filter((r) => r.id !== reelId);
        }
      })
      .addCase(toggleSaveReel.rejected, (state, action) => {
        const { reelId, saved } = action.meta.arg;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.saved = saved;
          reel.saveCount = saved ? (reel.saveCount || 0) + 1 : Math.max((reel.saveCount || 1) - 1, 0);
        }
        if (savedReel) {
          savedReel.saved = saved;
          savedReel.saveCount = saved ? (savedReel.saveCount || 0) + 1 : Math.max((savedReel.saveCount || 1) - 1, 0);
        }
        state.error = action.payload;
      })

      // Follow Reel Owner
      .addCase(followOnReel.pending, (state, action) => {
        const { reelId, followed } = action.meta.arg;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel && reel.owner) {
          reel.owner.followed = !followed;
        }
        if (savedReel && savedReel.owner) {
          savedReel.owner.followed = !followed;
        }
      })
      .addCase(followOnReel.fulfilled, (state, action) => {
        const { reelId, followed, actionType } = action.payload;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel && reel.owner) {
          reel.owner.followed = followed;
          reel.lastAction = { type: 'FOLLOW', action: actionType, timestamp: new Date().toISOString() };
        }
        if (savedReel && savedReel.owner) {
          savedReel.owner.followed = followed;
          savedReel.lastAction = { type: 'FOLLOW', action: actionType, timestamp: new Date().toISOString() };
        }
      })
      .addCase(followOnReel.rejected, (state, action) => {
        const { reelId, followed } = action.meta.arg;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel && reel.owner) {
          reel.owner.followed = followed;
        }
        if (savedReel && savedReel.owner) {
          savedReel.owner.followed = followed;
        }
        state.error = action.payload;
      })

      // Share Reel
      .addCase(shareReel.fulfilled, (state, action) => {
        const { reelId } = action.payload;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.shareCount = (reel.shareCount || 0) + 1;
        }
        if (savedReel) {
          savedReel.shareCount = (savedReel.shareCount || 0) + 1;
        }
      })
      .addCase(shareReel.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Comment on Reel
      .addCase(commentOnReel.pending, (state, action) => {
        const { reelId, message } = action.meta.arg;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.comments = [
            ...(reel.comments || []),
            {
              reelId,
              user: { name: 'You', id: 'temp' },
              comment: message,
              createdAt: new Date().toISOString(),
            },
          ];
          reel.commentCount = (reel.commentCount || 0) + 1;
        }
        if (savedReel) {
          savedReel.comments = [
            ...(savedReel.comments || []),
            {
              reelId,
              user: { name: 'You', id: 'temp' },
              comment: message,
              createdAt: new Date().toISOString(),
            },
          ];
          savedReel.commentCount = (savedReel.commentCount || 0) + 1;
        }
      })
      .addCase(commentOnReel.fulfilled, (state, action) => {
        const { reelId, comment } = action.payload;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.comments = [...(reel.comments || []).filter((c) => c.id !== 'temp'), comment];
        }
        if (savedReel) {
          savedReel.comments = [...(savedReel.comments || []).filter((c) => c.id !== 'temp'), comment];
        }
      })
      .addCase(commentOnReel.rejected, (state, action) => {
        const { reelId, message } = action.meta.arg;
        const reel = state.reels.find((r) => r.id === reelId);
        const savedReel = state.savedReels.find((r) => r.id === reelId);
        if (reel) {
          reel.comments = (reel.comments || []).filter((c) => c.comment !== message || c.id !== 'temp');
          reel.commentCount = Math.max((reel.commentCount || 1) - 1, 0);
        }
        if (savedReel) {
          savedReel.comments = (savedReel.comments || []).filter((c) => c.comment !== message || c.id !== 'temp');
          savedReel.commentCount = Math.max((savedReel.commentCount || 1) - 1, 0);
        }
        state.error = action.payload;
      });
  },
});

export const { clearReels, clearPayment } = reelSlice.actions;
export default reelSlice.reducer;