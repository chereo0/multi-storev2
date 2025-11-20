import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import { getProfile, updateProfile, updatePassword } from "../api/services";

const ProfilePage = () => {
  const { user } = useAuth();
  const { updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
  });
  // loading state is not needed here (profile uses saving state)

  useEffect(() => {
    const loadProfile = async () => {
      // Wait for auth to initialize
      try {
        const result = await getProfile();
        if (result.success && result.data) {
          const p = result.data;
          setProfileData({
            firstname:
              p.firstname || p.first_name || p.name || user?.firstname || "",
            lastname: p.lastname || p.last_name || user?.lastname || "",
            username: p.username || p.name || user?.username || "",
            email: p.email || user?.email || "",
            telephone: p.telephone || p.phone || user?.telephone || "",
          });
        } else {
          toast.error(result.message || "Failed to load profile");
        }
      } catch (error) {
        console.error("Profile load error:", error);
        toast.error("Network error while loading profile");
      } finally {
        // no-op
      }
    };

    loadProfile();
  }, [user]);

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const [saving, setSaving] = useState(false);

  // Change password state
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log("Saving profile:", profileData);
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success("Profile updated");
        // If backend returned updated user data, propagate into AuthContext
        const returned = result.data?.data || result.data || null;
        if (returned) {
          try {
            updateUser(returned);
          } catch (e) {
            console.warn(
              "ProfilePage: failed to propagate update to AuthContext",
              e
            );
          }
        }
        setIsEditing(false);
      } else {
        toast.error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Network error while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setProfileData({
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      email: user?.email || "",
      telephone: user?.telephone || "",
    });
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!pwOld || !pwNew || !pwConfirm) {
      toast.error("Please fill all password fields");
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error("New password and confirmation do not match");
      return;
    }
    // Basic length check
    if (pwNew.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    try {
      setChangingPassword(true);
      const payload = {
        old_password: pwOld,
        new_password: pwNew,
        confirm: pwConfirm,
      };
      const result = await updatePassword(payload);
      if (result.success) {
        toast.success("Password changed successfully");
        // Clear fields
        setPwOld("");
        setPwNew("");
        setPwConfirm("");
      } else {
        toast.error(result.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Network error while changing password");
    } finally {
      setChangingPassword(false);
    }
  };

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
      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1
            className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            My Profile
          </h1>
          <div
            className={`w-24 h-1 mx-auto rounded-full ${
              isDarkMode
                ? "bg-gradient-to-r from-cyan-400 to-purple-500"
                : "bg-gradient-to-r from-cyan-500 to-purple-600"
            }`}
          ></div>
        </div>

        <div
          className={`rounded-2xl p-8 backdrop-blur-md transition-all duration-300 ${
            isDarkMode
              ? "bg-gray-800/50 border border-cyan-400/30 shadow-2xl shadow-cyan-400/10"
              : "bg-white/80 border border-gray-200 shadow-xl"
          }`}
        >
          {/* Profile Header */}
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2
              className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {user?.name ||
                `${user?.firstname || ""} ${user?.lastname || ""}`.trim() ||
                "User Profile"}
            </h2>
            <p
              className={`transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {user?.email || "No email provided"}
            </p>
          </div>

          {/* Profile Form */}
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
                  value={profileData.firstname}
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
                  value={profileData.lastname}
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
                htmlFor="email"
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                } focus:outline-none focus:ring-2`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="telephone"
                className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={profileData.telephone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 disabled:bg-gray-800/30 disabled:text-gray-400"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 disabled:bg-gray-50 disabled:text-gray-500"
                } focus:outline-none focus:ring-2`}
                placeholder="Enter your phone number"
              />
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-8">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg shadow-cyan-400/25"
                    : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg"
                }`}
              >
                Edit Profile
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
                  {saving ? "Saving..." : "Save Changes"}
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
              </>
            )}
          </div>

          {/* Change Password Section */}
          <div className="mt-10 border-t pt-8">
            <h3
              className={`text-xl font-semibold mb-4 transition-colors duration-300 ${
                {
                  true: isDarkMode ? "text-white" : "text-gray-900",
                }[true]
              }`}
            >
              Change Password
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label
                  htmlFor="old_password"
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Current Password
                </label>
                <input
                  id="old_password"
                  name="old_password"
                  type="password"
                  value={pwOld}
                  onChange={(e) => setPwOld(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Current password"
                />
              </div>

              <div className="md:col-span-1">
                <label
                  htmlFor="new_password"
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  New Password
                </label>
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  } focus:outline-none focus:ring-2`}
                  placeholder="New password (min 8 chars)"
                />
              </div>

              <div className="md:col-span-1">
                <label
                  htmlFor="confirm_password"
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  name="confirm"
                  type="password"
                  value={pwConfirm}
                  onChange={(e) => setPwConfirm(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                      : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                  } focus:outline-none focus:ring-2`}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg shadow-pink-500/20"
                    : "bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg"
                }`}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
