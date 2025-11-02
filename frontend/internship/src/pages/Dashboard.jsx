import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">
              Welcome to your administration panel
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={logout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md flex-1 sm:flex-none"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Students Management Card */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                <span className="text-3xl text-blue-600">👨‍🎓</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Students Management</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage student records, track progress, and handle all student-related operations in one place.
              </p>
              <Link 
                to="/students"
                className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Manage Students
              </Link>
            </div>
          </div>

          {/* Certificates Card */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-all duration-300 hover:border-green-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors duration-300">
                <span className="text-3xl text-green-600">🏆</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Certificates</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Issue and manage certificates, send offer letters, and handle document-related operations.
              </p>
              <Link 
                to="/certificates"
                className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                View Certificates
              </Link>
            </div>
          </div>

          {/* Admins Management Card */}
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-all duration-300 hover:border-purple-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors duration-300">
                <span className="text-3xl text-purple-600">👨‍💼</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Admins Management</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage administrator accounts, permissions, and monitor admin activities across the platform.
              </p>
              <Link 
                to="/admins"
                className="inline-block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Manage Admins
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Admin Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;