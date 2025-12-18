// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import propertyReducer from './slices/propertySlice';
import propertyUpdateReducer from './slices/propertyUpdateSlice';
import subscriptionPlansReducer from './slices/subscriptionPlanSlice';
import couponReducer from './slices/couponSlice';
import reelReducer from './slices/reelSlice';
import chatReducer from './slices/chatSlice';
import advertisementReducer from './slices/advertisementSlice';
import visitReducer from './slices/visitSlice';
import reviewReducer from './slices/reviewSlice';
import districtsReducer from './slices/districtSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    property: propertyReducer,
    propertyUpdates: propertyUpdateReducer,
    subscriptionPlans: subscriptionPlansReducer,
    coupons: couponReducer,
    reel: reelReducer,
    chat: chatReducer,
    advertisements: advertisementReducer,
    visits: visitReducer,
    reviews: reviewReducer,
    districts: districtsReducer,
  },
});

export default store;