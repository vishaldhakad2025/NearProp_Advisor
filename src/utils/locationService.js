function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    deviceMemory: navigator.deviceMemory || 'Unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio,
    },
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
  };
}

const info = getDeviceInfo();
// console.log("📱 Device Info:", info);

export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("❌ Geolocation not supported"));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error("⏳ Location request timed out"));
    }, options.timeout || 1500); // default 15s timeout

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        resolve(pos);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: options.timeout || 15000,
        ...options,
      }
    );
  });
};


export const fetchNearbyPlaces = async (lat, lng, apiKey, {
  radius = 1500,
  type = "restaurant",
  keyword = ""
} = {}) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK") {
      return data.results; // array of places
    } else {
      throw new Error(data.error_message || "Nearby search failed");
    }
  } catch (error) {
    console.error("Error fetching nearby places:", error);
    throw error;
  }
};


// utils/fetchAddress.js
export const fetchAddressFromGoogle = async (lat, lng, apiKey) => {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  );
  const data = await res.json();
  console.log("📍 Google Maps API result:", data);

  if (!data.results || !data.results.length) {
    throw new Error("No location results found");
  }

  // ✅ Most accurate result (house/street if available)
  const detailedResult =
    data.results.find((r) => r.types.includes("street_address")) ||
    data.results.find((r) => r.types.includes("premise")) ||
    // data.results.find((r) => r.types.includes("route")) ||
    data.results[0];

  const fullAddress = detailedResult.formatted_address;

  let houseNumber = "";
  let colony = "";

  detailedResult.address_components.forEach((comp) => {
    if (comp.types.includes("street_number")) {
      houseNumber = comp.long_name;
    }
    if (
      comp.types.includes("sublocality") ||
      comp.types.includes("sublocality_level_1") ||
      comp.types.includes("neighborhood")
    ) {
      colony = comp.long_name;
    }
  });

  return { fullAddress, houseNumber, colony, components: detailedResult.address_components };
};




export const fetchDistrictIdFromGoogle = async (lat, lng, apiKey) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  );

  const data = await response.json();
  console.log("📍 Google Maps API result:", data);

  if (!data.results || !data.results.length) {
    throw new Error('No location results found');
  }

  const components = data.results[0].address_components;

  const districtComponent =
    components.find((comp) =>
      comp.types.includes('administrative_area_level_3')
    ) ||
    components.find((comp) =>
      comp.types.includes('administrative_area_level_2')
    ) ||
    components.find((comp) =>
      comp.types.includes('locality')
    );

  const districtName = districtComponent?.long_name || 'Unknown District';

  return { districtName };
};
export const getDistrictIdByName = (districtName, districts = []) => {
  if (!districtName || !districts.length) return 0;

  const normalize = (str) =>
    str?.toLowerCase().replace(/[^a-z]/g, '');

  const normalizedDistrictName = normalize(districtName);

  const match = districts.find((district) => {
    const normalizedName = normalize(district.name);
    return (
      normalizedName === normalizedDistrictName ||
      normalizedName.includes(normalizedDistrictName) ||
      normalizedDistrictName.includes(normalizedName)
    );
  });

  return match?.id || 0;
};
