import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarMain from "../components/NavbarMain";
import SidebarDrawer from "../components/SidebarDrawer";
import Footer from "../components/Footer";
import detectiveBg from "../assests/b.gif";
import avatar from "../assests/detective.png";

export default function Profile() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
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
    try {
      const res = await fetch("http://localhost:5000/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ name: nameInput }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      setEditMode(false);
      fetchProfile();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen text-white font-detective relative overflow-x-hidden"
      style={{
        backgroundImage: `url(${detectiveBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-0" />
      <NavbarMain onToggleDrawer={() => setIsDrawerOpen(true)} />
      <SidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <main className="relative z-10 px-6 py-10 max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-lime-300 text-center mb-8">
          🕵️ Your Profile
        </h2>

        {loading ? (
          <p className="text-center text-lime-200">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : (
          <div className="bg-black/60 border border-lime-500 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-6 mb-6">
              <img
                src={avatar}
                alt="Detective Avatar"
                className="w-20 h-20 rounded-full border-2 border-lime-400 shadow-md"
              />
              <div>
                {editMode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lime-200 font-semibold">Detective</span>
                    <input
                      type="text"
                      className="text-black rounded px-2 py-1"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                    />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold text-lime-200">
                    Detective {profileData.name}
                  </h3>
                )}
                <p className="text-lime-300 text-sm">{profileData.email}</p>
                <p className="text-lime-400 text-xs mt-1">
                  🗓️ Joined: {new Date(profileData.createdAt).toDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/70 p-4 rounded text-center border border-lime-400">
                <h4 className="text-xl font-semibold text-lime-200">📁 Datasets Uploaded</h4>
                <p className="text-2xl text-white mt-2">7</p>
              </div>
              <div className="bg-black/70 p-4 rounded text-center border border-lime-400">
                <h4 className="text-xl font-semibold text-lime-200">⏱️ Hours Spent</h4>
                <p className="text-2xl text-white mt-2">22.5</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => (editMode ? handleSave() : setEditMode(true))}
                className="bg-lime-500 hover:bg-lime-600 text-black font-semibold px-4 py-2 rounded"
              >
                {editMode ? "💾 Save" : "✏️ Edit Profile"}
              </button>
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
