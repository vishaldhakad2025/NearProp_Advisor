import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { toastError, toastSuccess } from "../../utils/toast";

/* -------------------------------------------------------------------------- */
/* ✅ Add Property                                                            */
/* -------------------------------------------------------------------------- */
export const addProperty = createAsyncThunk(
  "properties/addProperty",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/properties", formData);
      console.log("response ", res);
      toastSuccess("Property added successfully");
      return res.data;
    } catch (err) {
      console.error("error ", err);
      toastError("Failed to add property");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Fetch All Properties (Public)                                           */
/* -------------------------------------------------------------------------- */
export const getAllProperties = createAsyncThunk(
  "properties/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/public/properties");
      return res.data.data;
    } catch (err) {
      toastError("Failed to fetch properties");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Get Single Property by ID                                               */
/* -------------------------------------------------------------------------- */
export const getPropertyById = createAsyncThunk(
  "properties/getById",
  async (propertyId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/properties/${propertyId}`);
      return res.data;
    } catch (err) {
      toastError("Failed to load property");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Get My Properties (Private - logged-in user)                            */
/* -------------------------------------------------------------------------- */
export const getMyProperties = createAsyncThunk(
  "properties/getMyProperties",
  async (
    { page = 0, size = 10, sortBy = "createdAt", direction = "DESC" },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.get(`/api/properties/my-properties`, {
        params: { page, size, sortBy, direction },
      });

      return res.data;
    } catch (err) {
      console.error(err);
      toastError("Failed to fetch your properties");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Update Property Stock                                                   */
/* -------------------------------------------------------------------------- */
export const updatePropertyStock = createAsyncThunk(
  "properties/updateStock",
  async ({ propertyId, stock }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/properties/${propertyId}/update-stock`,
        {},
        { params: { stock } }
      );
      toastSuccess("Stock updated successfully");
      console.log(res);
      return res.data;
    } catch (err) {
      console.error(err);
      toastError("Failed to update stock");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Fetch visits for a property                                             */
/* -------------------------------------------------------------------------- */
export const fetchVisitsByProperty = createAsyncThunk(
  "property/fetchVisitsByProperty",
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/v1/visits/my-properties`, {
        params: { page: 0, size: 10, sortBy: "scheduledTime", direction: "ASC" },
      });
      return response.data.content.filter(
        (visit) => visit.property.id === parseInt(propertyId)
      );
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch visits");
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Fetch reviews for a property                                            */
/* -------------------------------------------------------------------------- */
export const fetchReviewsByProperty = createAsyncThunk(
  "property/fetchReviewsByProperty",
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/api/v1/reviews/property/${propertyId}`,
        {
          params: {
            page: 0,
            size: 10,
            sortBy: "createdAt",
            direction: "DESC",
          },
        }
      );
      return response.data.content;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch reviews");
    }
  }
);

/* -------------------------------------------------------------------------- */
/* ✅ Fetch reels for a property                                              */
/* API: GET /api/reels/property/?page=0&size=10&sortBy=createdAt&direction=DESC */
/* -------------------------------------------------------------------------- */
export const fetchReelsByProperty = createAsyncThunk(
  "property/fetchReelsByProperty",
  async ({ propertyId, page = 0, size = 10 }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/reels/property/${propertyId}`, {
        params: { page, size, sortBy: "createdAt", direction: "DESC" },
        headers: {

          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // 🔎 If backend requires filtering by propertyId, filter manually
      const filteredReels = response.data?.content
      return filteredReels || [];
    } catch (error) {
      console.error(error)
      return rejectWithValue(error.response?.data || "Failed to fetch reels");
    }
  }
);


// ✅ Delete Property
export const deleteProperty = createAsyncThunk(
  "properties/delete",
  async (propertyId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/properties/${propertyId}`);
      toastSuccess("Property deleted successfully");
      return propertyId; // return id so slice can remove it
    } catch (err) {
      console.error("Delete property error:", err);
      toastError("Failed to delete property");
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


const propertySlice = createSlice({
  name: "properties",
  initialState: {
    all: [],
    selectedProperty: null,
    myProperties: [],
    loading: false,
    error: null,
    visits: [],
    reviews: [],
    reels: [], // ✅ Added reels state
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ------------------------------- Add Property ------------------------------ */
      .addCase(addProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.all.unshift(action.payload.data);
      })
      .addCase(addProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ------------------------------ Get All Properties ----------------------------- */
      .addCase(getAllProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.all = action.payload;
      })
      .addCase(getAllProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ------------------------------ My Properties ----------------------------- */
      .addCase(getMyProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.myProperties = action.payload?.data || [];
      })
      .addCase(getMyProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ------------------------------ Update Stock ----------------------------- */
      .addCase(updatePropertyStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePropertyStock.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePropertyStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      /* --------------------------- Get Property by ID -------------------------- */
      .addCase(getPropertyById.pending, (state) => {
        state.loading = true;
        state.selectedProperty = null;
      })
      .addCase(getPropertyById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProperty = action.payload;
      })
      .addCase(getPropertyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ------------------------------ Visits ----------------------------- */
      .addCase(fetchVisitsByProperty.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVisitsByProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.visits = action.payload;
      })
      .addCase(fetchVisitsByProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ------------------------------ Reviews ----------------------------- */
      .addCase(fetchReviewsByProperty.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReviewsByProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchReviewsByProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ------------------------------ Reels ----------------------------- */
      .addCase(fetchReelsByProperty.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReelsByProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.reels = action.payload;
      })
      .addCase(fetchReelsByProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // deleted property 

      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.myProperties = state.myProperties.filter(
          (property) => property.id !== action.payload
        );
        state.all = state.all.filter((property) => property.id !== action.payload);
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.error = action.payload;
      });

  },
});

export default propertySlice.reducer;
