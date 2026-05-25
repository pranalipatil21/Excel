import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import NavbarMain from "../components/NavbarMain";
import Footer from "../components/Footer";
import { API_BASE } from "../utils/apiBase";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      };

      const response = await axios.post(`${API_BASE}/auth/admin/login`, payload);
      const token = response.data?.token;

      if (token) {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminEmail", response.data?.admin?.email || payload.email);
        localStorage.setItem("adminRole", "admin");
        navigate("/admin-dashboard");
      } else {
        setError("Admin login failed. Token not received.");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-page min-h-screen font-detective relative flex flex-col">
      <div className="absolute inset-0 theme-overlay z-0" />
      <NavbarMain />

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Admin Login Card */}
          <div className="theme-card border rounded-xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🔐</div>
              <h1 className="text-3xl font-bold theme-title">Admin Login</h1>
              <p className="theme-muted text-sm mt-2">Excel Analytics Platform</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold theme-title mb-2">
                  📧 Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@excelverse.com"
                  className="theme-input w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold theme-title mb-2">
                  🔒 Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="theme-input w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              {/* Demo Credentials Hint */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <strong>Admin Credentials (from backend .env):</strong>
                <br />
                Email: admin@excelverse.com
                <br />
                Password: password@123
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 theme-btn font-bold rounded-lg transition disabled:opacity-50"
              >
                {loading ? "🔄 Logging in..." : "🚀 Login"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-xs theme-muted">OR</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Back to Home */}
            <Link
              to="/"
              className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-sm theme-title"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 theme-card rounded-lg border text-center text-sm theme-muted">
            <p>🛡️ This is a secure admin panel.</p>
            <p className="mt-2">Only authorized administrators can access this area.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLogin;
