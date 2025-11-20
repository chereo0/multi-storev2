import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "h-8" }) => {
  const logoSrc = `${process.env.PUBLIC_URL}/logo-multi-store.png`;
  return (
    <Link to="/home" className="flex items-center space-x-3">
      <img
        src={logoSrc}
        alt="multi-store"
        className={`${className} w-auto select-none`}
        onError={(e) => {
          // fallback to text if image not found yet
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextSibling;
          if (fallback) fallback.style.display = 'inline-flex';
        }}
      />
      <span
        style={{ display: 'none' }}
        className="items-center justify-center rounded-full bg-[#5e503f] text-[#eae0d5] font-bold text-xl w-10 h-10"
      >
        M
      </span>
      <span className="text-white font-bold text-xl tracking-tight">multi-store</span>
    </Link>
  );
};

export default Logo;

