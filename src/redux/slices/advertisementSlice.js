import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// ✅ Correct name to match component imports
export const fetchAdvertisementsByDistrict = createAsyncThunk(
  'advertisements/fetchByDistrict',
  async (
    { districtName, page = 0, size = 10, sortBy = 'createdAt', direction = 'DESC' },
    { rejectWithValue }
  ) => {
    try {
      console.log(`Fetching ads for district: ${districtName}`);

      const response = await axiosInstance.get(`/api/v1/advertisements`, {
        params: { districtName, page, size, sortBy, direction },
      });

      console.log('Ads response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ad fetch error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const trackAdClick = createAsyncThunk(
  'advertisements/trackClick',
  async ({ adId, platform }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/api/v1/advertisements/${adId}/click/${platform}`);
      return { adId, platform };
    } catch (error) {
      console.error('Ad click tracking error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const advertisementSlice = createSlice({
  name: 'advertisements',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    totalPages: 0,
    currentPage: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdvertisementsByDistrict.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAdvertisementsByDistrict.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // backend Spring style: content[], totalPages, pageable.pageNumber
        state.items = action.payload?.content || [];
        state.totalPages = action.payload?.totalPages || 0;
        state.currentPage = action.payload?.pageable?.pageNumber || 0;
      })
      .addCase(fetchAdvertisementsByDistrict.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(trackAdClick.fulfilled, (state, action) => {
        console.log('Click tracked:', action.payload);
      })
      .addCase(trackAdClick.rejected, (state, action) => {
        console.warn('Ad click tracking failed:', action.payload || action.error.message);
      });
  },
});

export default advertisementSlice.reducer;
