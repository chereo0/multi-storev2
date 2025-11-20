import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Link as RouterLink, useParams } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import { useWishlist } from "../../context/WishlistContext";
import {
  getStore,
  getProducts,
  getStoreReviews,
  submitStoreReview,
} from "../../api/services";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle } from "lucide-react";

const StorePage = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  const { user } = useAuth();
  const { addToCart, getStoreItemsCount, getQuantityForProduct } = useCart();
  const { isDarkMode, colors } = useTheme();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Background: we use a single `storebg.png` asset for both dark and light modes.

  const lastFetchedIdRef = useRef(null);
  useEffect(() => {
    if (lastFetchedIdRef.current === String(storeId)) return; // StrictMode guard: fetch once per storeId
    lastFetchedIdRef.current = String(storeId);
    const fetchData = async () => {
      try {
        const [storeResult, productsResult, reviewsResult] = await Promise.all([
          getStore(storeId),
          getProducts(storeId),
          getStoreReviews(storeId),
        ]);

        // Normalize store from direct API or from embedded store_info in the products response
        if (storeResult && storeResult.success) {
          setStore(storeResult.data || null);
        }

        // If the products endpoint embeds store_info, merge it into existing store state
        const prodPayload = productsResult?.data;
        const embedded =
          prodPayload?.data?.store_info ||
          prodPayload?.store_info ||
          prodPayload?.store ||
          null;
        if (embedded) {
          const sanitizeField = (value) => {
            if (value === null || value === undefined) return null;
            const s = String(value).trim();
            if (!s) return null;
            const lower = s.toLowerCase();
            if (lower === "null" || lower === "undefined" || s === "#") return null;
            return s;
          };
          const mapped = {
            id: embedded.store_id || embedded.id,
            name: sanitizeField(embedded.name) || "",
            owner: sanitizeField(embedded.owner || embedded.store_owner) || "",
            description: sanitizeField(embedded.description) || "",
            logo: sanitizeField(embedded.profile_image || embedded.logo),
            banner: sanitizeField(embedded.background_image || embedded.banner),
            email: sanitizeField(embedded.email),
            telephone: sanitizeField(embedded.telephone || embedded.phone),
            address: sanitizeField(embedded.address),
            whatsapp: sanitizeField(embedded.whatsapp),
            facebook: sanitizeField(embedded.facebook),
            twitter: sanitizeField(embedded.twitter),
            instagram: sanitizeField(embedded.instagram),
            linkedin: sanitizeField(embedded.linkedin),
            youtube: sanitizeField(embedded.youtube),
            tiktok: sanitizeField(embedded.tiktok),
            product_limit:
              embedded.product_limit || embedded.productLimit || null,
            opening_hours:
              embedded.opening_hours || embedded.opening_hours || null,
            status: embedded.status,
            date_added: embedded.date_added,
            date_modified: embedded.date_modified,
            average_rating: embedded.average_rating,
            total_reviews: embedded.total_reviews,
          };
          setStore((prev) => ({ ...(prev || {}), ...mapped }));
        }

        // Normalize products: backend may return various shapes. Handle the API shape you pasted:
        // { success: 1, data: { store_info: {...}, new_products: [ { product_id, name, image, price }, ... ] } }
        if (productsResult && productsResult.success) {
          let p = productsResult.data;
          // If payload is wrapper object, try to extract arrays
          if (!Array.isArray(p)) {
            // common fields: data, products, new_products, items
            p = p?.data || p?.products || p?.new_products || p?.items || p;
          }
          // At this point p might still be an object (if we assigned prodPayload earlier), ensure array
          if (!Array.isArray(p)) {
            // If original data contained new_products nested under data, try that
            const maybe =
              productsResult.data?.data?.new_products ||
              productsResult.data?.new_products;
            p = Array.isArray(maybe) ? maybe : [];
          }

          // Normalize product fields (server uses product_id)
          const normalized = p.map((prod) => {
            const rawPrice =
              prod.price || prod.price_text || prod.price_display || "";
            const numeric =
              typeof rawPrice === "string"
                ? parseFloat(rawPrice.replace(/[^0-9.]/g, ""))
                : rawPrice;
            return {
              id: prod.product_id || prod.id,
              name: prod.name || prod.title || "Product",
              image:
                prod.image || prod.image_url || prod.picture || "/no-image.png",
              price: Number.isFinite(numeric) ? numeric : null,
              priceDisplay:
                rawPrice || (Number.isFinite(numeric) ? `$${numeric}` : null),
              description: prod.description || prod.short_description || "",
              inStock: prod.in_stock !== undefined ? !!prod.in_stock : true,
            };
          });
          setProducts(normalized);
        } else {
          setProducts([]);
        }

        // Normalize reviews similarly
        if (reviewsResult && reviewsResult.success) {
          let r = reviewsResult.data;
          if (!Array.isArray(r)) {
            r = r?.data || r?.reviews || [];
          }
          setReviews(Array.isArray(r) ? r : []);
        } else {
          setReviews([]);
        }
      } catch (e) {
        console.error("Error fetching store data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  const handleAddToCart = async (product) => {
    try {
      const res = await addToCart(product, storeId);
      // addToCart will already show server error as a toast on failure.
      if (res && res.success) {
        toast.success(`${product.name} added to cart`);
      }
    } catch (err) {
      // Defensive: addToCart should return structured response, but show toast if it throws
      toast.error(err?.message || String(err) || "Could not add to cart");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to submit a review");
      return;
    }
    // Build optimistic review object for immediate UI feedback
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split("T")[0],
    };

    // Optimistically update UI
    setReviews((prev) => [optimistic, ...prev]);
    setNewReview({ rating: 5, comment: "" });
    setShowReviewForm(false);

    // Send to server using expected payload { text, rating }
    try {
      const res = await submitStoreReview(storeId, {
        text: optimistic.comment,
        rating: optimistic.rating,
      });
      if (res && res.success) {
        toast.success("Review submitted");
        // Optionally replace temp review with returned server review (if provided)
        if (res.data) {
          setReviews((prev) =>
            prev.map((r) => (r.id === tempId ? res.data : r))
          );
        }
      } else {
        throw new Error(
          res?.message || res?.error || "Failed to submit review"
        );
      }
    } catch (err) {
      // Revert optimistic update on failure
      setReviews((prev) => prev.filter((r) => r.id !== tempId));
      toast.error(`Could not submit review: ${err?.message || err}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? "" : ""
        }`}
        style={{
          background: isDarkMode
            ? "linear-gradient(180deg, #0a0908, #22333b)"
            : "linear-gradient(180deg, #eae0d5, #c6ac8f)",
        }}
      >
        <div className="text-center">
          <h2
            className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
              colors[isDarkMode ? "dark" : "light"].text
            }`}
          >
            Store not found
          </h2>
          <Link to="/home" className="text-indigo-600 hover:text-indigo-500">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const storeCount = getStoreItemsCount(storeId);

  // Lightweight R3F background
  function FloatingInstanced({ count = 180 }) {
    const meshRef = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    useFrame(({ clock }) => {
      const t = clock.getElapsedTime();
      for (let i = 0; i < count; i++) {
        const r = 8 + (i % 10) * 0.25;
        const a = t * (0.2 + (i % 7) * 0.03) + i;
        dummy.position.set(
          Math.cos(a) * r,
          Math.sin(a * 0.9) * (r * 0.15),
          -6 - (i % 20) * 0.2
        );
        dummy.scale.setScalar(0.25 + (i % 5) * 0.04);
        dummy.rotation.set(a * 0.2, a * 0.3, a * 0.1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    });
    return (
      <instancedMesh ref={meshRef} args={[null, null, count]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={"#66e4ff"}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.5}
        />
      </instancedMesh>
    );
  }
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "text-white" : "text-gray-900"
      }`}
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #0a0908, #22333b)"
          : "linear-gradient(180deg, #eae0d5, #c6ac8f)",
      }}
    >
      {/* 3D background */}
      <div className="absolute inset-0 -z-10">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 60 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 6, 4]} intensity={1.2} color={"#00E5FF"} />
          <pointLight
            position={[-6, -4, 3]}
            intensity={1.0}
            color={"#FF00FF"}
          />
          <FloatingInstanced />
        </Canvas>
      </div>

      {/* Header */}
      <div
        className={`backdrop-blur-md border-b sticky top-0 z-30 transition-colors duration-300 ${
          isDarkMode
            ? "bg-black/40 border-white/10"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to="/home"
            className={`font-bold text-lg transition-colors duration-300 ${
              colors[isDarkMode ? "dark" : "light"].text
            }`}
          >
            {store?.name || "Store"}
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a
              href="#featured"
              className={`hover:text-cyan-300 transition-colors duration-300 ${
                colors[isDarkMode ? "dark" : "light"].textSecondary
              }`}
            >
              Featured
            </a>
            <a
              href="#products"
              className={`hover:text-fuchsia-300 transition-colors duration-300 ${
                colors[isDarkMode ? "dark" : "light"].textSecondary
              }`}
            >
              Products
            </a>
            <a
              href="#reviews"
              className={`hover:text-cyan-300 transition-colors duration-300 ${
                colors[isDarkMode ? "dark" : "light"].textSecondary
              }`}
            >
              Reviews
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <div
              className={`text-xs sm:text-sm transition-colors duration-300 ${
                colors[isDarkMode ? "dark" : "light"].textSecondary
              }`}
            >
              In this store: <span className="font-semibold">{storeCount}</span>
            </div>
            <Link
              to="/cart"
              className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${
                isDarkMode
                  ? "border-cyan-400/40 hover:bg-cyan-400/10"
                  : "border-cyan-600/40 hover:bg-cyan-600/10"
              }`}
            >
              Cart
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-6 md:p-10"
            style={{
              background: isDarkMode
                ? "rgba(10,14,39,0.55)"
                : "rgba(255,255,255,0.8)",
              border: "1px solid rgba(0,229,255,0.3)",
              boxShadow:
                "0 0 40px rgba(0,229,255,0.15), inset 0 0 30px rgba(255,0,255,0.08)",
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                <img
                  src={
                    store.logo || store.raw?.profile_image || store.raw?.logo || store.profile_image || '/no-image.png'
                  }
                  alt={store.name}
                  onError={(e) => {
                    try {
                      e.currentTarget.src = '/no-image.png';
                    } catch (err) {}
                  }}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 transition-colors duration-300 ${
                    isDarkMode ? "border-white/70" : "border-gray-300"
                  }`}
                />
                <div>
                  <h1
                    className={`text-3xl md:text-5xl font-extrabold leading-tight transition-colors duration-300 ${
                      colors[isDarkMode ? "dark" : "light"].text
                    }`}
                  >
                    {store.name}
                  </h1>
                  <p
                    className={`mt-1 transition-colors duration-300 ${
                      colors[isDarkMode ? "dark" : "light"].textSecondary
                    }`}
                  >
                    {store.description}
                  </p>
                  <div
                    className={`mt-2 text-sm flex items-center gap-4 ${
                      colors[isDarkMode ? "dark" : "light"].textSecondary
                    }`}
                  >
                    {store.average_rating && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {store.average_rating}
                        </span>
                        <span
                          className={`text-xs ${
                            colors[isDarkMode ? "dark" : "light"].textSecondary
                          }`}
                        >
                          ({store.total_reviews || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`mt-2 text-sm ${
                      colors[isDarkMode ? "dark" : "light"].textSecondary
                    }`}
                  >
                    {store.owner && (
                      <span className="mr-4">
                        Owner:{" "}
                        <span className="font-medium">{store.owner}</span>
                      </span>
                    )}
                    {store.email && (
                      <a
                        className="mr-4 text-indigo-500"
                        href={`mailto:${store.email}`}
                      >
                        {store.email}
                      </a>
                    )}
                    {store.telephone && (
                      <a
                        className="text-indigo-500"
                        href={`tel:${store.telephone}`}
                      >
                        {store.telephone}
                      </a>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    {store.facebook && (
                      <a
                        href={store.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                        aria-label="Facebook"
                        title="Facebook"
                      >
                        <Facebook className="w-4 h-4" />
                      </a>
                    )}
                    {store.twitter && (
                      <a
                        href={store.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white transition-colors duration-200"
                        aria-label="Twitter"
                        title="Twitter"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {store.instagram && (
                      <a
                        href={store.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 text-white transition-opacity duration-200"
                        aria-label="Instagram"
                        title="Instagram"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {store.linkedin && (
                      <a
                        href={store.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white transition-colors duration-200"
                        aria-label="LinkedIn"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {store.youtube && (
                      <a
                        href={store.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                        aria-label="YouTube"
                        title="YouTube"
                      >
                        <Youtube className="w-4 h-4" />
                      </a>
                    )}
                    {store.tiktok && (
                      <a
                        href={store.tiktok}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full bg-black hover:bg-gray-800 text-white transition-colors duration-200"
                        aria-label="TikTok"
                        title="TikTok"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                        </svg>
                      </a>
                    )}
                    {store.whatsapp && (
                      <a
                        href={
                          /^https?:\/\//i.test(store.whatsapp)
                            ? store.whatsapp
                            : `https://wa.me/${String(store.whatsapp).replace(/[^0-9+]/g, "")}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
                        aria-label="WhatsApp"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <a
                href="#products"
                className="inline-block px-6 py-3 rounded-full font-semibold"
                style={{
                  background: "linear-gradient(90deg,#00E5FF,#FF00FF)",
                  boxShadow: "0 0 24px rgba(0,229,255,0.35)",
                }}
              >
                EXPLORE
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="pb-20" aria-label="Featured products">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              id="featured"
              className={`text-2xl md:text-3xl font-bold transition-colors duration-300 ${
                colors[isDarkMode ? "dark" : "light"].text
              }`}
              style={{
                textShadow: isDarkMode
                  ? "0 0 20px rgba(0,229,255,0.4)"
                  : "none",
              }}
            >
              FEATURED PRODUCTS
            </h2>
            <button
              onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
                showWishlistOnly
                  ? "bg-pink-600 text-white"
                  : isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              }`}
            >
              {showWishlistOnly ? "❤️ Wishlist" : "🤍 Show Wishlist"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter(
                (product) => !showWishlistOnly || isInWishlist(product.id)
              )
              .map((product) => {
                const qty = getQuantityForProduct(product.id, storeId);
                const inWishlist = isInWishlist(product.id);
                return (
                  <div
                    key={product.id}
                    className="rounded-2xl overflow-hidden backdrop-blur-sm relative"
                    style={{
                      background: isDarkMode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.8)",
                      border: isDarkMode
                        ? "1px solid rgba(255,255,255,0.18)"
                        : "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    {/* Wishlist Icon */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-2 right-2 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-200 hover:scale-110"
                      style={{
                        background: inWishlist
                          ? "rgba(236, 72, 153, 0.9)"
                          : "rgba(0, 0, 0, 0.3)",
                      }}
                      aria-label={
                        inWishlist ? "Remove from wishlist" : "Add to wishlist"
                      }
                    >
                      {inWishlist ? (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-white"
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
                      )}
                    </button>

                    <div
                      className={`h-40 flex items-center justify-center transition-colors duration-300 ${
                        isDarkMode ? "bg-black/30" : "bg-gray-100"
                      }`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className={`font-semibold transition-colors duration-300 ${
                            colors[isDarkMode ? "dark" : "light"].text
                          }`}
                        >
                          <RouterLink to={`/product/${product.id}`} state={{ storeId }}>
                            {product.name}
                          </RouterLink>
                        </h3>
                        <span className="text-cyan-300 font-bold">
                          {product.priceDisplay
                            ? product.priceDisplay
                            : `$${product.price}`}
                        </span>
                      </div>
                      <p
                        className={`text-xs mb-3 line-clamp-2 transition-colors duration-300 ${
                          colors[isDarkMode ? "dark" : "light"].textSecondary
                        }`}
                      >
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            product.inStock
                              ? "bg-cyan-600 hover:bg-cyan-500"
                              : "bg-gray-600 cursor-not-allowed"
                          }`}
                          aria-label={
                            product.inStock
                              ? `Add ${product.name} to cart`
                              : `${product.name} out of stock`
                          }
                        >
                          {product.inStock ? "Add to Cart" : "Out of Stock"}
                        </button>
                        <RouterLink
                          to={`/product/${product.id}`}
                          state={{ storeId }}
                          className="px-3 py-2 rounded-lg text-sm border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 transition-colors duration-200"
                          aria-label={`View ${product.name}`}
                        >
                          View Product
                        </RouterLink>
                        {qty > 0 && (
                          <span
                            className={`text-xs transition-colors duration-300 ${
                              colors[isDarkMode ? "dark" : "light"]
                                .textSecondary
                            }`}
                          >
                            In cart: {qty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-2xl md:text-3xl font-bold mb-6 transition-colors duration-300 ${
              colors[isDarkMode ? "dark" : "light"].text
            }`}
          >
            REVIEWS ({reviews.length})
          </h2>
          {user && (
            <div className="mb-8">
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md"
              >
                {showReviewForm ? "Cancel" : "Write a Review"}
              </button>
              {showReviewForm && (
                <form
                  onSubmit={handleSubmitReview}
                  className={`mt-4 rounded-2xl p-6 backdrop-blur-sm transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-white/6 border border-white/15"
                      : "bg-white/80 border border-gray-200"
                  }`}
                >
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        colors[isDarkMode ? "dark" : "light"].text
                      }`}
                    >
                      Rating
                    </label>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setNewReview({ ...newReview, rating: i + 1 })
                          }
                          className={`w-8 h-8 ${
                            i < newReview.rating
                              ? "text-yellow-400"
                              : isDarkMode
                              ? "text-white/30"
                              : "text-gray-300"
                          }`}
                        >
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                        colors[isDarkMode ? "dark" : "light"].text
                      }`}
                    >
                      Comment
                    </label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) =>
                        setNewReview({ ...newReview, comment: e.target.value })
                      }
                      className={`w-full px-3 py-2 rounded-md transition-colors duration-200 ${
                        isDarkMode
                          ? "bg-gray-800/60 placeholder-gray-300"
                          : "bg-white placeholder-gray-500"
                      } ${colors[isDarkMode ? "dark" : "light"].text}`}
                      rows={4}
                      placeholder="Share your experience with this store..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md"
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </div>
          )}
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`rounded-2xl p-6 backdrop-blur-sm transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-white/6 border border-white/15"
                    : "bg-white/80 border border-gray-200"
                }`}
              >
                <div className="flex items-start">
                  <img
                    src={review.userAvatar}
                    alt={review.userName}
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4
                        className={`font-medium transition-colors duration-300 ${
                          colors[isDarkMode ? "dark" : "light"].text
                        }`}
                      >
                        {review.userName}
                      </h4>
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          colors[isDarkMode ? "dark" : "light"].textSecondary
                        }`}
                      >
                        {review.date}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "text-yellow-400"
                              : isDarkMode
                              ? "text-white/30"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p
                      className={`transition-colors duration-300 ${
                        colors[isDarkMode ? "dark" : "light"].textSecondary
                      }`}
                    >
                      {review.comment}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StorePage;
