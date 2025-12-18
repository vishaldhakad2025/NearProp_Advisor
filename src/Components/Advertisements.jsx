// // import { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import {
//   fetchAdvertisementsByDistrict,
//   trackAdClick,
// } from '../redux/slices/advertisementSlice';
// import './Advertisements.css';

// const ContactLink = ({ label, href, onClick, children }) => (
//   <p>
//     <strong>{label}:</strong>{' '}
//     <a
//       href={href}
//       target={href.startsWith('http') ? '_blank' : '_self'}
//       rel="noopener noreferrer"
//       onClick={onClick}
//     >
//       {children}
//     </a>
//   </p>
// );

// const SocialLink = ({ platform, url, adId, dispatch }) =>
//   url ? (
//     <a
//       href={url}
//       target="_blank"
//       rel="noopener noreferrer"
//       onClick={() => dispatch(trackAdClick({ adId, platform }))}
//     >
//       {platform.charAt(0).toUpperCase() + platform.slice(1)}
//     </a>
//   ) : null;

// const Advertisements = () => {
//   const dispatch = useDispatch();
//   const { items, status, error } = useSelector((state) => state.advertisements);

//   useEffect(() => {
//     const locationData = JSON.parse(localStorage.getItem('userLocationData'));
//     if (locationData?.districtName) {
//       console.log('District from localStorage:', locationData.districtName);
//       dispatch(fetchAdvertisementsByDistrict({ districtName: locationData.districtName }));
//     } else {
//       console.warn('No districtName found in userLocationData');
//     }
//   }, [dispatch]);

//   if (status === 'loading') return <p>Loading advertisements...</p>;
//   if (status === 'failed') return <p>Error loading ads: {error}</p>;

//   return (
//     <div className="ads-sidebar">
//       <h2 className="ads-title">Featured Ads</h2>

//       {items.length === 0 && <p>No ads found for your district.</p>}

//       {items.map((ad) => (
//         <div className="ad-card" key={ad.id}>
//           <img src={ad.bannerImageUrl} alt={ad.title} className="ad-image" />
//           <div className="ad-content">
//             <h3>{ad.title}</h3>
//             <p>{ad.description}</p>

//             {ad.phoneNumber && (
//               <ContactLink
//                 label="Phone"
//                 href={`tel:${ad.phoneNumber}`}
//                 onClick={() => dispatch(trackAdClick({ adId: ad.id, platform: 'phone' }))}
//               >
//                 {ad.phoneNumber}
//               </ContactLink>
//             )}
//             {ad.whatsappNumber && (
//               <ContactLink
//                 label="WhatsApp"
//                 href={`https://wa.me/${ad.whatsappNumber}`}
//                 onClick={() => dispatch(trackAdClick({ adId: ad.id, platform: 'whatsapp' }))}
//               >
//                 {ad.whatsappNumber}
//               </ContactLink>
//             )}
//             {ad.emailAddress && (
//               <ContactLink
//                 label="Email"
//                 href={`mailto:${ad.emailAddress}`}
//                 onClick={() => dispatch(trackAdClick({ adId: ad.id, platform: 'email' }))}
//               >
//                 {ad.emailAddress}
//               </ContactLink>
//             )}
//             {ad.websiteUrl && (
//               <ContactLink
//                 label="Website"
//                 href={ad.websiteUrl}
//                 onClick={() => dispatch(trackAdClick({ adId: ad.id, platform: 'website' }))}
//               >
//                 {ad.websiteUrl}
//               </ContactLink>
//             )}

//             <div className="ad-socials">
//               <SocialLink platform="facebook" url={ad.facebookUrl} adId={ad.id} dispatch={dispatch} />
//               <SocialLink platform="instagram" url={ad.instagramUrl} adId={ad.id} dispatch={dispatch} />
//               <SocialLink platform="twitter" url={ad.twitterUrl} adId={ad.id} dispatch={dispatch} />
//               <SocialLink platform="linkedin" url={ad.linkedinUrl} adId={ad.id} dispatch={dispatch} />
//               <SocialLink platform="youtube" url={ad.youtubeUrl} adId={ad.id} dispatch={dispatch} />
//             </div>

//             {ad.websiteUrl && (
//               <a
//                 href={ad.websiteUrl}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 onClick={() => dispatch(trackAdClick({ adId: ad.id, platform: 'website' }))}
//               >
//                 <button className="ad-button">Learn More</button>
//               </a>
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default Advertisements;
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdvertisementsByDistrict,
  trackAdClick,
} from '../redux/slices/advertisementSlice';
import './Advertisements.css';

