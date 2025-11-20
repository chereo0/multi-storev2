import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import {
  getWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
} from "../api/services";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth(); // Get user from AuthContext
  const hasFetchedWishlist = useRef(false); // Prevent duplicate fetches
  
  const [wishlistItems, setWishlistItems] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem("wishlist");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.warn("Failed to parse wishlist:", err);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    // Guard against duplicate fetches (StrictMode protection)
    if (hasFetchedWishlist.current) {
      console.log("🛡️ WishlistContext: Skipping duplicate wishlist fetch");
      return;
    }
    hasFetchedWishlist.current = true;

    // Only attempt server fetch if we have an auth token
    const authToken =
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (!authToken) {
      console.log("🛡️ WishlistContext: No auth token present, skipping server wishlist fetch (using localStorage)");
      return;
    }

    // Load wishlist from server on mount (requires auth)
    (async () => {
      try {
        console.log("📡 WishlistContext: Fetching wishlist from server...");
        const res = await getWishlist();
        if (res && res.success && res.data) {
          let items = [];
          if (Array.isArray(res.data)) {
            items = res.data;
          } else if (Array.isArray(res.data.items)) {
            items = res.data.items;
          } else if (Array.isArray(res.data.data)) {
            items = res.data.data;
          }

          // Normalize to array of product IDs or product objects
          const normalized = items.map((item) => {
            if (typeof item === "number" || typeof item === "string") {
              return item; // Just IDs
            }
            return item.product_id || item.id || item;
          });

          if (normalized.length > 0) {
            setWishlistItems(normalized);
          }
        }
      } catch (err) {
        console.log("Could not load server wishlist, using localStorage");
      }
    })();
  }, []);

  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToWishlist = async (productId) => {
    // Determine auth state
    const authToken =
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const hasUser = !!(user && !user.isGuest);
    const hasAuth = !!(authToken || user?.token);

    if (!hasUser) {
      // No user at all – prompt for login
      console.warn("⚠️ Wishlist: No user session, storing locally only");
      setWishlistItems((prev) => {
        if (prev.includes(productId)) return prev;
        return [...prev, productId];
      });
      toast("Please login to sync your wishlist", { icon: "ℹ️" });
      return { success: 1, local_only: true };
    }

    if (!hasAuth) {
      // User exists but no auth token – operate in local mode silently
      console.log(
        "ℹ️ Wishlist: User present but no auth token – saving locally (will sync when authenticated)"
      );
      setWishlistItems((prev) => {
        if (prev.includes(productId)) return prev;
        return [...prev, productId];
      });
      // Optional subtle toast to avoid confusion
      // toast("Saved to wishlist (local)", { icon: "♡" });
      return { success: 1, local_only: true };
    }
    
    // Optimistically add
    setWishlistItems((prev) => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });

    try {
      console.log("📡 Wishlist: Adding to server wishlist, productId:", productId);
      const res = await apiAddToWishlist(productId);
      
      console.log("📥 Wishlist: Server response:", res);

      if (res && res.success) {
        toast.success(res.message || "Added to wishlist");
      } else {
        // Revert on failure
        setWishlistItems((prev) => prev.filter((id) => id !== productId));

        // Handle error display
        let errorMsg = "Failed to add to wishlist";
        if (res?.error) {
          if (Array.isArray(res.error)) {
            errorMsg = res.error.filter(Boolean).join(" ");
          } else if (typeof res.error === 'string') {
            errorMsg = res.error;
          }
        } else if (res?.message) {
          errorMsg = res.message;
        }
        
        console.warn("⚠️ Wishlist: Failed to add:", errorMsg);
        toast.error(errorMsg);
      }

      return res;
    } catch (err) {
      console.error("❌ Wishlist: Error adding to wishlist:", err);
      
      // Revert on error
      setWishlistItems((prev) => prev.filter((id) => id !== productId));
      
      // Better error message for 400 Bad Request
      let errorMsg = "Failed to add to wishlist";
      if (err?.response?.status === 400) {
        errorMsg = err?.response?.data?.error || 
                   err?.response?.data?.message || 
                   "Invalid request. Please login and try again.";
      } else if (err?.response?.status === 401) {
        errorMsg = "Please login to add items to your wishlist";
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      toast.error(errorMsg);
      return { success: 0, error: errorMsg };
    }
  };

  const removeFromWishlist = async (productId) => {
    // Determine auth state
    const authToken =
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const hasUser = !!(user && !user.isGuest);
    const hasAuth = !!(authToken || user?.token);

    // Optimistically remove
    const backup = wishlistItems;
    setWishlistItems((prev) => prev.filter((id) => id !== productId));

    if (!hasUser || !hasAuth) {
      if (!hasUser) {
        console.warn("⚠️ Wishlist: No user session, removing locally only");
      } else {
        console.log(
          "ℹ️ Wishlist: User present but no auth token – removing locally (cannot sync without auth)"
        );
      }
      // Keep local change and exit
      // toast("Removed from local wishlist", { icon: "✓" });
      return { success: 1, local_only: true };
    }

    try {
      console.log("📡 Wishlist: Removing from server wishlist, productId:", productId);
      const res = await apiRemoveFromWishlist(productId);

      if (res && res.success) {
        toast.success(res.message || "Removed from wishlist");
      } else {
        // Revert on failure
        setWishlistItems(backup);
        const errorMsg =
          res?.error || res?.message || "Failed to remove from wishlist";
        if (Array.isArray(res?.error)) {
          toast.error(res.error.filter(Boolean).join(" "));
        } else {
          toast.error(errorMsg);
        }
      }

      return res;
    } catch (err) {
      // Revert on error
      setWishlistItems(backup);
      toast.error(err?.message || "Failed to remove from wishlist");
      return { success: 0, error: err?.message || String(err) };
    }
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.includes(productId);
  };

  const value = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
