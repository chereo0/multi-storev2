import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
// import ThreeScene from "../../components/ThreeScene";
import { getStores, getHomePageBuilder, getWishlist } from "../../api/services";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// Helper function to get icon for category
const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || "";
  if (name.includes("food")) return "🍔";
  if (name.includes("fashion") || name.includes("accessories")) return "👗";
  if (name.includes("market")) return "🛒";
  if (name.includes("flower")) return "🌸";
  if (name.includes("self-care") || name.includes("beauty")) return "💄";
  if (name.includes("electronic") || name.includes("gadget")) return "📱";
  if (name.includes("home") || name.includes("living")) return "🏠";
  if (name.includes("book")) return "📚";
  if (name.includes("sport")) return "⚽";
  return "⭐";
};

const Homepage = () => {
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [homeData, setHomeData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [slideImages, setSlideImages] = useState([]);
  const [slidesReady, setSlidesReady] = useState(false);
  const { user } = useAuth();
  // const { getCartItemsCount } = useCart();
  const { isDarkMode, colors } = useTheme();

  useEffect(() => {
    // Simulate loading and trigger animations
    setTimeout(() => {
      setLoading(false);
      setIsVisible(true);
    }, 100);

    // Fetch homepage builder data
    const fetchHomeData = async () => {
      try {
        const response = await getHomePageBuilder();
        if (response.success && response.data) {
          console.log("Homepage builder data:", response.data);
          setHomeData(response.data);

          // Extract categories from the data array
          if (Array.isArray(response.data)) {
            const categoryData = response.data.find(
              (item) => item.type === "category_carousel"
            );
            if (categoryData && categoryData.categories) {
              setCategories(categoryData.categories);
              console.log("Categories extracted:", categoryData.categories);
            }

            // Extract banners
            const bannerData = response.data.find(
              (item) =>
                item.type === "banner_carousel" || item.type === "banner"
            );
            if (bannerData && bannerData.banners) {
              setBanners(bannerData.banners);
              console.log("Banners extracted:", bannerData.banners);
            }

            // Extract new arrivals (carousel)
            const newArrivalData = response.data.find(
              (item) => item.type === "new_arrival_carousel"
            );
            console.log("New arrival (carousel) data found:", newArrivalData);
            if (newArrivalData) {
              const products =
                newArrivalData.products ||
                newArrivalData.stores ||
                newArrivalData.items ||
                [];
              setNewArrivals(products);
              console.log("New arrivals (carousel) extracted:", products);
            }

            // Extract new_arrival_product widget (requested)
            const newArrivalProductWidget = response.data.find(
              (item) => item.type === "new_arrival_product"
            );
            console.log("New arrival (product) widget found:", newArrivalProductWidget);
            if (newArrivalProductWidget) {
              const rawProducts =
                newArrivalProductWidget.products ||
                newArrivalProductWidget.items ||
                newArrivalProductWidget.data ||
                [];

              // Normalize products to use profile_image instead of background_image and detect discounts
              const normalizedProducts = rawProducts.map(product => {
                // For stores, prioritize profile_image over background_image
                let displayImage = product.image || product.thumb;
                if (!displayImage && product.store_id) {
                  // This is a store item, use profile_image
                  displayImage = product.profile_image || product.logo;
                }
                // Only use background_image as last resort if nothing else exists
                if (!displayImage) {
                  displayImage = product.background_image;
                }

                // Check for discount prices
                let specialPrice = product.special || product.special_price || product.discount_price || product.sale_price;

                // Check if discounts array exists and has items
                if (!specialPrice && product.discounts && Array.isArray(product.discounts) && product.discounts.length > 0) {
                  // Get the first discount price
                  const firstDiscount = product.discounts[0];
                  specialPrice = firstDiscount.price || firstDiscount.price_excluding_tax;
                }

                const rawPrice = product.price || product.price_text || product.price_display;
                const specialNumeric = specialPrice && typeof specialPrice === "string"
                  ? parseFloat(specialPrice.replace(/[^0-9.]/g, ""))
                  : (typeof specialPrice === "number" ? specialPrice : null);
                const regularNumeric = rawPrice && typeof rawPrice === "string"
                  ? parseFloat(rawPrice.replace(/[^0-9.]/g, ""))
                  : (typeof rawPrice === "number" ? rawPrice : null);
                const originalPrice = product.original_price || product.regular_price || regularNumeric;
                const hasDiscount = Number.isFinite(specialNumeric) && Number.isFinite(originalPrice) && specialNumeric < originalPrice;

                return {
                  ...product,
                  displayImage: displayImage,
                  hasDiscount: hasDiscount,
                  specialPrice: hasDiscount ? specialNumeric : null,
                  originalPrice: hasDiscount ? originalPrice : null,
                  displayPrice: hasDiscount ? specialNumeric : (regularNumeric || null)
                };
              });

              setNewArrivalProducts(normalizedProducts);
              console.log("New arrival products extracted and normalized:", normalizedProducts);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      }
    };

    // Fetch stores data
    const fetchStores = async () => {
      try {
        setStoresLoading(true);
        const response = await getStores();
        if (response.success) {
          setStores(response.data);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setStoresLoading(false);
      }
    };

    // Fetch wishlist products
    const fetchWishlist = async () => {
      try {
        const response = await getWishlist();
        if (response.success && response.data) {
          let items = [];
          if (Array.isArray(response.data)) {
            items = response.data;
          } else if (Array.isArray(response.data.items)) {
            items = response.data.items;
          } else if (Array.isArray(response.data.data)) {
            items = response.data.data;
          }
          // Get maximum 4 items, minimum 1
          if (items.length > 0) {
            const displayItems = items.slice(-4); // Get last 4 items
            setWishlistProducts(displayItems);
          }
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        // Silently fail - wishlist is optional
      }
    };

    fetchHomeData();
    fetchStores();
    fetchWishlist();
  }, []);

  // Resolve slideshow images from optional manifest or common name patterns
  useEffect(() => {
    let cancelled = false;
    const base = process.env.PUBLIC_URL || "";
    const names = [
      // preferred
      "sd1", "sd2", "sd3", "sd4", "sd5", "sd6", "sd7", "sd8",
      // common alternates
      "slide1", "slide2", "slide3", "slide4",
      "hero-1", "hero-2", "hero-3", "hero-4",
      "banner-1", "banner-2", "banner-3", "banner-4",
      "sd_1", "sd_2", "sd_3", "sd_4",
    ];
    const exts = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".PNG"]; // try common cases

    const probe = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => resolve(null);
        img.src = url;
      });

    const resolveOne = async (name) => {
      for (const ext of exts) {
        const url = `${base}/slideshow/${name}${ext}`;
        const ok = await probe(url);
        if (ok) return ok;
      }
      return null;
    };

    (async () => {
      // First try optional manifest: /slideshow/index.json with ["file1.jpg", ...]
      let listed = [];
      try {
        const res = await fetch(`${base}/slideshow/index.json`, { cache: 'no-store' });
        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr)) {
            for (const entry of arr) {
              if (typeof entry === 'string' && entry.trim()) {
                const url = `${base}/slideshow/${entry.trim()}`;
                const ok = await probe(url);
                if (ok) listed.push(ok);
              }
            }
          }
        }
      } catch (_) { }

      const found = [...listed];
      if (found.length === 0) {
        for (const n of names) {
          const url = await resolveOne(n);
          if (url) found.push(url);
        }
      }
      if (!cancelled) {
        setSlideImages(found);
        setSlidesReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const navigate = useNavigate();

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4 ${isDarkMode ? "border-blue-400" : "border-blue-600"
              }`}
          ></div>
          <div
            className={`text-xl font-medium transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
              }`}
          >
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : ""
        }`}
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #0a0908, #22333b)"
          : "linear-gradient(180deg, #eae0d5, #c6ac8f)",
      }}
    >
      {/* Global top padding now handled in App.js */}

      {/* Hero Section */}
      <section
        id="home"
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0908] via-[#22333b] to-[#0a0908] opacity-95" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div
            className={`transform transition-all duration-1000 ${isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
              }`}
          >
            {/* Main Headline */}
            <h1
              className={`text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                }`}
            >
              {homeData?.hero?.title || "DISCOVER INFINITE"}{" "}
              <span
                className="bg-gradient-to-r from-[#c6ac8f] to-[#eae0d5] bg-clip-text text-transparent"
                style={{
                  textShadow: "0 0 30px rgba(198, 172, 143, 0.5)",
                  filter: "drop-shadow(0 0 20px rgba(234, 224, 213, 0.3))",
                }}
              >
                {homeData?.hero?.highlight || "COMMERCE"}
              </span>
            </h1>

            {/* Subheading */}
            <p
              className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                }`}
              style={{
                textShadow: isDarkMode
                  ? "0 0 10px rgba(176, 184, 193, 0.3)"
                  : "none",
              }}
            >
              {homeData?.hero?.subtitle ||
                "Find what you love in our stores"}
            </p>

            {/* CTA Button */}
            <div className="mb-16">
              <Link
                to="/stores"
                className="inline-block px-12 py-4 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:scale-105 transform"
                style={{
                  background: "linear-gradient(90deg, #c6ac8f, #5e503f)",
                  boxShadow:
                    "0 0 30px rgba(198, 172, 143, 0.4), 0 0 60px rgba(94, 80, 63, 0.2)",
                  textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                }}
              >
                {homeData?.hero?.cta_text || "EXPLORE"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Section */}
      {categories.length > 0 && (
        <section
          id="services"
          className={`py-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`transform transition-all duration-1000 delay-300 ${isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
                }`}
            >
              <div className="text-center mb-16">
                <h2
                  className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                    }`}
                  style={{
                    textShadow: isDarkMode
                      ? "0 0 20px rgba(0, 229, 255, 0.5)"
                      : "none",
                  }}
                >
                  FEATURED CATEGORIES
                </h2>
                <p
                  className={`text-xl max-w-2xl mx-auto transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                    }`}
                >
                  Explore our digital universe of infinite possibilities.
                </p>
              </div>

              <div className="px-4">
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={30}
                  slidesPerView={1}
                  pagination={{ clickable: true }}
                  autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                  }}
                  breakpoints={{
                    640: {
                      slidesPerView: 2,
                    },
                    1024: {
                      slidesPerView: 3,
                    },
                  }}
                  className="pb-12"
                >
                  {/* Category Cards from API */}
                  {categories.map((category, index) => {
                    const glowColor = index % 2 === 0 ? "#00E5FF" : "#FF00FF";
                    const categoryIcon = getCategoryIcon(category.name);

                    return (
                      <SwiperSlide key={category.category_id || index}>
                        <div
                          className="relative group cursor-pointer h-full"
                        >
                          <div
                            className={`relative p-8 rounded-2xl transition-all duration-500 group-hover:scale-105 h-full flex flex-col items-center justify-center ${isDarkMode
                              ? "bg-white/3 backdrop-blur-md"
                              : "bg-white/80 backdrop-blur-md"
                              }`}
                            style={{
                              border: `1px solid ${glowColor}`,
                              boxShadow: `0 0 30px ${glowColor}30, inset 0 0 30px ${glowColor}10`,
                            }}
                          >
                            {/* Hexagonal Pattern Overlay */}
                            <div
                              className={`absolute inset-0 transition-opacity duration-300 ${isDarkMode ? "opacity-10" : "opacity-5"
                                }`}
                              style={{
                                backgroundImage: `
                                  radial-gradient(circle at 25% 25%, ${glowColor} 2px, transparent 2px),
                                  radial-gradient(circle at 75% 75%, ${glowColor} 2px, transparent 2px)
                                `,
                                backgroundSize: "40px 40px",
                              }}
                            />

                            <div className="text-center relative z-10 w-full">
                              <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:rotate-12"
                                style={{
                                  background: `linear-gradient(135deg, ${glowColor}20, ${glowColor}40)`,
                                  border: `2px solid ${glowColor}`,
                                  boxShadow: `0 0 25px ${glowColor}50`,
                                }}
                              >
                                {category.image ? (
                                  <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-12 h-12 object-contain"
                                  />
                                ) : (
                                  <span className="text-3xl">{categoryIcon}</span>
                                )}
                              </div>

                              <h3
                                className={`text-2xl font-bold mb-3 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                                  }`}
                                style={{
                                  textShadow: isDarkMode
                                    ? `0 0 15px ${glowColor}80`
                                    : "none",
                                }}
                              >
                                {category.name.replace(/&amp;/g, "&")}
                              </h3>

                              <p
                                className={`mb-4 text-sm transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"]
                                  .textSecondary
                                  }`}
                              >
                                {category.description ||
                                  "Discover amazing products"}
                              </p>

                              <button
                                onClick={() => {
                                  const id = category.slug || category.category_id || category.id;
                                  // Navigate to stores with categoryId query param
                                  navigate(`/stores?categoryId=${encodeURIComponent(id)}`);
                                }}
                                className="px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105"
                                style={{
                                  background: `linear-gradient(90deg, ${glowColor}, ${glowColor}80)`,
                                  color: "white",
                                  boxShadow: `0 0 20px ${glowColor}40`,
                                }}
                              >
                                EXPLORE
                              </button>
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section
          className={`py-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`transform transition-all duration-1000 delay-400 ${isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
                }`}
            >
              <div className="text-center mb-16">
                <h2
                  className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                    }`}
                  style={{
                    textShadow: isDarkMode
                      ? "0 0 20px rgba(0, 229, 255, 0.5)"
                      : "none",
                  }}
                >
                  NEW ARRIVALS
                </h2>
                <p
                  className={`text-xl max-w-2xl mx-auto transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                    }`}
                >
                  Fresh products just landed from across the multiverse.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {newArrivals.slice(0, 8).map((item, index) => (
                  <div
                    key={item.product_id || item.store_id || index}
                    className={`transform transition-all duration-500 delay-${index * 100
                      } ${isVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-10 opacity-0"
                      }`}
                  >
                    <Link to={item.store_id ? `/store/${item.store_id}` : "#"}>
                      <div
                        className={`relative p-4 rounded-xl transition-all duration-300 hover:scale-105 group cursor-pointer ${isDarkMode
                          ? "bg-white/3 backdrop-blur-md"
                          : "bg-white/80 backdrop-blur-md"
                          }`}
                        style={{
                          border: `1px solid ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"
                            }`,
                          boxShadow: `0 0 25px ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"
                            }20`,
                        }}
                      >
                        {/* Item Image */}
                        <div
                          className="relative mb-4 overflow-hidden rounded-lg flex items-center justify-center p-4"
                          style={{
                            height: "200px",
                            background: `linear-gradient(135deg, ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"
                              }20, ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"}40)`,
                          }}
                        >
                          {item.profile_image || item.logo || item.background_image ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={
                                  item.profile_image || item.logo || item.background_image
                                }
                                alt={item.name || item.title}
                                className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                onLoad={(e) => {
                                  console.log("✅ Image loaded successfully!");
                                  console.log(
                                    "URL:",
                                    item.background_image || item.profile_image
                                  );
                                  console.log("Store:", item.name);
                                }}
                                onError={(e) => {
                                  console.error("❌ Image load error!");
                                  console.error(
                                    "URL:",
                                    item.background_image || item.profile_image
                                  );
                                  console.error("Store:", item.name);
                                  e.target.style.display = "none";
                                  const fallback =
                                    document.createElement("div");
                                  fallback.className = "text-6xl";
                                  fallback.textContent = item.store_id
                                    ? "🏪"
                                    : "📦";
                                  e.target.parentElement.appendChild(fallback);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-6xl">
                              {item.store_id ? "🏪" : "📦"}
                            </div>
                          )}
                          {item.average_rating && (
                            <div
                              className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                background:
                                  "linear-gradient(90deg, #FF00FF, #FF00FF80)",
                                color: "white",
                                boxShadow: "0 0 15px #FF00FF40",
                              }}
                            >
                              ⭐ {item.average_rating}
                            </div>
                          )}
                        </div>

                        {/* Item Info */}
                        <div className="text-center">
                          <h3
                            className={`text-sm font-bold mb-2 line-clamp-2 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                              }`}
                            style={{
                              textShadow: isDarkMode
                                ? `0 0 10px ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"
                                }60`
                                : "none",
                            }}
                          >
                            {item.name || item.title}
                          </h3>

                          {/* Description or Reviews */}
                          {item.description && (
                            <p
                              className={`text-xs mb-3 line-clamp-2 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"]
                                .textSecondary
                                }`}
                            >
                              {item.description}
                            </p>
                          )}

                          {item.total_reviews && (
                            <div className="flex items-center justify-center space-x-2 mb-3">
                              <span
                                className="text-sm"
                                style={{
                                  color:
                                    index % 2 === 0 ? "#00E5FF" : "#FF00FF",
                                }}
                              >
                                {item.total_reviews} reviews
                              </span>
                            </div>
                          )}

                          {/* View Button */}
                          <button
                            className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
                            style={{
                              background: `linear-gradient(90deg, ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"
                                }20, ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"
                                }40)`,
                              border: `1px solid ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"
                                }`,
                              color: "white",
                              boxShadow: `0 0 15px ${index % 2 === 0 ? "#00E5FF" : "#FF00FF"
                                }20`,
                            }}
                          >
                            {item.store_id ? "VISIT STORE" : "VIEW PRODUCT"}
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Wishlist Products Section */}
      {wishlistProducts.length > 0 && (
        <section
          className={`py-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`transform transition-all duration-1000 delay-500 ${isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
                }`}
            >
              <div className="text-center mb-16">
                <h2
                  className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                    }`}
                  style={{
                    textShadow: isDarkMode
                      ? "0 0 20px rgba(255, 0, 255, 0.5)"
                      : "none",
                  }}
                >
                  WISHLIST PRODUCTS
                </h2>
                <p
                  className={`text-xl max-w-2xl mx-auto transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                    }`}
                >
                  Your favorite items waiting for you
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistProducts.map((item, index) => {
                  const productId = typeof item === 'object' ? (item.product_id || item.id) : item;
                  const productName = item.name || item.product_name || `Product ${productId}`;
                  const productImage = item.image || item.thumb || item.image_url || '/no-image.png';
                  const productPrice = item.price || item.price_formated || item.priceDisplay;

                  return (
                    <div
                      key={index}
                      className={`transform transition-all duration-500 delay-${index * 150
                        } ${isVisible
                          ? "translate-y-0 opacity-100"
                          : "translate-y-10 opacity-0"
                        }`}
                    >
                      <Link
                        to={`/product/${productId}`}
                        className={`relative p-6 rounded-xl transition-all duration-300 hover:scale-105 group cursor-pointer block ${isDarkMode
                          ? "bg-white/2 backdrop-blur-md"
                          : "bg-white/80 backdrop-blur-md"
                          }`}
                        style={{
                          border: isDarkMode ? "1px solid #00E5FF" : "1px solid #e5e7eb",
                          boxShadow: isDarkMode
                            ? "0 0 25px rgba(0, 229, 255, 0.2), inset 0 0 25px rgba(0, 229, 255, 0.05)"
                            : "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      >
                        {/* Product Image */}
                        <div className="w-full h-48 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden bg-gray-100">
                          <img
                            src={productImage}
                            alt={productName}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => { e.currentTarget.src = '/no-image.png'; }}
                          />
                        </div>

                        {/* Product Name */}
                        <h3
                          className={`text-lg font-bold mb-2 transition-colors duration-300 line-clamp-2 ${colors[isDarkMode ? "dark" : "light"].text
                            }`}
                          style={{
                            textShadow: isDarkMode
                              ? "0 0 10px rgba(0, 229, 255, 0.6)"
                              : "none",
                          }}
                        >
                          {productName}
                        </h3>

                        {/* Price */}
                        {productPrice && (
                          <div className="flex items-center justify-center mb-4">
                            <span
                              className="text-xl font-bold"
                              style={{ color: isDarkMode ? "#00E5FF" : "#0891b2" }}
                            >
                              {productPrice}
                            </span>
                          </div>
                        )}

                        {/* View Product Button */}
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
                          VIEW PRODUCT
                        </button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Arrival Products Section (from home_page_builder 'new_arrival_product') */}
      {newArrivalProducts && newArrivalProducts.length > 0 && (
        <section
          className={`py-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className={`transform transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}
            >
              <div className="text-center mb-16">
                <h2
                  className={`text-4xl md:text-5xl font-bold mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                    }`}
                >
                  NEW ARRIVAL PRODUCTS
                </h2>
                <p
                  className={`text-xl max-w-2xl mx-auto mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                    }`}
                >
                  Browse the latest products freshly added to the marketplace.
                </p>
                <Link
                  to="/latest"
                  className="inline-block px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    background: isDarkMode ? 'linear-gradient(90deg, #00E5FF, #0891b2)' : 'linear-gradient(90deg, #0891b2, #06b6d4)',
                    color: 'white',
                    boxShadow: isDarkMode ? '0 0 20px rgba(0, 229, 255, 0.4)' : '0 4px 12px rgba(8, 145, 178, 0.3)'
                  }}
                >
                  VIEW LATEST
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {newArrivalProducts.slice(0, 12).map((item, idx) => (
                  <div
                    key={item.id || item.product_id || item.store_id || idx}
                    className={`transform transition-all duration-500 delay-${idx * 80} ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                      }`}
                  >
                    <Link to={item.product_id ? `/product/${item.product_id}` : item.store_id ? `/store/${item.store_id}` : '#'}>
                      <div
                        className={`relative p-4 rounded-xl transition-all duration-300 hover:scale-105 group cursor-pointer ${isDarkMode ? "bg-white/3 backdrop-blur-md" : "bg-white/80 backdrop-blur-md"
                          }`}
                        style={{ border: `1px solid #e5e7eb`, boxShadow: `0 4px 12px rgba(0,0,0,0.06)` }}
                      >
                        <div className="relative mb-4 overflow-hidden rounded-lg flex items-center justify-center p-4" style={{ height: 180, background: '#f7fafc' }}>
                          {item.displayImage ? (
                            <img
                              src={item.displayImage}
                              alt={item.name || item.title}
                              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => { e.currentTarget.src = '/no-image.png'; }}
                            />
                          ) : (
                            <div className="text-6xl">📦</div>
                          )}
                        </div>

                        <div className="text-center">
                          <h3 className={`text-sm font-bold mb-2 line-clamp-2 ${colors[isDarkMode ? 'dark' : 'light'].text}`}>{item.name || item.title}</h3>
                          {(item.store_name || item.store) && (
                            <p className={`text-xs mb-2 ${colors[isDarkMode ? 'dark' : 'light'].textSecondary}`}>
                              🏪 {item.store_name || item.store}
                            </p>
                          )}
                          {item.hasDiscount ? (
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-lg font-bold" style={{ color: isDarkMode ? '#00E5FF' : '#0891b2' }}>
                                ${item.specialPrice.toFixed(2)}
                              </span>
                              <span className={`text-xs line-through ${colors[isDarkMode ? 'dark' : 'light'].textSecondary}`}>
                                ${item.originalPrice.toFixed(2)}
                              </span>
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">SALE</span>
                            </div>
                          ) : (
                            item.price && <div className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? '#00E5FF' : '#0891b2' }}>${item.price}</div>
                          )}
                          <button className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105" style={{ background: isDarkMode ? 'linear-gradient(90deg,#00E5FF20,#00E5FF40)' : 'linear-gradient(90deg,#EEF2FF,#E9F5FF)', border: '1px solid #e5e7eb' }}>PRE-ORDER</button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      <section
        className={`py-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {(
              homeData?.stats || [
                {
                  number: "1000+",
                  label: "Happy Customers",
                  icon: "👥",
                  glow: "#00E5FF",
                },
                {
                  number: "50+",
                  label: "Verified Stores",
                  icon: "🏪",
                  glow: "#FF00FF",
                },
                {
                  number: "10K+",
                  label: "Products Available",
                  icon: "📦",
                  glow: "#00E5FF",
                },
                {
                  number: "99%",
                  label: "Satisfaction Rate",
                  icon: "⭐",
                  glow: "#FF00FF",
                },
              ]
            ).map((stat, index) => (
              <div
                key={index}
                className={`transform transition-all duration-500 delay-${index * 200
                  } ${isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                  }`}
              >
                <div
                  className={`relative p-6 rounded-xl transition-all duration-300 hover:scale-105 ${isDarkMode
                    ? "bg-white/3 backdrop-blur-md"
                    : "bg-white/80 backdrop-blur-md"
                    }`}
                  style={{
                    border: `1px solid ${stat.glow}`,
                    boxShadow: `0 0 25px ${stat.glow}20, inset 0 0 25px ${stat.glow}05`,
                  }}
                >
                  <div
                    className="text-4xl mb-4"
                    style={{ textShadow: `0 0 20px ${stat.glow}50` }}
                  >
                    {stat.icon}
                  </div>
                  <div
                    className="text-4xl font-bold mb-2"
                    style={{
                      color: stat.glow,
                      textShadow: `0 0 15px ${stat.glow}60`,
                    }}
                  >
                    {stat.number}
                  </div>
                  <div
                    className={`text-lg font-medium transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                      }`}
                    style={{
                      textShadow: isDarkMode
                        ? "0 0 5px rgba(176, 184, 193, 0.3)"
                        : "none",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className={`py-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2
                className={`text-4xl font-bold mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                  }`}
                style={{
                  textShadow: isDarkMode
                    ? "0 0 20px rgba(0, 229, 255, 0.5)"
                    : "none",
                }}
              >
                Why Choose Multiverse Market?
              </h2>
              <p
                className={`text-xl mb-8 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                  }`}
              >
                We connect you with trusted sellers from across infinite
                dimensions, offering you access to unique products and
                exceptional service all in one cosmic marketplace.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div
                    className="rounded-lg p-3 mr-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #00E5FF20, #00E5FF40)",
                      border: "1px solid #00E5FF",
                      boxShadow: "0 0 15px #00E5FF30",
                    }}
                  >
                    <svg
                      className="w-6 h-6 text-[#00E5FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-semibold mb-2 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                        }`}
                      style={{
                        textShadow: isDarkMode
                          ? "0 0 10px rgba(0, 229, 255, 0.5)"
                          : "none",
                      }}
                    >
                      Verified Sellers
                    </h3>
                    <p
                      className={`transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                        }`}
                    >
                      All our sellers are thoroughly verified across multiple
                      dimensions to ensure quality and reliability.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div
                    className="rounded-lg p-3 mr-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #FF00FF20, #FF00FF40)",
                      border: "1px solid #FF00FF",
                      boxShadow: "0 0 15px #FF00FF30",
                    }}
                  >
                    <svg
                      className="w-6 h-6 text-[#FF00FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-semibold mb-2 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                        }`}
                      style={{
                        textShadow: isDarkMode
                          ? "0 0 10px rgba(255, 0, 255, 0.5)"
                          : "none",
                      }}
                    >
                      Quantum Payments
                    </h3>
                    <p
                      className={`transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                        }`}
                    >
                      Your transactions are protected with quantum-level
                      security across all dimensions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div
                    className="rounded-lg p-3 mr-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #00E5FF20, #00E5FF40)",
                      border: "1px solid #00E5FF",
                      boxShadow: "0 0 15px #00E5FF30",
                    }}
                  >
                    <svg
                      className="w-6 h-6 text-[#00E5FF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-semibold mb-2 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                        }`}
                      style={{
                        textShadow: isDarkMode
                          ? "0 0 10px rgba(0, 229, 255, 0.5)"
                          : "none",
                      }}
                    >
                      Infinite Selection
                    </h3>
                    <p
                      className={`transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                        }`}
                    >
                      Carefully curated products from the best sellers across
                      infinite universes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className={`py-20 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className={`text-4xl font-bold mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
              }`}
            style={{
              textShadow: isDarkMode
                ? "0 0 20px rgba(255, 0, 255, 0.5)"
                : "none",
            }}
          >
            Ready to Begin Your Journey?
          </h2>
          <p
            className={`text-xl mb-12 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
              }`}
          >
            Join thousands of explorers who have discovered infinite
            possibilities through our cosmic marketplace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 transform"
              style={{
                background: "linear-gradient(90deg, #00E5FF, #FF00FF)",
                color: "white",
                boxShadow:
                  "0 0 30px rgba(0, 229, 255, 0.4), 0 0 60px rgba(255, 0, 255, 0.2)",
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
              }}
            >
              JOIN THE MULTISTORE
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 transform"
              style={{
                background: "transparent",
                border: "2px solid #00E5FF",
                color: "#00E5FF",
                boxShadow: "0 0 20px rgba(0, 229, 255, 0.3)",
                textShadow: "0 0 10px rgba(0, 229, 255, 0.5)",
              }}
            >
              Order Your Store
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`py-16 transition-colors duration-300 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="flex items-center space-x-3">
                  <img src={`${process.env.PUBLIC_URL}/logo-multi-store.png`} alt="multi-store" className="h-8 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <span
                    className={`font-bold text-lg transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                      }`}
                  >
                    multi-store
                  </span>
                </div>
              </div>
              <p
                className={`mb-6 max-w-md transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                  }`}
              >
                Connecting explorers with trusted sellers across infinite
                dimensions. Your gateway to cosmic commerce and exceptional
                service.
              </p>
              <div className="flex space-x-6">
                <button
                  className="text-[#5e503f] hover:text-[#c6ac8f] transition-colors duration-200"
                >
                  <span className="sr-only">Facebook</span>
                  📘
                </button>
                <button
                  className="text-[#5e503f] hover:text-[#c6ac8f] transition-colors duration-200"
                >
                  <span className="sr-only">Twitter</span>
                  🐦
                </button>
                <button
                  className="text-[#5e503f] hover:text-[#c6ac8f] transition-colors duration-200"
                >
                  <span className="sr-only">Instagram</span>
                  📷
                </button>
                <button
                  className="text-[#5e503f] hover:text-[#c6ac8f] transition-colors duration-200"
                >
                  <span className="sr-only">LinkedIn</span>
                  💼
                </button>
              </div>
            </div>

            <div>
              <h3
                className={`text-lg font-semibold mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                  }`}

              >
                ABOUT US
              </h3>
              <ul className="space-y-3">
                <li>
                  <button
                    className={`hover:text-[#5e503f] transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                      }`}
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    className={`hover:text-[#5e503f] transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                      }`}
                  >
                    About
                  </button>
                </li>
                <li>
                  <Link
                    to="/services"
                    className={`hover:text-[#5e503f] transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                      }`}
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <button
                    className={`hover:text-[#5e503f] transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                      }`}
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3
                className={`text-lg font-semibold mb-6 transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].text
                  }`}

              >
                CUSTOMER SERVICE
              </h3>
              <ul className="space-y-3">
                {user && !user.isGuest ? (
                  <li>
                    <div
                      className={`font-medium transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].text
                        }`}
                    >
                      Hello, {user.firstname || user.name?.split(' ')[0] || ''} {user.lastname || user.name?.split(' ')[1] || ''}
                    </div>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/login"
                        className={`hover:text-[#5e503f] transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                          }`}
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/signup"
                        className={`hover:text-[#5e503f] transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                          }`}
                      >
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <button
                    className={`hover:text-[#5e503f] transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                      }`}
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button
                    className={`hover:text-[#5e503f] transition-colors duration-200 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                      }`}
                  >
                    Contact Support
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="border-t mt-12 pt-8 text-center"
            style={{ borderColor: "rgba(198, 172, 143, 0.35)" }}
          >
            <p
              className={`transition-colors duration-300 ${colors[isDarkMode ? "dark" : "light"].textSecondary
                }`}
            >
              &copy; 2025 multi-store. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
