import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { getLatest } from "../../api/services";
import LoadingSpinner from "../../components/LoadingSpinner";

const LatestProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    fetchLatestProducts();
  }, []);

  const fetchLatestProducts = async () => {
    try {
      setLoading(true);
      const response = await getLatest();
      console.log("Latest products response:", response);
      
      if (response.success && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error fetching latest products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className={`text-4xl md:text-5xl font-bold mb-4 transition-colors duration-300 ${
              colors[isDarkMode ? "dark" : "light"].text
            }`}
            style={{
              textShadow: isDarkMode ? "0 0 20px rgba(0, 229, 255, 0.5)" : "none",
            }}
          >
            LATEST PRODUCTS
          </h1>
          <p
            className={`text-xl max-w-2xl mx-auto transition-colors duration-300 ${
              colors[isDarkMode ? "dark" : "light"].textSecondary
            }`}
          >
            Browse our newest arrivals - fresh products just added to the marketplace
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className={`text-xl ${colors[isDarkMode ? "dark" : "light"].textSecondary}`}>
              No latest products available at the moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, index) => {
              const productId = product.product_id || product.id;
              const productName = product.name || product.title || product.product_name || `Product ${productId}`;
              const productImage = product.image || product.thumb || product.background_image || product.profile_image || '/no-image.png';
              const productPrice = product.price || product.price_formated || product.priceDisplay;
              const storeName = product.store_name || product.store;

              return (
                <Link
                  key={productId || index}
                  to={`/product/${productId}`}
                  className={`relative p-5 rounded-xl transition-all duration-300 hover:scale-105 group cursor-pointer block ${
                    isDarkMode ? "bg-white/3 backdrop-blur-md" : "bg-white/90 backdrop-blur-md"
                  }`}
                  style={{
                    border: isDarkMode ? "1px solid #00E5FF40" : "1px solid #e5e7eb",
                    boxShadow: isDarkMode
                      ? "0 0 20px rgba(0, 229, 255, 0.1), inset 0 0 20px rgba(0, 229, 255, 0.03)"
                      : "0 4px 12px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  {/* Product Image */}
                  <div
                    className="relative mb-4 overflow-hidden rounded-lg flex items-center justify-center p-4"
                    style={{ height: 200, background: isDarkMode ? '#1a1a1a' : '#f7fafc' }}
                  >
                    {productImage !== '/no-image.png' ? (
                      <img
                        src={productImage}
                        alt={productName}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = '/no-image.png';
                        }}
                      />
                    ) : (
                      <div className="text-6xl">📦</div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="text-center">
                    <h3
                      className={`text-base font-bold mb-2 line-clamp-2 transition-colors duration-300 ${
                        colors[isDarkMode ? "dark" : "light"].text
                      }`}
                      style={{
                        textShadow: isDarkMode ? "0 0 10px rgba(0, 229, 255, 0.3)" : "none",
                      }}
                    >
                      {productName}
                    </h3>

                    {/* Store Name */}
                    {storeName && (
                      <p
                        className={`text-xs mb-2 transition-colors duration-300 ${
                          colors[isDarkMode ? "dark" : "light"].textSecondary
                        }`}
                      >
                        🏪 {storeName}
                      </p>
                    )}

                    {/* Price */}
                    {productPrice && (
                      <div className="mb-3">
                        <span
                          className="text-xl font-bold"
                          style={{ color: isDarkMode ? "#00E5FF" : "#0891b2" }}
                        >
                          {productPrice}
                        </span>
                      </div>
                    )}

                    {/* View Details Button - No Add to Cart */}
                    <button
                      className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
                      style={{
                        background: isDarkMode
                          ? "linear-gradient(90deg, rgba(0, 229, 255, 0.2), rgba(0, 229, 255, 0.4))"
                          : "linear-gradient(90deg, rgba(8, 145, 178, 0.2), rgba(8, 145, 178, 0.4))",
                        border: isDarkMode ? "1px solid #00E5FF" : "1px solid #0891b2",
                        color: isDarkMode ? "white" : "#0891b2",
                        boxShadow: isDarkMode
                          ? "0 0 15px rgba(0, 229, 255, 0.2)"
                          : "0 0 15px rgba(8, 145, 178, 0.2)",
                      }}
                    >
                      VIEW DETAILS
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestProductsPage;
