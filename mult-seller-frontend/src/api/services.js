// Placeholder API service functions
// These will be replaced with actual Laravel backend API calls
import api from "./index";

// Helper: sanitize backend string fields (treat 'null', 'undefined', empty, '#') as null
function sanitizeField(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower === "null" || lower === "undefined" || s === "#") return null;
  return s;
}

// Mock data for development
const mockCategories = [
  {
    id: 1,
    name: "Electronics",
    slug: "electronics",
    image: "https://via.placeholder.com/200x150?text=Electronics",
    icon: "📱",
  },
  {
    id: 2,
    name: "Fashion",
    slug: "fashion",
    image: "https://via.placeholder.com/200x150?text=Fashion",
    icon: "👗",
  },
  {
    id: 3,
    name: "Home & Garden",
    slug: "home-garden",
    image: "https://via.placeholder.com/200x150?text=Home+Garden",
    icon: "🏠",
  },
  {
    id: 4,
    name: "Sports",
    slug: "sports",
    image: "https://via.placeholder.com/200x150?text=Sports",
    icon: "⚽",
  },
  {
    id: 5,
    name: "Books",
    slug: "books",
    image: "https://via.placeholder.com/200x150?text=Books",
    icon: "📚",
  },
  {
    id: 6,
    name: "Beauty",
    slug: "beauty",
    image: "https://via.placeholder.com/200x150?text=Beauty",
    icon: "💄",
  },
];

const mockStores = [
  {
    id: 1,
    name: "TechWorld Store",
    description: "Your one-stop shop for all electronics",
    banner: "https://via.placeholder.com/800x300?text=TechWorld+Banner",
    logo: "https://via.placeholder.com/100x100?text=TW",
    rating: 4.5,
    reviewCount: 128,
    category: "Electronics",
    isVerified: true,
  },
  {
    id: 2,
    name: "Fashion Hub",
    description: "Trendy fashion for everyone",
    banner: "https://via.placeholder.com/800x300?text=Fashion+Hub+Banner",
    logo: "https://via.placeholder.com/100x100?text=FH",
    rating: 4.2,
    reviewCount: 89,
    category: "Fashion",
    isVerified: true,
  },
  {
    id: 3,
    name: "Home Decor Plus",
    description: "Beautiful home decorations",
    banner: "https://via.placeholder.com/800x300?text=Home+Decor+Banner",
    logo: "https://via.placeholder.com/100x100?text=HD",
    rating: 4.7,
    reviewCount: 156,
    category: "Home & Garden",
    isVerified: false,
  },
];

const mockProducts = {
  1: [
    // TechWorld Store products
    {
      id: 1,
      name: "Wireless Headphones",
      description: "High-quality wireless headphones with noise cancellation",
      price: 99.99,
      image: "https://via.placeholder.com/300x300?text=Headphones",
      rating: 4.3,
      reviewCount: 45,
      inStock: true,
    },
    {
      id: 2,
      name: "Smartphone Case",
      description: "Protective case for your smartphone",
      price: 19.99,
      image: "https://via.placeholder.com/300x300?text=Phone+Case",
      rating: 4.1,
      reviewCount: 23,
      inStock: true,
    },
    {
      id: 3,
      name: "Bluetooth Speaker",
      description: "Portable Bluetooth speaker with great sound",
      price: 79.99,
      image: "https://via.placeholder.com/300x300?text=Speaker",
      rating: 4.5,
      reviewCount: 67,
      inStock: false,
    },
  ],
  2: [
    // Fashion Hub products
    {
      id: 4,
      name: "Summer Dress",
      description: "Elegant summer dress perfect for any occasion",
      price: 49.99,
      image: "https://via.placeholder.com/300x300?text=Summer+Dress",
      rating: 4.4,
      reviewCount: 34,
      inStock: true,
    },
    {
      id: 5,
      name: "Denim Jacket",
      description: "Classic denim jacket for casual wear",
      price: 69.99,
      image: "https://via.placeholder.com/300x300?text=Denim+Jacket",
      rating: 4.2,
      reviewCount: 28,
      inStock: true,
    },
  ],
  3: [
    // Home Decor Plus products
    {
      id: 6,
      name: "Decorative Vase",
      description: "Beautiful ceramic vase for your home",
      price: 39.99,
      image: "https://via.placeholder.com/300x300?text=Vase",
      rating: 4.6,
      reviewCount: 19,
      inStock: true,
    },
    {
      id: 7,
      name: "Wall Art",
      description: "Modern wall art to enhance your space",
      price: 89.99,
      image: "https://via.placeholder.com/300x300?text=Wall+Art",
      rating: 4.8,
      reviewCount: 42,
      inStock: true,
    },
  ],
};

// Normalize product shape from various backend formats
function normalizeProduct(raw) {
  if (!raw) return null;
  // Collect images from multiple possible fields and dedupe
  const imageCandidates = [];
  if (Array.isArray(raw.images)) imageCandidates.push(...raw.images);
  if (Array.isArray(raw.original_images)) imageCandidates.push(...raw.original_images);
  if (raw.image) imageCandidates.push(raw.image);
  if (raw.original_image) imageCandidates.push(raw.original_image);
  if (raw.image_url) imageCandidates.push(raw.image_url);
  if (raw.picture) imageCandidates.push(raw.picture);
  if (raw.image_url_1) imageCandidates.push(raw.image_url_1);
  if (raw.image_1) imageCandidates.push(raw.image_1);
  const images = Array.from(
    new Set(
      imageCandidates
        .filter(Boolean)
        .map((s) => String(s))
    )
  );
  const image = images[0] || "/no-image.png";

  // Price handling with formatted display from API when available
  const rawPrice =
    raw.price_formated ||
    raw.price_text ||
    raw.price_display ||
    raw.amount ||
    raw.price ||
    null;
  const numeric = typeof rawPrice === "string" ? parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) : rawPrice;

  // Special/discount price handling
  let rawSpecialPrice = raw.special || raw.special_price || raw.discount_price || raw.sale_price || null;
  
  // Check if discounts array exists and has items
  if (!rawSpecialPrice && raw.discounts && Array.isArray(raw.discounts) && raw.discounts.length > 0) {
    const firstDiscount = raw.discounts[0];
    rawSpecialPrice = firstDiscount.price || firstDiscount.price_excluding_tax;
  }
  
  const specialNumeric = typeof rawSpecialPrice === "string" ? parseFloat(String(rawSpecialPrice).replace(/[^0-9.]/g, "")) : rawSpecialPrice;
  const hasDiscount = specialNumeric && Number.isFinite(specialNumeric) && specialNumeric < (numeric || Infinity);
  
  // Original price fields
  const rawOriginalPrice = raw.original_price || raw.regular_price || (hasDiscount ? rawPrice : null);
  const originalNumeric = typeof rawOriginalPrice === "string" ? parseFloat(String(rawOriginalPrice).replace(/[^0-9.]/g, "")) : rawOriginalPrice;

  // Stock handling: prefer explicit status and quantity
  const stockStatus = (raw.stock_status || raw.status_text || "").toString().toLowerCase();
  const stockStatusId = typeof raw.stock_status_id !== "undefined" ? Number(raw.stock_status_id) : null;
  const quantity = typeof raw.quantity !== "undefined" ? Number(raw.quantity) : null;
  const inStockByStatus = stockStatus ? !stockStatus.includes("out of stock") && !stockStatus.includes("unavailable") : undefined;
  const inStockById = stockStatusId !== null ? ![0, -1, 5].includes(stockStatusId) : undefined; // 5 often means Out Of Stock
  const inStockByQty = quantity !== null ? quantity > 0 : undefined;
  const computeInStock = () => {
    if (typeof inStockByStatus !== "undefined") return inStockByStatus;
    if (typeof inStockById !== "undefined") return inStockById;
    if (typeof inStockByQty !== "undefined") return inStockByQty;
    if (typeof raw.in_stock !== "undefined") return !!raw.in_stock;
    if (typeof raw.stock !== "undefined") return Number(raw.stock) > 0;
    return true;
  };

  return {
    id: raw.product_id ?? raw.id ?? raw._id ?? null,
    name: raw.name ?? raw.title ?? raw.product_name ?? "Product",
    description: raw.description ?? raw.short_description ?? raw.desc ?? "",
    images,
    image,
    price: Number.isFinite(numeric) ? numeric : (typeof raw.price === "number" ? raw.price : null),
    priceDisplay:
      (typeof raw.price_formated !== "undefined" && raw.price_formated) ||
      rawPrice ||
      (Number.isFinite(numeric) ? `$${numeric}` : null),
    specialPrice: hasDiscount && Number.isFinite(specialNumeric) ? specialNumeric : null,
    specialPriceDisplay: hasDiscount ? (raw.special_formated || raw.special || (Number.isFinite(specialNumeric) ? `$${specialNumeric}` : null)) : null,
    originalPrice: hasDiscount && Number.isFinite(originalNumeric) ? originalNumeric : null,
    originalPriceDisplay: hasDiscount ? (raw.original_price_formated || rawOriginalPrice || (Number.isFinite(originalNumeric) ? `$${originalNumeric}` : null)) : null,
    hasDiscount: hasDiscount,
    rating: raw.rating ?? raw.average_rating ?? null,
    reviewCount: raw.reviewCount ?? raw.total_reviews ?? 0,
    inStock: computeInStock(),
    stock_status: raw.stock_status || null,
    quantity: quantity,
    manufacturer: raw.manufacturer || null,
    model: raw.model || null,
    sku: raw.sku || null,
    attributeGroups: Array.isArray(raw.attribute_groups) ? raw.attribute_groups : [],
    options: Array.isArray(raw.options) ? raw.options : [],
    storeId: raw.store_id ?? raw.storeId ?? (raw.store && (raw.store.id || raw.store.store_id)) ?? null,
    raw,
  };
}

