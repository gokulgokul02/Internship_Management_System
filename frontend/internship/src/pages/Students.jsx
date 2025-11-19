import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";

// Separate Form Component to prevent re-renders
const StudentForm = React.memo(
  ({
    showAddForm,
    editingStudent,
    formData,
    onInputChange,
    onCancel,
    onSubmit,
    adding,
    updating,
    departmentOptions,
    durationOptions,
    onTotalAmountChange,
    showAmountEdit,
    setShowAmountEdit,
    changeReason,
    setChangeReason,
    processingAmountChange,
    onConfirmAmountChange,
  }) => {
    if (!showAddForm) return null;

    const handleInputChange = (field, value) => {
      onInputChange(field, value);
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(e);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">
              {editingStudent
                ? `Edit Student - ${editingStudent.name}`
                : "Add New Student"}
            </h2>
            <button
              onClick={onCancel}
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

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              {/* Basic Information Fields */}
              <div className="col-span-full md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  placeholder="Student Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
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
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
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
                  value={formData.college}
                  onChange={(e) => handleInputChange("college", e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div className="col-span-full md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
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
                  Internship Type *
                </label>
                <select
                  value={formData.internshipType}
                  onChange={(e) =>
                    handleInputChange("internshipType", e.target.value)
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="col-span-full md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Months) *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
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
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  required
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Payment Information for Unpaid Internships */}
              {formData.internshipType === "unpaid" && (
                <>
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={formData.totalAmount || ""}
                          onChange={(e) =>
                            handleInputChange("totalAmount", e.target.value)
                          }
                          placeholder="Enter total amount"
                          disabled={!showAmountEdit && editingStudent}
                          className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                            !showAmountEdit && editingStudent
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                        />
                        {editingStudent && (
                          <button
                            type="button"
                            onClick={() => setShowAmountEdit(!showAmountEdit)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-1"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            {showAmountEdit ? "Cancel" : "Edit"}
                          </button>
                        )}
                      </div>
                      
                      {showAmountEdit && editingStudent && (
                        <div className="space-y-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div>
                            <label className="block text-sm font-medium text-yellow-700 mb-1">
                              Reason for Amount Change *
                            </label>
                            <textarea
                              value={changeReason}
                              onChange={(e) => setChangeReason(e.target.value)}
                              placeholder="Explain why you are changing the total amount..."
                              rows="2"
                              className="w-full border border-yellow-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-colors"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={onConfirmAmountChange}
                            disabled={!changeReason || processingAmountChange}
                            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            {processingAmountChange ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Updating...
                              </>
                            ) : (
                              "Update Amount"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Calculated automatically (₹5000/month) or enter manually
                    </p>
                  </div>

                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Advance Amount
                    </label>
                    <input
                      type="number"
                      placeholder="Advance Amount"
                      value={formData.advanceAmount}
                      onChange={(e) =>
                        handleInputChange("advanceAmount", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remaining Amount
                    </label>
                    <input
                      type="text"
                      value={`₹${formData.remainingAmount || "0"}`}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Mode *
                    </label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) =>
                        handleInputChange("paymentMode", e.target.value)
                      }
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    >
                      <option value="Online">Online</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  
                </>
              )}

              {/* Paid Internship Fields */}
              {formData.internshipType === "paid" && (
                <>
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stipend Amount *
                    </label>
                    <input
                      type="number"
                      placeholder="Stipend Amount"
                      value={formData.stipendAmount}
                      onChange={(e) =>
                        handleInputChange("stipendAmount", e.target.value)
                      }
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
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
                onClick={onCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

// Payment Modal Component
const PaymentModal = ({
  showPaymentModal,
  paymentStudent,
  paymentAmount,
  setPaymentAmount,
  paymentReason,
  setPaymentReason,
  processingPayment,
  processPayment,
  closePaymentModal,
  downloadBill,
  generateBillPreview,
  paymentHistory,
  loadingPaymentHistory,
  paymentHistoryTab,
  setPaymentHistoryTab,
  sendReceipt,
  setSendReceipt,
  previewPayment,
  sendPaymentInvoice,
}) => {
  if (!showPaymentModal || !paymentStudent) return null;

  const remaining = Number(paymentStudent.remainingAmount) || 0;
  const paidAmount = (paymentStudent.totalAmount || 0) - remaining;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
    
    {/* Header */}
    <div className="flex justify-between items-center p-6 border-b border-gray-200">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Payment Management</h2>
        <p className="text-gray-600">
          For: {paymentStudent.name} - {paymentStudent.department}
        </p>
        <p className="text-sm text-gray-500">Remaining Amount: ₹{remaining}</p>
      </div>

      <button
        onClick={closePaymentModal}
        className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    {/* Content */}
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT - Payment */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Process Payment</h3>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                min="0"
                max={remaining}
              />
              <p className="text-xs text-gray-500 mt-1">Maximum: ₹{remaining}</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendReceipt"
                checked={sendReceipt}
                onChange={(e) => setSendReceipt(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              />
              <label htmlFor="sendReceipt" className="text-sm text-gray-700 cursor-pointer">
                Send receipt email after payment
              </label>
            </div>

            <button
              onClick={processPayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || processingPayment}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : "Process Payment"}
            </button>
          </div>
        </div>

        {/* RIGHT - Bill */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bill Management</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate and manage bills for this student.
            </p>

            <button
              onClick={() => {
                generateBillPreview(paymentStudent.id);
                closePaymentModal();
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              Preview Bill
            </button>

            <button
              onClick={() => downloadBill(paymentStudent)}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              Download Bill
            </button>

            <button
              onClick={() => setPaymentHistoryTab(true)}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
            >
              View Payment History
            </button>
          </div>
        </div>

      </div>

      {/* Payment History */}
      {paymentHistoryTab && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3 px-4">Payment History</h3>

          <div 
            className="payment-history-scroll max-h-[50vh] overflow-y-auto px-4"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#3b82f6 #e5e7eb" }}
          >
            
            {loadingPaymentHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading payment history...</span>
              </div>
            ) : paymentHistory && paymentHistory.length > 0 ? (

              <div className="space-y-3 pb-2">
                {paymentHistory.map((p, index) => (
                  <div key={p.id}
                    className="payment-item flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 hover:border-blue-300"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="font-bold text-lg text-gray-900">
                          ₹{Number(p.amount).toFixed(2)}
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 mt-1 ml-8">
                        {new Date(p.createdAt).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => previewPayment && previewPayment(p.id)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                      >
                        Preview
                      </button>

                      
                    </div>
                  </div>
                ))}
              </div>

            ) : (
              <div className="flex flex-col items-center py-8 text-gray-500">
                No payment history available.
              </div>
            )}

          </div>
        </div>
      )}

      {/* Summary */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              ₹{paymentStudent.totalAmount || 0}
            </div>
            <div className="text-gray-600">Total Amount</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">₹{paidAmount}</div>
            <div className="text-green-600">Paid Amount</div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">₹{remaining}</div>
            <div className="text-blue-600">Remaining</div>
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
      <button
        onClick={closePaymentModal}
        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
      >
        Close
      </button>
    </div>

  </div>
</div>

  );
};

// Main Students Component
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
  const [sendingBillId, setSendingBillId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  // PDF Preview states
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [previewType, setPreviewType] = useState("");
  const [previewStudentId, setPreviewStudentId] = useState(null);
  const [previewPaymentId, setPreviewPaymentId] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [sendingPaymentId, setSendingPaymentId] = useState(null);

  // Screenshot Preview Modal
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotStudent, setScreenshotStudent] = useState(null);
  const [screenshotLoading, setScreenshotLoading] = useState(true);
  const [screenshotError, setScreenshotError] = useState(false);

  // Payment Details Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentReason, setPaymentReason] = useState("");
  const [sendReceipt, setSendReceipt] = useState(false);
  
  // Payment History in Modal
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [paymentHistoryTab, setPaymentHistoryTab] = useState(false);

  // Listen for newly registered students (live add) and clear notifications on visit
  useEffect(() => {
    const handleNewStudent = (e) => {
      try {
        const newStudent = e?.detail;
        if (!newStudent) return;
        setStudents((prev) => [newStudent, ...(prev || [])]);
        setFilteredStudents((prev) => [newStudent, ...(prev || [])]);
        showToast("New student added", "success");
      } catch (err) {
        console.error('Error handling student:registered event', err);
      }
    };

    window.addEventListener('student:registered', handleNewStudent);

    // When Students page mounts, notify Layout to clear notifications
    window.dispatchEvent(new Event('students:visited'));

    return () => {
      window.removeEventListener('student:registered', handleNewStudent);
    };
  }, []);

  // Form Type Modal
  const [showFormTypeModal, setShowFormTypeModal] = useState(false);

  // Internship Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusStudent, setStatusStudent] = useState(null);
  const [internshipStatus, setInternshipStatus] = useState("Active");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Amount Edit in Form
  const [showAmountEdit, setShowAmountEdit] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [processingAmountChange, setProcessingAmountChange] = useState(false);

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
  const [internshipStatusFilter, setInternshipStatusFilter] = useState("Active");

  // Form state with proper handling
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    department: "",
    internshipType: "unpaid",
    duration: "1",
    startDate: "",
    endDate: "",
    stipendType: "Unpaid",
    stipendAmount: "",
    paymentMode: "Online",
    totalAmount: "",
    advanceAmount: "",
    remainingAmount: "",
    paymentScreenshot: "",
  });

  // Department options
  const departmentOptions = [
    "Frontend Developer",
    "Fullstack Developer",
    "Python Fullstack Developer",
    "UI/UX Designer",
    "Digital Marketing",
    "Other",
  ];

  // Duration options
  const durationOptions = [
    { value: "1", label: "1 Month" },
    { value: "2", label: "2 Months" },
    { value: "3", label: "3 Months" },
    { value: "4", label: "4 Months" },
    { value: "5", label: "5 Months" },
    { value: "6", label: "6 Months" },
  ];

  // Internship Status options
  const internshipStatusOptions = ["Active", "Completed", "Discontinued"];

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
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  }, []);

  // ✅ FIXED: Enhanced fetchStudents with cache busting and proper data processing
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Add cache busting parameter to prevent cached responses
      const url = `http://localhost:5000/api/students?t=${Date.now()}`;

      const res = await axios.get(url, headers);

      console.log("🔄 Fetched students from server:", res.data);

      // Sort by updatedAt to show latest first
      const sortedStudents = res.data.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      );
      
      // Ensure proper boolean values for is_approved
      const processedStudents = sortedStudents.map(student => ({
        ...student,
        is_approved: Boolean(student.isApproved), // Force boolean conversion
        offerSent: Boolean(student.offerSent),
        completionSent: Boolean(student.completionSent)
      }));

      console.log("✅ Processed students with proper booleans:", processedStudents);

      setStudents(processedStudents);
      setFilteredStudents(processedStudents);
    } catch (err) {
      console.error("❌ Error fetching students:", err);
      showToast("Error fetching students", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Calculate end date based on start date and duration
  useEffect(() => {
    if (formData.startDate && formData.duration) {
      const start = new Date(formData.startDate);
      const end = new Date(start);
      end.setMonth(start.getMonth() + parseInt(formData.duration));
      setFormData((prev) => ({
        ...prev,
        endDate: end.toISOString().split("T")[0],
      }));
    }
  }, [formData.startDate, formData.duration]);

  // Auto-calculate total amount for new unpaid internships
  useEffect(() => {
    if (!editingStudent && formData.duration && formData.internshipType === "unpaid") {
      const months = parseInt(formData.duration);
      const calculatedTotal = months * 5000;

      setFormData((prev) => {
        const advance = prev.advanceAmount ? parseFloat(prev.advanceAmount) : 0;
        const remaining = calculatedTotal - advance;

        return {
          ...prev,
          totalAmount: calculatedTotal.toString(),
          remainingAmount: remaining >= 0 ? remaining.toString() : "0",
        };
      });
    }
  }, [formData.duration, formData.advanceAmount, editingStudent, formData.internshipType]);

  // Update remaining amount when advance amount or total amount changes
  useEffect(() => {
    if (formData.totalAmount) {
      const total = parseFloat(formData.totalAmount);
      const advance = formData.advanceAmount ? parseFloat(formData.advanceAmount) : 0;
      const remaining = total - advance;

      setFormData((prev) => ({
        ...prev,
        remainingAmount: remaining >= 0 ? remaining.toString() : "0",
      }));
    }
  }, [formData.advanceAmount, formData.totalAmount]);

  // Form input handler
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle total amount change in form
  const confirmAmountChange = async () => {
    if (!editingStudent) {
      showToast("No student selected!", "error");
      return;
    }

    if (!changeReason) {
      showToast("Please enter a reason for the amount change", "error");
      return;
    }

    setProcessingAmountChange(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const updateData = {
        totalAmount: parseFloat(formData.totalAmount),
        remainingAmount:
          parseFloat(formData.totalAmount) - (parseFloat(formData.advanceAmount) || 0),
      };

      await axios.put(
        `http://localhost:5000/api/students/${editingStudent.id}`,
        updateData,
        headers
      );

      setShowAmountEdit(false);
      setChangeReason("");
      showToast("Total amount updated successfully!");

      fetchStudents();
    } catch (error) {
      console.error("Error updating amount:", error);
      showToast("Failed to update amount!", "error");
    }
    setProcessingAmountChange(false);
  };

  // Update Form Type Function
  const updateFormType = async (type) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.put(
        "http://localhost:5000/api/internship-type/1",
        { FormType: type },
        headers
      );

      showToast(`Form type updated to ${type}`);
    } catch (error) {
      console.error("Update failed:", error);
      showToast("Failed to update form type!", "error");
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard
      .writeText("http://localhost:5173/student_register")
      .then(() => {
        showToast("Copied to clipboard!");
        setShowFormTypeModal(false);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        showToast("Failed to copy!", "error");
      });
  };

  // Update Internship Status
  const updateInternshipStatus = async () => {
    if (!statusStudent) return;

    setUpdatingStatus(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.put(
        `http://localhost:5000/api/students/${statusStudent.id}/status`,
        { internshipStatus },
        headers
      );

      setShowStatusModal(false);
      await fetchStudents();
      showToast(`Internship status updated to ${internshipStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update internship status!", "error");
    }
    setUpdatingStatus(false);
  };

  // Apply filters
  useEffect(() => {
    let filtered = students;

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

    if (departmentFilter !== "All") {
      filtered = filtered.filter(
        (student) => student.department === departmentFilter
      );
    }

    if (stipendTypeFilter !== "All") {
      filtered = filtered.filter(
        (student) => student.stipendType === stipendTypeFilter
      );
    }

    if (paymentModeFilter !== "All") {
      filtered = filtered.filter(
        (student) => student.paymentMode === paymentModeFilter
      );
    }

    if (paymentStatusFilter !== "All") {
      if (paymentStatusFilter === "Approved") {
        filtered = filtered.filter((student) => student.isApproved === true);
      } else if (paymentStatusFilter === "Pending") {
        filtered = filtered.filter(
          (student) =>
            student.isApproved !== true && student.paymentStatus !== "Failed"
        );
      } else if (paymentStatusFilter === "Rejected") {
        filtered = filtered.filter(
          (student) => student.paymentStatus === "Failed"
        );
      }
    }

    if (internshipStatusFilter !== "All") {
      filtered = filtered.filter(
        (student) => student.internshipStatus === internshipStatusFilter
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [
    searchTerm,
    students,
    departmentFilter,
    stipendTypeFilter,
    paymentModeFilter,
    paymentStatusFilter,
    internshipStatusFilter,
  ]);

  // Reset all filters
  const resetFilters = () => {
    setDepartmentFilter("All");
    setStipendTypeFilter("All");
    setPaymentModeFilter("All");
    setPaymentStatusFilter("All");
    setInternshipStatusFilter("Active");
    setSearchTerm("");
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      college: "",
      department: "",
      internshipType: "unpaid",
      duration: "1",
      startDate: "",
      endDate: "",
      stipendType: "Unpaid",
      stipendAmount: "",
      paymentMode: "Online",
      totalAmount: "",
      advanceAmount: "",
      remainingAmount: "",
      paymentScreenshot: "",
    });
    setEditingStudent(null);
    setShowAmountEdit(false);
    setChangeReason("");
  };

  // Edit Student
  const editStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      college: student.college || "",
      department: student.department || "",
      internshipType: student.internshipType || "unpaid",
      duration: student.duration?.toString() || "1",
      startDate: student.startDate || "",
      endDate: student.endDate || "",
      stipendType: student.stipendType || "Unpaid",
      stipendAmount: student.stipendAmount?.toString() || "",
      paymentMode: student.paymentMode || "Online",
      totalAmount: student.totalAmount?.toString() || "",
      advanceAmount: student.advanceAmount?.toString() || "",
      remainingAmount: student.remainingAmount?.toString() || "",
      paymentScreenshot: student.paymentScreenshot || "",
    });
    setShowAmountEdit(false);
    setChangeReason("");
    setShowAddForm(true);
  };

  // Add Student
  const addStudent = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const studentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        department: formData.department,
        internshipType: formData.internshipType,
        duration: parseInt(formData.duration),
        startDate: formData.startDate,
        endDate: formData.endDate,
        stipendType: formData.stipendType,
        stipendAmount:
          formData.stipendType === "Paid"
            ? parseFloat(formData.stipendAmount)
            : null,
        paymentMode:
          formData.stipendType === "Unpaid" ? formData.paymentMode : null,
        totalAmount: formData.totalAmount
          ? parseFloat(formData.totalAmount)
          : null,
        advanceAmount: formData.advanceAmount
          ? parseFloat(formData.advanceAmount)
          : null,
        remainingAmount: formData.remainingAmount
          ? parseFloat(formData.remainingAmount)
          : null,
        paymentScreenshot: formData.paymentScreenshot || null,
        paymentStatus: "Pending",
        is_approved: false,
        internshipStatus: "Active",
      };

      await axios.post(
        "http://localhost:5000/api/students",
        studentData,
        headers
      );

      resetForm();
      setShowAddForm(false);
      await fetchStudents();
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

  // Update Student
  const updateStudent = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const studentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        college: formData.college,
        department: formData.department,
        internshipType: formData.internshipType,
        duration: parseInt(formData.duration),
        startDate: formData.startDate,
        endDate: formData.endDate,
        stipendType: formData.stipendType,
        stipendAmount:
          formData.stipendType === "Paid"
            ? parseFloat(formData.stipendAmount)
            : null,
        paymentMode:
          formData.stipendType === "Unpaid" ? formData.paymentMode : null,
        totalAmount: formData.totalAmount
          ? parseFloat(formData.totalAmount)
          : null,
        advanceAmount: formData.advanceAmount
          ? parseFloat(formData.advanceAmount)
          : null,
        remainingAmount: formData.remainingAmount
          ? parseFloat(formData.remainingAmount)
          : null,
        paymentScreenshot: formData.paymentScreenshot || null,
        is_approved: editingStudent?.is_approved || false,
        internshipStatus: editingStudent?.internshipStatus || "Active",
      };

      await axios.put(
        `http://localhost:5000/api/students/${editingStudent.id}`,
        studentData,
        headers
      );

      resetForm();
      setShowAddForm(false);
      await fetchStudents();
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
    

    setDeletingId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.delete(`http://localhost:5000/api/students/${id}`, headers);
      await fetchStudents();
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

  // ✅ FIXED: Approve Student with proper state management and forced refresh
  const approveStudent = async (id) => {
  // Ask for confirmation first
  if (!window.confirm("Are you sure you want to approve this student?")) return;

  setApprovingId(id); // show loader or disable button for this student

  try {
    const headers = getAuthHeaders();
    if (!headers) return;

    console.log("🔄 Approving student:", id);

    // Send approval request
    const response = await axios.put(
      `http://localhost:5000/api/students/${id}/approve`,
      {},
      headers
    );

    console.log("✅ Approve response:", response.data);

    if (response.data.success) {
      showToast("Student approved successfully!", "success");

      // ✅ Re-fetch updated student list to ensure latest data (especially for approval flag)
      await fetchStudents();
    } else {
      showToast("Failed to approve student.", "error");
    }
  } catch (error) {
    console.error("❌ Error approving student:", error);
    console.error("Error details:", error.response?.data);

    showToast(
      "Error approving student: " +
        (error.response?.data?.message || error.message),
      "error"
    );

    // Optional: refresh anyway, to reload accurate data from backend
    await fetchStudents();
  } finally {
    // ✅ Always clear loading state
    setApprovingId(null);
  }
};

  // ✅ FIXED: Reject Student with proper state management and forced refresh
  const rejectStudent = async (id) => {
    if (!window.confirm("Are you sure you want to reject this student?")) {
      return;
    }

    setApprovingId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      console.log("🔄 Rejecting student:", id);

      const response = await axios.put(
        `http://localhost:5000/api/students/${id}/reject`,
        {},
        headers
      );

      console.log("✅ Reject response:", response.data);

      if (response.data.success) {
        showToast("Student rejected successfully!");
        
        // Force immediate refresh from server to ensure data consistency
        await fetchStudents();
      }
    } catch (err) {
      console.error("❌ Error rejecting student:", err);
      console.error("Error details:", err.response?.data);
      showToast(
        "Error rejecting student: " +
          (err.response?.data?.message || err.message),
        "error"
      );
      // Force refresh on error
      await fetchStudents();
    }
    setApprovingId(null);
  };

  // Process Payment
   const processPayment = async () => {
     if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
       showToast("Please enter a valid payment amount", "error");
       return;
     }

     const remaining = Number(paymentStudent.remainingAmount) || 0;
     const paymentAmountNum = parseFloat(paymentAmount);
     
     if (paymentAmountNum > remaining) {
       showToast(`Payment amount cannot exceed remaining amount of ₹${remaining}`, "error");
       return;
     }

     setProcessingPayment(true);
     try {
       const headers = getAuthHeaders();
       if (!headers) return;

       const paymentData = {
         amount: paymentAmountNum,
         paymentDate: new Date().toISOString(),
         reason: paymentReason || null,
       };

       const res = await axios.post(
         `http://localhost:5000/api/students/${paymentStudent.id}/payment`,
         paymentData,
         headers
       );

       // ✅ Immediately update local state with new remaining amount
       const newRemaining = remaining - paymentAmountNum;
       setPaymentStudent(prev => ({
         ...prev,
         remainingAmount: newRemaining,
         advanceAmount: (parseFloat(prev.advanceAmount) || 0) + paymentAmountNum
       }));

       // Refresh students list
       await fetchStudents();

       // Refresh payment history for this student so new payment appears immediately
       setLoadingPaymentHistory(true);
       try {
         const hres = await axios.get(
           `http://localhost:5000/api/payments/student/${paymentStudent.id}`,
           headers
         );
         if (hres.data.success) {
           setPaymentHistory(hres.data.history || []);
           setPaymentHistoryTab(true);
         }
       } catch (herr) {
         console.error('Error fetching payment history after payment:', herr);
       }
       setLoadingPaymentHistory(false);

       // ✅ Dispatch payment event for notifications
       try {
         const paymentEvent = new CustomEvent('payment:processed', {
           detail: {
             studentId: paymentStudent.id,
             studentName: paymentStudent.name,
             amount: paymentAmountNum,
             remainingAmount: newRemaining,
             timestamp: new Date().toISOString()
           }
         });
         window.dispatchEvent(paymentEvent);
         console.log('✅ Payment event dispatched:', paymentEvent.detail);
       } catch (eventErr) {
         console.error('Error dispatching payment event:', eventErr);
       }

       // Send receipt email if requested
       if (sendReceipt && res.data.paymentId) {
         try {
           await axios.post(
             `http://localhost:5000/api/payments/send/${res.data.paymentId}`,
             {},
             headers
           );
           showToast("Payment recorded and receipt sent successfully!");
         } catch (sendErr) {
           console.error('Error sending receipt:', sendErr);
           showToast(res.data?.message || "Payment processed. Receipt send failed, but payment recorded.", "warning");
         }
       } else {
         showToast(res.data?.message || "Payment processed successfully!");
       }

       // clear inputs but keep modal open so admin can see history
       setPaymentAmount("");
       setPaymentReason("");
       setSendReceipt(false);
     } catch (err) {
       console.error("Error processing payment:", err);
       showToast(
         "Error processing payment: " +
           (err.response?.data?.message || err.message),
         "error"
       );
     }
     setProcessingPayment(false);
   };
  const viewPaymentDetails = async (student) => {
    setPaymentStudent(student);
    setPaymentAmount("");
    setPaymentReason("");
    setShowPaymentModal(true);
    setPaymentHistoryTab(false);
    
    // Load payment history
    setLoadingPaymentHistory(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(
        `http://localhost:5000/api/payments/student/${student.id}`,
        headers
      );

      if (response.data.success) {
        setPaymentHistory(response.data.history || []);
        // show history tab automatically
        setPaymentHistoryTab(true);
      } else {
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setPaymentHistory([]);
    }
    setLoadingPaymentHistory(false);
  };
  // Generate Bill Preview
  const generateBillPreview = async (studentId) => {
    setGeneratingPreview(true);
    setPreviewStudentId(studentId);
    setPreviewType("bill");

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(
        `http://localhost:5000/api/admin/${studentId}/generate-bill-preview`,
        { headers }
      );

      if (response.data.success) {
        setPdfData(response.data.billPreview);
        setShowPDFPreview(true);
        showToast("Bill preview generated successfully!");
      }
    } catch (error) {
      console.error("Error generating bill preview:", error);
      showToast(
        "Error generating bill preview: " +
          (error.response?.data?.message || error.message),
        "error"
      );
    }
    setGeneratingPreview(false);
  };

  // Preview a payment invoice (fetch blob and convert to base64 for preview)
  const previewPayment = async (paymentId) => {
    setGeneratingPreview(true);
    setPreviewPaymentId(paymentId);
    setPreviewType('payment');
    viewPaymentDetails(false)
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get(`http://localhost:5000/api/payments/download/${paymentId}`, { ...headers, responseType: 'blob' });
      const blob = res.data;
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64data = reader.result.split(',')[1];
          setPdfData(base64data);
          setShowPDFPreview(true);
              // Notify other tabs/components that a payment was previewed
              try {
                window.dispatchEvent(new Event('payment:previewed'));
              } catch (e) {
                console.warn('Could not dispatch payment:previewed event', e);
              }
        } catch (err) {
          console.error('Error parsing PDF blob', err);
          showToast('Failed to load invoice for preview', 'error');
        }
        setGeneratingPreview(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error fetching invoice for preview', err);
      showToast('Error fetching invoice', 'error');
      setGeneratingPreview(false);
    }
  };

  // Send invoice for a specific payment
  const sendPaymentInvoice = async (paymentId) => {
    setSendingPaymentId(paymentId);
   
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      await axios.post(`http://localhost:5000/api/payments/send/${paymentId}`, {}, headers);
      showToast('Invoice sent to user', 'success');
      // close preview if open
      setShowPDFPreview(false);
    } catch (err) {
      console.error('Error sending invoice', err);
      showToast('Error sending invoice', 'error');
    }
    setSendingPaymentId(null);
  };

  // Send Bill after preview
  const sendBill = async (id) => {
    setSendingBillId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(
        "http://localhost:5000/api/admin/send-bill",
        { studentId: id },
        headers
      );

      setShowPDFPreview(false);
      showToast("Bill sent successfully!");
    } catch (error) {
      console.error("Error sending bill:", error);
      showToast(
        "Error sending bill: " +
          (error.response?.data?.message || error.message),
        "error"
      );
    }
    setSendingBillId(null);
  };

  // Download Bill
  const downloadBill = async (student) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(
        `http://localhost:5000/api/students/${student.id}/generate-bill`,
        {
          ...headers,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bill-${student.name}-${student.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast("Bill downloaded successfully!");
    } catch (error) {
      console.error("Error downloading bill:", error);
      showToast("Error downloading bill", "error");
    }
  };

  // Update Internship Status
  const updateStudentStatus = (student) => {
    setStatusStudent(student);
    setInternshipStatus(student.internshipStatus || "Active");
    setShowStatusModal(true);
  };

  // Generate PDF Preview
  const generatePDFPreview = async (studentId, type) => {
    const student = students.find((s) => s.id === studentId);

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
    const student = students.find(s => s.id === id);
    
    if (!isSuperAdmin && !student.isApproved) {
      showToast("Cannot send offer: Student is not approved", "error");
      return;
    }

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
      await fetchStudents();
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
    const student = students.find(s => s.id === id);
    
    if (!isSuperAdmin && !student.is_approved) {
      showToast("Cannot send completion: Student is not approved", "error");
      return;
    }

    setSendingCompletionId(id);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(
        "http://localhost:5000/api/admin/send-completion-with-course",
        { studentId: id },
        headers
      );

      setShowPDFPreview(false);
      await fetchStudents();
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
    setTimeout(() => {
      setPdfData(null);
      setPreviewType("");
      setPreviewStudentId(null);
    }, 300);
  };

  // View Screenshot
  const viewScreenshot = (student) => {
    setScreenshotLoading(true);
    setScreenshotError(false);
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

  // Close Payment Modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentStudent(null);
    setPaymentAmount("");
    setPaymentReason("");
    setSendReceipt(false);
  };

  // Close Form Type Modal
  const closeFormTypeModal = () => {
    setShowFormTypeModal(false);
  };

  // Close Status Modal
  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusStudent(null);
    setInternshipStatus("Active");
  };

  const handleCancel = () => {
    resetForm();
    setShowAddForm(false);
  };

  // ✅ FIXED: Enhanced permission check with proper boolean handling
  const canSendDocuments = (student) => {
    if (!student) return false;
    
    // Super admin can always send documents
    if (isSuperAdmin) {
      return true;
    }
    
    // Normal admin can only send if student is approved
    const isApproved = Boolean(student.isApproved);
    return isApproved;
  };

  // Check if user can preview documents - Always allow preview
  const canPreviewDocuments = (student) => {
    return true;
  };

  // ✅ FIXED: Enhanced payment status badge with proper boolean handling
  const getPaymentStatusBadge = (student) => {
  // Handle both naming styles safely
  const isApproved = Boolean(student.isApproved ?? student.isApproved);
  const paymentStatus = student.payment_status ?? student.paymentStatus;

  if (isApproved) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Approved
      </span>
    );
  }

  if (paymentStatus === "Failed") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Rejected
      </span>
    );
  }



  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      Pending Approval
    </span>
  );
};


  // Get internship status badge
  const getInternshipStatusBadge = (student) => {
    const status = student.internshipStatus || "Active";
    const statusColors = {
      Active: "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Discontinued: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
      >
        {status}
      </span>
    );
  };

  // Check if student needs approval (for Super Admin actions)
  const needsApproval = (student) => {
    const isApproved = Boolean(student.isApproved);
    return !isApproved && student.paymentStatus !== "Failed";
  };

  // Check if student is approved
  const isApproved = (student) => {
    return Boolean(student.isApproved);
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
    if (!showPDFPreview) return null;

    const student = students.find((s) => s.id === previewStudentId);
    const isOffer = previewType === "offer";
    const isCompletion = previewType === "completion";
    const isBill = previewType === "bill";
    const isPaymentPreview = previewType === 'payment';
    const canSend = canSendDocuments(student);
    const canPreview = canPreviewDocuments(student);

    const isAlreadySent =
      (isOffer && student?.offerSent) ||
      (isCompletion && student?.completionSent);

    const getModalTitle = () => {
      if (isOffer) return "Offer Letter Preview";
      if (isCompletion) return "Completion Certificate Preview";
      if (isBill) return "Bill Preview";
      if (isPaymentPreview) return "Payment Invoice Preview";
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
      if (isBill)
        return sendingBillId === previewStudentId ? "Sending..." : "Send Bill";
      return "Send";
    };

    const handleSend = () => {
      if (isOffer) return sendOffer(previewStudentId);
      if (isCompletion) return sendCompletion(previewStudentId);
      if (isBill) return sendBill(previewStudentId);
      if (isPaymentPreview) return sendPaymentInvoice(previewPaymentId);
    };

    const isSending = () => {
      if (isOffer) return sendingOfferId === previewStudentId;
      if (isCompletion) return sendingCompletionId === previewStudentId;
      if (isBill) return sendingBillId === previewStudentId;
      if (isPaymentPreview) return sendingPaymentId === previewPaymentId;
      return false;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {getModalTitle()}
              </h2>
              <p className="text-gray-600">
                For: {student?.name} - {student?.department}
              </p>
              {isAlreadySent && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  ✓ Already sent to student
                </p>
              )}
              {!canSend && !isSuperAdmin && (
                <p className="text-sm text-yellow-600 font-medium mt-1">
                  ⚠ Student needs approval before sending documents
                </p>
              )}
              {!canSend && isSuperAdmin && (
                <p className="text-sm text-blue-600 font-medium mt-1">
                  ⓘ You can send documents as Super Admin
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

          <div className="flex-1 p-6">
            {pdfData ? (
              <iframe
                src={`data:application/pdf;base64,${pdfData}`}
                className="w-full h-96 border border-gray-300 rounded-lg"
                title="PDF Preview"
                key={previewStudentId + previewType}
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={closePDFPreview}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={
                isSending() || isAlreadySent || (!canSend && !isSuperAdmin)
              }
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2"
            >
              {isSending() ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : isAlreadySent ? (
                "Already Sent"
              ) : !canSend && !isSuperAdmin ? (
                "Needs Approval"
              ) : (
                getSendButtonText()
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Screenshot Preview Modal
  const ScreenshotPreviewModal = () => {
    if (!showScreenshotModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Payment Screenshot
              </h2>
              <p className="text-gray-600">
                For: {screenshotStudent?.name} - {screenshotStudent?.department}
              </p>
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

          <div className="flex-1 p-6 flex items-center justify-center bg-gray-100">
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
                  The payment screenshot could not be loaded.
                </p>
              </div>
            )}
            {!screenshotError && screenshotUrl && (
              <img
                src={screenshotUrl}
                alt="Payment Screenshot"
                className={`max-w-full max-h-full object-contain rounded-lg border border-gray-300 transition-opacity duration-300 ${
                  screenshotLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={handleScreenshotLoad}
                onError={handleScreenshotError}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={closeScreenshotModal}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Form Type Modal
  const FormTypeModal = () => {
    if (!showFormTypeModal) return null;

    const formTypes = [
      {
        type: "paid",
        label: "Paid",
        description: "₹5,000/month",
        color: "green",
      },
      {
        type: "unpaid",
        label: "Unpaid",
        description: "No fees",
        color: "blue",
      },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              Select Form Type
            </h2>
            <button
              onClick={closeFormTypeModal}
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

          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Choose the form type for new student registrations:
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {formTypes.map((form) => (
                <button
                  key={form.type}
                  onClick={() => updateFormType(form.type)}
                  className={`p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors text-center ${
                    form.color === "green"
                      ? "border-green-500 hover:bg-green-50"
                      : "border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <div
                    className={`font-semibold ${
                      form.color === "green"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  >
                    {form.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {form.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Form Link
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">
                    Student Registration Form:
                  </span>
                  <button
                    onClick={handleCopyClick}
                    className="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Internship Status Modal
  const StatusModal = () => {
    if (!showStatusModal || !statusStudent) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              Update Internship Status
            </h2>
            <button
              onClick={closeStatusModal}
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

          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600">
                Update internship status for{" "}
                <strong>{statusStudent.name}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internship Status
                </label>
                <select
                  value={internshipStatus}
                  onChange={(e) => setInternshipStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  {internshipStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={closeStatusModal}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={updateInternshipStatus}
              disabled={updatingStatus}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2"
            >
              {updatingStatus ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout pageTitle="Student Management">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Toast />
          <PDFPreviewModal />
          <ScreenshotPreviewModal />
          <FormTypeModal />
          <StatusModal />

          {/* Payment Modal Component */}
          <PaymentModal
            showPaymentModal={showPaymentModal}
            paymentStudent={paymentStudent}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            paymentReason={paymentReason}
            setPaymentReason={setPaymentReason}
            processingPayment={processingPayment}
            processPayment={processPayment}
            closePaymentModal={closePaymentModal}
            downloadBill={downloadBill}
            generateBillPreview={generateBillPreview}
            paymentHistory={paymentHistory}
            loadingPaymentHistory={loadingPaymentHistory}
            paymentHistoryTab={paymentHistoryTab}
            setPaymentHistoryTab={setPaymentHistoryTab}
            sendReceipt={sendReceipt}
            setSendReceipt={setSendReceipt}
            previewPayment={previewPayment}
            sendPaymentInvoice={sendPaymentInvoice}
          />

          {/* Separated Form Component */}
          <StudentForm
            showAddForm={showAddForm}
            editingStudent={editingStudent}
            formData={formData}
            onInputChange={handleInputChange}
            onCancel={handleCancel}
            onSubmit={editingStudent ? updateStudent : addStudent}
            adding={adding}
            updating={updating}
            departmentOptions={departmentOptions}
            durationOptions={durationOptions}
            onTotalAmountChange={confirmAmountChange}
            showAmountEdit={showAmountEdit}
            setShowAmountEdit={setShowAmountEdit}
            changeReason={changeReason}
            setChangeReason={setChangeReason}
            processingAmountChange={processingAmountChange}
            onConfirmAmountChange={confirmAmountChange}
          />

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 top-4 z-40">
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
                  onClick={() => setShowFormTypeModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 justify-center"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send Form
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
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
                  Add Student
                </button>
              </div>
            </div>

            {/* Filters Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internship Status
                </label>
                <select
                  value={internshipStatusFilter}
                  onChange={(e) => setInternshipStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="All">All Status</option>
                  {internshipStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                          Duration & Status
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
                              {student.duration
                                ? `${student.duration} Month${
                                    student.duration > 1 ? "s" : ""
                                  }`
                                : "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.startDate &&
                                formatDate(student.startDate)}{" "}
                              - {student.endDate && formatDate(student.endDate)}
                            </div>
                            <div className="mt-2">
                              <button
                                onClick={() => updateStudentStatus(student)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                {getInternshipStatusBadge(student)}
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
                              </button>
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

                              <div className="text-xs">
                                {getPaymentStatusBadge(student)}
                              </div>

                              {student.stipendType === "Unpaid" && (
                                <>
                                  <button
                                    onClick={() => viewPaymentDetails(student)}
                                    className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
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
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    View Payment
                                  </button>

                                  {student.paymentScreenshot && (
                                    <button
                                      onClick={() => viewScreenshot(student)}
                                      className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
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
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      View Screenshot
                                    </button>
                                  )}

                                  <div className="text-xs text-gray-600">
                                    <div>
                                      Total: ₹{student.totalAmount || 0}
                                    </div>
                                    <div>
                                      Paid: ₹
                                      {(student.totalAmount || 0) -
                                        (student.remainingAmount || 0)}
                                    </div>
                                    <div>
                                      Remaining: ₹{student.remainingAmount || 0}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>

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

                                    
                                  </>
                                )}

                                {isApproved(student) && (
                                  <div className="text-xs text-green-600 font-medium">
                                    Approved
                                  </div>
                                )}

                                {student.paymentStatus === "Failed" && (
                                  <div className="text-xs text-red-600 font-medium">
                                    Rejected
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          <td className="px-4 py-3">
                            <div className="flex gap-3 sm:gap-4">
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
                                  disabled={generatingPreview}
                                  className={`flex-1 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors ${
                                    student.offerSent
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
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
                                      <span>Preview Offer</span>
                                    </div>
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    generatePDFPreview(student.id, "completion")
                                  }
                                  disabled={generatingPreview}
                                  className={`flex-1 text-xs px-2 sm:px-3 py-1.5 rounded font-medium transition-colors ${
                                    student.completionSent
                                      ? "bg-green-100 text-green-700 hover:bg-green-200"
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
                                      <span>Preview Completion</span>
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
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {getPageNumbers().map((pageNumber, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            typeof pageNumber === "number" &&
                            paginate(pageNumber)
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
    </Layout>
  );
};

export default Students;