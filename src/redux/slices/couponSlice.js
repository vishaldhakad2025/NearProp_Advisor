// ✅ redux/slices/couponSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { toastSuccess, toastError } from "../../utils/toast";

const apiPrefix = "/api";

// ✅ Create Coupon
export const createCoupon = createAsyncThunk(
  "coupons/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`${apiPrefix}/admin/coupons`, payload);
      toastSuccess("Coupon created successfully.");
      return res.data;
    } catch (err) {
      toastError("Failed to create coupon.");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Get All Coupons
export const getAllCoupons = createAsyncThunk(
  "coupons/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`${apiPrefix}/admin/coupons`);
      return res.data.data;
    } catch (err) {
      toastError("Failed to load coupons.");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Get Single Coupon
export const getSingleCoupon = createAsyncThunk(
  "coupons/getOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`${apiPrefix}/admin/coupons/${id}`);
      console.log("res",res)
      return res.data.data;
    } catch (err) {
      toastError("Failed to fetch coupon.");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Update Coupon
export const updateCoupon = createAsyncThunk(
  "coupons/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`${apiPrefix}/admin/coupons/${id}`, data);
      toastSuccess("Coupon updated successfully.");
      return res.data;
    } catch (err) {
      toastError("Failed to update coupon.");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Toggle Active/Inactive
export const toggleCouponStatus = createAsyncThunk(
  "coupons/toggleStatus",
  async ({ id, active }, { rejectWithValue }) => {
    try {
      const status = active ? "deactivate" : "activate";
      const res = await axiosInstance.put(`${apiPrefix}/admin/coupons/${id}/${status}`);
      toastSuccess(`Coupon ${active ? "deactivated" : "activated"} successfully.`);
      return { id, active: !active };
    } catch (err) {
      toastError("Failed to update coupon status.");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Delete Coupon
export const deleteCoupon = createAsyncThunk(
  "coupons/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${apiPrefix}/admin/coupons/${id}`);
      toastSuccess("Coupon deleted successfully.");
      return id;
    } catch (err) {
      toastError("Failed to delete coupon.");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const couponSlice = createSlice({
  name: "coupons",
  initialState: {
    coupons: [],
    singleCoupon: null,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllCoupons.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload;
      })
      .addCase(getAllCoupons.rejected, (state) => {
        state.loading = false;
      })

      .addCase(getSingleCoupon.fulfilled, (state, action) => {
        state.singleCoupon = action.payload;
      })

      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        const index = state.coupons.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.coupons[index].active = action.payload.active;
      })

      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter((c) => c.id !== action.payload);
      });
  },
});

export default couponSlice.reducer;
