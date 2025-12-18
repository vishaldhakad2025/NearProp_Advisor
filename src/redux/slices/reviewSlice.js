// src/slices/reviewSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'https://api.nearprop.com/api/reviews'; // Fixed endpoint without /v1

// Fetch reviews for a specific property
export const getReviewsByProperty = createAsyncThunk(
  'reviews/getReviewsByProperty',
  async ({ propertyId, token }, { rejectWithValue }) => {
    try {
      if (!token) throw new Error('Token is missing');
      if (!propertyId) throw new Error('propertyId is required');
      const response = await axios.get(
        `${API_BASE_URL}/property/${propertyId}?page=0&size=10&sortBy=createdAt&direction=DESC`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Fetched reviews for property:', propertyId, response.data);
      return response.data.content || response.data;
    } catch (error) {
      console.error('Fetch reviews error for propertyId', propertyId, ':', error.response?.status, error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || error.message || 'Server error (500)');
    }
  }
);

// Create a review for a property
export const createReview = createAsyncThunk(
  'reviews/createReview',
  async ({ token, reviewData }, { rejectWithValue }) => {
    try {
      if (!token) throw new Error('Token is missing');
      if (!reviewData.propertyId) throw new Error('propertyId is required');
      if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      if (!reviewData.comment || reviewData.comment.trim().length === 0) {
        throw new Error('Comment is required');
      }
      console.log('Sending review request:', { url: API_BASE_URL, reviewData }); // Log payload
      const response = await axios.post(`${API_BASE_URL}`, reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Created review:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create review error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        reviewData,
      });
      return rejectWithValue(
        error.response?.status === 500
          ? 'Server error (500). Please try again later or contact support.'
          : error.response?.data?.message || error.message || 'Failed to submit review'
      );
    }
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetReviewState: (state) => {
      state.reviews = [];
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // getReviewsByProperty
    builder
      .addCase(getReviewsByProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(getReviewsByProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reviews = Array.isArray(action.payload) ? action.payload : action.payload?.content || [];
      })
      .addCase(getReviewsByProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.reviews = [];
      })
      // createReview
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (!state.reviews.some((r) => r.id === action.payload.id)) {
          state.reviews = [...state.reviews, action.payload];
        }
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetReviewState } = reviewSlice.actions;
export default reviewSlice.reducer;