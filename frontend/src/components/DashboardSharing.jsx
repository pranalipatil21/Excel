import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../utils/apiBase";

/**
 * Dashboard Sharing Component
 * Allows users to:
 * - Generate shareable links
 * - Share via email with team members
 * - Manage share permissions (view/edit)
 * - Revoke shares
 */
const DashboardSharing = ({ dashboardId, onShare = null }) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shareType, setShareType] = useState("link"); // link or email
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view"); // view or edit
  const [expiresIn, setExpiresIn] = useState("never"); // never, 1day, 7days, 30days
  const [generatedLink, setGeneratedLink] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");


  const loadShares = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/dashboard/${dashboardId}/shares`);
      setShares(response.data.shares || []);
    } catch (error) {
      console.error("Error loading shares:", error);
      // Silently fail - user may not have backend auth set up yet
    }
  }, [dashboardId]);

  /**
   * Load existing shares
   */
  useEffect(() => {
    if (dashboardId) {
      loadShares();
    }
  }, [dashboardId, loadShares]);

  /**
   * Create a new share (link or email)
   */
  const handleCreateShare = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (shareType === "email" && !email.trim()) {
      setErrorMessage("Please enter an email address");
      return;
    }

    try {
      setLoading(true);

      const expiresAt = getExpirationDate(expiresIn);
      const shareData = {
        shareType,
        permission,
        expiresAt,
      };

      if (shareType === "email") {
        shareData.email = email;
      }

      const response = await axios.post(
        `${API_BASE}/dashboard/${dashboardId}/share`,
        shareData
      );

      // Add new share to list
      setShares([...shares, response.data.share]);

      // Generate shareable link if applicable
      if (shareType === "link") {
        const shareLink = `${window.location.origin}/shared-dashboard/${response.data.share.shareLink}`;
        setGeneratedLink(shareLink);
        setSuccessMessage("Shareable link created! You can copy it above.");
      } else {
        setSuccessMessage(`Dashboard shared with ${email}`);
        setEmail("");
      }

      if (onShare) {
        onShare(response.data.share);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "Failed to create share");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy share link to clipboard
   */
  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setSuccessMessage("Link copied to clipboard!");
      setTimeout(() => setSuccessMessage(""), 2000);
    }
  };

  /**
   * Revoke a share
   */
  const handleRevokeShare = async (shareId) => {
    if (!window.confirm("Are you sure? This will revoke access immediately.")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/dashboard/share/${shareId}`);

      setShares((prev) => prev.filter((s) => s._id !== shareId));
      setSuccessMessage("Share revoked successfully");
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "Failed to revoke share");
    }
  };

  /**
   * Calculate expiration date from user selection
   */
  const getExpirationDate = (option) => {
    if (option === "never") return null;

    const now = new Date();
    const days = option === "1day" ? 1 : option === "7days" ? 7 : 30;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  };

  /**
   * Format expiration date for display
   */
  const formatDate = (date) => {
    if (!date) return "Never expires";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-t-lg">
        <h2 className="text-lg font-bold text-white">🔗 Share Dashboard</h2>
        <p className="text-cyan-50 text-sm mt-1">Share your dashboard with team members or via public link</p>
      </div>

      <div className="p-6">
        {/* Message Alerts */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            ✅ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ❌ {errorMessage}
          </div>
        )}

        {/* Share Type Selection */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-800 mb-3">Choose Share Method</label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="shareType"
                value="link"
                checked={shareType === "link"}
                onChange={(e) => {
                  setShareType(e.target.value);
                  setGeneratedLink(null);
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700">
                <strong>🔗 Public Link</strong> - Anyone with the link can access
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="shareType"
                value="email"
                checked={shareType === "email"}
                onChange={(e) => setShareType(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">
                <strong>📧 Email Invite</strong> - Send invitation to team members
              </span>
            </label>
          </div>
        </div>

        {/* Email Input (if email selected) */}
        {shareType === "email" && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Team Member Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Permission Settings */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Permission Level</label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="view">👁️ View Only - Can see the dashboard</option>
            <option value="edit">✏️ Edit - Can modify and save changes</option>
          </select>
        </div>

        {/* Expiration Settings */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration</label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="never">⏳ Never expires</option>
            <option value="1day">📅 Expires in 1 day</option>
            <option value="7days">📅 Expires in 7 days</option>
            <option value="30days">📅 Expires in 30 days</option>
          </select>
        </div>

        {/* Create Share Button */}
        <button
          onClick={handleCreateShare}
          disabled={loading || (shareType === "email" && !email.trim())}
          className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
        >
          {loading ? "Creating share..." : shareType === "link" ? "🔗 Generate Link" : "📧 Send Invite"}
        </button>

        {/* Generated Link Display */}
        {generatedLink && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">📋 Your Shareable Link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm font-mono text-blue-700"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded text-sm transition"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Share this link with anyone to grant access</p>
          </div>
        )}

        {/* Existing Shares List */}
        {shares.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Active Shares ({shares.length})</h3>
            <div className="space-y-3">
              {shares.map((share) => (
                <div key={share._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                  <div className="text-sm">
                    <p className="font-semibold text-gray-800">
                      {share.shareType === "link" ? "🔗 Public Link" : `📧 ${share.sharedWith}`}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {share.permission === "view" ? "👁️ View Only" : "✏️ Can Edit"} • {formatDate(share.expiresAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeShare(share._id)}
                    className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded transition"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-3 rounded-b-lg text-xs text-gray-500">
        <p>💡 Tip: Use public links for quick sharing, email invites for team collaboration</p>
      </div>
    </div>
  );
};

export default DashboardSharing;