const mockReviews = {
  stores: {
    1: [
      {
        id: 1,
        userId: 1,
        userName: "John Doe",
        userAvatar: "https://via.placeholder.com/40",
        rating: 5,
        comment: "Great store with excellent products and fast delivery!",
        date: "2024-01-15",
      },
      {
        id: 2,
        userId: 2,
        userName: "Jane Smith",
        userAvatar: "https://via.placeholder.com/40",
        rating: 4,
        comment:
          "Good selection of electronics, customer service could be better.",
        date: "2024-01-10",
      },
    ],
  },
  products: {
    1: [
      {
        id: 1,
        userId: 1,
        userName: "John Doe",
        userAvatar: "https://via.placeholder.com/40",
        rating: 5,
        comment: "Amazing sound quality! Highly recommended.",
        date: "2024-01-12",
      },
    ],
  },
};

// API Functions
export const getCategories = async () => {
  try {
    const response = await api.get("/categories");
    // Normalize response - backend may return { success, data } or just array
    if (response && response.data) {
      const data = response.data.data || response.data;
      return { success: true, data: Array.isArray(data) ? data : [] };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, data: [] };
  }
};

export const getStores = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, data: mockStores };
};

/**
 * Send contact form data to backend
 * POST /contact
 * @param {object} payload { name, email, subject, message }
 */
export const sendContact = async (payload) => {
  try {
  const response = await api.post("/contact", payload);
    // Normalize response
    if (response && (response.status === 200 || response.status === 201)) {
      return { success: true, data: response.data };
    }
    return { success: false, error: response?.data || "Unknown response" };
  } catch (e) {
    const err = e?.response?.data?.message || e?.message || "Request failed";
    return { success: false, error: err };
  }
};

export const getCategoryBySlug = async (slug) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const category = mockCategories.find((c) => c.slug === String(slug));
  return { success: !!category, data: category };
};

export const getStoresByCategory = async (categoryIdOrSlug) => {
  // Try real API first: GET /getstoresbycategoryid/:id
  try {
    const id = String(categoryIdOrSlug);
    console.log("🔍 Calling API: /getstoresbycategoryid/" + id);
    const res = await api.get(`/getstoresbycategoryid/${encodeURIComponent(id)}`);
    console.log("📦 API Raw Response:", res);
    if (res && res.data) {
      const payload = res.data;
      console.log("📦 API Payload:", payload);
      // Normalize different API shapes. Prefer payload.data.stores when present.
      const dataArray =
        (payload.data && Array.isArray(payload.data.stores) && payload.data.stores) ||
        (Array.isArray(payload.stores) && payload.stores) ||
        (Array.isArray(payload.data) && payload.data) ||
        (Array.isArray(payload) && payload) ||
        [];
      console.log("📦 Data Array extracted:", dataArray.length, "items");
      const ok = payload.success === 1 || payload.success === true || dataArray.length >= 0;
      // Map incoming store objects to a consistent shape used by the UI
      const mapped = (Array.isArray(dataArray) ? dataArray : []).map((s) => ({
        id: s.id ?? s.store_id ?? s.storeId ?? s._id ?? s.slug ?? null,
        name: s.name ?? s.store_name ?? s.title ?? "",
        description: s.description ?? s.desc ?? s.summary ?? "",
        logo: s.profile_image ?? s.logo ?? s.avatar ?? null,
        banner: s.background_image ?? s.banner ?? null,
        rating: s.average_rating ? Number(s.average_rating) : s.rating ?? null,
        reviewCount: s.total_reviews ? Number(s.total_reviews) : s.reviewCount ?? 0,
        category: s.category ?? s.category_id ?? null,
        raw: s,
      }));
      console.log("✅ Mapped stores:", mapped.length, "items");

      // Return only API data - no mock fallback
      return { success: !!ok, data: mapped };
    }
    
    // If res.data is empty/undefined
    console.warn("API response has no data");
    return { success: false, data: [] };
    
  } catch (err) {
    // If the API call fails, return error
    console.error("getStoresByCategory API failed:", err?.message || err);
    return { success: false, data: [], error: err?.message || "Failed to fetch stores by category" };
  }
};

export const getStore = async (storeId) => {
  // Try real API first
  try {
    const res = await api.get(`/store/${storeId}`);
    // Accept different API shapes: { success: 1|true, data: {...} } or direct object
    if (res && res.data) {
      const payload = res.data;
      const raw = payload.data || payload;
      // Some APIs wrap the store under data.store_info (and may also include products)
      const dataObj = (raw && (raw.store_info || raw.store || raw)) || null;
      if (!dataObj) return { success: false, data: null };

      // Normalize store shape so UI can rely on `logo` and `banner` fields
      const normalized = {
        id: dataObj.store_id ?? dataObj.id ?? dataObj._id ?? dataObj.slug ?? null,
        name: sanitizeField(dataObj.name ?? dataObj.store_name ?? dataObj.title ?? "") || "",
        description: sanitizeField(dataObj.description ?? dataObj.desc ?? dataObj.summary ?? "") || "",
        logo: sanitizeField(dataObj.profile_image ?? dataObj.logo ?? dataObj.avatar ?? null),
        banner: sanitizeField(dataObj.background_image ?? dataObj.banner ?? dataObj.cover ?? null),
        owner: sanitizeField(dataObj.owner ?? dataObj.store_owner ?? null),
        email: sanitizeField(dataObj.email ?? null),
        telephone: sanitizeField(dataObj.telephone ?? dataObj.phone ?? null),
        address: sanitizeField(dataObj.address ?? null),
        whatsapp: sanitizeField(dataObj.whatsapp ?? null),
        facebook: sanitizeField(dataObj.facebook ?? null),
        twitter: sanitizeField(dataObj.twitter ?? null),
        instagram: sanitizeField(dataObj.instagram ?? null),
        linkedin: sanitizeField(dataObj.linkedin ?? null),
        youtube: sanitizeField(dataObj.youtube ?? null),
        tiktok: sanitizeField(dataObj.tiktok ?? null),
        average_rating: dataObj.average_rating ?? dataObj.rating ?? null,
        total_reviews: dataObj.total_reviews ?? dataObj.reviewCount ?? 0,
        raw: dataObj,
      };
      const ok = payload.success === 1 || payload.success === true || !!payload.data;
      return { success: ok, data: normalized };
    }
    return { success: false, data: null };
  } catch (error) {
    console.warn(
      "getStore API failed, falling back to mock data:",
      error?.message || error
    );
    // Fallback to mock store for local dev
    await new Promise((resolve) => setTimeout(resolve, 300));
    const store = mockStores.find((s) => s.id === parseInt(storeId));
    if (!store) return { success: false, data: null };
    const normalized = {
      id: store.id,
      name: store.name,
      description: store.description,
      logo: store.logo || store.profile_image || null,
      banner: store.banner || store.background_image || null,
      average_rating: store.rating || null,
      total_reviews: store.reviewCount || 0,
      raw: store,
    };
    return { success: true, data: normalized };
  }
};

