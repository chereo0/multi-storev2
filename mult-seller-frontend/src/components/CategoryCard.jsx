import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  if (!category) return null;
  const { name, slug, image, icon } = category;
  return (
    <Link
      to={`/category/${slug}`}
      className="block bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group"
    >
      <div className="relative">
        <img src={image} alt={name} loading="lazy" className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
        {icon && (
          <div className="absolute top-3 left-3 text-white text-2xl drop-shadow">{icon}</div>
        )}
      </div>
      <div className="p-4 text-center">
        <h4 className="font-semibold text-text group-hover:text-primary transition-colors">{name}</h4>
      </div>
    </Link>
  );
};

export default CategoryCard;



