import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { searchProducts, searchStores } from '../../api/services';

const Tab = {
  Products: 'products',
  Stores: 'stores',
};

const SearchPage = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const q = (params.get('q') || '').trim();
  const initialTab = (params.get('tab') || Tab.Products).toLowerCase();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setActiveTab((p.get('tab') || Tab.Products).toLowerCase());
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!q) return;
      setLoading(true);
      try {
        const [prods, sts] = await Promise.all([
          searchProducts(q),
          searchStores(q),
        ]);
        if (!cancelled) {
          setProducts((prods && prods.success && Array.isArray(prods.data)) ? prods.data : []);
          setStores((sts && sts.success && Array.isArray(sts.data)) ? sts.data : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [q]);

  const changeTab = (tab) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', tab);
    navigate(`/search?${newParams.toString()}`, { replace: true });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : ''}`}>
      <div className="h-16" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Search results</h1>
        {q && (
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>for "{q}"</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => changeTab(Tab.Products)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === Tab.Products ? (isDarkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700') : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
          >
            Products
          </button>
          <button
            onClick={() => changeTab(Tab.Stores)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === Tab.Stores ? (isDarkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700') : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
          >
            Stores
          </button>
        </div>

        {loading ? (
          <div className={`mt-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Searching...</div>
        ) : (
          <div className="mt-8">
            {activeTab === Tab.Products ? (
              products.length === 0 ? (
                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No matching products.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((p, idx) => (
                    <div key={(p.id || p.product_id || idx) + ''} className={`rounded-2xl p-4 ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white border border-gray-200 shadow'}`}>
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                          <img src={p.image || p.images?.[0] || p.raw?.image || '/no-image.png'} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-semibold truncate`}>{p.name}</div>
                          <div className={`${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'} text-sm`}>{p.price_formated || (p.price ? `$${(+p.price).toFixed(2)}` : '')}</div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-xs mt-1`}>Store: {p.storeName || p.raw?.store_name || p.storeId}</div>
                          <div className="mt-3 flex gap-2">
                            <Link to={`/product/${p.id || p.product_id}`} state={{ storeId: p.storeId }} className={`${isDarkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'} px-3 py-1 rounded`}>View Product</Link>
                            {p.storeId && (
                              <Link to={`/store/${p.storeId}`} className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded`}>Go to Store</Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              stores.length === 0 ? (
                <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No matching stores.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stores.map((s, idx) => {
                    const storeId = s.id || s.store_id || s.storeId || s.slug || idx;
                    return (
                      <Link key={(s.id || s.slug || idx) + ''} to={`/store/${storeId}`} className={`rounded-2xl p-4 block ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white border border-gray-200 shadow'}`}>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gray-100 mb-3">
                            <img src={s.logo || s.profile_image || s.raw?.profile_image || '/no-image.png'} alt={s.name} className="w-full h-full object-cover" />
                          </div>
                          <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>{s.name}</div>
                          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mt-1 line-clamp-2`}>{s.description}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
