import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/admin";

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", type: "ADMIN" });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Get current admin info
  const currentAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
  const isSuperAdmin = currentAdmin.type === "SUPER_ADMIN";

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("No authentication token found. Please login again.", "error");
      return null;
    }
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch Admins
  const getAdmins = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      console.log("Fetching admins...");
      const res = await axios.get(`${API_BASE}/admins`, headers);
      console.log("Admins data:", res.data);
      setAdmins(res.data);
    } catch (error) {
      console.error("Error fetching admins:", error);
      const errorMessage = error.response?.data?.message || "Error fetching admins";
      showToast(errorMessage, "error");
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdmins();
  }, []);

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      if (editId) {
        // For edit, only send email and type (no password)
        const updateData = { email: form.email };
        if (isSuperAdmin) {
          updateData.type = form.type;
        }
        
        await axios.put(`${API_BASE}/${editId}`, updateData, headers);
        showToast("Admin updated successfully!");
      } else {
        // For create, use the /create endpoint
        await axios.post(`${API_BASE}/create`, form, headers);
        showToast("Admin created successfully!");
      }

      setForm({ email: "", password: "", type: "ADMIN" });
      setShowForm(false);
      setEditId(null);
      getAdmins();
    } catch (error) {
      console.error("Error saving admin:", error);
      const errorMessage = error.response?.data?.message || "Error saving admin";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Edit Click
  const handleEdit = (admin) => {
    setForm({ 
      email: admin.email, 
      password: "", // Don't pre-fill password
      type: admin.type 
    });
    setEditId(admin.id);
    setShowForm(true);
  };

  // Delete
  const handleDelete = async (id) => {
    // Prevent self-deletion
    if (parseInt(currentAdmin.id) === parseInt(id)) {
      showToast("Cannot delete your own account", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.delete(`${API_BASE}/${id}`, headers);
      showToast("Admin deleted successfully!");
      getAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      const errorMessage = error.response?.data?.message || "Error deleting admin";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Cancel form
  const handleCancel = () => {
    setForm({ email: "", password: "", type: "ADMIN" });
    setEditId(null);
    setShowForm(false);
  };

  // Toast Component
  const Toast = () => {
    if (!toast.show) return null;

    return (
      <div className="fixed top-4 right-4 z-50 animate-fade-in">
        <div
          className={`flex items-center p-4 rounded-lg shadow-lg border ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-green-50 border-green-200 text-green-800"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full mr-3 ${
              toast.type === "error" ? "bg-red-500" : "bg-green-500"
            }`}
          ></div>
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  // Get admin type badge
  const getAdminTypeBadge = (type) => {
    const typeConfig = {
      SUPER_ADMIN: {
        color: "bg-purple-100 text-purple-800",
        label: "Super Admin"
      },
      ADMIN: {
        color: "bg-blue-100 text-blue-800",
        label: "Admin"
      }
    };

    const config = typeConfig[type] || typeConfig.ADMIN;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Toast Notification */}
        <Toast />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Management</h1>
            <p className="text-gray-600">Manage administrator accounts and permissions</p>
            {!isSuperAdmin && (
              <p className="text-sm text-yellow-600 mt-1">
                ⚠️ You have limited permissions as a regular admin
              </p>
            )}
          </div>
          
          {isSuperAdmin && (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2 mt-4 sm:mt-0"
              onClick={() => {
                setForm({ email: "", password: "", type: "ADMIN" });
                setEditId(null);
                setShowForm(true);
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Admin
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editId ? "Edit Admin" : "Add New Admin"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              {!editId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter password (min. 6 characters)"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters long
                  </p>
                </div>
              )}

              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Type
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editId ? "Update Admin" : "Create Admin"
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Administrator Accounts</h2>
              <div className="text-sm text-gray-500">
                {admins.length} admin{admins.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {loading && admins.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-2">Loading admins...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No admin accounts found</p>
              <p className="text-gray-400 mt-1">
                {isSuperAdmin 
                  ? 'Click "Add Admin" to create the first admin account' 
                  : 'Only Super Admin can create new admin accounts'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {admins.map((admin, index) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          {admin.email}
                          {parseInt(currentAdmin.id) === parseInt(admin.id) && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getAdminTypeBadge(admin.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {/* Regular admins can only edit themselves */}
                          {(isSuperAdmin || parseInt(currentAdmin.id) === parseInt(admin.id)) && (
                            <button
                              onClick={() => handleEdit(admin)}
                              disabled={loading}
                              className="bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                            >
                              Edit
                            </button>
                          )}
                          
                          {/* Only SuperAdmin can delete, and cannot delete self */}
                          {isSuperAdmin && parseInt(currentAdmin.id) !== parseInt(admin.id) && (
                            <button
                              onClick={() => handleDelete(admin.id)}
                              disabled={loading}
                              className="bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Permissions Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Permissions Information</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Super Admin:</strong> Can create, edit, and delete all admin accounts</li>
            <li>• <strong>Admin:</strong> Can only edit their own profile</li>
            <li>• Self-deletion is not allowed for security reasons</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Admins;