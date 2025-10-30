import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/admin";

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Admins
  const getAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setAdmins(res.data);
    } catch (error) {
      console.error("Error fetching admins:", error);
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
      if (editId) {
        await axios.put(`${API}/${editId}`, { email: form.email });
      } else {
        await axios.post(API, form);
      }

      setForm({ email: "", password: "" });
      setShowForm(false);
      setEditId(null);
      getAdmins();
    } catch (error) {
      console.error("Error saving admin:", error);
    } finally {
      setLoading(false);
    }
  };

  // Edit Click
  const handleEdit = (admin) => {
    setForm({ email: admin.email, password: "" });
    setEditId(admin.id);
    setShowForm(true);
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API}/${id}`);
      getAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Management</h1>
            <p className="text-gray-600">Manage administrator accounts and permissions</p>
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2 mt-4 sm:mt-0"
            onClick={() => {
              setForm({ email: "", password: "" });
              setEditId(null);
              setShowForm(true);
            }}
          >
            <span>+</span>
            Add Admin
          </button>
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
                  Email Address
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
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
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
                      {editId ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    editId ? "Update Admin" : "Save Admin"
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  onClick={() => setShowForm(false)}
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
            <h2 className="text-lg font-semibold text-gray-900">Administrator Accounts</h2>
          </div>

          {loading && admins.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-2">Loading admins...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No admin accounts found</p>
              <p className="text-gray-400 mt-1">Click "Add Admin" to create the first admin account</p>
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
                        {admin.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(admin)}
                            disabled={loading}
                            className="bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            disabled={loading}
                            className="bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Total {admins.length} admin{admins.length !== 1 ? 's' : ''} registered
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admins;