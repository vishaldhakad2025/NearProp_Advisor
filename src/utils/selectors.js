// src/Components/selectors.js
import { createSelector } from 'reselect';

const getPropertiesState = (state) => state.properties || {};

export const selectPropertiesStatus = createSelector(
  [getPropertiesState],
  (properties) => ({
    loading: properties.loading ?? false,
    error: properties.error ?? null,
  })
);