export const getProducts = async (storeId) => {
  // Try real API first
  try {
    const res = await api.get(`/store/${storeId}/products`);
    if (res && res.data) {
      const payload = res.data;
      // Attempt to extract array of products from possible shapes
      let data = payload.data || payload;
      if (!Array.isArray(data)) {
        data = data?.products || data?.new_products || data?.items || [];
      }
      const arr = Array.isArray(data) ? data : [];
      const normalized = arr.map(normalizeProduct);
      const ok = payload.success === 1 || payload.success === true || arr.length >= 0;
      return { success: ok, data: normalized };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.warn(
      "getProducts API failed, falling back to mock data:",
      error?.message || error
    );
    // Fallback: return empty list (do not surface mock products in production)
    await new Promise((resolve) => setTimeout(resolve, 200));
    // For local dev, map mockProducts to normalized shape if available
    const list = mockProducts[storeId] || [];
    return { success: true, data: list.map(normalizeProduct) };
  }
};

export const getProduct = async (productId) => {
  // Try real API first: GET /products/:id
  try {
    const res = await api.get(`/products/${productId}`);
    if (res && res.data) {
      const payload = res.data;
      const raw = payload.data || payload.product || payload;
      if (raw && (raw.product_id || raw.id || raw.name)) {
        return { success: true, data: normalizeProduct(raw) };
      }
    }
  } catch (err) {
    console.warn("getProduct API failed, falling back to mock:", err?.message || err);
  }
  // Fallback to mock data
  await new Promise((resolve) => setTimeout(resolve, 150));
  let product = null;
  for (const storeProducts of Object.values(mockProducts)) {
    product = storeProducts.find((p) => p.id === parseInt(productId));
    if (product) break;
  }
  return { success: !!product, data: normalizeProduct(product) };
};

// Search stores by name/description/slug; tries backend then falls back to client filtering
export const searchStores = async (query) => {
  const q = String(query || '').trim();
  if (!q) return { success: true, data: [] };
  try {
    // Try a few common endpoints
    const endpoints = [
      `/stores?search=${encodeURIComponent(q)}`,
      `/search/stores?q=${encodeURIComponent(q)}`,
      `/search?q=${encodeURIComponent(q)}&type=stores`,
    ];
    for (const path of endpoints) {
      try {
        const res = await api.get(path);
        const body = res?.data || {};
        const list = body.data || body.stores || body.items || body;
        if (Array.isArray(list) && list.length >= 0) {
          return { success: true, data: list };
        }
      } catch (_e) {}
    }
  } catch (_err) {}
  // Fallback: use home page builder and filter client-side
  try {
    const home = await getHomePageBuilder();
    let arr = [];
    if (home?.success) {
      const d = home.data;
      if (Array.isArray(d)) {
        const widget = d.find((w) => Array.isArray(w.stores) || Array.isArray(w.items));
        arr = (widget?.stores || widget?.items || []).slice(0, 100);
      } else if (Array.isArray(d?.stores)) {
        arr = d.stores.slice(0, 100);
      }
      const low = q.toLowerCase();
      const filtered = arr.filter((s) => {
        const name = (s?.name || '').toLowerCase();
        const desc = (s?.description || '').toLowerCase();
        const slug = (s?.slug || '').toLowerCase();
        return name.includes(low) || desc.includes(low) || slug.includes(low);
      });
      return { success: true, data: filtered };
    }
  } catch (_err2) {}
  return { success: true, data: [] };
};

// Search products; tries backend endpoints, falls back to scanning products from first N stores
export const searchProducts = async (query) => {
  const q = String(query || '').trim();
  if (!q) return { success: true, data: [] };
  try {
    const endpoints = [
      `/search/products?q=${encodeURIComponent(q)}`,
      `/products?search=${encodeURIComponent(q)}`,
      `/search?q=${encodeURIComponent(q)}&type=products`,
    ];
    for (const path of endpoints) {
      try {
        const res = await api.get(path);
        const body = res?.data || {};
        const raw = body.data || body.products || body.items || body;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
        if (Array.isArray(list)) {
          const normalized = list.map((p) => normalizeProduct(p));
          return { success: true, data: normalized };
        }
      } catch (_e) {}
    }
  } catch (_err) {}
  // Fallback: fetch stores from home builder and query first few products
  try {
    const storesRes = await getHomePageBuilder();
    let storeList = [];
    const d = storesRes?.data;
    if (Array.isArray(d)) {
      const widget = d.find((w) => Array.isArray(w.stores) || Array.isArray(w.items));
      storeList = (widget?.stores || widget?.items || []).slice(0, 10);
    } else if (Array.isArray(d?.stores)) {
      storeList = d.stores.slice(0, 10);
    }
    const low = q.toLowerCase();
    const results = [];
    for (const s of storeList) {
      const storeId = s.id || s.store_id || s.storeId || s.slug;
      if (!storeId) continue;
      try {
        const prods = await getProducts(storeId);
        if (prods?.success) {
          for (const prod of prods.data || []) {
            const name = (prod?.name || '').toLowerCase();
            const model = (prod?.model || '').toLowerCase();
            if (name.includes(low) || model.includes(low)) {
              results.push({ ...prod, storeId: prod.storeId || storeId, storeName: s.name });
            }
          }
        }
      } catch (_e) {}
    }
    return { success: true, data: results };
  } catch (_err2) {
    return { success: true, data: [] };
  }
};

// Lightweight client-side suggestions for products and stores without backend endpoints
// Caches home builder and per-store products in-memory to keep typing responsive
const __searchCache = {
  homeAt: 0,
  home: null,
  productsByStore: {},
};

const getHomeCached = async () => {
  const now = Date.now();
  // refresh cache every 5 minutes
  if (!__searchCache.home || now - __searchCache.homeAt > 5 * 60 * 1000) {
    try {
      const res = await getHomePageBuilder();
      if (res?.success) {
        __searchCache.home = res.data;
        __searchCache.homeAt = now;
      }
    } catch (_) {}
  }
  return __searchCache.home;
};

const getStoreListFromHome = (home) => {
  if (!home) return [];
  // Home can be array of widgets or object with stores
  if (Array.isArray(home)) {
    const stores = [];
    for (const w of home) {
      if (Array.isArray(w?.stores)) stores.push(...w.stores);
      if (Array.isArray(w?.items)) stores.push(...w.items);
    }
    return stores;
  }
  if (Array.isArray(home?.stores)) return home.stores;
  return [];
};

const scoreIncludes = (text, tokens) => {
  const t = (text || '').toString().toLowerCase();
  let score = 0;
  for (const tok of tokens) {
    if (!tok) continue;
    const idx = t.indexOf(tok);
    if (idx >= 0) {
      // earlier matches score slightly higher
      score += 2 + Math.max(0, 5 - idx);
    }
  }
  return score;
};

export const searchSuggest = async (query, options = {}) => {
  const q = String(query || '').trim();
  const limitStores = options.limitStores || 8;
  const limitProducts = options.limitProducts || 8;
  if (q.length < 2) return { success: true, data: { products: [], stores: [] } };

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  // 1) Get stores from home builder and filter
  const home = await getHomeCached();
  let stores = getStoreListFromHome(home).map((s) => ({
    id: s.id || s.store_id || s.storeId || s.slug,
    name: s.name || s.store_name || '',
    description: s.description || s.desc || '',
    logo: s.logo || s.profile_image,
    raw: s,
  }));
  const scoredStores = stores
    .map((s) => ({
      ...s,
      _score: scoreIncludes(`${s.name} ${s.description}`, tokens),
    }))
    .filter((s) => s._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limitStores);

  // 2) Gather products: use cached per-store products; fetch for top few stores if not cached
  const products = [];
  const candidateStores = scoredStores.length > 0 ? scoredStores : stores.slice(0, 10);

  for (const s of candidateStores.slice(0, 6)) {
    const sid = s.id;
    if (!sid) continue;
    if (!__searchCache.productsByStore[sid]) {
      try {
        const res = await getProducts(sid);
        if (res?.success) {
          __searchCache.productsByStore[sid] = res.data || [];
        } else {
          __searchCache.productsByStore[sid] = [];
        }
      } catch (_) {
        __searchCache.productsByStore[sid] = [];
      }
    }
    for (const p of __searchCache.productsByStore[sid]) {
      const name = p?.name || p?.raw?.name || '';
      const model = p?.model || '';
      const desc = p?.description || '';
      const score = scoreIncludes(`${name} ${model} ${desc}`, tokens);
      if (score > 0) {
        products.push({ ...p, storeId: p.storeId || sid, _score: score });
      }
    }
  }

  const topProducts = products
    .sort((a, b) => b._score - a._score)
    .slice(0, limitProducts)
    .map((p) => ({
      id: p.id || p.product_id,
      name: p.name,
      image: p.image || p.images?.[0] || p.raw?.image,
      priceDisplay: p.priceDisplay || p.price_formated || (p.price ? `$${(+p.price).toFixed(2)}` : ''),
      storeId: p.storeId,
    }));

  const topStores = scoredStores.map((s) => ({
    id: s.id,
    name: s.name,
    logo: s.logo,
  }));

  return { success: true, data: { products: topProducts, stores: topStores } };
};

export const getStoreReviews = async (storeId) => {
  // Fetch reviews from the store endpoint (reviews are included in data.reviews)
  try {
    const storeRes = await api.get(`/store/${storeId}`);
    if (storeRes && storeRes.data) {
      const payload = storeRes.data;
      const storeData = payload.data || payload;
      
      // Reviews are in data.reviews array
      if (Array.isArray(storeData.reviews)) {
        return { success: true, data: storeData.reviews };
      }
      
      // If store payload includes rating metadata but no reviews array, return empty
      if (typeof storeData.total_reviews !== "undefined") {
        return { success: true, data: [] };
      }
      
      // Also check if reviews are at the top level
      if (Array.isArray(payload.reviews)) {
        return { success: true, data: payload.reviews };
      }
    }
  } catch (err) {
    console.warn(
      "getStoreReviews: could not read reviews from store endpoint:",
      err?.message || err
    );
  }

  // If all attempts fail, return empty array
  return { success: true, data: [] };
};

export const getProductReviews = async (productId) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  const reviews = mockReviews.products[productId] || [];
  return { success: true, data: reviews };
};

