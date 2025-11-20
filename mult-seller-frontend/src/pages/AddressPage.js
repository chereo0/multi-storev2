import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  createAddress,
  updateAddress,
  getUserAddresses,
} from "../api/services";
import toast from "react-hot-toast";
import LocationPicker from "../components/LocationPicker";
import { deleteAddress } from "../api/services";

const AddressPage = () => {
  const { user, tokenValid, loading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressId, setAddressId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  // Two-step flow control: 'pick' -> choose location on map, then 'form' -> fill details
  const [flowStep, setFlowStep] = useState("form");
  const locationStepRef = useRef(null);
  const [addressData, setAddressData] = useState({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    city: "",
    address_1: "",
    address_2: "",
    postcode: "",
    country: "Lebanon",
    phone: user?.telephone || "",
    latitude: null,
    longitude: null,
  });

  // Load addresses on component mount
  useEffect(() => {
    const loadAddresses = async () => {
      console.log("AddressPage useEffect triggered");
      console.log("User from context:", user);
      console.log("Token valid:", tokenValid);

      // If AuthContext is still initializing, wait for it to finish so tokens are restored
      if (authLoading) {
        console.log("Auth is still loading, deferring address load");
        return;
      }

      if (!user) {
        console.log("No user found, skipping address load");
        return;
      }

      // Check if we have a token available
      const authToken =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token");
      const clientToken = localStorage.getItem("client_token");

      if (!authToken && !clientToken) {
        console.log("No tokens available, skipping address load");
        toast.error("Authentication required. Please log in again.");
        return;
      }

      console.log(
        "Tokens available - auth_token:",
        !!authToken,
        "client_token:",
        !!clientToken
      );

      // Log token details for debugging
      if (authToken) {
        console.log("AddressPage: Auth token details:", {
          length: authToken.length,
          start: authToken.substring(0, 10) + "...",
          end: "..." + authToken.substring(authToken.length - 10),
          timestamp: new Date().toISOString(),
        });
      }

      if (clientToken) {
        console.log("AddressPage: Client token details:", {
          length: clientToken.length,
          start: clientToken.substring(0, 10) + "...",
          timestamp: new Date().toISOString(),
        });
      }

      setLoading(true);
      try {
        // Get all addresses for the user using the correct endpoint
        const result = await getUserAddresses();

        if (result.success && result.data) {
          // Handle both array and single object responses
          const addressList = Array.isArray(result.data)
            ? result.data
            : [result.data];
          setAddresses(addressList);

          // If there are addresses, select the first one by default
          if (addressList.length > 0) {
            const firstAddress = addressList[0];
            setSelectedAddressId(firstAddress.id);
            setAddressId(firstAddress.id);
            setAddressData({
              firstname: firstAddress.firstname || user?.firstname || "",
              lastname: firstAddress.lastname || user?.lastname || "",
              city: firstAddress.city || "",
              address_1: firstAddress.address_1 || "",
              address_2: firstAddress.address_2 || "",
              postcode: firstAddress.postcode || "",
              country: firstAddress.country || "Lebanon",
              phone: firstAddress.phone || user?.telephone || "",
              latitude:
                firstAddress.latitude ?? firstAddress.lat ?? firstAddress.geo_lat ?? null,
              longitude:
                firstAddress.longitude ?? firstAddress.lng ?? firstAddress.geo_lng ?? null,
            });
          }
        } else {
          console.log("No addresses found or API error:", result.message);
          if (
            result.message === "Authentication required" ||
            result.message ===
              "User authentication required. Please log in properly."
          ) {
            toast.error(
              "Please log in properly to access your addresses. The current session may not have the required permissions."
            );
          } else {
            toast.error(result.message || "Failed to load addresses");
          }
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
        toast.error("Network error while loading addresses");
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure AuthContext has finished token restoration
    const timeoutId = setTimeout(() => {
      loadAddresses();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, tokenValid, authLoading]);

  // Handle address selection
  const handleAddressSelect = (address) => {
    setSelectedAddressId(address.id);
    setAddressId(address.id);
    setAddressData({
      firstname: address.firstname || user?.firstname || "",
      lastname: address.lastname || user?.lastname || "",
      city: address.city || "",
      address_1: address.address_1 || "",
      address_2: address.address_2 || "",
      postcode: address.postcode || "",
      country: address.country || "Lebanon",
      phone: address.phone || user?.telephone || "",
      latitude: address.latitude ?? address.lat ?? address.geo_lat ?? null,
      longitude: address.longitude ?? address.lng ?? address.geo_lng ?? null,
    });
    setIsEditing(false);
    setFlowStep("form");
  };

  // Prepare form for creating a new address
  const handleAddNewAddress = () => {
    setIsEditing(true);
    setFlowStep("pick");
    setAddressId(null);
    setSelectedAddressId(null);
    setAddressData({
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      city: "",
      address_1: "",
      address_2: "",
      postcode: "",
      country: "Lebanon",
      phone: user?.telephone || "",
      latitude: null,
      longitude: null,
    });
    // Smooth scroll to the location picker step
    setTimeout(() => {
      if (locationStepRef.current) {
        locationStepRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const handleInputChange = (e) => {
    setAddressData({
      ...addressData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("Saving address data:", addressData);
      let result;

      if (addressId) {
        // Update existing address
        console.log("Updating address with ID:", addressId);
        result = await updateAddress(addressId, addressData);
      } else {
        // Create new address
        console.log("Creating new address");
        result = await createAddress(addressData);
        if (result.success && result.data?.id) {
          setAddressId(result.data.id);
          setSelectedAddressId(result.data.id);
        }
      }

      console.log("Save result:", result);

      if (result.success) {
        toast.success("Address saved successfully!", {
          style: {
            background: "linear-gradient(90deg, #00E5FF, #FF00FF)",
            color: "#fff",
          },
          iconTheme: {
            primary: "#00E5FF",
            secondary: "#FF00FF",
          },
        });
        setIsEditing(false);
        setFlowStep("form");

        // Reload addresses to reflect changes
        const reloadResult = await getUserAddresses();
        if (reloadResult.success && reloadResult.data) {
          const addressList = Array.isArray(reloadResult.data)
            ? reloadResult.data
            : [reloadResult.data];
          setAddresses(addressList);
        }
      } else {
        console.error("Save failed:", result);
        const msg = String(result.message || "Failed to save address");
        if (msg.includes("Unknown column 'country_id'")) {
          toast.error(
            "Address service temporarily unavailable: backend DB missing column country_id. We've notified the team."
          );
        } else {
          toast.error(msg);
        }
      }
    } catch (error) {
      console.error("Error saving address:", error);
      const msg = String(error?.message || "An error occurred while saving the address");
      if (msg.includes("Unknown column 'country_id'")) {
        toast.error(
          "Address service temporarily unavailable: backend DB missing column country_id. We've notified the team."
        );
      } else {
        toast.error("An error occurred while saving the address");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setAddressData({
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      city: "",
      address_1: "",
      address_2: "",
      postcode: "",
      country: "Lebanon",
      phone: user?.telephone || "",
      latitude: null,
      longitude: null,
    });
    setIsEditing(false);
    setFlowStep("form");
  };

  // Delete selected address
  const handleDeleteAddress = async () => {
    // Allow selectedAddressId to be an id or an object
    const id = extractAddressId(selectedAddressId);
    if (!id) {
      toast.error("No valid address selected to delete");
      console.error(
        "Invalid selectedAddressId for deletion:",
        selectedAddressId
      );
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this address? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      setSaving(true);
      console.log("Attempting delete for id:", id, "type:", typeof id);
      const result = await deleteAddress(id);
      if (result.success) {
        toast.success("Address deleted");
        await refreshAddressesAfterDelete(id);
      } else {
        toast.error(result.message || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Network error while deleting address");
    } finally {
      setSaving(false);
    }
  };

  // Helper to extract address id from an id or object
  const extractAddressId = (maybe) => {
    if (!maybe) return null;
    // If it's a primitive id
    if (typeof maybe === "string" || typeof maybe === "number")
      return String(maybe);
    // If it's an object, try common fields
    if (typeof maybe === "object") {
      return String(
        maybe.id ||
          maybe.address_id ||
          maybe.addressId ||
          maybe.ID ||
          maybe._id ||
          maybe.address?.id ||
          ""
      );
    }
    return null;
  };

  // Refresh addresses list after deletion and adjust selection
  const refreshAddressesAfterDelete = async (deletedId) => {
    try {
      const reloadResult = await getUserAddresses();
      if (reloadResult.success && reloadResult.data) {
        const addressList = Array.isArray(reloadResult.data)
          ? reloadResult.data
          : [reloadResult.data];
        setAddresses(addressList);
        if (addressList.length > 0) {
          const first = addressList[0];
          setSelectedAddressId(first.id);
          setAddressId(first.id);
          setAddressData({
            firstname: first.firstname || user?.firstname || "",
            lastname: first.lastname || user?.lastname || "",
            city: first.city || "",
            address_1: first.address_1 || "",
            address_2: first.address_2 || "",
            postcode: first.postcode || "",
            country: first.country || "Lebanon",
            phone: first.phone || user?.telephone || "",
          });
        } else {
          setSelectedAddressId(null);
          setAddressId(null);
          setAddressData({
            firstname: user?.firstname || "",
            lastname: user?.lastname || "",
            city: "",
            address_1: "",
            address_2: "",
            postcode: "",
            country: "Lebanon",
            phone: user?.telephone || "",
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing addresses after delete:", error);
    }
  };

  // Delete address by id (used for per-card delete button)
  const handleDeleteAddressById = async (idOrAddress) => {
    const id = extractAddressId(idOrAddress);
    if (!id) {
      toast.error("Invalid address id");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this address? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      setSaving(true);
  const result = await deleteAddress(id);
      if (result.success) {
        toast.success("Address deleted");
        // Reload addresses
        const reloadResult = await getUserAddresses();
        if (reloadResult.success && reloadResult.data) {
          const addressList = Array.isArray(reloadResult.data)
            ? reloadResult.data
            : [reloadResult.data];
          setAddresses(addressList);
          // If deleted the currently selected address, reset selection
          if (selectedAddressId === id) {
            if (addressList.length > 0) {
              const first = addressList[0];
              setSelectedAddressId(first.id);
              setAddressId(first.id);
              setAddressData({
                firstname: first.firstname || user?.firstname || "",
                lastname: first.lastname || user?.lastname || "",
                city: first.city || "",
                address_1: first.address_1 || "",
                address_2: first.address_2 || "",
                postcode: first.postcode || "",
                country: first.country || "Lebanon",
                phone: first.phone || user?.telephone || "",
              });
            } else {
              setSelectedAddressId(null);
              setAddressId(null);
              setAddressData({
                firstname: user?.firstname || "",
                lastname: user?.lastname || "",
                city: "",
                address_1: "",
                address_2: "",
                postcode: "",
                country: "Lebanon",
                phone: user?.telephone || "",
              });
            }
          }
        }
      } else {
        toast.error(result.message || "Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address by id:", error);
      toast.error("Network error while deleting address");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDarkMode ? "bg-gray-900" : ""
        }`}
        style={
          !isDarkMode
            ? {
                backgroundImage: "url(/white%20backgroud.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
              }
            : {}
        }
      >
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4 ${
              isDarkMode ? "border-cyan-400" : "border-cyan-600"
            }`}
          ></div>
          <div
            className={`text-xl font-medium transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Loading address...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900" : ""
      }`}
      style={
        !isDarkMode
          ? {
              backgroundImage: "url(/white%20backgroud.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
            }
          : {}
      }
    >
  {/* Global top padding handled in App.js */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="md:flex-1 text-center md:text-left">
            <h1
              className={`text-4xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              My Addresses
            </h1>
            <div
              className={`w-24 h-1 mb-3 rounded-full ${
                isDarkMode
                  ? "bg-gradient-to-r from-cyan-400 to-purple-500"
                  : "bg-gradient-to-r from-cyan-500 to-purple-600"
              }`}
            ></div>
            <p
              className={`text-lg transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Manage your delivery addresses
            </p>

            {user && (
              <div className="mt-4 inline-block px-4 py-2 rounded-lg text-sm bg-green-100 text-green-800 border border-green-200">
                <span>✓ Authentication active - Addresses can be loaded</span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={handleAddNewAddress}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25"
                  : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
              }`}
            >
              + Add New Address
            </button>
          </div>
        </div>

        {/* Address Selection */}
        {addresses.length > 0 && (
          <div
            className={`mb-8 p-6 rounded-lg transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-800/50 border border-gray-700"
                : "bg-white/50 border border-gray-200"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {addresses.length > 1
                ? "Select Address to Edit"
                : "Current Address"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  onClick={() => handleAddressSelect(address)}
                  className={`relative p-4 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedAddressId === address.id
                      ? isDarkMode
                        ? "bg-cyan-500/20 border-2 border-cyan-400"
                        : "bg-cyan-100 border-2 border-cyan-500"
                      : isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 hover:bg-gray-600/50"
                      : "bg-gray-50 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {/* Per-card delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddressById(address);
                    }}
                    title="Delete address"
                    className={`absolute top-2 right-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${
                      isDarkMode
                        ? "bg-gray-800 text-red-400 hover:bg-gray-700"
                        : "bg-white text-red-600 hover:bg-gray-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {address.firstname} {address.lastname}
                  </div>
                  <div
                    className={`text-xs mt-1 transition-colors duration-300 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {address.address_1}
                  </div>
                  <div
                    className={`text-xs transition-colors duration-300 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {address.city}, {address.country}
                  </div>
                  <div
                    className={`text-xs mt-1 transition-colors duration-300 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {address.phone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Addresses Message */}
        {addresses.length === 0 && !loading && (
          <div
            className={`mb-8 p-8 rounded-lg text-center transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-800/50 border border-gray-700"
                : "bg-white/50 border border-gray-200"
            }`}
          >
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-gray-700/50" : "bg-gray-100"
              }`}
            >
              <svg
                className={`w-8 h-8 ${
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3
              className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {!user ? "Please Log In" : "No Addresses Found"}
            </h3>
            <p
              className={`text-sm transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {!user
                ? "You need to be logged in to manage your addresses"
                : "You don't have any saved addresses yet. Create your first address below."}
            </p>
            {!user && (
              <div className="mt-4">
                <Link
                  to="/auth"
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25"
                      : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                  }`}
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl p-8 backdrop-blur-md transition-all duration-300 ${
            isDarkMode
              ? "bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10"
              : "bg-white/80 border border-gray-200 shadow-xl"
          }`}
        >
          {/* Address Header */}
          <div className="text-center mb-8">
            <div
              className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h2
              className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Delivery Address
            </h2>
            <p
              className={`transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {user?.name || "User"} - {user?.email || "No email provided"}
            </p>
          </div>

          {/* Address Form */}
          {/* Step 1: Pick location for new address */}
          {isEditing && !addressId && flowStep === "pick" && (
            <div
              ref={locationStepRef}
              className={`mb-8 p-6 rounded-lg transition-all duration-300 ${
                isDarkMode
                  ? "bg-gray-800/50 border border-gray-700"
                  : "bg-white/50 border border-gray-200"
              }`}
            >
              <h3
                className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Step 1 of 2: Choose Location
              </h3>
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-4`}>
                Tap on the map to drop a pin or use the "Use my location" button. You can adjust it before continuing.
              </p>
              <LocationPicker
                value={{ lat: addressData.latitude, lng: addressData.longitude }}
                onChange={(pos) =>
                  setAddressData((prev) => ({
                    ...prev,
                    latitude: pos.lat,
                    longitude: pos.lng,
                  }))
                }
                isDark={isDarkMode}
                disabled={false}
                height={360}
              />
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => {
                    if (addressData.latitude == null || addressData.longitude == null) {
                      toast.error("Please choose a location before continuing.");
                      return;
                    }
                    setFlowStep("form");
                    // scroll to top of form after switching step
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }, 50);
                  }}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25"
                      : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                  }`}
                >
                  Continue to Form
                </button>
                <button
                  onClick={handleCancel}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Details form */}
          {!(isEditing && !addressId && flowStep === "pick") && (
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstname"
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={addressData.firstname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label
                  htmlFor="lastname"
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={addressData.lastname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="city"
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={addressData.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                } focus:outline-none focus:ring-2`}
                placeholder="Enter your city"
              />
            </div>

            <div>
              <label
                htmlFor="address_1"
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Address Line 1
              </label>
              <input
                type="text"
                id="address_1"
                name="address_1"
                value={addressData.address_1}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                } focus:outline-none focus:ring-2`}
                placeholder="Enter your address line 1"
              />
            </div>

            <div>
              <label
                htmlFor="address_2"
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Address Line 2
              </label>
              <input
                type="text"
                id="address_2"
                name="address_2"
                value={addressData.address_2}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                } focus:outline-none focus:ring-2`}
                placeholder="Enter your address line 2 (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="postcode"
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Postcode
                </label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={addressData.postcode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your postcode"
                />
              </div>

              <div>
                <label
                  htmlFor="country"
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={addressData.country}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                  } focus:outline-none focus:ring-2`}
                >
                  <option value="Lebanon">Lebanon</option>
                  <option value="Syria">Syria</option>
                  <option value="Jordan">Jordan</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Contact Phone
              </label>
              <div className="flex">
                <div
                  className={`flex-shrink-0 px-4 py-3 rounded-l-lg border border-r-0 text-sm font-medium transition-colors duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border-gray-600 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-700"
                  }`}
                >
                  +961
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={addressData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`flex-1 px-4 py-3 rounded-r-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter your phone number"
                  pattern="[0-9]{7,8}"
                  title="Please enter a valid Lebanese phone number (7-8 digits)"
                />
              </div>
            </div>

            {/* Location section */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Location (optional)
              </label>
              <div className="space-y-3">
                <LocationPicker
                  value={{ lat: addressData.latitude, lng: addressData.longitude }}
                  onChange={(pos) =>
                    setAddressData((prev) => ({
                      ...prev,
                      latitude: pos.lat,
                      longitude: pos.lng,
                    }))
                  }
                  isDark={isDarkMode}
                  disabled={!isEditing}
                  height={320}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="latitude"
                      className={`block text-xs font-medium mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="latitude"
                      name="latitude"
                      value={addressData.latitude ?? ""}
                      onChange={(e) =>
                        setAddressData((prev) => ({
                          ...prev,
                          latitude: e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="e.g. 33.8938"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="longitude"
                      className={`block text-xs font-medium mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="longitude"
                      name="longitude"
                      value={addressData.longitude ?? ""}
                      onChange={(e) =>
                        setAddressData((prev) => ({
                          ...prev,
                          longitude: e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 rounded-lg ${
                        isDarkMode
                          ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="e.g. 35.5018"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
          )}

          {/* Action Buttons */}
          {!(isEditing && !addressId && flowStep === "pick") && (
            <div className="flex justify-center space-x-4 mt-8">
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setFlowStep("form");
                  }}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25"
                      : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                  }`}
                >
                  Edit Address
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg shadow-green-400/25"
                        : "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                    }`}
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Save Address"
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    Cancel
                  </button>
                  {/* Delete button available while editing or when an address is selected */}
                  <button
                    onClick={handleDeleteAddress}
                    disabled={!selectedAddressId || saving}
                    className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDarkMode
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-red-500 hover:bg-red-400 text-white"
                    }`}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {/* Address Summary */}
          {!(isEditing && !addressId && flowStep === "pick") && addressData.address_1 && (
            <div
              className={`mt-8 p-6 rounded-lg transition-all duration-300 ${
                isDarkMode ? "bg-gray-700/30" : "bg-gray-50"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Address Summary
              </h3>
              <div
                className={`space-y-2 text-sm transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <p>
                  <strong>Name:</strong> {addressData.firstname}{" "}
                  {addressData.lastname}
                </p>
                <p>
                  <strong>Address:</strong> {addressData.address_1}
                </p>
                {addressData.address_2 && (
                  <p>
                    <strong>Address Line 2:</strong> {addressData.address_2}
                  </p>
                )}
                <p>
                  <strong>City:</strong> {addressData.city}
                </p>
                <p>
                  <strong>Postcode:</strong> {addressData.postcode}
                </p>
                <p>
                  <strong>Country:</strong> {addressData.country}
                </p>
                <p>
                  <strong>Phone:</strong> +961{addressData.phone}
                </p>
                {addressData.latitude != null && addressData.longitude != null && (
                  <p>
                    <strong>Location:</strong> {addressData.latitude}, {addressData.longitude}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressPage;
