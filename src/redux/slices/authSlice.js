import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

const authPrefix = "api/v1/auth";
const userPrefix = "api/v1/users";

// Send OTP
export const sendOtp = createAsyncThunk("auth/sendOtp", async (mobileNumber, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(`${authPrefix}/login`, {
      mobileNumber,
      deviceInfo: "web-client",
    });
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});


// ✅ Verify OTP and store token with role validation
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ mobileNumber, otp }, { rejectWithValue }) => {
    console.log("---------------------------API Call: verifyOtp", { mobileNumber, otp });
    try {
      const res = await axiosInstance.post(`${authPrefix}/verify-otp`, {
        identifier: mobileNumber,
        code: otp,
        type: "MOBILE",
        deviceInfo: "web-client",
      });

      const { token, userId, roles } = res.data.data;

      // ✅ Save token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("roles", JSON.stringify(roles)); // save roles array
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { token, roles }; // ✅ return roles for validation
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);


// Fetch User Profile after verifying OTP
export const fetchUserProfile = createAsyncThunk("auth/fetchUserProfile", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`${userPrefix}/profile`);
    console.log("Fetched user profile:", res.data.data);
    return res.data.data;

  } catch (error) {
    return rejectWithValue(error.response?.data || { message: error.message });
  }
});


// Update Profile
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`api/v1/users/profile-update`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data; // updated user data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null, // Full profile
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.clear();
      delete axiosInstance.defaults.headers.common["Authorization"];
    },
    setCredentials: (state, action) => {
      const { token, ...user } = action.payload;
      state.user = user;
      state.token = token;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload }; // merge updated fields
        localStorage.setItem("user", JSON.stringify(state.user));
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
