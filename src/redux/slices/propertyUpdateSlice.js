// src/redux/slices/propertyUpdateSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { toastSuccess, toastError } from "../../utils/toast";

// 🔹 Fetch All Pending Property Updates
export const getPendingPropertyUpdates = createAsyncThunk(
  "propertyUpdates/pending",
  async ({ page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/property-updates/admin/pending?page=${page}&size=${size}&sort=submittedAt,desc`);
      return res.data;
    } catch (err) {
        console.error(err)
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// 🔹 Review (Approve/Reject) Update Request
export const reviewPropertyUpdate = createAsyncThunk(
  "propertyUpdates/review",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`/api/property-updates/admin/review`, payload);
      toastSuccess("Update review submitted");
      return payload;
    } catch (err) {
        console.error(err)
      toastError("Review failed");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const propertyUpdateSlice = createSlice({
  name: "propertyUpdates",
  initialState: {
    updates: [],
    loading: false,
    total: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPendingPropertyUpdates.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPendingPropertyUpdates.fulfilled, (state, action) => {
        state.loading = false;
        state.updates = action.payload.content;
        state.total = action.payload.totalElements;
      })
      .addCase(getPendingPropertyUpdates.rejected, (state) => {
        state.loading = false;
      })
      .addCase(reviewPropertyUpdate.fulfilled, (state, action) => {
        state.updates = state.updates.filter(
          (item) => item.id !== action.payload.requestId
        );
      });
  },
});

export default propertyUpdateSlice.reducer;