const ContactLink = ({ label, href, onClick, children }) => (
  <p>
    <strong>{label}:</strong>{' '}
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : '_self'}
      rel="noopener noreferrer"
      onClick={onClick}
    >
      {children}
    </a>
  </p>
);

const SocialLink = ({ platform, url, adId, dispatch }) =>
  url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => dispatch(trackAdClick({ adId, platform }))}
    >
      {platform.charAt(0).toUpperCase() + platform.slice(1)}
    </a>
  ) : null;

const Advertisements = () => {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.advertisements);

  useEffect(() => {
    const locationData = JSON.parse(localStorage.getItem('userLocationData'));
    if (locationData?.districtName) {
      console.log('District from localStorage:', locationData.districtName);
      dispatch(
        fetchAdvertisementsByDistrict({ districtName: locationData.districtName })
      );
    } else {
      console.warn('No districtName found in userLocationData');
    }
  }, [dispatch]);

  if (status === 'loading') return <div className="spinner">Loading advertisements...</div>;
  if (status === 'failed') return <div className="error">Error loading ads: {error}</div>;

  // 🔹 Static fallback ad
  const fallbackAd = {
    id: 'static-1',
    title: 'NearProp Featured Ad',
    description:
      'Own your dream home in the holy city of Ujjain! This beautifully designed 3 BHK independent house is located near [Famous Landmark/Main Road/Temple], offering both comfort and convenience. The property features spacious rooms, modern interiors, 24x7 water supply, and parking space. Perfect for families looking for a peaceful lifestyle with all amenities nearby.',
    bannerImageUrl: 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHByb3BlcnR5fGVufDB8fDB8fHww', // Put a default image inside /public/images/
    phoneNumber: '9876543210',
    whatsappNumber: '9876543210',
    emailAddress: 'info@nearprop.com',
    websiteUrl: 'https://nearprop.com',
  };

  // Ads to display (API ads or fallback)
  const adsToRender = items.length > 0 ? items : [fallbackAd];

  return (
    <div className="ads-sidebar">
      <h2 className="ads-title">Featured Ads</h2>

      {adsToRender.map((ad) => (
        <div className="ad-card" key={ad.id}>
          <img src={ad.bannerImageUrl} alt={ad.title} className="ad-image" />
          <div className="ad-content">
            <h3>{ad.title}</h3>
            <p>{ad.description}</p>

            {ad.phoneNumber && (
              <ContactLink
                label="Phone"
                href={`tel:${ad.phoneNumber}`}
                onClick={() =>
                  dispatch(trackAdClick({ adId: ad.id, platform: 'phone' }))
                }
              >
                {ad.phoneNumber}
              </ContactLink>
            )}
            {ad.whatsappNumber && (
              <ContactLink
                label="WhatsApp"
                href={`https://wa.me/${ad.whatsappNumber}`}
                onClick={() =>
                  dispatch(trackAdClick({ adId: ad.id, platform: 'whatsapp' }))
                }
              >
                {ad.whatsappNumber}
              </ContactLink>
            )}
            {ad.emailAddress && (
              <ContactLink
                label="Email"
                href={`mailto:${ad.emailAddress}`}
                onClick={() =>
                  dispatch(trackAdClick({ adId: ad.id, platform: 'email' }))
                }
              >
                {ad.emailAddress}
              </ContactLink>
            )}
            {ad.websiteUrl && (
              <ContactLink
                label="Website"
                href={ad.websiteUrl}
                onClick={() =>
                  dispatch(trackAdClick({ adId: ad.id, platform: 'website' }))
                }
              >
                {ad.websiteUrl}
              </ContactLink>
            )}

            <div className="ad-socials">
              <SocialLink
                platform="facebook"
                url={ad.facebookUrl}
                adId={ad.id}
                dispatch={dispatch}
              />
              <SocialLink
                platform="instagram"
                url={ad.instagramUrl}
                adId={ad.id}
                dispatch={dispatch}
              />
              <SocialLink
                platform="twitter"
                url={ad.twitterUrl}
                adId={ad.id}
                dispatch={dispatch}
              />
              <SocialLink
                platform="linkedin"
                url={ad.linkedinUrl}
                adId={ad.id}
                dispatch={dispatch}
              />
              <SocialLink
                platform="youtube"
                url={ad.youtubeUrl}
                adId={ad.id}
                dispatch={dispatch}
              />
            </div>

            {ad.websiteUrl && (
              <a
                href={ad.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  dispatch(trackAdClick({ adId: ad.id, platform: 'website' }))
                }
              >
                <button className="ad-button">Learn More</button>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Advertisements;