export const submitStoreReview = async (storeId, reviewData) => {
  // Send review to backend: expects { text, rating }
  try {
    const payload = {
      text: reviewData.text ?? reviewData.comment ?? "",
      rating: reviewData.rating ?? null,
    };

    const res = await api.post(`/store/${storeId}/review`, payload);
    if (res && res.data) {
      const body = res.data;
      const ok =
        body.success === 1 ||
        body.success === true ||
        body.status === "success" ||
        !!body.data;
      return {
        success: !!ok,
        data: body.data || null,
        message: body.message || null,
      };
    }
    return { success: false, message: "No response from server" };
  } catch (err) {
    console.warn("submitStoreReview failed:", err?.message || err);
    // Return a structured failure so callers can revert optimistic updates
    return { success: false, error: err?.message || String(err) };
  }
};

export const submitProductReview = async (productId, reviewData) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // In real implementation, this would send data to backend
  return { success: true, message: "Review submitted successfully" };
};

// Add to cart (POST /cart)
export const addToCart = async (cartData) => {
  try {
    // Normalize and include extra option representations to maximize backend compatibility
    try {
      if (cartData && Array.isArray(cartData.option_list) && (!cartData.option || Object.keys(cartData.option).length === 0)) {
        // build a map keyed by product_option_id
        const map = {};
        for (const o of cartData.option_list) {
          const k = o.product_option_id ?? o.option_id ?? null;
          const altKey = o.option_id ?? o.product_option_id ?? null;
          const v = o.product_option_value_id ?? o.product_option_value_id ?? null;
          if (k != null && v != null) map[String(k)] = String(v);
          if (altKey != null && v != null) map[String(altKey)] = String(v);
        }
        if (Object.keys(map).length > 0) {
          cartData.option = { ...(cartData.option || {}), ...map };
        }
      }
    } catch (e) {
      console.warn('addToCart: option normalization failed', e);
    }

    const res = await api.post("/cart", cartData);
    console.log("addToCart API raw response:", res);
    console.log("addToCart API response data:", res.data);

    if (res && res.data) {
      const body = res.data;
      const ok =
        body.success === 1 ||
        body.success === true ||
        body.status === "success";

      const result = {
        success: ok ? 1 : 0,
        data: body.data || null,
        message: body.message || null,
        error: body.error || null,
      };

      console.log("addToCart returning:", result);

      // If server rejected due to missing option validation (e.g. "Color required!")
      // try a fallback: submit as application/x-www-form-urlencoded with option[<id>]=<value>
      try {
        const msg = String(result.message || result.error || '').toLowerCase();
        const shouldRetryForm = !ok && (msg.includes('color required') || msg.includes('please select') || msg.includes('required') || msg.includes('option'));
        if (shouldRetryForm && cartData) {
          console.log('addToCart: attempting form-encoded retry due to validation message:', msg);
          const params = new URLSearchParams();
          if (cartData.product_id) params.append('product_id', String(cartData.product_id));
          if (cartData.quantity) params.append('quantity', String(cartData.quantity));

          if (cartData.option && typeof cartData.option === 'object') {
            for (const [k, v] of Object.entries(cartData.option)) {
              params.append(`option[${k}]`, String(v));
              params.append(`product_option[${k}]`, String(v));
              params.append(`product_option_value[${k}]`, String(v));
            }
          }
          if (Array.isArray(cartData.option_list)) {
            for (const opt of cartData.option_list) {
              const k = opt.product_option_id ?? opt.option_id ?? null;
              const v = opt.product_option_value_id ?? opt.product_option_value_id ?? null;
              if (typeof k !== 'undefined' && typeof v !== 'undefined' && k !== null && v !== null) {
                params.append(`option[${k}]`, String(v));
                params.append(`product_option[${k}]`, String(v));
                params.append(`product_option_value[${k}]`, String(v));
                if (typeof opt.option_id !== 'undefined' && opt.option_id !== null) {
                  params.append(`option[${opt.option_id}]`, String(v));
                  params.append(`product_option[${opt.option_id}]`, String(v));
                }
              }
            }
          }

          const retryRes = await api.post('/cart', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
          console.log('addToCart form-encoded retry response:', retryRes?.data);
          const rb = retryRes?.data || {};
          const rok = rb.success === 1 || rb.success === true || rb.status === 'success';
          const retryResult = { success: rok ? 1 : 0, data: rb.data || null, message: rb.message || null, error: rb.error || null };
          return retryResult;
        }
      } catch (er) {
        console.warn('addToCart form-encoded retry failed:', er);
      }

      return result;
    }
    return { success: 0, message: "No response from server" };
  } catch (err) {
    console.warn("addToCart caught error:", err);
    console.log("addToCart error response:", err?.response?.data);

    // Check if error response has data from server (status 400 with validation errors)
    if (err?.response?.data) {
      const body = err.response.data;
      const result = {
        success: body.success || 0,
        data: body.data || null,
        message: body.message || null,
        error: body.error || null,
      };
      console.log("addToCart returning error response:", result);

      // Try form-encoded retry when server returns validation-like messages
      try {
        const msg = String(result.message || result.error || '').toLowerCase();
        const shouldRetryForm = (msg.includes('color required') || msg.includes('please select') || msg.includes('required') || msg.includes('option'));
        if (shouldRetryForm && cartData) {
          console.log('addToCart: attempting form-encoded retry after error response:', msg);
          const params = new URLSearchParams();
          if (cartData.product_id) params.append('product_id', String(cartData.product_id));
          if (cartData.quantity) params.append('quantity', String(cartData.quantity));

          if (cartData.option && typeof cartData.option === 'object') {
            for (const [k, v] of Object.entries(cartData.option)) {
              params.append(`option[${k}]`, String(v));
              params.append(`product_option[${k}]`, String(v));
              params.append(`product_option_value[${k}]`, String(v));
            }
          }
          if (Array.isArray(cartData.option_list)) {
            for (const opt of cartData.option_list) {
              const k = opt.product_option_id ?? opt.option_id ?? null;
              const v = opt.product_option_value_id ?? opt.product_option_value_id ?? null;
              if (typeof k !== 'undefined' && typeof v !== 'undefined' && k !== null && v !== null) {
                params.append(`option[${k}]`, String(v));
                params.append(`product_option[${k}]`, String(v));
                params.append(`product_option_value[${k}]`, String(v));
                if (typeof opt.option_id !== 'undefined' && opt.option_id !== null) {
                  params.append(`option[${opt.option_id}]`, String(v));
                  params.append(`product_option[${opt.option_id}]`, String(v));
                }
              }
            }
          }

          const retryRes = await api.post('/cart', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
          console.log('addToCart form-encoded retry response (from catch):', retryRes?.data);
          const rb = retryRes?.data || {};
          const rok = rb.success === 1 || rb.success === true || rb.status === 'success';
          const retryResult = { success: rok ? 1 : 0, data: rb.data || null, message: rb.message || null, error: rb.error || null };
          return retryResult;
        }
      } catch (er) {
        console.warn('addToCart form-encoded retry failed (from catch):', er);
      }

      return result;
    }

    return { success: 0, error: err?.message || String(err) };
  }
};

// Get cart (GET /cart)
export const getCart = async () => {
  try {
    const res = await api.get("/cart");
    if (res && res.data) {
      const body = res.data;
      const data = body.data || body;
      const ok = body.success === 1 || body.success === true || !!body.data;
      return { success: !!ok, data };
    }
    return { success: false, data: null };
  } catch (err) {
    console.warn("getCart failed:", err?.message || err);
    return { success: false, data: null, error: err?.message || String(err) };
  }
};

// Empty/clear cart (DELETE /cart/empty)
export const emptyCart = async () => {
  try {
    const res = await api.delete("/cart/empty");
    console.log("emptyCart API response:", res);

    if (res && res.data) {
      const body = res.data;
      const ok =
        body.success === 1 ||
        body.success === true ||
        body.status === "success";

      const result = {
        success: ok ? 1 : 0,
        message: body.message || "Cart cleared successfully",
        data: body.data || null,
      };

      console.log("emptyCart returning:", result);
      return result;
    }
    return { success: 1, message: "Cart cleared" };
  } catch (err) {
    console.warn("emptyCart caught error:", err);

    // Even if server returns error, we might want to clear local cart
    if (err?.response?.data) {
      const body = err.response.data;
      return {
        success: body.success || 0,
        message: body.message || null,
        error: body.error || null,
      };
    }

    return { success: 0, error: err?.message || String(err) };
  }
};

// Remove product from cart (DELETE /cart/:key)
export const removeFromCartAPI = async (key) => {
  try {
    const res = await api.delete(`/cart/${key}`);
    console.log("removeFromCartAPI response:", res);

    if (res && res.data) {
      const body = res.data;
      const ok =
        body.success === 1 ||
        body.success === true ||
        body.status === "success";

      const result = {
        success: ok ? 1 : 0,
        message: body.message || "Item removed from cart",
        data: body.data || null,
      };

      console.log("removeFromCartAPI returning:", result);
      return result;
    }
    return { success: 1, message: "Item removed" };
  } catch (err) {
    console.warn("removeFromCartAPI caught error:", err);

    if (err?.response?.data) {
      const body = err.response.data;
      return {
        success: body.success || 0,
        message: body.message || null,
        error: body.error || null,
      };
    }

    return { success: 0, error: err?.message || String(err) };
  }
};

// Update cart (PUT /cart)
export const updateCartAPI = async (cartData) => {
  try {
    const res = await api.put("/cart", cartData);
    console.log("updateCartAPI raw response:", res);
    console.log("updateCartAPI response data:", res.data);

    if (res && res.data) {
      const body = res.data;
      const ok =
        body.success === 1 ||
        body.success === true ||
        body.status === "success";

      const result = {
        success: ok ? 1 : 0,
        data: body.data || null,
        message: body.message || "Cart updated successfully",
        error: body.error || null,
      };

      console.log("updateCartAPI returning:", result);
      return result;
    }
    return { success: 0, message: "No response from server" };
  } catch (err) {
    console.warn("updateCartAPI caught error:", err);
    console.log("updateCartAPI error response:", err?.response?.data);

    // Check if error response has data from server (status 400 with validation errors)
    if (err?.response?.data) {
      const body = err.response.data;
      const result = {
        success: body.success || 0,
        data: body.data || null,
        message: body.message || null,
        error: body.error || null,
      };
      console.log("updateCartAPI returning error response:", result);
      return result;
    }

    return { success: 0, error: err?.message || String(err) };
  }
};

// Get wishlist (GET /wishlist)
export const getWishlist = async (customerId) => {
  try {
    // If no customerId provided, try to get from localStorage user
    let userId = customerId;
    if (!userId) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          userId = user.id || user.customer_id || user.customerId;
        } catch (e) {
          console.warn("Failed to parse user from localStorage");
        }
      }
    }
    
    if (!userId) {
      console.warn("getWishlist: No customer ID available");
      return { success: false, data: [], error: "No customer ID" };
    }

    const res = await api.get(`/wishlist/${userId}`);
    console.log("getWishlist response:", res);

    if (res && res.data) {
      const body = res.data;
      const data = body.data || body;
      const ok = body.success === 1 || body.success === true || !!body.data;
      return { success: !!ok, data };
    }
    return { success: false, data: [] };
  } catch (err) {
    console.warn("getWishlist failed:", err?.message || err);
    return { success: false, data: [], error: err?.message || String(err) };
  }
};

