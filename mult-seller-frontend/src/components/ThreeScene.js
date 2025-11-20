import React, { useState, useEffect } from 'react';

// Simple CSS-based animated background replacement
export default function ThreeScene({ formInteraction = 0 }) {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate random stars for the background
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          animationDelay: Math.random() * 3,
          animationDuration: Math.random() * 4 + 2
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(45deg, 
            rgba(0, 229, 255, 0.1) 0%, 
            rgba(255, 0, 255, 0.1) 25%, 
            rgba(0, 229, 255, 0.05) 50%, 
            rgba(255, 0, 255, 0.1) 75%, 
            rgba(0, 229, 255, 0.1) 100%)`,
          animation: 'gradientShift 8s ease-in-out infinite'
        }}
      />
      
      {/* Floating geometric shapes */}
      <div className="absolute inset-0">
        {/* Floating circles */}
        <div 
          className="absolute w-4 h-4 rounded-full opacity-20"
          style={{
            background: 'linear-gradient(45deg, #00E5FF, #FF00FF)',
            left: '20%',
            top: '30%',
            animation: `float 6s ease-in-out infinite, pulse 3s ease-in-out infinite`,
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute w-6 h-6 rounded-full opacity-15"
          style={{
            background: 'linear-gradient(45deg, #FF00FF, #00E5FF)',
            right: '25%',
            top: '60%',
            animation: `float 8s ease-in-out infinite, pulse 4s ease-in-out infinite`,
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute w-3 h-3 rounded-full opacity-25"
          style={{
            background: 'linear-gradient(45deg, #00E5FF, #FF00FF)',
            left: '70%',
            top: '20%',
            animation: `float 7s ease-in-out infinite, pulse 2.5s ease-in-out infinite`,
            animationDelay: '1s'
          }}
        />
        
        {/* Floating squares */}
        <div 
          className="absolute w-5 h-5 opacity-20"
          style={{
            background: 'linear-gradient(45deg, #FF00FF, #00E5FF)',
            left: '15%',
            top: '70%',
            transform: 'rotate(45deg)',
            animation: `float 9s ease-in-out infinite, rotate 10s linear infinite`,
            animationDelay: '3s'
          }}
        />
        <div 
          className="absolute w-4 h-4 opacity-15"
          style={{
            background: 'linear-gradient(45deg, #00E5FF, #FF00FF)',
            right: '15%',
            top: '40%',
            transform: 'rotate(45deg)',
            animation: `float 5s ease-in-out infinite, rotate 8s linear infinite`,
            animationDelay: '1.5s'
          }}
        />
      </div>

      {/* Animated stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `twinkle ${star.animationDuration}s ease-in-out infinite`,
              animationDelay: `${star.animationDelay}s`
            }}
          />
        ))}
      </div>

      {/* Interactive elements based on form interaction */}
      {formInteraction > 0 && (
        <div className="absolute inset-0">
          {/* Pulsing rings */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${100 + formInteraction * 20}px`,
              height: `${100 + formInteraction * 20}px`,
              border: '2px solid rgba(0, 229, 255, 0.3)',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${150 + formInteraction * 30}px`,
              height: `${150 + formInteraction * 30}px`,
              border: '1px solid rgba(255, 0, 255, 0.2)',
              borderRadius: '50%',
              animation: 'pulse 3s ease-in-out infinite',
              animationDelay: '1s'
            }}
          />
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { 
            background: linear-gradient(45deg, 
              rgba(0, 229, 255, 0.1) 0%, 
              rgba(255, 0, 255, 0.1) 25%, 
              rgba(0, 229, 255, 0.05) 50%, 
              rgba(255, 0, 255, 0.1) 75%, 
              rgba(0, 229, 255, 0.1) 100%);
          }
          50% { 
            background: linear-gradient(45deg, 
              rgba(255, 0, 255, 0.1) 0%, 
              rgba(0, 229, 255, 0.1) 25%, 
              rgba(255, 0, 255, 0.05) 50%, 
              rgba(0, 229, 255, 0.1) 75%, 
              rgba(255, 0, 255, 0.1) 100%);
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
          }
          25% { 
            transform: translateY(-20px) translateX(10px); 
          }
          50% { 
            transform: translateY(-10px) translateX(-5px); 
          }
          75% { 
            transform: translateY(-30px) translateX(15px); 
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.2; 
          }
          50% { 
            transform: scale(1.2); 
            opacity: 0.4; 
          }
        }
        
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.2; 
            transform: scale(1); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2); 
          }
        }
        
        @keyframes rotate {
          from { 
            transform: rotate(0deg); 
          }
          to { 
            transform: rotate(360deg); 
          }
        }
  `}</style>
    </div>
  );
}