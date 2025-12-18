import React, { createContext, useState, useEffect } from 'react';

const SubscriptionContext = createContext();

const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://api.nearprop.com',
  apiPrefix: 'api',
};

export function SubscriptionProvider({ children }) {
  const [canAddProperty, setCanAddProperty] = useState(null);
  const [loadingCanAddProperty, setLoadingCanAddProperty] = useState(true);
  const [error, setError] = useState(null);

  const checkCanAddProperty = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not logged in. Token not found.');
      }

      const response = await fetch(`${API_CONFIG.baseUrl}/${API_CONFIG.apiPrefix}/subscriptions/can-add-property`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check can-add-property: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Can-add-property response:', data);
      setCanAddProperty(data.canAddProperty); // Adjust if response structure differs, e.g., data.data.canAddProperty
    } catch (err) {
      console.error('Can-add-property error:', err);
      setError(err.message);
    } finally {
      setLoadingCanAddProperty(false);
    }
  };

  useEffect(() => {
    checkCanAddProperty();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ canAddProperty, loadingCanAddProperty, error, checkCanAddProperty }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export default SubscriptionContext;