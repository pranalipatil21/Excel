import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import defaultAvatar from "../assests/detective.png";

export default function Profile() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [role, setRole] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(defaultAvatar);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || "Failed to fetch profile");
      }

      const data = await res.json();
      setProfileData(data);
      setNameInput(data.name);
      setEmailInput(data.email);
      setRole(data.role || "User");
      setError("");

      // If user has profile picture URL
      if (data.avatarUrl) {
        setAvatarPreview(data.avatarUrl);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (nameInput.trim() === "") {
      setError("Name cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ name: nameInput, email: emailInput }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      setEditMode(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchProfile();
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      // Optional: upload to backend if supported
    }
  };

  return (
    <div className="theme-page min-h-screen font-detective relative overflow-x-hidden">
      <div className="absolute inset-0 theme-overlay z-0" />
      <NavbarMain onToggleDrawer={() => setIsDrawerOpen(true)} />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-6 py-10 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold theme-title text-center mb-8">
          Your Profile
        </h2>

        {error && (
          <div className="bg-red-600 text-white p-3 mb-4 rounded text-center">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-600 text-white p-3 mb-4 rounded text-center">
            ✅ {success}
          </div>
        )}

        {loading ? (
          <p className="text-center theme-subtitle">Loading...</p>
        ) : !profileData ? (
          <div className="theme-card border p-6 rounded-lg shadow-lg text-center">
            <p className="text-red-600 font-medium mb-2">Unable to load profile.</p>
            <p className="theme-subtitle text-sm mb-4">Please login again or try after backend is running.</p>
            <button
              onClick={handleLogout}
              className="theme-btn font-semibold px-4 py-2 rounded"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <div className="theme-card border p-6 rounded-lg shadow-lg transition-opacity duration-500 ease-in opacity-100">
            <div className="flex items-center gap-6 mb-6">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border-2 border-lime-400 shadow-md"
                />
                {editMode && (
                  <input
                    type="file"
                    accept="image/*"
                    id="avatar-upload"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                )}
              </label>

              <div>
                {editMode ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="theme-subtitle font-semibold">User</span>
                      <input
                        type="text"
                        className="theme-input rounded px-2 py-1"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                      />
                    </div>
                    <input
                      type="email"
                      className="theme-input rounded px-2 py-1"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Email"
                    />
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold theme-subtitle">
                      {profileData.name}
                    </h3>
                    <p className="theme-title text-sm">{profileData.email}</p>
                  </>
                )}
                <p className="theme-title text-xs mt-1">
                  🗓️ Joined: {new Date(profileData.createdAt).toDateString()}
                </p>
                <p className="theme-title text-xs mt-1">🔑 Role: {role}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-between mt-4">
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="theme-btn font-semibold px-4 py-2 rounded disabled:opacity-50"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setNameInput(profileData?.name || "");
                      setEmailInput(profileData?.email || "");
                      setError("");
                      setSuccess("");
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded"
                  >
                    ❌ Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="theme-btn font-semibold px-4 py-2 rounded"
                >
                  ✏️ Edit Profile
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded"
              >
                🔓 Logout
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}