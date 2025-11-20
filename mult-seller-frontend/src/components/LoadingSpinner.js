import React from 'react';

const LoadingSpinner = ({ size = 'h-32 w-32', color = 'border-primary' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className={`animate-spin rounded-full ${size} border-b-2 ${color}`}></div>
    </div>
  );
};

export default LoadingSpinner;

