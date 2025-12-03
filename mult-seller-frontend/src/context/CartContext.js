import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import toast from "react-hot-toast";
import {
  addToCart as apiAddToCart,
  emptyCart as apiEmptyCart,
  removeFromCartAPI,
  updateCartAPI,
  getCart as apiGetCart,
  normalizeProduct,
} from "../api/services";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Initialize state from localStorage immediately
    const savedCart = localStorage.getItem("cart");
    console.log(
      "CartProvider: Initial state - savedCart from localStorage:",
      savedCart
    );
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        console.log("CartProvider: Initial state - parsed cart:", parsed);
        return parsed;
      } catch (err) {
        console.warn("CartProvider: Failed to parse saved cart:", err);
        return [];
      }
    }
    return [];
  });
  const backupRef = useRef(null);

  useEffect(() => {
    // This effect now only runs once on mount for logging purposes
    // The actual cart loading happens in useState initializer above
    console.log("CartProvider mounted. Current cartItems:", cartItems);
    console.log("localStorage cart:", localStorage.getItem("cart"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On mount, attempt to sync with server-side cart if localStorage is empty
  const hasSyncedServerCartRef = useRef(false);
  useEffect(() => {
    if (hasSyncedServerCartRef.current) return; // StrictMode guard: ensure single sync
    hasSyncedServerCartRef.current = true;
    const syncServerCart = async () => {
      try {
        const savedCart = localStorage.getItem("cart");
        if (savedCart && savedCart !== "[]") {
          console.log("CartProvider: local cart present, skipping server sync");
          return;
        }
        console.log("CartProvider: local cart empty, fetching server cart...");
        const res = await apiGetCart();
        console.log("CartProvider: server getCart response:", res);
        if (res && res.data) {
          // Handle different shapes: res.data.products (OpenCart-like), res.data.items, or raw array
          const products = Array.isArray(res.data.products)
            ? res.data.products
            : Array.isArray(res.data.items)
              ? res.data.items
              : Array.isArray(res.data)
                ? res.data
                : [];

          if (products.length > 0) {
            const normalized = products.map((it) => {
              // Support both shapes where product fields live on the item or nested
              const prodObj = it.product || it.product_detail || {
                id: it.product_id || it.productId || it.product_id || it.product_id,
                name: it.name || it.title || it.product_name || "",
                price: typeof it.price_raw !== 'undefined' ? Number(it.price_raw) : (it.price ? Number(String(it.price).replace(/[^0-9.-]+/g, '')) : null),
                image: it.thumb || it.image || (it.product && (it.product.image || it.product.thumb)) || '/no-image.png',
              };
              const qty = Number(it.quantity || it.qty || it.count || 1);
              // Map option if present
              let option = undefined;
              if (Array.isArray(it.option) && it.option.length > 0) {
                // take first option object shape { product_option_id, product_option_value_id } if present
                const first = it.option[0];
                if (first && first.product_option_id && first.product_option_value_id) {
                  option = {
                    product_option_id: first.product_option_id,
                    product_option_value_id: first.product_option_value_id,
                  };
                }
              } else if (it.option && typeof it.option === 'object' && Object.keys(it.option).length > 0) {
                // if option is a map like { "14": "44" }
                const key = Object.keys(it.option)[0];
                option = {
                  product_option_id: parseInt(key),
                  product_option_value_id: parseInt(it.option[key]),
                };
              }

              return {
                product: normalizeProduct(prodObj) || { id: Number(prodObj.id), name: prodObj.name || '', price: prodObj.price || 0, image: prodObj.image },
                storeId: it.store_id || it.storeId || 1,
                quantity: isNaN(qty) ? 1 : qty,
                option,
                key: it.key || it.cart_id || null // Store the unique cart item key
              };
            });

            setCartItems(normalized);
          }
        }
      } catch (e) {
        console.warn("CartProvider: failed to sync server cart:", e);
      }
    };
    syncServerCart();
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    console.log("CartContext: Saving cart to localStorage:", cartItems);
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = async (product, storeId, quantity = 1, option) => {
    // Keep backup for revert if server call fails
    backupRef.current = null;
    const sameOption = (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return (
        String(a.product_option_id) === String(b.product_option_id) &&
        String(a.product_option_value_id) === String(b.product_option_value_id)
      );
    };
    setCartItems((prev) => {
      backupRef.current = prev;
      const existingItem = prev.find(
        (item) => item.product.id === product.id && item.storeId === storeId && sameOption(item.option, option)
      );

      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id && item.storeId === storeId && sameOption(item.option, option)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, {
          product, storeId, quantity, option: option ? {
            product_option_id: option.product_option_id,
            product_option_value_id: option.product_option_value_id
          } : undefined
        }];
      }
    });

    // Send to server (optimistic). Payload shape: { product_id, quantity, store_id, option? }
    try {
      const payload = {
        product_id: product.id,
        quantity,
        store_id: storeId,
      };
      // Include product option if provided. Backend expects mapping of product_option_id -> product_option_value_id
      // Accept a single option object or an array of them.
      if (option) {
        const buildOptionMap = (opt) => ({
          [String(opt.product_option_id)]: String(opt.product_option_value_id),
        });
        if (Array.isArray(option) && option.length > 0) {
          payload.option = option.reduce((acc, opt) => {
            if (opt && opt.product_option_id && opt.product_option_value_id) {
              acc[String(opt.product_option_id)] = String(
                opt.product_option_value_id
              );
            }
            return acc;
          }, {});
        } else if (
          option.product_option_id &&
          option.product_option_value_id
        ) {
          payload.option = buildOptionMap(option);
        }
      }
      const res = await apiAddToCart(payload);
      console.log("addToCart: Server response:", res);

      // If server rejects the add (for example: different-store constraint), revert and surface message
      // Check for success being explicitly 0, false, or undefined
      const isSuccess = res && (res.success === 1 || res.success === true);

      if (!isSuccess) {
        setCartItems(backupRef.current || []);

        // Handle error - check if it's a multi-store conflict
        let message = "Could not add to cart";
        let isMultiStoreError = false;

        if (res?.error) {
          if (Array.isArray(res.error)) {
            // Server returned error as array (e.g., ["Your cart already contains..."])
            message = res.error.filter(Boolean).join(" ");
          } else if (typeof res.error === "string") {
            message = res.error;
          }

          // Check if this is a multi-store conflict
          if (message.toLowerCase().includes("cart already contains") ||
            message.toLowerCase().includes("different store")) {
            isMultiStoreError = true;
          }
        } else if (res?.message) {
          message = res.message;
        }

        console.log("addToCart: Error type:", isMultiStoreError ? "Multi-store conflict" : "General error");

        // If it's a multi-store error, show confirmation dialog
        if (isMultiStoreError) {
          const confirmClear = window.confirm(
            `${message}\n\nWould you like to clear your current cart and add this item?`
          );

          if (confirmClear) {
            console.log("User confirmed: Clearing cart and adding new item");
            // Clear the cart first, then add the new item
            try {
              await clearCart();
              // Try adding again after clearing
              const retryRes = await apiAddToCart(payload);
              if (retryRes && (retryRes.success === 1 || retryRes.success === true)) {
                toast.success("Cart cleared and item added!");
                // Update local state with new item
                setCartItems([{ product, storeId, quantity }]);
                return retryRes;
              } else {
                toast.error("Failed to add item after clearing cart");
                return retryRes;
              }
            } catch (error) {
              console.error("Error clearing cart:", error);
              toast.error("Failed to clear cart");
              return { success: false, error: "Failed to clear cart" };
            }
          } else {
            console.log("User cancelled: Keeping existing cart");
            toast("Item not added. Current cart unchanged.", { icon: 'ℹ️' });
            return { success: false, cancelled: true };
          }
        } else {
          // Show regular error
          console.log("addToCart: Showing error toast:", message);
          toast.error(message);
          console.warn("addToCart: server rejected the update", message);
          return res || { success: false, error: message };
        }
      }

      // Sync full cart from server to ensure local state matches server state
      console.log("addToCart: Successfully added to cart, now syncing full cart state");
      try {
        const fullCartRes = await apiGetCart();
        console.log("addToCart: fetched full cart from server:", fullCartRes);

        if (fullCartRes && fullCartRes.data) {
          // Normalize the server cart response (same logic as initial sync on mount)
          const products = Array.isArray(fullCartRes.data.products)
            ? fullCartRes.data.products
            : Array.isArray(fullCartRes.data.items)
              ? fullCartRes.data.items
              : Array.isArray(fullCartRes.data)
                ? fullCartRes.data
                : [];

          if (products.length > 0) {
            const normalized = products.map((it) => {
              const prodObj = it.product || it.product_detail || {
                id: it.product_id || it.productId,
                name: it.name || it.title || it.product_name || "",
                price: typeof it.price_raw !== 'undefined' ? Number(it.price_raw) : (it.price ? Number(String(it.price).replace(/[^0-9.-]+/g, '')) : null),
                image: it.thumb || it.image || (it.product && (it.product.image || it.product.thumb)) || '/no-image.png',
                // Preserve discount information if available
                hasDiscount: it.hasDiscount || (it.product && it.product.hasDiscount) || false,
                specialPrice: it.specialPrice || (it.product && it.product.specialPrice) || null,
                originalPrice: it.originalPrice || (it.product && it.product.originalPrice) || null,
              };
              const qty = Number(it.quantity || it.qty || it.count || 1);

              // Map option if present
              let option = undefined;
              if (Array.isArray(it.option) && it.option.length > 0) {
                const first = it.option[0];
                if (first && first.product_option_id && first.product_option_value_id) {
                  option = {
                    product_option_id: first.product_option_id,
                    product_option_value_id: first.product_option_value_id,
                  };
                }
              } else if (it.option && typeof it.option === 'object' && Object.keys(it.option).length > 0) {
                const key = Object.keys(it.option)[0];
                option = {
                  product_option_id: parseInt(key),
                  product_option_value_id: parseInt(it.option[key]),
                };
              }

              return {
                product: normalizeProduct(prodObj) || {
                  id: Number(prodObj.id || prodObj.product_id || prodObj.productId),
                  name: prodObj.name || '',
                  price: prodObj.price || 0,
                  image: prodObj.image,
                  hasDiscount: prodObj.hasDiscount,
                  specialPrice: prodObj.specialPrice,
                  originalPrice: prodObj.originalPrice,
                },
                storeId: it.store_id || it.storeId || 1,
                quantity: isNaN(qty) ? 1 : qty,
                option,
                key: it.key || it.cart_id || null
              };
            });

            setCartItems(normalized);
            console.log("addToCart: synced cart state with server, total items:", normalized.length);
          }
        }
      } catch (syncErr) {
        console.warn("addToCart: failed to sync full cart from server, keeping optimistic update:", syncErr);
        // Keep the optimistic update if sync fails
      }

      // Return the successful response so callers can react
      return res;
    } catch (err) {
      // Revert optimistic update on network/error
      setCartItems(backupRef.current || []);
      const message =
        err?.message || String(err) || "Network error adding to cart";
      toast.error(message);
      console.warn("addToCart network error:", message);
      return { success: false, error: message };
    }
  };

  const removeFromCart = async (productId, storeId) => {
    // Optimistically remove from local state
    const backup = cartItems;
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.storeId === storeId)
      )
    );

    // Call server to remove item (key is the product_id or cart key)
    try {
      // Find the item to get its key
      const itemToRemove = cartItems.find(
        (item) => item.product.id === productId && item.storeId === storeId
      );
      const key = itemToRemove?.key || productId; // Use key if available, else fallback to productId
      console.log("removeFromCart: Removing item with key:", key);

      const res = await removeFromCartAPI(key);

      if (res && res.success) {
        toast.success(res.message || "Item removed from cart");
      } else {
        // Revert if server failed
        setCartItems(backup);
        const errorMsg = res?.error || res?.message || "Failed to remove item";
        if (Array.isArray(res?.error)) {
          toast.error(res.error.filter(Boolean).join(" "));
        } else {
          toast.error(errorMsg);
        }
      }

      return res;
    } catch (err) {
      // Revert on error
      setCartItems(backup);
      toast.error(err?.message || "Failed to remove item");
      return { success: 0, error: err?.message || String(err) };
    }
  };

  const updateQuantity = async (productId, storeId, quantity, option) => {
    if (quantity <= 0) {
      removeFromCart(productId, storeId);
      return;
    }

    // Optimistically update local state
    const backup = cartItems;
    const sameOptionLocal = (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return (
        String(a.product_option_id) === String(b.product_option_id) &&
        String(a.product_option_value_id) === String(b.product_option_value_id)
      );
    };
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId && item.storeId === storeId && sameOptionLocal(item.option, option)
          ? { ...item, quantity }
          : item
      )
    );

    // Call server to update quantity
    try {
      // Find the item to get its key
      const itemToUpdate = cartItems.find(
        (item) => item.product.id === productId && item.storeId === storeId && sameOptionLocal(item.option, option)
      );
      const key = itemToUpdate?.key || productId;

      const payload = {
        key: key, // Server expects 'key' (cart_id) not 'product_id'
        quantity,
      };

      const res = await updateCartAPI(payload);

      if (res && res.success) {
        // Optionally sync from server if it returns updated cart
        if (res.data && Array.isArray(res.data.items)) {
          const normalized = res.data.items.map((it) => {
            const productObj = it.product ||
              it.product_detail || {
              id: it.product_id || it.productId,
              name: it.name || it.title,
              price: it.price || it.unit_price,
              image:
                it.image ||
                (it.product && it.product.image) ||
                "/no-image.png",
            };
            const store = it.store_id || it.storeId || it.store;
            const qty = it.quantity || it.qty || it.count || 1;
            return { product: normalizeProduct(productObj), storeId: store, quantity: qty, key: it.key || it.cart_id || null };
          });
          setCartItems(normalized);
        }
      } else {
        // Revert if server failed
        setCartItems(backup);
        const errorMsg =
          res?.error || res?.message || "Failed to update quantity";
        if (Array.isArray(res?.error)) {
          toast.error(res.error.filter(Boolean).join(" "));
        } else {
          toast.error(errorMsg);
        }
      }

      return res;
    } catch (err) {
      // Revert on error
      setCartItems(backup);
      toast.error(err?.message || "Failed to update quantity");
      return { success: 0, error: err?.message || String(err) };
    }
  };

  const clearCart = async () => {
    try {
      // Call server to clear cart
      const res = await apiEmptyCart();

      // Clear local cart regardless of server response
      setCartItems([]);

      if (res && res.success) {
        toast.success(res.message || "Cart cleared");
      } else {
        console.warn("Server cart clear failed, but local cart cleared:", res);
      }

      return res;
    } catch (err) {
      // Still clear local cart even if server fails
      setCartItems([]);
      console.warn("clearCart error:", err);
      return { success: 0, error: err?.message || String(err) };
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      // Use discounted price if available, otherwise use regular price
      const effectivePrice = (item.product.hasDiscount && item.product.specialPrice)
        ? (typeof item.product.specialPrice === 'number' ? item.product.specialPrice : parseFloat(item.product.specialPrice) || item.product.price)
        : item.product.price;
      return total + effectivePrice * item.quantity;
    }, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartItemsByStore = () => {
    const storeGroups = {};
    cartItems.forEach((item) => {
      if (!storeGroups[item.storeId]) {
        storeGroups[item.storeId] = [];
      }
      storeGroups[item.storeId].push(item);
    });
    return storeGroups;
  };

  const getStoreItemsCount = (storeId) => {
    return cartItems
      .filter((item) => String(item.storeId) === String(storeId))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const getQuantityForProduct = (productId, storeId) => {
    const item = cartItems.find(
      (i) => i.product.id === productId && String(i.storeId) === String(storeId)
    );
    return item ? item.quantity : 0;
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    getCartItemsByStore,
    getStoreItemsCount,
    getQuantityForProduct,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
