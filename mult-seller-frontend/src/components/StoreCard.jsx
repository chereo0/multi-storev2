import React from 'react';
import { Link } from 'react-router-dom';

const StoreCard = ({ store }) => {
  if (!store) return null;
  return (
    <Link to={`/store/${store.id}`} className="block bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group">
      <div className="relative">
        <img src={store.banner} alt={store.name} loading="lazy" className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition" />
        {/* Always render a profile image with fallbacks to handle different backend shapes */}
        <img
          src={
            store.logo || store.raw?.profile_image || store.raw?.logo || store.profile_image || '/no-image.png'
          }
          alt={store.name}
          loading="lazy"
          onError={(e) => {
            try {
              e.currentTarget.src = '/no-image.png';
            } catch (err) {}
          }}
          className="w-14 h-14 rounded-full border-4 border-white shadow absolute -bottom-7 left-4"
        />
      </div>
      <div className="pt-9 px-4 pb-4">
        <h3 className="text-lg font-bold text-text group-hover:text-primary transition-colors">{store.name}</h3>
        <p className="text-sm text-muted line-clamp-2">{store.description}</p>
      </div>
    </Link>
  );
};

export default StoreCard;



