import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'https://api.nearprop.com/api/visits';

// Fetch visits scheduled by the user (as buyer)
export const fetchMyVisits = createAsyncThunk(
  'visits/fetchMyVisits',
  async ({ token, page = 0, size = 10 }, thunkAPI) => {
    try {
      if (!token) throw new Error('Token is missing');
      const response = await axios.get(
        `${BASE_URL}/my-visits?page=${page}&size=${size}&sortBy=scheduledTime&direction=ASC`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Fetched my visits:', response.data);
      return response.data;
    } catch (error) {
      console.error('Fetch my visits error:', error);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch visits scheduled on user's properties (as seller)
export const fetchPropertyVisits = createAsyncThunk(
  'visits/fetchPropertyVisits',
  async ({ token, page = 0, size = 10 }, thunkAPI) => {
    try {
      if (!token) throw new Error('Token is missing');
      const response = await axios.get(
        `${BASE_URL}/my-properties?page=${page}&size=${size}&sortBy=scheduledTime&direction=ASC`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Fetched property visits:', response.data);
      return response.data;
    } catch (error) {
      console.error('Fetch property visits error:', error);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create a visit (Schedule Tour as buyer)
export const createVisit = createAsyncThunk(
  'visits/createVisit',
  async ({ token, visitData }, thunkAPI) => {
    try {
      if (!token) throw new Error('Token is missing');
      const response = await axios.post(`${BASE_URL}`, visitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Created visit:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create visit error:', error);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update visit status (as seller)
export const updateVisitStatus = createAsyncThunk(
  'visits/updateStatus',
  async ({ id, status, token, userName }, thunkAPI) => {
    try {
      if (!token) throw new Error('Token is missing');
      const response = await axios.put(
        `${BASE_URL}/${id}/status`,
        { status, updatedBy: userName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log("00",response)
      console.log(`Updated visit ${id} status to ${status} by ${userName}`);
      return { ...response.data, updatedBy: userName };
    } catch (error) {
      console.error('Update visit status error:', error);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete visit (as buyer or seller)
export const deleteVisit = createAsyncThunk(
  'visits/deleteVisit',
  async ({ id, token }, thunkAPI) => {
    try {
      if (!token) throw new Error('Token is missing');
      await axios.delete(`${BASE_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Deleted visit:', id);
      return id;
    } catch (error) {
      console.error('Delete visit error:', error);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

const visitSlice = createSlice({
  name: 'visits',
  initialState: {
    myVisits: [],
    propertyVisits: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateVisitStatusWebSocket: (state, action) => {
      const { id, status, updatedBy } = action.payload;
      // Update myVisits
      const myVisitIndex = state.myVisits.findIndex((v) => v.id === id);
      if (myVisitIndex !== -1) {
        state.myVisits = [
          ...state.myVisits.slice(0, myVisitIndex),
          { ...state.myVisits[myVisitIndex], status, updatedBy },
          ...state.myVisits.slice(myVisitIndex + 1),
        ];
        console.log(`WebSocket updated my visit ${id} status to ${status} by ${updatedBy || 'Unknown'}`);
      }
      // Update propertyVisits
      const propertyVisitIndex = state.propertyVisits.findIndex((v) => v.id === id);
      if (propertyVisitIndex !== -1) {
        state.propertyVisits = [
          ...state.propertyVisits.slice(0, propertyVisitIndex),
          { ...state.propertyVisits[propertyVisitIndex], status, updatedBy },
          ...state.propertyVisits.slice(propertyVisitIndex + 1),
        ];
        console.log(`WebSocket updated property visit ${id} status to ${status} by ${updatedBy || 'Unknown'}`);
      }
      if (myVisitIndex === -1 && propertyVisitIndex === -1) {
        console.warn(`Visit ${id} not found for WebSocket update`);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my visits
      .addCase(fetchMyVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyVisits.fulfilled, (state, action) => {
        state.loading = false;
        state.myVisits = action.payload?.content || [];
      })
      .addCase(fetchMyVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch property visits
      .addCase(fetchPropertyVisits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyVisits.fulfilled, (state, action) => {
        state.loading = false;
        state.propertyVisits = action.payload?.content || [];
      })
      .addCase(fetchPropertyVisits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create visit
      .addCase(createVisit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVisit.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.myVisits.some((v) => v.id === action.payload.id)) {
          state.myVisits = [...state.myVisits, action.payload];
        }
      })
      .addCase(createVisit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update visit status
      .addCase(updateVisitStatus.fulfilled, (state, action) => {
        const index = state.propertyVisits.findIndex((v) => v.id === action.payload.id);
        if (index !== -1) {
          state.propertyVisits = [
            ...state.propertyVisits.slice(0, index),
            action.payload,
            ...state.propertyVisits.slice(index + 1),
          ];
        }
      })
      // Delete visit
      .addCase(deleteVisit.fulfilled, (state, action) => {
        state.myVisits = state.myVisits.filter((v) => v.id !== action.payload);
        state.propertyVisits = state.propertyVisits.filter((v) => v.id !== action.payload);
      });
  },
});

export const { updateVisitStatusWebSocket } = visitSlice.actions;
export default visitSlice.reducer;