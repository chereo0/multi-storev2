import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getProduct } from '../../api/services';
import { post as apiPost } from '../../api/index';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

// Basic HTML sanitizer (remove script tags & inline event handlers). For stronger
// security consider adding DOMPurify; this keeps dependencies minimal.
function sanitizeHTML(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

const ProductPage = () => {
  const { productId } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description'); // description first by default
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getProduct(productId);
        if (p.success) {
          setProduct(p.data);
          // Initialize gallery selected image
          if (p.data?.images && p.data.images.length > 0) {
            setSelectedImage(p.data.images[0]);
          } else if (p.data?.image) {
            setSelectedImage(p.data.image);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const handleAdd = async () => {
    if (!product) return;
    
    // Check if product has required options
    const hasOptions = product.options && product.options.length > 0;
    if (hasOptions) {
      const requiredOptions = product.options
        .filter((opt) => opt.required)
        .map((opt) => ({
          optId: opt.product_option_id ?? opt.option_id ?? opt.id ?? opt.name,
          raw: opt,
        }));

      const missingOptions = requiredOptions.filter((ro) => !selectedOptions[ro.optId]);

      if (missingOptions.length > 0) {
        toast.error('Please select all required options');
        return;
      }
    }
    
    // Prepare cart data
    const cartData = {
      product_id: product.id,
      quantity: quantity
    };
    let optionMap = null;
    let optionArrayVar = null;
    
    // Add options if selected
    if (hasOptions) {
      const optionArray = [];
      optionMap = {};
      for (const opt of product.options) {
        const optId = opt.product_option_id ?? opt.option_id ?? opt.id ?? opt.name;
        const selectedValue = selectedOptions[optId];
        if (typeof selectedValue !== 'undefined' && selectedValue !== '') {
          const pid = parseInt(opt.product_option_id ?? opt.option_id ?? opt.id);
          const pvid = parseInt(selectedValue);
          if (!Number.isNaN(pid) && !Number.isNaN(pvid)) {
            optionArray.push({ product_option_id: pid, product_option_value_id: pvid, option_id: opt.option_id });
            optionMap[pid] = pvid;
            if (opt.option_id && String(opt.option_id) !== String(pid)) {
              optionMap[String(opt.option_id)] = pvid;
            }
          } else {
            // If numeric ids are not available, include raw values (best-effort)
            const key = String(opt.product_option_id ?? opt.option_id ?? opt.id ?? opt.name);
            optionArray.push({ product_option_id: key, product_option_value_id: selectedValue });
            optionMap[key] = selectedValue;
          }
        }
      }
      // Send both shapes: `option` as keyed map (common on many backends), and `option_list` as array of objects.
      if (Object.keys(optionMap).length > 0) cartData.option = optionMap;
      if (optionArray.length > 0) cartData.option_list = optionArray;
      optionArrayVar = optionArray;
    }
    
    // Call API to add to cart
    const services = await import('../../api/services');
    const addToCartAPI = services.addToCart;
    const getCartAPI = services.getCart;
    const emptyCartAPI = services.emptyCart;

    let result = await addToCartAPI(cartData);

    // If server reports cart conflict (different store items) but our local cart is empty,
    // clear server cart and retry once automatically to avoid confusing users.
    const msg = (result?.message || result?.error || '').toString().toLowerCase();
    const conflictDetected = msg.includes('already contains') || msg.includes('clear the cart') || msg.includes('different store') || msg.includes('another store');
    if (!result.success && conflictDetected) {
      try {
        // If the local cart is empty (user sees nothing), proactively clear server cart and retry.
        const saved = localStorage.getItem('cart');
        const localEmpty = !saved || saved === '[]' || saved === 'null';
        if (localEmpty) {
          console.log('Conflict detected and local cart empty — clearing server cart and retrying');
          await emptyCartAPI();
          result = await addToCartAPI(cartData);
        } else {
          // Fallback: inspect server cart; only clear if server reports empty
          const current = await getCartAPI();
          let serverItems = [];
          if (current && current.data) {
            if (Array.isArray(current.data)) serverItems = current.data;
            else if (Array.isArray(current.data.items)) serverItems = current.data.items;
            else if (Array.isArray(current.data.products)) serverItems = current.data.products;
          }
          const serverCount = Array.isArray(serverItems) ? serverItems.length : 0;
          if (serverCount === 0) {
            await emptyCartAPI();
            result = await addToCartAPI(cartData);
          }
        }
      } catch (e) {
        console.warn('Retry after clearing server cart failed:', e);
      }
    }

    // If the server responded with a validation error about missing color/option,
    // retry with form-encoded payload in case the backend expects `option[<id>]=<value>`.
    const validationMsg = (result?.message || result?.error || '').toString().toLowerCase();
    const requiresOption = validationMsg.includes('color required') || validationMsg.includes('please select') || validationMsg.includes('required');
    if (!result.success && requiresOption && hasOptions) {
      try {
        const params = new URLSearchParams();
        params.append('product_id', String(product.id));
        params.append('quantity', String(quantity));
        // optionMap was built above when preparing cartData
        if (typeof optionMap === 'object' && optionMap) {
          for (const [k, v] of Object.entries(optionMap)) {
            params.append(`option[${k}]`, String(v));
          }
        }
        // Post as application/x-www-form-urlencoded
        const retryRes = await apiPost('/cart', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        // Axios returns response object with data
        const body = retryRes?.data || {};
        const ok = body.success === 1 || body.success === true || body.status === 'success';
        if (ok) {
          toast.success(`${product.name} added to cart`);
          const fallbackStoreId = 1;
          addToCart(product, product.storeId || fallbackStoreId, quantity);
          return;
        }
      } catch (e) {
        console.warn('Form-encoded addToCart retry failed:', e);
      }
    }

    if (result.success) {
      toast.success(`${product.name} added to cart`);
      // Also update local cart context for UI
      const fallbackStoreId = 1;
      const localOption = Array.isArray(optionArrayVar) && optionArrayVar.length > 0 ? optionArrayVar : (optionMap && Object.keys(optionMap).length > 0 ? optionMap : undefined);
      addToCart(product, product.storeId || fallbackStoreId, quantity, localOption);
    } else {
      toast.error(result.message || result.error || 'Failed to add to cart');
    }
  };

  const handleThumbClick = useCallback((img) => {
    setSelectedImage(img);
  }, []);

  if (loading) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
        style={{
          background: isDarkMode
            ? "linear-gradient(180deg, #0a0908, #22333b)"
            : "linear-gradient(180deg, #eae0d5, #c6ac8f)",
        }}
      >
        <div className={`animate-spin rounded-full h-32 w-32 border-b-2 ${
          isDarkMode ? "border-cyan-400" : "border-indigo-600"
        }`}></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
        style={{
          background: isDarkMode
            ? "linear-gradient(180deg, #0a0908, #22333b)"
            : "linear-gradient(180deg, #eae0d5, #c6ac8f)",
        }}
      >
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Product not found</h2>
          <Link to="/home" className={`${isDarkMode ? "text-cyan-400 hover:text-cyan-300" : "text-indigo-600 hover:text-indigo-500"}`}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900" : ""
      }`}
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #0a0908, #22333b)"
          : "linear-gradient(180deg, #eae0d5, #c6ac8f)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`rounded-lg shadow-lg overflow-hidden flex flex-col backdrop-blur-md transition-colors duration-300 ${
            isDarkMode 
              ? "bg-gray-800/50 border border-cyan-400/30" 
              : "bg-white/90 border border-gray-200"
          }`}>
            <div className={`relative w-full h-96 ${isDarkMode ? "bg-black" : "bg-gray-100"}`}>
              <img
                src={selectedImage || product.image || '/no-image.png'}
                alt={product.name}
                className="w-full h-96 object-contain mix-blend-screen"
                onError={(e)=>{e.currentTarget.src='/no-image.png'}}
              />
              {product.stock_status && (
                <span className={`absolute top-4 left-4 px-3 py-1 text-xs font-semibold rounded-full shadow ${product.inStock ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {product.stock_status}
                </span>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="p-4 grid grid-cols-5 gap-3">
                {product.images.slice(0,10).map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={()=>handleThumbClick(img)}
                    className={`border rounded-md overflow-hidden h-20 flex items-center justify-center bg-gray-50 hover:border-indigo-500 transition ${selectedImage===img ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-200'}`}
                  >
                    <img src={img} alt="thumb" className="object-contain h-full w-full" onError={(e)=>{e.currentTarget.src='/no-image.png'}} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>{product.name}</h1>
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className={`ml-2 text-sm transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>{product.rating} ({product.reviewCount})</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                {product.hasDiscount && product.originalPriceDisplay ? (
                  <>
                    <div className={`text-3xl font-bold transition-colors duration-300 ${
                      isDarkMode ? "text-cyan-400" : "text-cyan-600"
                    }`}>
                      {product.specialPriceDisplay || (product.specialPrice ? `$${product.specialPrice}` : product.priceDisplay)}
                    </div>
                    <div className={`text-xl font-medium line-through transition-colors duration-300 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}>
                      {product.originalPriceDisplay || (product.originalPrice ? `$${product.originalPrice}` : product.priceDisplay)}
                    </div>
                    <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">SALE</span>
                  </>
                ) : (
                  <div className={`text-3xl font-bold transition-colors duration-300 ${
                    isDarkMode ? "text-cyan-400" : "text-gray-900"
                  }`}>{product.priceDisplay || (product.price ? `$${product.price}` : '—')}</div>
                )}
              </div>
              {typeof product.quantity === 'number' && (
                <span className={`text-sm px-2 py-1 rounded transition-colors duration-300 ${
                  isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                }`}>Qty: {product.quantity}</span>
              )}
            </div>
            
            {/* Product Options */}
            {product.options && product.options.length > 0 && (
              <div className={`mb-6 p-4 rounded-lg border backdrop-blur-md transition-colors duration-300 ${
                isDarkMode 
                  ? "bg-gray-800/50 border-cyan-400/30" 
                  : "bg-gray-50 border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-4 pb-2 border-b transition-colors duration-300 ${
                  isDarkMode 
                    ? "text-white border-gray-700" 
                    : "text-gray-900 border-gray-300"
                }`}>Product Options</h3>
                <div className="space-y-5">
                  {product.options.map((option) => {
                    const optionType = (option.type || '').toLowerCase();
                    const values = option.product_option_value || option.option_value || option.values || [];
                    const optId = option.product_option_id ?? option.option_id ?? option.id ?? option.name;
                    const isRequired = option.required === true || option.required === 1 || option.required === '1' || option.required === 'true';
                    return (
                      <div key={optId || option.name} className={`p-4 rounded-md shadow-sm transition-colors duration-300 ${
                        isDarkMode 
                          ? "bg-gray-700/50 border border-gray-600" 
                          : "bg-white border border-gray-200"
                      }`}>
                        <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                          isDarkMode ? "text-gray-200" : "text-gray-800"
                        }`}>
                          {option.name || option.text || 'Option'} {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {(optionType === 'select' || !optionType) && (
                          <select
                            value={selectedOptions[optId] || ''}
                            onChange={(e) => setSelectedOptions(prev => ({
                              ...prev,
                              [optId]: e.target.value
                            }))}
                            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 transition-colors duration-300 ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500"
                                : "bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                            }`}
                          >
                            <option value="">-- Please Select --</option>
                            {values.map((value) => {
                              const vid = value.product_option_value_id ?? value.id ?? value.option_value_id ?? value.option_value_id;
                              return (
                                <option key={vid} value={vid}>
                                  {value.name ?? value.text ?? value.option_value}
                                  {value.price && ` (+${value.price_prefix || ''}${value.price})`}
                                </option>
                              );
                            })}
                          </select>
                        )}
                        {optionType === 'radio' && (
                          <div className="space-y-3">
                            {values.map((value) => {
                              const vid = value.product_option_value_id ?? value.id ?? value.option_value_id ?? value.option_value_id;
                              return (
                                <label key={vid} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isDarkMode
                                    ? "border-gray-600 hover:bg-gray-700/50"
                                    : "border-gray-200 hover:bg-gray-50"
                                }`}>
                                  <input
                                    type="radio"
                                    name={`option_${optId}`}
                                    value={vid}
                                    checked={String(selectedOptions[optId] || '') === String(vid)}
                                    onChange={(e) => setSelectedOptions(prev => ({
                                      ...prev,
                                      [optId]: e.target.value
                                    }))}
                                    className={`w-4 h-4 focus:ring-2 ${
                                      isDarkMode
                                        ? "text-cyan-500 focus:ring-cyan-500"
                                        : "text-indigo-600 focus:ring-indigo-500"
                                    }`}
                                  />
                                  <span className={`ml-3 text-sm font-medium ${
                                    isDarkMode ? "text-gray-200" : "text-gray-800"
                                  }`}>
                                    {value.name ?? value.text ?? value.option_value}
                                    {value.price && <span className={`ml-2 ${
                                      isDarkMode ? "text-cyan-400" : "text-indigo-600"
                                    }`}>(+{value.price_prefix || ''}{value.price})</span>}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {optionType === 'checkbox' && (
                          <div className="space-y-3">
                            {values.map((value) => {
                              const vid = value.product_option_value_id ?? value.id ?? value.option_value_id ?? value.option_value_id;
                              return (
                                <label key={vid} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                  isDarkMode
                                    ? "border-gray-600 hover:bg-gray-700/50"
                                    : "border-gray-200 hover:bg-gray-50"
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={String(selectedOptions[optId] || '') === String(vid)}
                                    onChange={(e) => {
                                      setSelectedOptions(prev => {
                                        if (e.target.checked) {
                                          return { ...prev, [optId]: vid };
                                        } else {
                                          const newOpts = { ...prev };
                                          delete newOpts[optId];
                                          return newOpts;
                                        }
                                      });
                                    }}
                                    className={`w-4 h-4 rounded focus:ring-2 ${
                                      isDarkMode
                                        ? "text-cyan-500 focus:ring-cyan-500"
                                        : "text-indigo-600 focus:ring-indigo-500"
                                    }`}
                                  />
                                  <span className={`ml-3 text-sm font-medium ${
                                    isDarkMode ? "text-gray-200" : "text-gray-800"
                                  }`}>
                                    {value.name ?? value.text ?? value.option_value}
                                    {value.price && <span className={`ml-2 ${
                                      isDarkMode ? "text-cyan-400" : "text-indigo-600"
                                    }`}>(+{value.price_prefix || ''}{value.price})</span>}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Quantity Selector */}
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-3 transition-colors duration-300 ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}>Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-colors font-semibold ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-cyan-500"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-indigo-500"
                  }`}
                  type="button"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-24 h-10 px-3 text-center border-2 rounded-lg focus:ring-2 font-semibold transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500"
                      : "bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                  }`}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className={`w-10 h-10 flex items-center justify-center border-2 rounded-lg transition-colors font-semibold ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-cyan-500"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-indigo-500"
                  }`}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={!product.inStock} className={`px-5 py-3 rounded-md text-white transition-all duration-300 ${
                product.inStock 
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}>
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <Link
                to={`/store/${(location.state && location.state.storeId) || product.storeId || product.raw?.store_id || 1}`}
                className={`px-5 py-3 rounded-md border transition-colors duration-300 ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Back to Store
              </Link>
            </div>
            {product.manufacturer && (
              <div className={`mt-4 text-sm transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>Manufacturer: <span className={`font-medium ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}>{product.manufacturer}</span></div>
            )}
            {product.model && (
              <div className={`text-sm transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>Model: <span className={`font-medium ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}>{product.model}</span></div>
            )}
            {product.sku && (
              <div className={`text-sm transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>SKU: <span className={`font-medium ${
                isDarkMode ? "text-gray-200" : "text-gray-800"
              }`}>{product.sku}</span></div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <div className={`border-b transition-colors duration-300 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}>
            <nav className="-mb-px flex space-x-8">
              <button onClick={() => setActiveTab('description')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                activeTab === 'description'
                  ? isDarkMode
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-indigo-500 text-indigo-600'
                  : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
                Description
              </button>
              {product.attributeGroups && product.attributeGroups.length > 0 && (
                <button onClick={() => setActiveTab('specs')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                  activeTab === 'specs'
                    ? isDarkMode
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-indigo-500 text-indigo-600'
                    : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                  Specs
                </button>
              )}
            </nav>
          </div>

          {activeTab === 'description' && (
            <div className="py-6">
              <div className={`p-6 rounded-lg shadow-lg backdrop-blur-md transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-800/50 border border-cyan-400/30"
                  : "bg-white/90 border border-gray-200"
              }`}>
                <h3 className={`text-lg font-semibold mb-3 transition-colors duration-300 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>About this product</h3>
                {product.description ? (
                  <div className={`prose max-w-none leading-relaxed transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`} dangerouslySetInnerHTML={{ __html: sanitizeHTML(product.description) }} />
                ) : (
                  <div className={`transition-colors duration-300 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>No description available.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'specs' && product.attributeGroups && (
            <div className="py-6">
              <div className={`p-6 rounded-lg shadow-lg backdrop-blur-md space-y-6 transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gray-800/50 border border-cyan-400/30"
                  : "bg-white/90 border border-gray-200"
              }`}>
                {product.attributeGroups.map(group => (
                  <div key={group.attribute_group_id || group.name}>
                    <h4 className={`text-md font-semibold mb-2 transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}>{group.name}</h4>
                    <ul className="space-y-1">
                      {Array.isArray(group.attribute) && group.attribute.map(attr => (
                        <li key={attr.attribute_id || attr.name} className={`flex justify-between text-sm border-b py-1 transition-colors duration-300 ${
                          isDarkMode ? "border-gray-700" : "border-gray-100"
                        }`}>
                          <span className={`transition-colors duration-300 ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}>{attr.name}</span>
                          <span className={`font-medium transition-colors duration-300 ${
                            isDarkMode ? "text-gray-200" : "text-gray-800"
                          }`}>{attr.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
