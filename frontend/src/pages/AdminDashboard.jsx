import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarMain from "../components/NavbarMain";
import Footer from "../components/Footer";
import { API_BASE } from "../utils/apiBase";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalUsers: 0,
    totalDashboards: 0,
    totalCharts: 0,
    usersWhoUploaded: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const email = localStorage.getItem("adminEmail");

    if (!adminToken) {
      navigate("/admin-login");
    } else {
      setIsAdmin(true);
      setAdminEmail(email);
      loadStats(adminToken);
    }
  }, [navigate]);

  const loadStats = async (token) => {
    try {
      setLoadingStats(true);

      const res = await fetch(`${API_BASE}/auth/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch admin stats");
      }

      const data = await res.json();
      setStats(data?.stats || {
        totalUploads: 0,
        totalUsers: 0,
        totalDashboards: 0,
        totalCharts: 0,
        usersWhoUploaded: 0,
      });

      const activities = (data?.activities || []).map((activity) => ({
        id: activity.id,
        type: activity.type,
        description: `${activity.uploadedBy} (${activity.uploadedByEmail}) uploaded ${activity.fileName}`,
        timestamp: new Date(activity.uploadDate).toLocaleString(),
        icon: "📤",
      }));

      setRecentActivities(activities);
    } catch (error) {
      setRecentActivities([]);
      setStats({
        totalUploads: 0,
        totalUsers: 0,
        totalDashboards: 0,
        totalCharts: 0,
        usersWhoUploaded: 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("adminRole");
    navigate("/admin-login", { replace: true });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="theme-page min-h-screen font-detective relative">
      <div className="absolute inset-0 theme-overlay z-0" />
      <NavbarMain onSearchChange={() => {}} />

      <main className="relative z-10 px-6 py-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold theme-title">🎛️ Admin Dashboard</h1>
            <p className="theme-muted text-sm mt-2">Logged in as: {adminEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition"
          >
            🚪 Logout
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {/* Total Uploads */}
          <div className="theme-card border rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex justify-between items-start mb-3">
              <div className="text-3xl">📤</div>
              <span className="text-emerald-600 font-bold text-lg">{stats.totalUploads}</span>
            </div>
            <h3 className="theme-title font-semibold">Total Uploads</h3>
            <p className="theme-muted text-sm mt-2">Excel files uploaded</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((stats.totalUploads / 10) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Total Dashboards */}
          <div className="theme-card border rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex justify-between items-start mb-3">
              <div className="text-3xl">📊</div>
              <span className="text-blue-600 font-bold text-lg">{stats.totalDashboards}</span>
            </div>
            <h3 className="theme-title font-semibold">Dashboards Created</h3>
            <p className="theme-muted text-sm mt-2">Custom dashboards</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((stats.totalDashboards / 10) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Total Charts */}
          <div className="theme-card border rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex justify-between items-start mb-3">
              <div className="text-3xl">📈</div>
              <span className="text-purple-600 font-bold text-lg">{stats.totalCharts}</span>
            </div>
            <h3 className="theme-title font-semibold">Charts Generated</h3>
            <p className="theme-muted text-sm mt-2">Visualizations created</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((stats.totalCharts / 20) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Active Users */}
          <div className="theme-card border rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex justify-between items-start mb-3">
              <div className="text-3xl">👥</div>
              <span className="text-orange-600 font-bold text-lg">{stats.totalUsers}</span>
            </div>
            <h3 className="theme-title font-semibold">Registered Users</h3>
            <p className="theme-muted text-sm mt-2">User accounts</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${(stats.totalUsers / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Users Who Uploaded */}
          <div className="theme-card border rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex justify-between items-start mb-3">
              <div className="text-3xl">🧑‍💻</div>
              <span className="text-cyan-600 font-bold text-lg">{stats.usersWhoUploaded}</span>
            </div>
            <h3 className="theme-title font-semibold">Upload Users</h3>
            <p className="theme-muted text-sm mt-2">Unique users who uploaded files</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((stats.usersWhoUploaded / 10) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {/* Recent Activities */}
          <div className="theme-card border rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold theme-title mb-4">📋 Recent Activities</h2>
            {loadingStats ? (
              <div className="text-center py-8 text-gray-400">
                <p>Loading latest admin stats...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{activity.icon}</span>
                          <span className="font-semibold theme-title">{activity.type}</span>
                        </div>
                        <p className="theme-muted text-sm">{activity.description}</p>
                      </div>
                      <span className="text-xs theme-muted whitespace-nowrap ml-2">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-lg mb-2">📭</p>
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="theme-card border rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold theme-title mb-4">ℹ️ System Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="theme-muted text-sm font-semibold mb-1">Platform Version</p>
              <p className="text-lg font-bold theme-title">1.0.0</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="theme-muted text-sm font-semibold mb-1">Admin Name</p>
              <p className="text-lg font-bold theme-title">Admin</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="theme-muted text-sm font-semibold mb-1">Last Login</p>
              <p className="text-lg font-bold theme-title">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="theme-muted text-sm font-semibold mb-1">Database Status</p>
              <p className="text-lg font-bold text-green-600">🟢 Connected</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="theme-muted text-sm font-semibold mb-1">API Status</p>
              <p className="text-lg font-bold text-green-600">🟢 Running</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="theme-muted text-sm font-semibold mb-1">Last Updated</p>
              <p className="text-lg font-bold theme-title">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
