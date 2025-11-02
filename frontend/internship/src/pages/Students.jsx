import React, { useEffect, useState } from "react";
import axios from "axios";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sendingOfferId, setSendingOfferId] = useState(null);
  const [sendingCompletionId, setSendingCompletionId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  // PDF Preview states
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [previewType, setPreviewType] = useState(""); // 'offer' or 'completion'
  const [previewStudentId, setPreviewStudentId] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Screenshot Preview Modal
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotStudent, setScreenshotStudent] = useState(null);
  const [screenshotLoading, setScreenshotLoading] = useState(true);
  const [screenshotError, setScreenshotError] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Filter states
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [stipendTypeFilter, setStipendTypeFilter] = useState("All");
  const [paymentModeFilter, setPaymentModeFilter] = useState("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");

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
  const [paymentMode, setPaymentMode] = useState("Online");
  const [razorpayTransactionId, setRazorpayTransactionId] = useState("");
  const [senderUpiId, setSenderUpiId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");

  // Department options
  const departmentOptions = [
    "Frontend Developer",
    "Fullstack Developer",
    "Python Fullstack Developer",
    "UI/UX Designer",
    "Digital Marketing",
    "Other",
  ];

  // Get token and admin info
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("No authentication token found. Please login again.", "error");
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const isSuperAdmin = admin.type === "SUPER_ADMIN";

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Fetch Students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await axios.get(
        "http://localhost:5000/api/students",
        headers
      );
      const sortedStudents = res.data.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (err) {
      console.error("Error fetching students:", err);
      showToast("Error fetching students", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Apply filters whenever filters or search term change
  useEffect(() => {
    let filtered = students;

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.id.toLowerCase().includes(searchLower) ||
          student.name.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower) ||
          (student.college &&
            student.college.toLowerCase().includes(searchLower)) ||
          (student.department &&
            student.department.toLowerCase().includes(searchLower))
      );
    }

    // Apply department filter
    if (departmentFilter !== "All") {
      filtered = filtered.filter(
        (student) => student.department === departmentFilter
      );
    }

    // Apply stipend type filter
    if (stipendTypeFilter !== "All") {
      filtered = filtered.filter(
        (student) => student.stipendType === stipendTypeFilter
      );
    }

    // Apply payment mode filter
    if (paymentModeFilter !== "All") {
      filtered = filtered.filter(
        (student) => student.paymentMode === paymentModeFilter
      );
    }

    // Apply payment status filter
    if (paymentStatusFilter !== "All") {
      if (paymentStatusFilter === "Approved") {
        filtered = filtered.filter(
          (student) =>
            student.paymentStatus === "Completed" || student.is_approved
        );
      } else if (paymentStatusFilter === "Pending") {
        filtered = filtered.filter(
          (student) =>
            (student.paymentStatus !== "Completed" && !student.is_approved) ||
            student.paymentStatus === "Pending"
        );
      } else if (paymentStatusFilter === "Rejected") {
        filtered = filtered.filter(
          (student) => student.paymentStatus === "Failed"
        );
      }
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    searchTerm,
    students,
    departmentFilter,
    stipendTypeFilter,
    paymentModeFilter,
    paymentStatusFilter,
  ]);

  // Reset all filters
  const resetFilters = () => {
    setDepartmentFilter("All");
    setStipendTypeFilter("All");
    setPaymentModeFilter("All");
    setPaymentStatusFilter("All");
    setSearchTerm("");
  };

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
    setPaymentMode("Online");
    setRazorpayTransactionId("");
    setSenderUpiId("");
    setPaymentScreenshot("");
    setEditingStudent(null);
  };

  // Add Student
  const addStudent = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const studentData = {
        name,
        email,
        phone,
        college,
        department,
        startDate,
        endDate,
        stipendType,
        stipendAmount: stipendType === "Paid" ? stipendAmount : null,
        paymentMode: stipendType === "Unpaid" ? paymentMode : null,
        razorpayTransactionId:
          stipendType === "Unpaid" && paymentMode === "Online"
            ? razorpayTransactionId
            : null,
        senderUpiId:
          stipendType === "Unpaid" && paymentMode === "Online"
            ? senderUpiId
            : null,
        paymentScreenshot:
          stipendType === "Unpaid" && paymentMode === "Online"
            ? paymentScreenshot
            : null,
        paymentStatus: "Pending",
      };

      await axios.post(
        "http://localhost:5000/api/students",
        studentData,
        headers
      );
      resetForm();
      setShowAddForm(false);
      fetchStudents();
      showToast("Student added successfully!");
    } catch (err) {
      console.error("Error adding student:", err);
      showToast(
        "Error adding student: " + (err.response?.data?.message || err.message),
        "error"
      );
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
    setPaymentMode(student.paymentMode || "Online");
    setRazorpayTransactionId(student.razorpayTransactionId || "");
    setSenderUpiId(student.senderUpiId || "");
    setPaymentScreenshot(student.paymentScreenshot || "");
    setShowAddForm(true);

    // Scroll to form
    setTimeout(() => {
      document.getElementById("student-form-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Update Student
  const updateStudent = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const studentData = {
        name,
        email,
        phone,
        college,
        department,
        startDate,
        endDate,
        stipendType,
        stipendAmount: stipendType === "Paid" ? stipendAmount : null,
        paymentMode: stipendType === "Unpaid" ? paymentMode : null,
        razorpayTransactionId:
          stipendType === "Unpaid" && paymentMode === "Online"
            ? razorpayTransactionId
            : null,
        senderUpiId:
          stipendType === "Unpaid" && paymentMode === "Online"
            ? senderUpiId
            : null,
        paymentScreenshot:
          stipendType === "Unpaid" && paymentMode === "Online"
            ? paymentScreenshot
            : null,
      };

      await axios.put(
        `http://localhost:5000/api/students/${editingStudent.id}`,
        studentData,
        headers
      );
      resetForm();
      setShowAddForm(false);
      fetchStudents();
      showToast("Student updated successfully!");
    } catch (err) {
      console.error("Error updating student:", err);
      showToast(
        "Error updating student: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
    setUpdating(false);
  };

  // Delete Student
  const deleteStudent = async (id) => {
    /*if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }*/

    setDeletingId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.delete(`http://localhost:5000/api/students/${id}`, headers);
      fetchStudents();
      showToast("Student deleted successfully!");
    } catch (err) {
      console.error("Error deleting student:", err);
      showToast(
        "Error deleting student: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
    setDeletingId(null);
  };

  // CORRECTED: Approve Student (Super Admin only) - Fixed logic
  const approveStudent = async (id) => {
    /*  if (!window.confirm("Are you sure you want to approve this student?")) {
      return;
    }*/

    setApprovingId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(
        `http://localhost:5000/api/students/${id}/approve`,
        {},
        headers
      );

      fetchStudents();
      showToast("Student approved successfully!");
    } catch (err) {
      console.error("Error approving student:", err);
      showToast(
        "Error approving student: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
    setApprovingId(null);
  };

  // CORRECTED: Reject Student (Super Admin only)
  const rejectStudent = async (id) => {
    /*if (!window.confirm("Are you sure you want to reject this student?")) {
      return;
    }*/

    setApprovingId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(
        `http://localhost:5000/api/students/${id}/reject`,
        {},
        headers
      );

      fetchStudents();
      showToast("Student rejected successfully!");
    } catch (err) {
      console.error("Error rejecting student:", err);
      showToast(
        "Error rejecting student: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
    setApprovingId(null);
  };

  // CORRECTED: Revoke Approval (Super Admin only)
  const revokeApproval = async (id) => {
    /*  if (!window.confirm("Are you sure you want to revoke approval for this student?")) {
      return;
    }*/

    setApprovingId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(
        `http://localhost:5000/api/students/${id}/revoke`,
        {},
        headers
      );

      fetchStudents();
      showToast("Student approval revoked successfully!");
    } catch (err) {
      console.error("Error revoking approval:", err);
      showToast(
        "Error revoking approval: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
    setApprovingId(null);
  };

  // Generate PDF Preview
  const generatePDFPreview = async (studentId, type) => {
    setGeneratingPreview(true);
    setPreviewStudentId(studentId);
    setPreviewType(type);

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const endpoint = "http://localhost:5000/api/admin/generate-preview";
      const payload = { studentId, type };

      const response = await axios.post(endpoint, payload, headers);

      if (response.data.success) {
        setPdfData(response.data.pdfData);
        setPdfFileName(response.data.fileName);
        setShowPDFPreview(true);
        showToast(response.data.message);
      }
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      showToast(
        "Error generating preview: " +
          (error.response?.data?.message || error.message),
        "error"
      );
    }
    setGeneratingPreview(false);
  };

  // Send Offer after preview
  const sendOffer = async (id) => {
    setSendingOfferId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(
        "http://localhost:5000/api/admin/send-offer",
        { studentId: id },
        headers
      );
      setShowPDFPreview(false);
      fetchStudents();
      showToast("Offer letter sent successfully!");
    } catch (error) {
      console.error("Error sending offer:", error);
      showToast(
        "Error sending offer: " +
          (error.response?.data?.message || error.message),
        "error"
      );
    }
    setSendingOfferId(null);
  };

  // Send Completion after preview
  const sendCompletion = async (id) => {
    setSendingCompletionId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(
        "http://localhost:5000/api/admin/send-completion",
        { studentId: id },
        headers
      );
      setShowPDFPreview(false);
      fetchStudents();
      showToast("Completion certificate sent successfully!");
    } catch (error) {
      console.error("Error sending completion:", error);
      showToast(
        "Error sending completion: " +
          (error.response?.data?.message || error.message),
        "error"
      );
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

  // FIXED: View Screenshot - No blinking
  const viewScreenshot = (student) => {
    setScreenshotLoading(true);
    setScreenshotError(false);
    console.log("From API =>", student);
    console.log("Screenshot URL =>", student.screenshotUrl);

    setScreenshotUrl(
  student.paymentScreenshot
    ? `http://localhost:5000/uploads/${student.paymentScreenshot}`
    : null
);


    setScreenshotStudent(student);
    setShowScreenshotModal(true);
  };

  // Handle screenshot image load
  const handleScreenshotLoad = () => {
    setScreenshotLoading(false);
    setScreenshotError(false);
  };

  // Handle screenshot image error
  const handleScreenshotError = () => {
    setScreenshotLoading(false);
    setScreenshotError(true);
  };

  // Close Screenshot Modal
  const closeScreenshotModal = () => {
    setShowScreenshotModal(false);
    setScreenshotUrl("");
    setScreenshotStudent(null);
    setScreenshotLoading(true);
    setScreenshotError(false);
  };

  // Calculate duration for display
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCancel = () => {
    resetForm();
    setShowAddForm(false);
  };

  // Check if user can send documents
  const canSendDocuments = (student) => {
    // Super Admin can always send documents
    if (isSuperAdmin) {
      return true;
    }

    // For regular users: Only allow if student is approved
    return student.paymentStatus === "Completed" || student.is_approved;
  };

  // CORRECTED: Get payment status badge - Fixed logic
  const getPaymentStatusBadge = (student) => {
    const status = student.paymentStatus || "Pending";
    const isApproved = student.is_approved;

    // If student is explicitly approved, show as Approved
    if (isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Approved
        </span>
      );
    }

    const statusConfig = {
      Pending: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Pending Approval",
      },
      Completed: { color: "bg-green-100 text-green-800", label: "Approved" },
      Failed: { color: "bg-red-100 text-red-800", label: "Rejected" },
      Refunded: { color: "bg-purple-100 text-purple-800", label: "Refunded" },
    };

    const config = statusConfig[status] || statusConfig.Pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // CORRECTED: Check if student needs approval (for Super Admin actions)
  const needsApproval = (student) => {
    return (
      (student.paymentStatus === "Pending" && !student.is_approved) ||
      student.paymentStatus === "Failed"
    );
  };

  // CORRECTED: Check if student is approved
  const isApproved = (student) => {
    return student.paymentStatus === "Completed" || student.is_approved;
  };

  // Get Stipend Details for display
  const getStipendDetails = (student) => {
    if (student.stipendType === "Paid") {
      return `₹${student.stipendAmount}`;
    } else {
      return `Unpaid (${student.paymentMode || "Online"})`;
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("Copied to clipboard!", "success");
      })
      .catch(() => {
        showToast("Failed to copy", "error");
      });
  };

  // Pagination Logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Next page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Previous page
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // PDF Preview Modal
  const PDFPreviewModal = () => {
    if (!showPDFPreview || !pdfData) return null;

    const student = students.find((s) => s.id === previewStudentId);
    const isOffer = previewType === "offer";
    const isCompletion = previewType === "completion";
    const canSend = canSendDocuments(student);

    const getModalTitle = () => {
      if (isOffer) return "Offer Letter Preview";
      if (isCompletion) return "Completion Certificate Preview";
      return "Document Preview";
    };

    const getSendButtonText = () => {
      if (isOffer)
        return sendingOfferId === previewStudentId
          ? "Sending..."
          : "Send Offer Letter";
      if (isCompletion)
        return sendingCompletionId === previewStudentId
          ? "Sending..."
          : "Send Completion Certificate";
      return "Send";
    };

    const handleSend = () => {
      if (isOffer) return sendOffer(previewStudentId);
      if (isCompletion) return sendCompletion(previewStudentId);
    };

    const isSending = () => {
      if (isOffer) return sendingOfferId === previewStudentId;
      if (isCompletion) return sendingCompletionId === previewStudentId;
      return false;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {getModalTitle()}
              </h2>
              <p className="text-gray-600">
                For: {student?.name} - {student?.department}
              </p>
              {!canSend && !isSuperAdmin && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Student not approved. Cannot send documents until approved
                  by Super Admin.
                </p>
              )}
              {isSuperAdmin && (
                <p className="text-sm text-blue-600 mt-1">
                  🔧 Super Admin Mode: Can send documents without approval
                </p>
              )}
            </div>
            <button
              onClick={closePDFPreview}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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
              onClick={handleSend}
              disabled={isSending() || (!canSend && !isSuperAdmin)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2"
            >
              {isSending() ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                getSendButtonText()
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // FIXED: Screenshot Preview Modal - No blinking
  const ScreenshotPreviewModal = () => {
    if (!showScreenshotModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Payment Screenshot
              </h2>
              <p className="text-gray-600">
                For: {screenshotStudent?.name} - {screenshotStudent?.department}
              </p>
              {screenshotStudent?.senderUpiId && (
                <p className="text-sm text-blue-600 mt-1">
                  Sender UPI: {screenshotStudent.senderUpiId}
                </p>
              )}
            </div>
            <button
              onClick={closeScreenshotModal}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* FIXED: Screenshot Viewer - No blinking */}
          <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-gray-100">
            {screenshotLoading && !screenshotError && (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600">Loading screenshot...</p>
              </div>
            )}

            {screenshotError && (
              <div className="flex flex-col items-center justify-center text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to Load Screenshot
                </h3>
                <p className="text-gray-500 mb-4">
                  The payment screenshot could not be loaded. This might be due
                  to an invalid URL or network issue.
                </p>
                <div className="text-sm text-gray-500 bg-gray-200 p-2 rounded">
                  <p>URL: {screenshotUrl?.substring(0, 100)}...</p>
                </div>
              </div>
            )}
            {!screenshotError && screenshotUrl && (
              <img
                src={screenshotUrl}
                alt="Payment Screenshot"
                className={`max-w-full max-h-full object-contain rounded-lg border border-gray-300 transition-opacity duration-300 ${
                  screenshotLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setScreenshotLoading(false)}
                onError={() => setScreenshotError(true)}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={closeScreenshotModal}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Close
            </button>
            {!screenshotError && screenshotUrl && (
              <a
                href={screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open in New Tab
              </a>
            )}
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

        {/* Screenshot Preview Modal */}
        <ScreenshotPreviewModal />

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Student Management
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage student records and communications
              </p>

              {/* Search Bar */}
              <div className="mt-4 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by ID, Name, Email, College..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddForm(!showAddForm);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 justify-center"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {showAddForm ? "Cancel" : "Add Student"}
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="All">All Departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Stipend Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stipend Type
              </label>
              <select
                value={stipendTypeFilter}
                onChange={(e) => setStipendTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="All">All Types</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode
              </label>
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="All">All Modes</option>
                <option value="Online">Online</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Status
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Total Students: {students.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Showing: {filteredStudents.length}</span>
              </div>
              {isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Super Admin Mode</span>
                </div>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Filters
            </button>
          </div>
        </div>

        {/* Add/Edit Student Form */}
        {showAddForm && (
          <div
            id="student-form-section"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingStudent
                ? `Edit Student - ${editingStudent.name} (ID: ${editingStudent.id})`
                : "Add New Student"}
            </h3>
            <form onSubmit={editingStudent ? updateStudent : addStudent}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {/* Basic Information Fields */}
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
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
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

                {/* PAID Stipend - Only Stipend Amount */}
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

                {/* UNPAID Stipend - Payment Mode and Conditional Fields */}
                {stipendType === "Unpaid" && (
                  <>
                    <div className="col-span-full md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Mode *
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      >
                        <option value="Online">Online</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>

                    {/* Online Payment Fields - Only show if payment mode is Online */}
                    
                  </>
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
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
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
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No students found" : "No students found"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Add a student to get started with management."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 mr-2"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Add Student
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        College & Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stipend Details & Approval Status
                      </th>
                      {isSuperAdmin && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Super Admin Actions
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            #{student.id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                            {student.phone && (
                              <div className="text-sm text-gray-500">
                                {student.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {student.college || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.department || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {student.startDate && student.endDate
                              ? calculateDuration(
                                  student.startDate,
                                  student.endDate
                                )
                              : "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.startDate && formatDate(student.startDate)}{" "}
                            - {student.endDate && formatDate(student.endDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            <div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  student.stipendType === "Paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {getStipendDetails(student)}
                              </span>
                            </div>

                            {/* Approval Status for both Paid and Unpaid */}
                            <div className="text-xs">
                              {getPaymentStatusBadge(student)}
                            </div>

                            {/* Enhanced Payment Details for Online Payments */}
                            {student.stipendType === "Unpaid" &&
                              student.paymentMode === "Online" && (
                                <div className="space-y-1">
                                  {student.razorpayTransactionId && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="text-gray-600 font-medium">
                                        Txn:
                                      </span>
                                      <span className="text-gray-500 font-mono">
                                        {student.razorpayTransactionId.substring(
                                          0,
                                          8
                                        )}
                                        ...
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            student.razorpayTransactionId
                                          )
                                        }
                                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                        title="Copy Transaction ID"
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  )}

                                  {student.senderUpiId && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="text-gray-600 font-medium">
                                        UPI:
                                      </span>
                                      <span className="text-gray-500 font-mono">
                                        {student.senderUpiId}
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(student.senderUpiId)
                                        }
                                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                        title="Copy UPI ID"
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  )}

                                  {student.paymentScreenshot && (
                                    <div>
                                      <button
                                        onClick={() => viewScreenshot(student)}
                                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                      >
                                        <svg
                                          className="w-3 h-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                          />
                                        </svg>
                                        View Screenshot
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Additional info for Cash Payments */}
                            {student.stipendType === "Unpaid" &&
                              student.paymentMode === "Cash" && (
                                <div className="text-xs text-gray-500">
                                  Payment: Cash
                                </div>
                              )}

                            {/* Additional info for Paid interns */}
                            {student.stipendType === "Paid" &&
                              student.stipendAmount && (
                                <div className="text-xs text-gray-500">
                                  Amount: ₹{student.stipendAmount}
                                </div>
                              )}
                          </div>
                        </td>

                        {/* CORRECTED: Super Admin Approval Column - Fixed logic */}
                        {isSuperAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {needsApproval(student) && (
                                <>
                                  <button
                                    onClick={() => approveStudent(student.id)}
                                    disabled={approvingId === student.id}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded font-medium transition-colors flex items-center gap-1"
                                  >
                                    {approvingId === student.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                    Approve
                                  </button>

                                  <button
                                    onClick={() => rejectStudent(student.id)}
                                    disabled={approvingId === student.id}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded font-medium transition-colors flex items-center gap-1"
                                  >
                                    {approvingId === student.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    )}
                                    Reject
                                  </button>
                                </>
                              )}

                              {isApproved(student) && (
                                <button
                                  onClick={() => revokeApproval(student.id)}
                                  disabled={approvingId === student.id}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 rounded font-medium transition-colors flex items-center gap-1"
                                >
                                  {approvingId === student.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                  ) : (
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m2 4.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2h1.5"
                                      />
                                    </svg>
                                  )}
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        )}

                        <td className="px-4 py-3">
                          <div className="flex gap-3 sm:gap-4">
                            {/* Offer Letter */}
                            <div className="text-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                                  student.offerSent
                                    ? "bg-green-100 text-green-600"
                                    : !canSendDocuments(student) &&
                                      !isSuperAdmin
                                    ? "bg-gray-100 text-gray-300"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {student.offerSent ? (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 mt-1">
                                Offer
                              </span>
                            </div>

                            {/* Completion Certificate */}
                            <div className="text-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                                  student.completionSent
                                    ? "bg-green-100 text-green-600"
                                    : !canSendDocuments(student) &&
                                      !isSuperAdmin
                                    ? "bg-gray-100 text-gray-300"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {student.completionSent ? (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 mt-1">
                                Completion
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  generatePDFPreview(student.id, "offer")
                                }
                                disabled={
                                  student.offerSent ||
                                  generatingPreview ||
                                  !student.college ||
                                  !student.department ||
                                  !student.startDate ||
                                  !student.endDate
                                }
                                className={`flex-1 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors ${
                                  student.offerSent
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                                }`}
                              >
                                {generatingPreview &&
                                previewStudentId === student.id &&
                                previewType === "offer" ? (
                                  <div className="flex items-center gap-1 justify-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                                    <span className="hidden sm:inline">
                                      Generating...
                                    </span>
                                  </div>
                                ) : student.offerSent ? (
                                  <div className="flex items-center gap-1 justify-center">
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="hidden sm:inline">
                                      Sent
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 justify-center">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    <span className="hidden sm:inline">
                                      Preview Offer
                                    </span>
                                  </div>
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  generatePDFPreview(student.id, "completion")
                                }
                                disabled={
                                  student.completionSent ||
                                  generatingPreview ||
                                  !student.college ||
                                  !student.department ||
                                  !student.startDate ||
                                  !student.endDate
                                }
                                className={`flex-1 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors ${
                                  student.completionSent
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                                }`}
                              >
                                {generatingPreview &&
                                previewStudentId === student.id &&
                                previewType === "completion" ? (
                                  <div className="flex items-center gap-1 justify-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent"></div>
                                    <span className="hidden sm:inline">
                                      Generating...
                                    </span>
                                  </div>
                                ) : student.completionSent ? (
                                  <div className="flex items-center gap-1 justify-center">
                                    <svg
                                      className="w-3 h-3"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="hidden sm:inline">
                                      Sent
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 justify-center">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="hidden sm:inline">
                                      Preview Completion
                                    </span>
                                  </div>
                                )}
                              </button>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => editStudent(student)}
                                className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1 justify-center"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
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
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {indexOfFirstStudent + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastStudent, filteredStudents.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredStudents.length}
                    </span>{" "}
                    results
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Previous Button */}
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((pageNumber, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          typeof pageNumber === "number" && paginate(pageNumber)
                        }
                        disabled={pageNumber === "..."}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pageNumber === currentPage
                            ? "bg-blue-600 text-white"
                            : pageNumber === "..."
                            ? "text-gray-500 cursor-default"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Students;
