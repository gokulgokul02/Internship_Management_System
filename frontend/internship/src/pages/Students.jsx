import React, { useEffect, useState } from "react";
import axios from "axios";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sendingOfferId, setSendingOfferId] = useState(null);
  const [sendingCompletionId, setSendingCompletionId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // PDF Preview states
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [previewType, setPreviewType] = useState(""); // 'offer' or 'completion'
  const [previewStudentId, setPreviewStudentId] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Student form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stipendType, setStipendType] = useState("Unpaid");
  const [stipendAmount, setStipendAmount] = useState("");

  // Department options
  const departmentOptions = [
    "Frontend Developer",
    "Fullstack Developer",
    "Python Fullstack Developer",
    "UI/UX Designer",
    "Digital Marketing",
    "Other"
  ];

  const token = localStorage.getItem("token");

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    } catch (err) {
      console.error("Error fetching students:", err);
      showToast("Error fetching students", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Reset form
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCollege("");
    setDepartment("");
    setStartDate("");
    setEndDate("");
    setStipendType("Unpaid");
    setStipendAmount("");
    setEditingStudent(null);
  };

  // Add Student
  const addStudent = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await axios.post(
        "http://localhost:5000/api/students",
        { 
          name, 
          email, 
          phone, 
          college,
          department,
          startDate,
          endDate,
          stipendType, 
          stipendAmount: stipendType === "Paid" ? stipendAmount : null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      resetForm();
      setShowAddForm(false);
      fetchStudents();
      showToast("Student added successfully!");
    } catch (err) {
      console.error("Error adding student:", err);
      showToast("Error adding student: " + (err.response?.data?.message || err.message), "error");
    }
    setAdding(false);
  };

  // Edit Student
  const editStudent = (student) => {
    setEditingStudent(student);
    setName(student.name);
    setEmail(student.email);
    setPhone(student.phone);
    setCollege(student.college);
    setDepartment(student.department);
    setStartDate(student.startDate);
    setEndDate(student.endDate);
    setStipendType(student.stipendType);
    setStipendAmount(student.stipendAmount || "");
    setShowAddForm(true);
  };

  // Update Student
  const updateStudent = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(
        `http://localhost:5000/api/students/${editingStudent.id}`,
        { 
          name, 
          email, 
          phone, 
          college,
          department,
          startDate,
          endDate,
          stipendType, 
          stipendAmount: stipendType === "Paid" ? stipendAmount : null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      resetForm();
      setShowAddForm(false);
      fetchStudents();
      showToast("Student updated successfully!");
    } catch (err) {
      console.error("Error updating student:", err);
      showToast("Error updating student: " + (err.response?.data?.message || err.message), "error");
    }
    setUpdating(false);
  };

  // Delete Student
  const deleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }
    
    setDeletingId(id);
    try {
      await axios.delete(
        `http://localhost:5000/api/students/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStudents();
      showToast("Student deleted successfully!");
    } catch (err) {
      console.error("Error deleting student:", err);
      showToast("Error deleting student: " + (err.response?.data?.message || err.message), "error");
    }
    setDeletingId(null);
  };

  // Generate PDF Preview
  const generatePDFPreview = async (studentId, type) => {
    setGeneratingPreview(true);
    setPreviewStudentId(studentId);
    setPreviewType(type);
    
    try {
      const response = await axios.post(
        `http://localhost:5000/api/admin/generate-preview`,
        { studentId, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPdfData(response.data.pdfData);
        setPdfFileName(response.data.fileName);
        setShowPDFPreview(true);
        showToast(response.data.message);
      }
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      showToast("Error generating preview: " + (error.response?.data?.message || error.message), "error");
    }
    setGeneratingPreview(false);
  };

  // Send Offer after preview
  const sendOffer = async (id) => {
    setSendingOfferId(id);
    try {
      await axios.post(
        `http://localhost:5000/api/admin/send-offer`,
        { studentId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPDFPreview(false);
      fetchStudents();
      showToast("Offer letter sent successfully!");
    } catch (error) {
      console.error("Error sending offer:", error);
      showToast("Error sending offer: " + (error.response?.data?.message || error.message), "error");
    }
    setSendingOfferId(null);
  };

  // Send Completion after preview
  const sendCompletion = async (id) => {
    setSendingCompletionId(id);
    try {
      await axios.post(
        `http://localhost:5000/api/admin/send-completion`,
        { studentId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPDFPreview(false);
      fetchStudents();
      showToast("Completion certificate sent successfully!");
    } catch (error) {
      console.error("Error sending completion:", error);
      showToast("Error sending completion: " + (error.response?.data?.message || error.message), "error");
    }
    setSendingCompletionId(null);
  };

  // Close PDF Preview
  const closePDFPreview = () => {
    setShowPDFPreview(false);
    setPdfData(null);
    setPdfFileName("");
    setPreviewType("");
    setPreviewStudentId(null);
  };

  // Calculate duration for display
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCancel = () => {
    resetForm();
    setShowAddForm(false);
  };

  // Toast Component
  const Toast = () => {
    if (!toast.show) return null;

    return (
      <div className="fixed top-4 right-4 z-50 animate-fade-in">
        <div className={`flex items-center p-4 rounded-lg shadow-lg border ${
          toast.type === "error" 
            ? "bg-red-50 border-red-200 text-red-800" 
            : "bg-green-50 border-green-200 text-green-800"
        }`}>
          <div className={`w-4 h-4 rounded-full mr-3 ${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          }`}></div>
          <span className="font-medium">{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // PDF Preview Modal
  const PDFPreviewModal = () => {
    if (!showPDFPreview || !pdfData) return null;

    const student = students.find(s => s.id === previewStudentId);
    const isOffer = previewType === 'offer';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {isOffer ? 'Offer Letter Preview' : 'Completion Letter Preview'}
              </h2>
              <p className="text-gray-600">
                For: {student?.name} - {student?.department}
              </p>
            </div>
            <button
              onClick={closePDFPreview}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 p-6 overflow-auto">
            <iframe
              src={`data:application/pdf;base64,${pdfData}`}
              className="w-full h-96 border border-gray-300 rounded-lg"
              title="PDF Preview"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={closePDFPreview}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => isOffer ? sendOffer(previewStudentId) : sendCompletion(previewStudentId)}
              disabled={isOffer ? sendingOfferId === previewStudentId : sendingCompletionId === previewStudentId}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2"
            >
              {isOffer ? 
                (sendingOfferId === previewStudentId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : "Send Offer Letter")
              : 
                (sendingCompletionId === previewStudentId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : "Send Completion Letter")
              }
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        <Toast />

        {/* PDF Preview Modal */}
        <PDFPreviewModal />

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Student Management</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage student records and communications</p>
            </div>
            <button 
              onClick={() => {
                resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showAddForm ? "Cancel" : "Add Student"}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Total Students: {students.length}</span>
            </div>
          </div>
        </div>

        {/* Add/Edit Student Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingStudent ? "Edit Student" : "Add New Student"}
            </h3>
            <form onSubmit={editingStudent ? updateStudent : addStudent}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="col-span-full md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Student Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                
                <div className="col-span-full md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email ID *
                  </label>
                  <input 
                    type="email" 
                    placeholder="Email ID" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                
                <div className="col-span-full md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input 
                    type="text" 
                    placeholder="Phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                
                <div className="col-span-full md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College *
                  </label>
                  <input 
                    type="text" 
                    placeholder="College Name" 
                    value={college} 
                    onChange={(e) => setCollege(e.target.value)} 
                    required 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                
                <div className="col-span-full md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-full md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    required 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                
                <div className="col-span-full md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    required 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                
                <div className="col-span-full md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stipend Type *
                  </label>
                  <select 
                    value={stipendType} 
                    onChange={(e) => setStipendType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                
                {stipendType === "Paid" && (
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stipend Amount *
                    </label>
                    <input 
                      type="number" 
                      placeholder="Stipend Amount" 
                      value={stipendAmount} 
                      onChange={(e) => setStipendAmount(e.target.value)} 
                      required 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="submit" 
                  disabled={adding || updating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 justify-center"
                >
                  {adding || updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {adding && "Adding..."}
                      {updating && "Updating..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingStudent ? "Update Student" : "Add Student"}
                    </>
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Students Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500 mb-4">Add a student to get started with management.</p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Add Your First Student
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College & Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stipend</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                          {student.phone && <div className="text-sm text-gray-500">{student.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{student.college || "N/A"}</div>
                        <div className="text-sm text-gray-500">{student.department || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {student.startDate && student.endDate ? calculateDuration(student.startDate, student.endDate) : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.startDate && formatDate(student.startDate)} - {student.endDate && formatDate(student.endDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.stipendType === "Paid" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {student.stipendType === "Paid" ? `₹${student.stipendAmount}` : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="text-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                              student.offerSent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {student.offerSent ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 mt-1">Offer</span>
                          </div>
                          <div className="text-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                              student.completionSent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {student.completionSent ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 mt-1">Completion</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => generatePDFPreview(student.id, 'offer')}
                              disabled={student.offerSent || generatingPreview || !student.college || !student.department || !student.startDate || !student.endDate}
                              className={`flex-1 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors ${
                                student.offerSent 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400'
                              }`}
                            >
                              {generatingPreview && previewStudentId === student.id && previewType === 'offer' ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                                  <span className="hidden sm:inline">Generating...</span>
                                </div>
                              ) : student.offerSent ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="hidden sm:inline">Sent</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 justify-center">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="hidden sm:inline">Preview Offer</span>
                                </div>
                              )}
                            </button>

                            <button
                              onClick={() => generatePDFPreview(student.id, 'completion')}
                              disabled={student.completionSent || generatingPreview || !student.college || !student.department || !student.startDate || !student.endDate}
                              className={`flex-1 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors ${
                                student.completionSent 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400'
                              }`}
                            >
                              {generatingPreview && previewStudentId === student.id && previewType === 'completion' ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent"></div>
                                  <span className="hidden sm:inline">Generating...</span>
                                </div>
                              ) : student.completionSent ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="hidden sm:inline">Sent</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 justify-center">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="hidden sm:inline">Preview Completion</span>
                                </div>
                              )}
                            </button>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => editStudent(student)}
                              className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1 justify-center"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => deleteStudent(student.id)}
                              disabled={deletingId === student.id}
                              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 disabled:bg-gray-100 disabled:text-gray-400 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1 justify-center"
                            >
                              {deletingId === student.id ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent"></div>
                                </div>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Delete</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;