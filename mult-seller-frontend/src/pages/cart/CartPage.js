import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import {
  confirmCheckout,
  submitOrder,
  getShippingMethods,
  selectShippingMethod,
  getPaymentMethods,
  selectPaymentMethod,
  getUserAddresses
} from '../../api/services';

const CartPage = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [stars, setStars] = useState([]);
  // Checkout selections
  const [shippingMethods, setShippingMethods] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedShippingCode, setSelectedShippingCode] = useState('');
  const [selectedPaymentCode, setSelectedPaymentCode] = useState('');
  const [shippingComment, setShippingComment] = useState('');
  const [paymentComment, setPaymentComment] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const { isGuest } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getCartItemsByStore 
  } = useCart();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Generate starfield for dark mode
  useEffect(() => {
    if (isDarkMode) {
      const newStars = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * 2 + 1
      }));
      setStars(newStars);
    }
  }, [isDarkMode]);

  // Fetch shipping/payment methods and addresses when entering checkout
  useEffect(() => {
    const fetchData = async () => {
      if (!showCheckout) return;
      try {
        setLoading(true);
        const [ship, pay, addr] = await Promise.all([
          getShippingMethods(),
          getPaymentMethods(),
          getUserAddresses(),
        ]);
        if (ship?.success) {
          const list = Array.isArray(ship.data) ? ship.data : [];
          setShippingMethods(list);
          const def = list.find(m => m.selected || m.default || m.is_default) || list[0];
          if (def && def.code) setSelectedShippingCode(def.code);
        }
        if (pay?.success) {
          const list = Array.isArray(pay.data) ? pay.data : [];
          setPaymentMethods(list);
          const def = list.find(m => m.default || m.is_default || m.selected) || list[0];
          if (def) setSelectedPaymentCode(def.code || def.id || def.method || '');
        }
        if (addr?.success && addr.data) {
          const list = Array.isArray(addr.data) ? addr.data : [addr.data];
          setAddresses(list);
          if (list.length > 0) setSelectedAddressId(list[0].id || list[0].address_id || '');
        }
      } catch (e) {
        console.warn('Checkout init failed:', e?.message || e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showCheckout]);

  // No customer information form fields required

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (isGuest) {
      navigate('/signup');
      return;
    }
    setLoading(true);
    try {
      // 1) Select shipping method
      if (selectedShippingCode) {
        console.log('🛒 Setting shipping method:', selectedShippingCode);
        const shipRes = await selectShippingMethod(selectedShippingCode);
        if (!shipRes.success) {
          console.error('❌ Shipping error:', shipRes);
          throw new Error(shipRes.error || 'Failed to set shipping method');
        }
        console.log('✅ Shipping method set');
      } else {
        throw new Error('No shipping method selected');
      }
      // 2) Select payment method (spec: paymentmethod & agree=1 & comment)
      if (selectedPaymentCode) {
        const payRes = await selectPaymentMethod(selectedPaymentCode, paymentComment || "");
        if (!payRes.success) throw new Error('Failed to set payment method');
      } else {
        throw new Error('No payment method selected');
      }
      // 3) Confirm order (address_id if available)
      const confirmRes = await confirmCheckout(selectedAddressId || null);
      if (confirmRes && confirmRes.success) {
        const data = confirmRes.data || {};
        setOrderDetails({
          orderId: data.order_id || data.orderId || data.id || Math.floor(Math.random() * 1000000),
          message: data.message || 'Order placed successfully',
          estimatedDelivery: data.estimatedDelivery || '3-5 business days'
        });
        setOrderSubmitted(true);
        clearCart();
      } else {
        // Fallback: local submit mock
        const result = await submitOrder({ items: cartItems, total: getCartTotal() });
        if (result.success) {
          setOrderDetails(result.data);
          setOrderSubmitted(true);
          clearCart();
        } else {
          throw new Error(result?.error || result?.message || 'Order failed');
        }
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(error?.message || 'Error submitting order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cartItemsByStore = getCartItemsByStore();

  // Order success page
  if (orderSubmitted) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-900' : ''
        }`}
        style={!isDarkMode ? {
          backgroundImage: 'url(/white%20backgroud.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        } : {}}
      >
        <div className={`max-w-md w-full rounded-2xl p-8 text-center backdrop-blur-md transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/80 border border-cyan-400/30 shadow-2xl shadow-cyan-400/20' 
            : 'bg-white/90 border border-gray-200 shadow-xl'
        }`}>
          <div className="mb-6">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${
              isDarkMode ? 'bg-green-500/20 border border-green-400' : 'bg-green-100'
            }`}>
              <svg className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Order Placed Successfully!</h2>
          <p className={`mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your order #{orderDetails.orderId} has been placed successfully.
          </p>
          <p className={`mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {orderDetails.message}
          </p>
          <p className={`text-sm mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Estimated delivery: {orderDetails.estimatedDelivery}
          </p>
          <div className="space-y-3">
            <Link
              to="/home"
              className={`w-full px-4 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25' 
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
              }`}
            >
              Continue Shopping
            </Link>
            <button
              onClick={() => {
                setOrderSubmitted(false);
                setOrderDetails(null);
              }}
              className={`w-full px-4 py-3 rounded-full font-semibold transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart page
  if (cartItems.length === 0) {
    return (
      <div 
        className={`min-h-screen transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-900' : ''
        }`}
        style={!isDarkMode ? {
          backgroundImage: 'url(/white%20backgroud.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        } : {}}
      >
        {/* Starfield for dark mode */}
        {isDarkMode && (
          <div className="fixed inset-0 pointer-events-none">
            {stars.map(star => (
              <div
                key={star.id}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  animationDuration: `${star.twinkle}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Spacer for fixed navbar */}
        <div className="h-16"></div>

        {/* Empty Cart Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className={`mb-8 p-8 rounded-2xl backdrop-blur-md transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10' 
                : 'bg-white/80 border border-gray-200 shadow-xl'
            }`}>
              <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
              }`}>
                <svg className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </div>
              <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Your Cosmic Cart is Empty</h2>
              <p className={`text-lg mb-8 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Start your quantum shopping journey to add items to your cart</p>
            <Link
              to="/home"
                className={`inline-block px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25' 
                    : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                }`}
              >
                Explore the Multiverse
            </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : ''
      }`}
      style={!isDarkMode ? {
        backgroundImage: 'url(/white%20backgroud.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Starfield for dark mode */}
      {isDarkMode && (
        <div className="fixed inset-0 pointer-events-none">
          {stars.map(star => (
            <div
              key={star.id}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animationDuration: `${star.twinkle}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Heading */}
        <div className="text-center mb-12">
          <h1 className={`text-5xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            YOUR COSMIC CART
          </h1>
          <div className={`w-32 h-1 mx-auto rounded-full ${
            isDarkMode ? 'bg-gradient-to-r from-cyan-400 to-purple-500' : 'bg-gradient-to-r from-cyan-500 to-purple-600'
          }`}></div>
        </div>

        {!showCheckout ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details Section */}
            <div className={`rounded-2xl p-6 backdrop-blur-md transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10' 
                : 'bg-white/80 border border-gray-200 shadow-xl'
            }`}>
              <h2 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                ORDER DETAILS
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(cartItemsByStore).map(([sid, items]) =>
                  items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.storeId}`}
                      className={`rounded-xl p-4 flex gap-4 items-center transition-all duration-300 hover:scale-105 ${
                        isDarkMode
                          ? 'bg-gray-700/50 border border-gray-600/50 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/20'
                          : 'bg-gray-50 border border-gray-200 hover:border-cyan-300 hover:shadow-lg'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-lg overflow-hidden ${
                        isDarkMode ? 'ring-2 ring-cyan-400/50' : 'ring-2 ring-cyan-300/50'
                      }`}>
                        <img
                          src={
                            item.product.image ||
                            item.product.image_url ||
                            item.product.picture ||
                            item.product.raw?.image ||
                            '/no-image.png'
                          }
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.product.name}</div>
                        <div className="text-sm flex items-center gap-2 mt-1">
                          {item.product.hasDiscount && item.product.specialPrice ? (
                            <>
                              <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'} font-semibold`}>
                                ${typeof item.product.specialPrice === 'number' ? item.product.specialPrice.toFixed(2) : item.product.specialPrice}
                              </span>
                              <span className={`line-through text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                ${item.product.originalPrice?.toFixed ? item.product.originalPrice.toFixed(2) : item.product.price?.toFixed ? item.product.price.toFixed(2) : item.product.price}
                              </span>
                            </>
                          ) : (
                            <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>
                              ${item.product.price?.toFixed ? item.product.price.toFixed(2) : item.product.price}
                            </span>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.storeId, item.quantity - 1, item.option)}
                              className={`px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                              -
                            </button>
                            <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.storeId, item.quantity + 1, item.option)}
                              className={`px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id, item.storeId)}
                              className={`ml-3 px-2 py-1 rounded ${isDarkMode ? 'bg-red-600/70 text-white' : 'bg-red-100 text-red-600'}`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    if (isGuest) navigate('/signup');
                    else setShowCheckout(true);
                  }}
                  className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25 hover:shadow-cyan-400/40'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  PROCEED TO CHECKOUT
                </button>
                <Link
                  to="/home"
                  className={`block w-full text-center mt-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                    isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'
                  }`}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className={`rounded-2xl p-6 backdrop-blur-md transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10'
                : 'bg-white/80 border border-gray-200 shadow-xl'
            }`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ORDER SUMMARY</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subtotal</span>
                  <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Shipping</span>
                  <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Calculated at confirm</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Taxes</span>
                  <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Included</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                  <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                  <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`rounded-2xl p-6 backdrop-blur-md transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10'
                : 'bg-white/80 border border-gray-200 shadow-xl'
            }`}>
              <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>CONFIRM ORDER</h2>
              <div className="space-y-6">
                {/* Address selection */}
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delivery Address</h3>
                  {addresses.length === 0 ? (
                    <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No saved addresses. Please add one in Profile &gt; Address.</div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map(addr => (
                        <label key={addr.id || addr.address_id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${selectedAddressId === (addr.id || addr.address_id) ? 'border-cyan-400' : (isDarkMode ? 'border-gray-700' : 'border-gray-200')}`}>
                          <input type="radio" name="address" className="mt-1" checked={selectedAddressId === (addr.id || addr.address_id)} onChange={() => setSelectedAddressId(addr.id || addr.address_id)} />
                          <div>
                            <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{[addr.firstname, addr.lastname].filter(Boolean).join(' ')}</div>
                            <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{[addr.address_1, addr.city].filter(Boolean).join(', ')}</div>
                            {addr.phone && <div className="text-xs text-gray-500">{addr.phone}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shipping method */}
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipping Method</h3>
                  <select
                    value={selectedShippingCode}
                    onChange={(e)=>setSelectedShippingCode(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
                  >
                    {shippingMethods.length === 0 ? (
                      <option value="" disabled>No shipping methods available</option>
                    ) : (
                      shippingMethods.map(m => (
                        <option key={m.code} value={m.code}>
                          {(m.title || m.name || m.code || 'Unnamed method') + (m.cost ? ` - ${m.cost}` : '')}
                        </option>
                      ))
                    )}
                  </select>
                  <input
                    type="text"
                    value={shippingComment}
                    onChange={(e)=>setShippingComment(e.target.value)}
                    placeholder="Shipping comment (optional)"
                    className={`mt-3 w-full px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
                  />
                </div>

                {/* Payment method */}
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Payment Method</h3>
                  <select
                    value={selectedPaymentCode}
                    onChange={(e)=>setSelectedPaymentCode(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
                  >
                    {paymentMethods.map(m => (
                      <option key={m.code || m.id} value={m.code || m.id}>
                        {m.title || m.name || m.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={paymentComment}
                    onChange={(e)=>setPaymentComment(e.target.value)}
                    placeholder="Payment comment (optional)"
                    className={`mt-3 w-full px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading || !selectedAddressId || !selectedShippingCode}
                    className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isDarkMode
                        ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25'
                        : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
                    }`}
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Back to Cart
                  </button>
                </div>
              </div>
            </div>
            <div className={`rounded-2xl p-6 backdrop-blur-md transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10'
                : 'bg-white/80 border border-gray-200 shadow-xl'
            }`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ORDER SUMMARY</h2>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => {
                  const effectivePrice = (item.product.hasDiscount && item.product.specialPrice) 
                    ? (typeof item.product.specialPrice === 'number' ? item.product.specialPrice : parseFloat(item.product.specialPrice) || item.product.price)
                    : item.product.price;
                  return (
                    <div key={`${item.product.id}-${item.storeId}`} className="flex items-center justify-between text-sm">
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.product.name} × {item.quantity}</span>
                      <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>${(effectivePrice * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subtotal</span>
                  <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Shipping</span>
                  <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Calculated at confirm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Taxes</span>
                  <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>Included</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                  <span className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;