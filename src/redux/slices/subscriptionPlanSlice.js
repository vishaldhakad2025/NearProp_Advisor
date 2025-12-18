import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { toastError } from "../../utils/toast";

const apiPrefix = "/api";

// ✅ Get All Subscription Plans
export const getAllSubscriptionPlans = createAsyncThunk(
    "subscriptionPlans/getAll",
    async ({ page = 0, size = 10 } = {}, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(
                `${apiPrefix}/subscriptions/plans`
            );
            console.log(res)
            return res.data.data;
        } catch (err) {
            console.error(err)
            toastError("Failed to load plans.");
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// ✅ Get Single Plan
export const getSingleSubscriptionPlan = createAsyncThunk(
    "subscriptionPlans/getOne",
    async (planId, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`${apiPrefix}/admin/subscription-plans/${planId}`);
            console.log(res)
            return res.data.data;
        } catch (err) {
            toastError("Failed to fetch plan.");
            console.error("err", err)
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);






const subscriptionPlanSlice = createSlice({
    name: "subscriptionPlans",
    initialState: {
        plans: [],
        singlePlan: null,
        loading: false,
        totalElements: 0,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllSubscriptionPlans.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllSubscriptionPlans.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = action.payload;
                state.totalElements = action.payload.totalElements;
            })
            .addCase(getAllSubscriptionPlans.rejected, (state) => {
                state.loading = false;
            })

            .addCase(getSingleSubscriptionPlan.pending, (state) => {
                state.loading = true;
            })
            .addCase(getSingleSubscriptionPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.singlePlan = action.payload;
            })
            .addCase(getSingleSubscriptionPlan.rejected, (state) => {
                state.loading = false;
            })
    },
});

export default subscriptionPlanSlice.reducer;
