import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Async Thunk to fetch districts
export const fetchDistricts = createAsyncThunk(
  'districts/fetchAll',
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get('/api/districts');
      return res.data;
    } catch (err) {
      console.error('Error fetching districts:', err);
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || 'Failed to fetch districts'
      );
    }
  }
);

// Async Thunk to fetch dashboard data
export const fetchDashboard = createAsyncThunk(
  'dashboard/fetchAll',
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get('/api/analytics/dashboard');
      console.log('Dashboard data fetched:', res.data);
      return res.data.data;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || 'Failed to fetch dashboard'
      );
    }
  }
);

const initialState = {
  districts: {
    list: [],
    loading: false,
    error: null,
  },
  dashboard: {
    data: null,
    loading: false,
    error: null,
  },
};

const districtSlice = createSlice({
  name: 'districts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Districts
    builder
      .addCase(fetchDistricts.pending, (state) => {
        state.districts.loading = true;
        state.districts.error = null;
      })
      .addCase(fetchDistricts.fulfilled, (state, action) => {
        state.districts.loading = false;
        state.districts.list = action.payload;
      })
      .addCase(fetchDistricts.rejected, (state, action) => {
        state.districts.loading = false;
        state.districts.error = action.payload;
      });

    // Dashboard
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.dashboard.loading = true;
        state.dashboard.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.dashboard.loading = false;
        state.dashboard.error = action.payload;
      });
  },
});

export default districtSlice.reducer;