// Add to wishlist (POST /wishlist/:id)
export const addToWishlist = async (productId) => {
  try {
    console.log("addToWishlist: Attempting to add product", productId);
    console.log(
      "addToWishlist: Auth token in localStorage:",
      localStorage.getItem("auth_token")
    );
    console.log(
      "addToWishlist: User in localStorage:",
      localStorage.getItem("user")
    );

    // Check what token will actually be sent
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    const clientToken = localStorage.getItem("client_token");
    console.log(
      "addToWishlist: Token to be used:",
      token ? "auth_token" : "client_token"
    );
    console.log("addToWishlist: Token value:", token || clientToken);

    const res = await api.post(`/wishlist/${productId}`);

    if (res && res.data) {
      const body = res.data;

      // Check if server returned HTML error (database error)
      if (
        typeof body === "string" &&
        (body.includes("Fatal error") ||
          body.includes("<!DOCTYPE") ||
          body.includes("<html"))
      ) {
        console.error("Server returned HTML error:", body.substring(0, 200));
        return {
          success: 0,
          message: "Server database error",
          data: null,
          error:
            "The server is experiencing database connection issues. Please contact support.",
        };
      }

      const ok =
        body.success === 1 ||
        body.success === true ||
        body.status === "success";

      const result = {
        success: ok ? 1 : 0,
        message: body.message || "Added to wishlist",
        data: body.data || null,
        error: body.error || null,
      };

      console.log("addToWishlist returning:", result);
      return result;
    }
    return { success: 1, message: "Added to wishlist" };
  } catch (err) {
    console.warn("addToWishlist caught error:", err);
    console.log("addToWishlist error response:", err?.response?.data);

    if (err?.response?.data) {
      const body = err.response.data;

      // Check if error response is HTML
      if (
        typeof body === "string" &&
        (body.includes("Fatal error") ||
          body.includes("<!DOCTYPE") ||
          body.includes("<html"))
      ) {
        return {
          success: 0,
          message: "Server database error",
          error:
            "The server is experiencing database connection issues. Please contact support.",
        };
      }

      return {
        success: body.success || 0,
        message: body.message || null,
        error: body.error || null,
      };
    }

    return { success: 0, error: err?.message || String(err) };
  }
};

// Remove from wishlist (DELETE /wishlist/:id)
export const removeFromWishlist = async (productId) => {
  try {
    const res = await api.delete(`/wishlist/${productId}`);
    console.log("removeFromWishlist response:", res);

    if (res && res.data) {
      const body = res.data;

      // Check if server returned HTML error (database error)
      if (
        typeof body === "string" &&
        (body.includes("Fatal error") ||
          body.includes("<!DOCTYPE") ||
          body.includes("<html"))
      ) {
        console.error("Server returned HTML error:", body.substring(0, 200));
        return {
          success: 0,
          message: "Server database error",
          data: null,
          error:
            "The server is experiencing database connection issues. Please contact support.",
        };
      }

      const ok =
        body.success === 1 ||
        body.success === true ||
        body.status === "success";

      const result = {
        success: ok ? 1 : 0,
        message: body.message || "Removed from wishlist",
        data: body.data || null,
        error: body.error || null,
      };

      console.log("removeFromWishlist returning:", result);
      return result;
    }
    return { success: 1, message: "Removed from wishlist" };
  } catch (err) {
    console.warn("removeFromWishlist caught error:", err);

    if (err?.response?.data) {
      const body = err.response.data;

      // Check if error response is HTML
      if (
        typeof body === "string" &&
        (body.includes("Fatal error") ||
          body.includes("<!DOCTYPE") ||
          body.includes("<html"))
      ) {
        return {
          success: 0,
          message: "Server database error",
          error:
            "The server is experiencing database connection issues. Please contact support.",
        };
      }

      return {
        success: body.success || 0,
        message: body.message || null,
        error: body.error || null,
      };
    }

    return { success: 0, error: err?.message || String(err) };
  }
};

// Get latest products
export const getLatest = async () => {
  try {
    const res = await api.get('/latest');
    console.log("getLatest response:", res);
    
    if (res && res.data) {
      const body = res.data;
      const data = body.data || body.products || body;
      return { success: true, data: Array.isArray(data) ? data : [] };
    }
    return { success: false, data: [] };
  } catch (err) {
    console.warn("getLatest failed:", err?.message || err);
    return { success: false, data: [], error: err?.message || String(err) };
  }
};

export const submitOrder = async (orderData) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // In real implementation, this would send order data to backend
  const orderId = Math.floor(Math.random() * 1000000);
  return {
    success: true,
    data: {
      orderId,
      message: "Order placed successfully",
      estimatedDelivery: "3-5 business days",
    },
  };
};

