import React, { useState, useEffect } from "react";
import axios from "axios";

const Certificates = () => {
  const [certificates, setCertificates] = useState({ offers: [], completions: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("offers");

  const token = localStorage.getItem("token");

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/certificates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCertificates(res.data);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadCertificate = (certificate) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = `http://localhost:5000${certificate.path}`;
    link.download = certificate.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading certificates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Certificate Management</h1>
              <p className="text-gray-600 mt-1">Manage offer letters and completion certificates</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("offers")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "offers"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Offer Letters ({certificates.offers.length})
              </button>
              <button
                onClick={() => setActiveTab("completions")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "completions"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Completion Certificates ({certificates.completions.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="mt-6">
            {activeTab === "offers" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Offer Letters</h3>
                {certificates.offers.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">No offer letters found.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {certificates.offers.map((certificate, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{certificate.name}</h4>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(certificate.size)} • {formatDate(certificate.created)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadCertificate(certificate)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "completions" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Completion Certificates</h3>
                {certificates.completions.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">No completion certificates found.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {certificates.completions.map((certificate, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{certificate.name}</h4>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(certificate.size)} • {formatDate(certificate.created)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadCertificate(certificate)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificates;