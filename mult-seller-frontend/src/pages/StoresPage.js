import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getHomePageBuilder, getStoresByCategory } from "../api/services";

const StoresPage = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minRating, setMinRating] = useState(0);

  const searchQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("q") || "").trim().toLowerCase();
  }, [location.search]);

  // Needed for conditional empty-state messaging; re-added after previous removal
  const categoryId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("categoryId");
  }, [location.search]);

  // Sync selectedCategory from URL on initial load or URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCategoryId = params.get("categoryId");
    
    if (urlCategoryId) {
      setSelectedCategory(urlCategoryId);
    } else {
      setSelectedCategory("all");
    }
  }, [location.search]);

  // fetch categories for filter dropdown from home_page_builder
  useEffect(() => {
    let mounted = true;
    async function fetchCategories() {
      try {
        const response = await getHomePageBuilder();
        if (!mounted) return;
        
        if (response && response.success && response.data) {
          // Extract categories from the data array - look for category_carousel widget
          if (Array.isArray(response.data)) {
            const categoryWidget = response.data.find(
              (item) => item.type === "category_carousel"
            );
            if (categoryWidget && categoryWidget.categories) {
              setCategories(categoryWidget.categories);
              console.log("Categories loaded for filters:", categoryWidget.categories);
              // Log first category structure to debug
              if (categoryWidget.categories.length > 0) {
                console.log("First category structure:", categoryWidget.categories[0]);
                console.log("First category keys:", Object.keys(categoryWidget.categories[0]));
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    fetchCategories();
    return () => { mounted = false };
  }, []);

  // handler keeps URL in sync and triggers fetch logic
  const handleSelectCategory = (catId) => {
    if (catId === 'all') {
      setSelectedCategory('all');
      // remove categoryId from query
      navigate(location.pathname, { replace: false });
    } else {
      setSelectedCategory(catId);
      // push categoryId into the query so page is linkable
      navigate(`${location.pathname}?categoryId=${encodeURIComponent(catId)}`, { replace: false });
    }
  };

  // Fetch stores when selectedCategory changes (triggered by URL or user click)
  useEffect(() => {
    const fetchStoresForCategory = async () => {
      try {
        setLoading(true);
        
        if (selectedCategory === "all") {
          // Fetch all stores from home page builder
          const response = await getHomePageBuilder();
          if (response && response.success && response.data) {
            let fetched = [];
            if (Array.isArray(response.data)) {
              // Only look for stores, not products
              const widget = response.data.find(
                (it) => Array.isArray(it.stores)
              );
              fetched = (widget && widget.stores) || [];
            } else if (Array.isArray(response.data.stores)) {
              fetched = response.data.stores;
            }
            
            // Filter to ensure only stores (not products) are included
            // Stores have store_id/storeId, products have product_id
            const onlyStores = fetched.filter(item => {
              const hasStoreId = item.store_id || item.storeId || item.id;
              const hasProductId = item.product_id;
              const isStore = hasStoreId && !hasProductId;
              if (!isStore && hasProductId) {
                console.log("Filtering out product:", item.name);
              }
              return isStore;
            });
            
            setStores(onlyStores || []);
          }
        } else if (selectedCategory && selectedCategory !== "all") {
          // Fetch stores for specific category
          console.log("Fetching stores for selected category:", selectedCategory);
          const res = await getStoresByCategory(selectedCategory);
          console.log("API Response for category filter:", res);
          
          if (res) {
            let data = res.data || [];
            console.log("Items received from API:", data.length);
            if (res.error) {
              console.error("API returned error:", res.error);
            }
            
            // Filter out products - only keep stores
            const onlyStores = data.filter(item => {
              const hasStoreId = item.store_id || item.storeId || item.id;
              const hasProductId = item.product_id;
              const isStore = hasStoreId && !hasProductId;
              if (!isStore && hasProductId) {
                console.log("Filtering out product:", item.name);
              }
              return isStore;
            });
            
            // Additional client-side filter to ensure only category-matched stores
            const filtered = onlyStores.filter(store => {
              const storeCategoryId = String(store.category?.id || store.category_id || store.category || store.raw?.category_id || '');
              const requestedCategoryId = String(selectedCategory);
              const matches = storeCategoryId === requestedCategoryId;
              if (!matches) {
                console.log(`Filtering out store "${store.name}" - category ${storeCategoryId} doesn't match ${requestedCategoryId}`);
              }
              return matches;
            });
            
            console.log("Stores after filtering:", filtered.length, "stores");
            setStores(filtered);
          } else {
            console.warn("No response from API");
            setStores([]);
          }
        }
      } catch (error) {
        console.error("Error fetching stores for category:", error);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStoresForCategory();
  }, [selectedCategory]);

  const filteredStores = useMemo(() => {
    let result = (stores || []).slice();

    // apply search query
    if (searchQuery) {
      result = result.filter((store) => {
        const name = (store?.name || "").toLowerCase();
        const desc = (store?.description || "").toLowerCase();
        const slug = (store?.slug || "").toLowerCase();
        return (
          name.includes(searchQuery) ||
          desc.includes(searchQuery) ||
          slug.includes(searchQuery)
        );
      });
    }

    // apply minimum rating filter (category is already applied via API fetch)
    if (minRating && Number(minRating) > 0) {
      result = result.filter((store) => {
        const rating = store.average_rating ?? store.rating ?? 0;
        return Number(rating) >= Number(minRating);
      });
    }

    return result;
  }, [stores, searchQuery, minRating]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "" : ""
      }`}
      style={{
        // Match homepage gradient colors
        background: isDarkMode
          ? "linear-gradient(180deg, #0a0908, #22333b)"
          : "linear-gradient(180deg, #eae0d5, #c6ac8f)",
      }}
    >
  {/* Spacer removed; global padding added in App.js */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1
            className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Explore Our Stores
          </h1>
          <div
            className={`w-24 h-1 mx-auto rounded-full ${
              isDarkMode
                ? "bg-gradient-to-r from-cyan-400 to-purple-500"
                : "bg-gradient-to-r from-cyan-500 to-purple-600"
            }`}
          ></div>
          <p
            className={`text-lg mt-6 transition-colors duration-300 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Discover amazing stores from across the multiverse
          </p>
        </div>

        {/* Sidebar Layout with Categories and Stores */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <aside className={`lg:w-64 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 h-fit ${
            isDarkMode 
              ? 'bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10' 
              : 'bg-white/80 border border-gray-200 shadow-xl'
          }`}>
            <h2 className={`text-xl font-bold mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
            }`}>
              <svg className="inline w-6 h-6 mr-2 -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories
            </h2>
            
            <div className="space-y-2">
              {/* All Stores Button */}
              <button
                onClick={() => handleSelectCategory('all')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                  selectedCategory === 'all'
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300 border-2 border-cyan-400'
                      : 'bg-gradient-to-r from-cyan-100 to-purple-100 text-cyan-700 border-2 border-cyan-500'
                    : isDarkMode
                      ? 'bg-gray-700/30 text-gray-300 border border-gray-600 hover:bg-gray-700/50 hover:border-cyan-400/50'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-cyan-400'
                }`}
              >
                <span className="mr-2">🏪</span>
                All Stores
              </button>

              {/* Category List */}
              {categories && categories.length > 0 ? (
                categories.map((cat) => {
                  // Try multiple possible ID fields
                  const catId = cat.id || cat._id || cat.category_id || cat.slug || cat.name;
                  const catName = cat.name || cat.title || cat.slug;
                  const isActive = String(selectedCategory) === String(catId);
                  
                  // Debug log if catId is undefined
                  if (!catId) {
                    console.warn("Category has no valid ID:", cat);
                  }
                  
                    return (
                    <button
                      key={catId || Math.random()}
                      onClick={() => handleSelectCategory(catId)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300 border-2 border-cyan-400'
                            : 'bg-gradient-to-r from-cyan-100 to-purple-100 text-cyan-700 border-2 border-cyan-500'
                          : isDarkMode
                            ? 'bg-gray-700/30 text-gray-300 border border-gray-600 hover:bg-gray-700/50 hover:border-cyan-400/50'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-cyan-400'
                      }`}
                    >
                      <span className="mr-2">{cat.icon || '📦'}</span>
                      {catName}
                    </button>
                  );
                })
              ) : (
                <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading categories...
                </p>
              )}
            </div>

            {/* Rating Filter */}
            <div className="mt-8">
              <h3 className={`text-sm font-semibold mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`}>
                <svg className="inline w-5 h-5 mr-2 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Min Rating
              </h3>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 text-sm ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white focus:border-purple-400'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                }`}
              >
                <option value={0}>All</option>
                <option value={1}>⭐ 1+</option>
                <option value={2}>⭐⭐ 2+</option>
                <option value={3}>⭐⭐⭐ 3+</option>
                <option value={4}>⭐⭐⭐⭐ 4+</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5</option>
              </select>
            </div>
          </aside>

          {/* Stores Grid */}
          <div className="flex-1">
            {loading ? (
          <div className="text-center">
            <div
              className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${
                isDarkMode ? "border-cyan-400" : "border-cyan-600"
              }`}
            ></div>
            <p
              className={`mt-4 transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Loading stores...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStores.length > 0 ? (
              filteredStores.map((store, idx) => {
                const storeId =
                  store.id ??
                  store.store_id ??
                  store.storeId ??
                  store._id ??
                  store.slug ??
                  idx;
                return (
                  <Link
                    key={store.id || store.store_id || store.slug || idx}
                    to={`/store/${storeId}`}
                    className={`group rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:scale-105 ${
                      isDarkMode
                        ? "bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10 hover:shadow-cyan-400/20"
                        : "bg-white/80 border border-gray-200 shadow-xl hover:shadow-2xl"
                    }`}
                  >
                    <div className="text-center">
                      <div
                        className={`w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center ${
                          isDarkMode ? "bg-gray-700/50" : "bg-gray-100"
                        }`}
                      >
                        <img
                          src={
                            store.logo || store.raw?.profile_image || store.raw?.logo || store.profile_image || '/no-image.png'
                          }
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3
                        className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {store.name || "Quantum Store"}
                      </h3>
                      <p
                        className={`text-sm mb-4 transition-colors duration-300 ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {store.description ||
                          "Explore amazing products from this quantum store"}
                      </p>
                      <div
                        className={`inline-block px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          isDarkMode
                            ? "bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30"
                            : "bg-cyan-100 text-cyan-600 group-hover:bg-cyan-200"
                        }`}
                      >
                        Visit Store
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full text-center">
                <div
                  className={`rounded-2xl p-8 backdrop-blur-md transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10"
                      : "bg-white/80 border border-gray-200 shadow-xl"
                  }`}
                >
                  <div
                    className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-100"
                    }`}
                  >
                    <svg
                      className={`w-12 h-12 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3
                    className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {searchQuery 
                      ? "No matching stores" 
                      : categoryId 
                      ? "No stores now for this category" 
                      : "No Stores Available"}
                  </h3>
                  <p
                    className={`transition-colors duration-300 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {searchQuery
                      ? "Try a different search keyword."
                      : categoryId
                      ? "There are no stores related to this category at the moment. Check back later!"
                      : "Check back later for new stores!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        </div>

        {/* Featured Store removed per request; stores displayed above come from home_page_builder */}
      </div>
    </div>
  );
};

export default StoresPage;