// Checkout APIs
// Shipping methods
export const getShippingMethods = async () => {
  try {
    const res = await api.get("/shippingmethods");
    if (res && res.data) {
      const body = res.data;
      const raw = body.data || body.methods || body.shipping_methods || body;

      const entries = [];
      const pushRate = (rate, fallbackCode) => {
        if (!rate) return;
        const code = rate.code || rate.value || fallbackCode;
        const title = rate.title || rate.name || rate.label || rate.method_title || rate.method || code;
        const cost = rate.cost ?? rate.price ?? rate.fee ?? rate.total;
        const selected = !!(rate.selected || rate.default || rate.is_default);
        if (code) entries.push({ code, title, cost, selected });
      };

      const flattenContainer = (container) => {
        if (!container) return;
        if (Array.isArray(container)) {
          container.forEach((item) => {
            if (item && (item.quote || item.quotes)) {
              const q = item.quote || item.quotes;
              if (Array.isArray(q)) q.forEach((r) => pushRate(r));
              else if (q && typeof q === 'object') Object.keys(q).forEach((k) => pushRate(q[k], k));
            } else {
              pushRate(item);
            }
          });
        } else if (typeof container === 'object') {
          Object.keys(container).forEach((k) => {
            const method = container[k];
            if (method && (method.quote || method.quotes)) {
              const q = method.quote || method.quotes;
              if (Array.isArray(q)) q.forEach((r) => pushRate(r));
              else if (q && typeof q === 'object') Object.keys(q).forEach((rk) => pushRate(q[rk], rk));
            } else {
              pushRate(method, k);
            }
          });
        }
      };

      if (Array.isArray(raw) || typeof raw === 'object') {
        const container = Array.isArray(raw) ? raw : (raw.methods || raw.shipping_methods || raw.shipping || raw.quotes || raw);
        flattenContainer(container);
      }

      if (entries.length === 0 && raw && typeof raw === 'object') {
        Object.values(raw).forEach((v) => flattenContainer(v));
      }

      const seen = new Set();
      const normalized = entries.filter((r) => {
        if (seen.has(r.code)) return false;
        seen.add(r.code);
        return true;
      });

      return { success: true, data: normalized };
    }
    return { success: false, data: [] };
  } catch (err) {
    console.warn("getShippingMethods failed:", err?.message || err);
    return { success: false, data: [], error: err?.message || String(err) };
  }
};

// Spec: Always POST JSON: { shipping_method: <code>, agree: 1 }
// Note: Backend may validate against available methods from GET /shippingmethods
export const selectShippingMethod = async (code) => {
  try {
    if (!code) return { success: false, error: 'No shipping method code provided' };
    
    console.log('🚚 selectShippingMethod called with code:', code);
    
    // Fetch available methods first to ensure code is valid
    const availableRes = await api.get('/shippingmethods');
    const availableBody = availableRes?.data || {};
    console.log('📋 Available shipping methods:', availableBody);
    
    // Extract and validate the code exists in available methods
    let methods = [];
    if (availableBody.data) {
      const raw = availableBody.data;
      if (Array.isArray(raw)) methods = raw;
      else if (raw.quote || raw.quotes) {
        const quotes = raw.quote || raw.quotes;
        if (typeof quotes === 'object') {
          methods = Object.values(quotes).flatMap(provider => 
            Array.isArray(provider.quote) ? provider.quote : []
          );
        }
      }
    }
    
    const matchingMethod = methods.find(m => 
      m.code === code || 
      `${m.parent_code || ''}.${m.code}` === code ||
      m.value === code
    );
    
    if (!matchingMethod && methods.length > 0) {
      console.warn('⚠️ Code not found in available methods. Available:', methods.map(m => m.code));
    }
    
    // POST shipping method selection
    const payload = { shipping_method: String(code), agree: 1 };
    console.log('📦 Posting shipping method:', payload);
    
    const res = await api.post('/shippingmethods', payload, { headers: { Accept: 'application/json' } });
    const body = res?.data || {};
    
    console.log('📬 Shipping method response:', body);
    
    const ok = body.success === 1 || body.success === true || !!body.data;
    const errors = body.error || body.errors || [];
    
    if (!ok && Array.isArray(errors)) {
      console.warn('⚠️ Shipping method selection failed:', errors);
      const hasRequiredWarning = errors.some(e => /shipping method required/i.test(String(e)));
      if (hasRequiredWarning) {
        console.error('❌ Backend validation failed. Diagnostics:');
        console.error('   Code sent:', code);
        console.error('   Available methods:', methods.map(m => m.code || m.value));
        console.error('   Cart status: Check if cart has items and totals');
      }
    }
    
    return { 
      success: !!ok, 
      data: body.data || null, 
      message: body.message || null, 
      error: body.error || body.errors || null 
    };
  } catch (err) {
    console.error('💥 selectShippingMethod exception:', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.error || err?.message || String(err) };
  }
};

// Payment methods
export const getPaymentMethods = async () => {
  try {
    const res = await api.get("/paymentmethods");
    if (res && res.data) {
      const body = res.data;
      const raw = body.data || body.methods || body;
      let list = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object') {
        const container = raw.methods || raw.payment_methods || raw;
        if (Array.isArray(container)) list = container;
        else if (container && typeof container === 'object') {
          // Ensure the map key becomes the final code value
          list = Object.keys(container).map((k) => ({ ...(container[k] || {}), code: k }));
        }
      }
      const normalized = list.map((m) => ({
        code: m.code || m.id || m.method || m.value || '',
        title: m.title || m.name || m.label || m.code || 'Payment',
        selected: !!(m.selected || m.default || m.is_default)
      })).filter(m => m.code);
      return { success: true, data: normalized };
    }
    return { success: false, data: [] };
  } catch (err) {
    console.warn("getPaymentMethods failed:", err?.message || err);
    return { success: false, data: [], error: err?.message || String(err) };
  }
};

