import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/dashboard");
        console.log("Dashboard Data:", response.data);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to your administration panel</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Students */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <span className="text-2xl text-blue-600">👨‍🎓</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overview.totalStudents}</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-green-600 font-medium">
                  +{stats.overview.recentStudents} recent
                </div>
              </div>

              {/* Total Internships */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100">
                    <span className="text-2xl text-green-600">💼</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Internships</p>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">Active positions</div>
              </div>

              {/* Active Admins */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <span className="text-2xl text-purple-600">👨‍💼</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overview.activeAdmins}</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">Team Members</div>
              </div>

              {/* Payment Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-100">
                    <span className="text-2xl text-orange-600">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Paid Internships</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.students.paid}</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  {stats.students.unpaid} unpaid
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Approval Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Approved Students</span>
                    <span className="font-semibold text-green-600">{stats.students.payed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Approval</span>
                    <span className="font-semibold text-yellow-600">{stats.students.nopaid}</span>
                  </div>
                  <div className="pt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${
      stats.overview.totalStudents > 0 
        ? (stats.students.payed / stats.overview.totalStudents) * 100 
        : 0
    }%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stipend Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stipend Types</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Paid Internships</span>
                    <span className="font-semibold text-green-600">{stats.students.paid}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Unpaid Internships</span>
                    <span className="font-semibold text-blue-600">{stats.students.unpaid}</span>
                  </div>
                  <div className="pt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.overview.totalStudents > 0 ? (stats.students.paid / stats.overview.totalStudents) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Students Management */}
          <Link to="/students" className="group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300 h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                  <span className="text-2xl text-blue-600">👨‍🎓</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Students</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage student records, approvals, and internship details
                </p>
                <div className="text-blue-600 font-medium text-sm">Manage Students →</div>
              </div>
            </div>
          </Link>

          {/* Certificates */}
          <Link to="/certificates" className="group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-green-300 h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors duration-300">
                  <span className="text-2xl text-green-600">🏆</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Certificates</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Issue and manage certificates and completion documents
                </p>
                <div className="text-green-600 font-medium text-sm">View Certificates →</div>
              </div>
            </div>
          </Link>

          {/* Admins Management */}
          <Link to="/admins" className="group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-purple-300 h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors duration-300">
                  <span className="text-2xl text-purple-600">👨‍💼</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Admins</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage administrator accounts and system permissions
                </p>
                <div className="text-purple-600 font-medium text-sm">Manage Admins →</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Internship Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;