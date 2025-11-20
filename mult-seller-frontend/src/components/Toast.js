import React from 'react';

const Toast = ({ show, title, message, type = 'success' }) => {
  return (
    <div className={`fixed top-6 right-6 z-50 transform transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
      <div className={`max-w-sm w-full shadow-lg rounded-lg overflow-hidden ring-1 ring-black/5 bg-white`}>
        <div className="p-4 flex items-start">
          <div className={`flex-shrink-0 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {type === 'success' ? '✅' : '⚠️'}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-semibold text-text">{title}</p>
            <p className="mt-1 text-sm text-muted">{message}</p>
          </div>
        </div>
        <div className={`h-1 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-[shrink_2s_linear_forwards]`} />
      </div>
      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
};

export default Toast;