// Spec: Always POST JSON: { payment_method: <code>, agree: 1, comment: <string> }
export const selectPaymentMethod = async (code, comment = "") => {
  try {
    if (!code) return { success: false, error: 'No payment method code provided' };
    const payload = { payment_method: String(code), agree: 1, comment: comment || "" };
    const res = await api.post('/paymentmethods', payload, { headers: { 'Accept': 'application/json' } });
    const body = res?.data || {};
    const ok = body.success === 1 || body.success === true || !!body.data;
    return { success: !!ok, data: body.data || null, message: body.message || null, error: body.error || body.errors || null };
  } catch (err) {
    console.warn('selectPaymentMethod error:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
};

// Confirm order
export const confirmCheckout = async (addressId) => {
  try {
    // Confirm order with POST /confirm; backend expects { address_id }
    // Always include address_id as requested
    const payload = { address_id: addressId };
    const res = await api.post("/confirm", payload);
    if (res && res.data) {
      const body = res.data;
      const data = body.data || body;
      const ok = body.success === 1 || body.success === true || !!body.data;
      return { success: !!ok, data, message: body.message || data.message };
    }
    return { success: false };
  } catch (err) {
    console.warn("confirmCheckout failed:", err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
};

// Orders APIs
export const getCustomerOrders = async () => {
  try {
    const res = await api.get("/customerorders");
    const body = res?.data || {};
    const list = body.data || body.orders || body || [];
    const items = Array.isArray(list) ? list : (Array.isArray(list.items) ? list.items : []);
    return { success: true, data: items };
  } catch (err) {
    console.warn("getCustomerOrders failed:", err?.message || err);
    return { success: false, data: [], error: err?.message || String(err) };
  }
};

export const getCustomerOrderById = async (id) => {
  try {
    const res = await api.get(`/customerorders/${id}`);
    const body = res?.data || {};
    const data = body.data || body.order || body;
    return { success: true, data };
  } catch (err) {
    console.warn("getCustomerOrderById failed:", err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
};

export const cancelOrder = async (id) => {
  try {
    // Prefer POST, fallback to GET on method not allowed
    try {
      const res = await api.post(`/cancelOrder/${id}`);
      const body = res?.data || {};
      const ok = body.success === 1 || body.success === true || !!body.data;
      return { success: !!ok, data: body.data || null, message: body.message };
    } catch (inner) {
      if (inner?.response?.status === 405) {
        const res = await api.get(`/cancelOrder/${id}`);
        const body = res?.data || {};
        const ok = body.success === 1 || body.success === true || !!body.data;
        return { success: !!ok, data: body.data || null, message: body.message };
      }
      throw inner;
    }
  } catch (err) {
    console.warn("cancelOrder failed:", err?.message || err);
    return { success: false, error: err?.response?.data?.message || err?.message || String(err) };
  }
};

// Get or refresh client credentials token
export const getClientToken = async () => {
  try {
    // Prepare client credentials with the correct values
    const clientCredentials = {
      client_id: process.env.REACT_APP_CLIENT_ID || "shopping_oauth_client",
      client_secret:
        process.env.REACT_APP_CLIENT_SECRET || "shopping_oauth_secret",
      grant_type: "client_credentials",
    };

    const response = await fetch(
      "https://multi-store-api.cloudgoup.com/api/rest/oauth2/token/client_credentials",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(clientCredentials),
      }
    );

    const data = await response.json();

    // Check for success and extract token from the correct location
    if (
      response.ok &&
      data.success === 1 &&
      data.data &&
      data.data.access_token
    ) {
      // Store the token for future use
      localStorage.setItem("client_token", data.data.access_token);
      console.log(
        "Client token obtained successfully:",
        data.data.access_token.substring(0, 20) + "..."
      );
      return data.data.access_token;
    } else {
      console.error("Failed to get client token:", data);
      return null;
    }
  } catch (error) {
    console.error("Client token error:", error);
    return null;
  }
  }

export const getClientCredentialsToken = async (
  clientId = process.env.REACT_APP_OAUTH_CLIENT_ID || "shopping_oauth_client",
  clientSecret = process.env.REACT_APP_OAUTH_CLIENT_SECRET ||
    "shopping_oauth_secret"
) => {
  const payload = new URLSearchParams();
  payload.append("client_id", clientId);
  payload.append("client_secret", clientSecret);
  payload.append("grant_type", "client_credentials");
  const explicitTokenUrl = process.env.REACT_APP_TOKEN_URL;
  const defaultAbsoluteTokenUrl =
    "https://multi-store-api.cloudgoup.com/api/rest/oauth2/token";
  const base = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
  const url =
    explicitTokenUrl && typeof explicitTokenUrl === "string"
      ? explicitTokenUrl
      : base
      ? `${base}/oauth2/token`
      : defaultAbsoluteTokenUrl;
  const response = await api.post(url, payload, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
};

// Get user token using OAuth2 Password Grant (not supported by backend, will fail silently)
export const getUserToken = async (email, password) => {
  try {
    const payload = new URLSearchParams();
    payload.append(
      "client_id",
      process.env.REACT_APP_OAUTH_CLIENT_ID || "shopping_oauth_client"
    );
    payload.append(
      "client_secret",
      process.env.REACT_APP_OAUTH_CLIENT_SECRET || "shopping_oauth_secret"
    );
    payload.append("grant_type", "password");
    payload.append("username", email);
    payload.append("password", password);

    const tokenUrl =
      "https://multi-store-api.cloudgoup.com/api/rest/oauth2/token";

    const response = await api.post(tokenUrl, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data;
  } catch (error) {
    // Backend doesn't support password grant - this is expected
    // Return null to indicate token fetch failed
    return null;
  }
};

export const fetchAndStoreClientToken = async () => {
  const data = await getClientCredentialsToken();
  const token = data?.access_token || data?.token || data?.data?.access_token;
  if (token) {
    try {
      localStorage.setItem("client_token", token);
    } catch (_e) {}
  }
  return data;
};

// Login API function
export const loginUser = async (email, password) => {
  try {
    // Get client credentials token first
    let token = localStorage.getItem("client_token");

    // If no token or token might be expired, get a new one
    if (!token) {
      token = await getClientToken();
      if (!token) {
        return {
          success: false,
          message: "Failed to authenticate with server. Please try again.",
        };
      }
    }

    // Prepare login payload
    const payload = {
      email: email,
      password: password,
    };

    // Use axios instance; rely on Bearer token only (no cookies)
    const response = await api.post("/login", payload, {
      withCredentials: false,
    });

    const data = response.data;

    // If unauthorized, try to get a new token and retry once
    if (response.status === 401) {
      console.log("Token expired, getting new token...");
      token = await getClientToken();
      if (token) {
        const retryResponse = await api.post("/login", payload, {
          withCredentials: false,
        });

        const retryData = retryResponse.data;

        if (retryResponse.status >= 200 && retryResponse.status < 300) {
          // Handle both success: 1 and success: true patterns
          if (retryData.success === 1 || retryData.success === true) {
            return { success: true, ...retryData };
          } else {
            return {
              success: false,
              message: retryData.message || "Login failed",
              errors: retryData.errors,
            };
          }
        } else {
          return {
            success: false,
            message: retryData.message || "Login failed",
            errors: retryData.errors,
          };
        }
      } else {
        return {
          success: false,
          message: "Authentication failed. Please try again.",
        };
      }
    }

    if (response.status >= 200 && response.status < 300) {
      // Handle both success: 1 and success: true patterns
      if (data.success === 1 || data.success === true) {
        // Try to get user-specific OAuth token using password grant (silently fail if not supported)
        try {
          const userTokenData = await getUserToken(email, password);
          if (userTokenData && userTokenData.access_token) {
            console.log("Successfully obtained user OAuth token");
            // Add the token to the response for downstream consumers
            data.auth_token = userTokenData.access_token;
            data.token_type = userTokenData.token_type;
            data.expires_in = userTokenData.expires_in;
          }
        } catch (tokenError) {
          // Silently ignore OAuth2 errors - backend doesn't support password grant
          // This is expected and doesn't affect login success
          console.log(
            "OAuth2 password grant not supported by backend (expected)"
          );
        }

        // Normalize/standardize successful response into a stable shape
        const raw = data || {};
        const topData = raw.data || {};
        const userNode =
          raw.user || topData.user || topData.customer || raw.customer || null;

        let tokenValue =
          raw.auth_token ||
          raw.token ||
          raw.access_token ||
          topData.auth_token ||
          topData.token ||
          topData.access_token ||
          (raw.data && raw.data["access-token"]) || // rare patterns
          null;

        // If backend doesn't return a user token, fallback to client token so app uses a single Bearer
        if (!tokenValue) {
          tokenValue = localStorage.getItem("client_token") || token;
        }

        const normalizedUser = userNode
          ? {
              id:
                userNode.id ||
                userNode.user_id ||
                userNode.customer_id ||
                topData.id ||
                null,
              name:
                userNode.name ||
                [userNode.firstname, userNode.lastname]
                  .filter(Boolean)
                  .join(" ") ||
                "User",
              email: userNode.email || email,
              firstname: userNode.firstname,
              lastname: userNode.lastname,
              username: userNode.username,
              telephone: userNode.telephone,
              avatar:
                userNode.avatar ||
                (topData.user && topData.user.avatar) ||
                "https://via.placeholder.com/40",
            }
          : null;

        return {
          success: true,
          user: normalizedUser,
          token: tokenValue,
          data: raw,
        };
      } else {
        // Check if error is "User is logged." - logout and retry
        if (
          data.error &&
          Array.isArray(data.error) &&
          data.error.some((err) => err.includes("User is logged"))
        ) {
          console.log(
            "User already logged in on backend, logging out first..."
          );
          await logoutUser();

          // Retry login after logout
          console.log("Retrying login after logout...");
          const retryResponse = await fetch(
            "https://multi-store-api.cloudgoup.com/api/rest/login",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            }
          );

          const retryData = await retryResponse.json();

          if (
            retryResponse.ok &&
            (retryData.success === 1 || retryData.success === true)
          ) {
            console.log("Login successful after logout");
            return { success: true, ...retryData };
          }
        }

        return {
          success: false,
          message: data.message || "Login failed",
          errors: data.errors,
          error: data.error,
        };
      }
    } else {
      return {
        success: false,
        message: data.message || "Login failed",
        errors: data.errors,
      };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};

// Registration API function (reintroduced after accidental removal)
export const registerUser = async (payload) => {
  try {
    // Ensure client token exists for bearer authorization
    let token = localStorage.getItem("client_token");
    if (!token) {
      token = await getClientToken();
      if (!token) {
        return {
          success: false,
          message: "Failed to authenticate with server. Please try again.",
        };
      }
    }

    // Guarantee confirm field (backend often expects password confirmation)
    if (payload && payload.password && !payload.confirm) {
      payload.confirm = payload.password;
    }

    const response = await api.post("/register", payload, { withCredentials: false });
    const data = response.data || {};

    // Retry once on 401 by refreshing client token
    if (response.status === 401) {
      token = await getClientToken();
      if (!token) {
        return { success: false, message: "Authentication failed." };
      }
      const retry = await api.post("/register", payload, { withCredentials: false });
      const retryData = retry.data || {};
      if (retry.status >= 200 && retry.status < 300 && (retryData.success === 1 || retryData.success === true)) {
        return { success: true, ...retryData };
      }
      return {
        success: false,
        message: retryData.message || "Registration failed",
        errors: retryData.errors,
        error: retryData.error,
      };
    }

    if (response.status >= 200 && response.status < 300) {
      if (data.success === 1 || data.success === true) {
        return { success: true, ...data };
      }
      return {
        success: false,
        message: data.message || "Registration failed",
        errors: data.errors,
        error: data.error,
      };
    }
    return {
      success: false,
      message: data.message || "Registration failed",
      errors: data.errors,
      error: data.error,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};

// Logout API function - invalidates server-side user session/token if applicable
export const logoutUser = async () => {
  try {
    const userToken =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    const clientToken = localStorage.getItem("client_token");

    // Use client token if no user token available
    const tokenToUse = userToken || clientToken;

    if (!tokenToUse) {
      console.log("No token available for logout, clearing local state only");
      return { success: true };
    }

    console.log("Attempting logout with token (Bearer only, no cookies)...");
    const response = await api.post(
      "/logout",
      {},
      {
        withCredentials: false,
        headers: { Authorization: `Bearer ${tokenToUse}` },
      }
    );

    console.log("Logout response status:", response.status);

    if (response.status >= 200 && response.status < 300) {
      console.log("Logout successful");
      return { success: true };
    }

    console.log("Logout completed (non-ok response but proceeding)");
    return { success: true, data: response.data };
  } catch (e) {
    console.warn("Logout request failed, proceeding to clear local state:", e);
    return { success: true };
  }
};

// Address API functions
const baseUrl = "https://multi-store-api.cloudgoup.com/api/rest";

// Create new address
export const createAddress = async (addressData) => {
  try {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    const clientToken = localStorage.getItem("client_token");
    console.log("Creating address with data:", addressData);
    console.log("Auth token available:", token ? "Yes" : "No");
    console.log("Client token available:", clientToken ? "Yes" : "No");

    // Use auth token first, fallback to client token as temporary workaround
    const tokenToUse = token || clientToken;
    if (!tokenToUse) {
      console.log("No auth token found - user needs to be properly logged in");
      return {
        success: false,
        message: "User authentication required. Please log in properly.",
      };
    }

    console.log("Using token type:", token ? "auth_token" : "client_token");

    const url = `${baseUrl}/account/address`;
    console.log("Creating address at:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenToUse}`,
      },
      body: JSON.stringify(addressData),
    });

    console.log("Create response status:", response.status);
    const data = await response.json();
    console.log("Create response data:", data);

    if (response.ok) {
      return { success: true, data };
    } else {
      return {
        success: false,
        message: data.message || "Failed to create address",
        errors: data.errors,
      };
    }
  } catch (error) {
    console.error("Create address error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};

// Update address by ID
export const updateAddress = async (addressId, addressData) => {
  try {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    const clientToken = localStorage.getItem("client_token");
    console.log("Updating address", addressId, "with data:", addressData);
    console.log("Auth token available:", token ? "Yes" : "No");
    console.log("Client token available:", clientToken ? "Yes" : "No");

    // Use auth token first, fallback to client token as temporary workaround
    const tokenToUse = token || clientToken;
    if (!tokenToUse) {
      console.log("No auth token found - user needs to be properly logged in");
      return {
        success: false,
        message: "User authentication required. Please log in properly.",
      };
    }

    console.log("Using token type:", token ? "auth_token" : "client_token");

    const url = `${baseUrl}/account/address/${addressId}`;
    console.log("Updating address at:", url);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tokenToUse}`,
      },
      body: JSON.stringify(addressData),
    });

    console.log("Update response status:", response.status);
    const data = await response.json();
    console.log("Update response data:", data);

    if (response.ok) {
      return { success: true, data };
    } else {
      return {
        success: false,
        message: data.message || "Failed to update address",
        errors: data.errors,
      };
    }
  } catch (error) {
    console.error("Update address error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};

// Get address by ID
export const getAddress = async (addressId) => {
  try {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    const clientToken = localStorage.getItem("client_token");
    console.log("Getting address with ID:", addressId);
    console.log("Auth token available:", token ? "Yes" : "No");
    console.log("Client token available:", clientToken ? "Yes" : "No");

    // Use auth token first, fallback to client token as temporary workaround
    const tokenToUse = token || clientToken;
    if (!tokenToUse) {
      console.log("No auth token found - user needs to be properly logged in");
      return {
        success: false,
        message: "User authentication required. Please log in properly.",
      };
    }

    console.log("Using token type:", token ? "auth_token" : "client_token");

    const url = `${baseUrl}/account/address/${addressId}`;
    console.log("Fetching address from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokenToUse}`,
      },
    });

    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", data);

    if (response.ok) {
      return { success: true, data: data.data || data };
    } else {
      return {
        success: false,
        message: data.message || "Failed to fetch address",
        errors: data.errors,
      };
    }
  } catch (error) {
    console.error("Get address error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};

// Get all addresses for the current user
export const getUserAddresses = async () => {
  try {
    // Use the configured axios instance - it will handle token injection automatically
    const response = await api.get("/account/address");

    const data = response.data;

    if (data.success === 1 && data.data && Array.isArray(data.data)) {
      return { success: true, data: data.data };
    } else if (data.success === 1 && Array.isArray(data)) {
      return { success: true, data: data };
    } else if (Array.isArray(data)) {
      return { success: true, data: data };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      if (status === 403) {
        return {
          success: false,
          message:
            "Access denied. Please log in again or check your permissions.",
        };
      } else if (status === 401) {
        return {
          success: false,
          message: "Authentication required. Please log in again.",
        };
      } else {
        return {
          success: false,
          message:
            error.response.data?.message ||
            `Failed to fetch addresses (${status})`,
        };
      }
    }

    return { success: false, message: "Network error. Please try again." };
  }
};


// Get current user profile
export const getProfile = async () => {
  try {
    const response = await api.get("/account");
    const data = response.data;
    // Normalize common patterns
    if (data && (data.success === 1 || data.success === true)) {
      return { success: true, data: data.data || data.user || data };
    }
    return { success: true, data: data };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        message:
          error.response.data?.message ||
          `Failed to fetch profile (${error.response.status})`,
        errors: error.response.data?.errors,
      };
    }
    return { success: false, message: "Network error. Please try again." };
  }
};

// Update current user profile
export const updateProfile = async (payload) => {
  try {
    const response = await api.put("/account", payload);
    console.log("Update profile response:", response.status, response.data);
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: response.data };
    }
    return {
      success: false,
      message: response.data?.message || "Failed to update profile",
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        message:
          error.response.data?.message ||
          `Failed to update profile (${error.response.status})`,
        errors: error.response.data?.errors,
      };
    }
    return { success: false, message: "Network error. Please try again." };
  }
};

// Change user password
export const updatePassword = async (payload) => {
  try {
    // Expecting payload: { old_password, new_password, confirm }
    const response = await api.put("/account/password", payload);
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: response.data };
    }
    return {
      success: false,
      message: response.data?.message || "Failed to change password",
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        message:
          error.response.data?.message ||
          `Failed to change password (${error.response.status})`,
        errors: error.response.data?.errors,
      };
    }
    return { success: false, message: "Network error. Please try again." };
  }
};

// Get homepage builder data
export const getHomePageBuilder = async () => {
  try {
    // Check if we have client token, if not get one
    let clientToken = localStorage.getItem("client_token");
    if (!clientToken) {
      console.log("No client token found, fetching...");
      await fetchAndStoreClientToken();
      clientToken = localStorage.getItem("client_token");
    }

    const response = await api.get("/home_page_builder");
    let data = response.data;

    console.log("Homepage builder raw response:", data);

    // Fix backend debug output issue - clean the response if it's a string with debug output
    if (typeof data === "string") {
      // Backend is returning debug output like: string(2) "80"\n{actual json}
      // Extract just the JSON part
      try {
        // Find the first { or [ which indicates start of JSON
        const jsonStart = Math.max(data.indexOf("{"), data.indexOf("["));
        if (jsonStart > 0) {
          const cleanJson = data.substring(jsonStart);
          data = JSON.parse(cleanJson);
          console.log(
            "Homepage builder: Cleaned debug output, parsed JSON successfully"
          );
        }
      } catch (parseError) {
        console.error(
          "Homepage builder: Failed to parse cleaned JSON:",
          parseError
        );
        // Continue with original data
      }
    }

    if (data && (data.success === 1 || data.success === true)) {
      return { success: true, data: data.data || data };
    }
    return { success: true, data: data };
  } catch (error) {
    console.error("Error fetching homepage builder:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
      return {
        success: false,
        message:
          error.response.data?.message ||
          `Failed to fetch homepage data (${error.response.status})`,
        errors: error.response.data?.errors,
      };
    }
    return { success: false, message: "Network error. Please try again." };
  }
};

// Delete address by ID
export const deleteAddress = async (addressId) => {
  try {
    // Normalize id: try numeric first
    let id = addressId;
    if (typeof id === "object") {
      id = id.id || id.address_id || id.addressId || id._id || id.ID || null;
    }
    if (id == null) {
      console.error("deleteAddress called with invalid id:", addressId);
      return { success: false, message: "Invalid address id" };
    }

    // If id looks numeric, coerce to number
    const numeric = Number(id);
    const finalId =
      Number.isFinite(numeric) && String(numeric) === String(id)
        ? numeric
        : String(id);

    // Use axios instance so headers and baseURL are consistent
    const url = `/account/address/${finalId}`;
    console.log("Deleting address via API:", url);

    const response = await api.delete(url);

    // axios returns data in response.data
    console.log("Delete response status:", response.status);
    console.log("Delete response data:", response.data);

    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: response.data };
    } else {
      return {
        success: false,
        message: response.data?.message || "Failed to delete address",
        errors: response.data?.errors,
      };
    }
  } catch (error) {
    // If axios error, unwrap
    if (error.response) {
      console.error(
        "Delete address error response:",
        error.response.status,
        error.response.data
      );
      return {
        success: false,
        message: error.response.data?.message || "Failed to delete address",
        errors: error.response.data?.errors,
      };
    }
    console.error("Delete address error:", error);
    return { success: false, message: "Network error. Please try again." };
  }
};
