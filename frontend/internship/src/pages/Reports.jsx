import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const Reports = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalPending: 0,
    totalStudents: 0,
    approvedStudents: 0,
    pendingStudents: 0,
    revenueByDepartment: [],
    paymentMethodBreakdown: [],
    monthlyRevenue: []
  });
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loadingAllTransactions, setLoadingAllTransactions] = useState(false);

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

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Show toast notification
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  }, []);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const res = await axios.get(
        "http://localhost:5000/api/students",
        headers
      );
      console.log("Fetched students:", res.data); // Debug log
      setStudents(res.data);
      generateReportData(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
      showToast("Error fetching students data", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch transactions (payments) for a particular student
  const fetchTransactionsForStudent = async (studentId) => {
    if (!studentId) {
      setTransactions([]);
      return;
    }
    setLoadingTransactions(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get(`http://localhost:5000/api/payments/student/${studentId}`, headers);
      if (res.data.success) {
        setTransactions(res.data.history || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error fetching transactions for student', err);
      showToast('Error fetching transactions', 'error');
      setTransactions([]);
    }
    setLoadingTransactions(false);
  };

  // Preview payment invoice (open in new tab)
  const previewPaymentReport = async (paymentId) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get(`http://localhost:5000/api/payments/download/${paymentId}`, { ...headers, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      window.open(url, '_blank');
      // revoke after short delay
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('Error previewing payment', err);
      showToast('Error previewing payment', 'error');
    }
  };

  // Send payment invoice for a payment id
  const sendPaymentReport = async (paymentId) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      await axios.post(`http://localhost:5000/api/payments/send/${paymentId}`, {}, headers);
      showToast('Invoice sent', 'success');
    } catch (err) {
      console.error('Error sending payment invoice', err);
      showToast('Error sending invoice', 'error');
    }
  };

  // Fetch transactions for all students (aggregate)
  const fetchAllTransactions = async () => {
    if (!students || students.length === 0) return;
    setLoadingAllTransactions(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const calls = students.map(s => axios.get(`http://localhost:5000/api/payments/student/${s.id}`, headers).then(r => ({ id: s.id, history: r.data.history || [] })).catch(err => ({ id: s.id, history: [] })));
      const results = await Promise.allSettled(calls);
      const aggregated = [];
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value && Array.isArray(r.value.history)) {
          aggregated.push(...r.value.history.map(h => ({ ...h, studentId: r.value.id })));
        }
      });
      // Sort by createdAt desc
      aggregated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllTransactions(aggregated);
      // show in transactions view when no student selected
      if (!selectedStudentId) setTransactions(aggregated);
    } catch (err) {
      console.error('Error fetching all transactions', err);
      showToast('Error fetching all transactions', 'error');
    }
    setLoadingAllTransactions(false);
  };

  // Generate report data
  const generateReportData = (studentData = students) => {
    console.log("Generating report data for:", studentData.length, "students");
    
    const data = studentData;
    
    // Calculate totals
    const totalRevenue = data.reduce((sum, student) => {
      if (student.isApproved && student.totalAmount) {
        const paidAmount = parseFloat(student.totalAmount) - (parseFloat(student.remainingAmount) || 0);
        console.log(`Student ${student.id}: Approved=${student.isApproved}, Total=${student.totalAmount}, Remaining=${student.remainingAmount}, Paid=${paidAmount}`);
        return sum + paidAmount;
      }
      return sum;
    }, 0);

    const totalPending = data.reduce((sum, student) => {
      if (student.isApproved && student.remainingAmount) {
        return sum + parseFloat(student.remainingAmount);
      }
      return sum;
    }, 0);

    // Department-wise revenue
    const revenueByDepartment = data.reduce((acc, student) => {
      if (student.isApproved && student.totalAmount) {
        const dept = student.department || 'Unknown';
        const paidAmount = parseFloat(student.totalAmount) - (parseFloat(student.remainingAmount) || 0);
        
        if (!acc[dept]) {
          acc[dept] = 0;
        }
        acc[dept] += paidAmount;
      }
      return acc;
    }, {});

    // Payment method breakdown
    const paymentMethodBreakdown = data.reduce((acc, student) => {
      if (student.isApproved && student.totalAmount) {
        const method = student.paymentMode || 'Unknown';
        const paidAmount = parseFloat(student.totalAmount) - (parseFloat(student.remainingAmount) || 0);
        
        if (!acc[method]) {
          acc[method] = 0;
        }
        acc[method] += paidAmount;
      }
      return acc;
    }, {});

    // Monthly revenue
    const monthlyRevenue = data.reduce((acc, student) => {
      if (student.isApproved && student.paymentDate) {
        const month = new Date(student.paymentDate).toLocaleString('default', { month: 'short', year: 'numeric' });
        const paidAmount = parseFloat(student.totalAmount) - (parseFloat(student.remainingAmount) || 0);
        
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += paidAmount;
      }
      return acc;
    }, {});

    const report = {
      totalRevenue,
      totalPending,
      totalStudents: data.length,
      approvedStudents: data.filter(s => s.isApproved).length,
      pendingStudents: data.filter(s => !s.isApproved).length,
      revenueByDepartment: Object.entries(revenueByDepartment).map(([dept, revenue]) => ({ dept, revenue })),
      paymentMethodBreakdown: Object.entries(paymentMethodBreakdown).map(([method, amount]) => ({ method, amount })),
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }))
    };

    console.log("Generated report data:", report);
    console.log("Payment method breakdown:", paymentMethodBreakdown);
    setReportData(report);
  };

  // Filter data by date range
  const filterDataByDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      generateReportData(students);
      return;
    }

    const filtered = students.filter(student => {
      const paymentDate = student.paymentDate ? new Date(student.paymentDate) : null;
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);

      return paymentDate && paymentDate >= start && paymentDate <= end;
    });

    generateReportData(filtered);
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply date filter
  const applyDateFilter = () => {
    filterDataByDateRange();
    showToast("Date filter applied successfully");
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateRange({ startDate: "", endDate: "" });
    generateReportData(students);
    showToast("Date filter cleared");
  };

  // Export to CSV
  const exportToCSV = () => {
    setGeneratingReport(true);
    try {
      const csvData = [
        ['Student ID', 'Name', 'Email', 'Department', 'Internship Type', 'Total Amount', 'Paid Amount', 'Remaining Amount', 'Payment Mode', 'Approval Status', 'Payment Date']
      ];

      students.forEach(student => {
        const paidAmount = parseFloat(student.totalAmount || 0) - parseFloat(student.remainingAmount || 0);
        csvData.push([
          student.id,
          student.name,
          student.email,
          student.department,
          student.internshipType,
          `₹${student.totalAmount || 0}`,
          `₹${paidAmount}`,
          `₹${student.remainingAmount || 0}`,
          student.paymentMode || 'N/A',
          student.isApproved ? 'Approved' : 'Pending',
          student.paymentDate ? new Date(student.paymentDate).toLocaleDateString() : 'N/A'
        ]);
      });

      // Add summary data
      csvData.push([]);
      csvData.push(['SUMMARY']);
      csvData.push(['Total Revenue', `₹${reportData.totalRevenue.toFixed(2)}`]);
      csvData.push(['Total Pending', `₹${reportData.totalPending.toFixed(2)}`]);
      csvData.push(['Total Students', reportData.totalStudents]);
      csvData.push(['Approved Students', reportData.approvedStudents]);
      csvData.push(['Pending Students', reportData.pendingStudents]);

      const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `reports-${new Date().toISOString().split('T')[0]}.csv`);
      
      showToast("CSV report downloaded successfully");
    } catch (error) {
      console.error("Error generating CSV:", error);
      showToast("Error generating CSV report", "error");
    }
    setGeneratingReport(false);
  };

  // Export to PDF
  const exportToPDF = () => {
    setGeneratingReport(true);
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('RORIRI - Financial Reports', 105, yPosition, { align: 'center' });
      yPosition += 15;

      // Date range
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateText = dateRange.startDate && dateRange.endDate 
        ? `Date Range: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`
        : `Generated on: ${new Date().toLocaleDateString()}`;
      doc.text(dateText, 105, yPosition, { align: 'center' });
      yPosition += 20;

      // Summary Section
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('Financial Summary', 14, yPosition);
      yPosition += 10;

      const summaryData = [
        ['Total Revenue', `₹${reportData.totalRevenue.toFixed(2)}`],
        ['Pending Amount', `₹${reportData.totalPending.toFixed(2)}`],
        ['Total Students', reportData.totalStudents.toString()],
        ['Approved Students', reportData.approvedStudents.toString()],
        ['Pending Approval', reportData.pendingStudents.toString()]
      ];

      doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Department-wise Revenue
      const deptData = reportData.revenueByDepartment.map(item => [
        item.dept,
        `₹${item.revenue.toFixed(2)}`
      ]);

      if (deptData.length > 0) {
        doc.setFontSize(16);
        doc.text('Revenue by Department', 14, yPosition);
        yPosition += 10;

        doc.autoTable({
          startY: yPosition,
          head: [['Department', 'Revenue']],
          body: deptData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Payment Method Breakdown
      const paymentData = reportData.paymentMethodBreakdown.map(item => [
        item.method || 'Unknown',
        `₹${item.amount.toFixed(2)}`
      ]);

      if (paymentData.length > 0) {
        // Check if we need a new page
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text('Payment Method Breakdown', 14, yPosition);
        yPosition += 10;

        doc.autoTable({
          startY: yPosition,
          head: [['Payment Method', 'Amount']],
          body: paymentData,
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Student Details Table (on new page)
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(16);
      doc.text('Student Details', 14, yPosition);
      yPosition += 10;

      const studentData = students.map(student => {
        const paidAmount = parseFloat(student.totalAmount || 0) - parseFloat(student.remainingAmount || 0);
        return [
          student.id,
          student.name.substring(0, 15), // Limit name length
          student.department?.substring(0, 12) || 'N/A', // Limit department length
          student.internshipType?.substring(0, 8) || 'N/A',
          `₹${parseFloat(student.totalAmount || 0).toFixed(2)}`,
          `₹${paidAmount.toFixed(2)}`,
          `₹${parseFloat(student.remainingAmount || 0).toFixed(2)}`,
          student.isApproved ? 'Approved' : 'Pending'
        ];
      });

      doc.autoTable({
        startY: yPosition,
        head: [['ID', 'Name', 'Department', 'Type', 'Total', 'Paid', 'Pending', 'Status']],
        body: studentData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { 
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        margin: { left: 10, right: 10 },
        pageBreak: 'auto'
      });

      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount} - Generated by ${admin.name || 'Admin'} - ${new Date().toLocaleDateString()}`,
          105,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // If transactions exist, add them in a separate section
      if (transactions && transactions.length > 0) {
        doc.addPage();
        let tY = 20;
        doc.setFontSize(16);
        doc.text('Transactions', 14, tY);
        tY += 10;

        const txnBody = transactions.map(tx => [
          tx.id,
          tx.studentId || 'N/A',
          `₹${Number(tx.amount).toFixed(2)}`,
          tx.method || 'N/A',
          new Date(tx.createdAt).toLocaleString()
        ]);

        doc.autoTable({
          startY: tY,
          head: [['ID', 'Student ID', 'Amount', 'Method', 'Date']],
          body: txnBody,
          theme: 'grid',
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });
      }

      // Save the PDF
      doc.save(`reports-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("PDF report downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast("Error generating PDF report", "error");
    }
    setGeneratingReport(false);
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Debug component to show raw data
  const DebugInfo = () => {
    if (loading) return null;
    
    const paymentMethods = students.reduce((acc, student) => {
      if (student.isApproved && student.totalAmount) {
        const method = student.paymentMode || 'Unknown';
        acc[method] = (acc[method] || 0) + 1;
      }
      return acc;
    }, {});

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Students:</span> {students.length}
          </div>
          <div>
            <span className="font-medium">Approved Students:</span> {students.filter(s => s.isApproved).length}
          </div>
          <div>
            <span className="font-medium">Students with Payment:</span> {students.filter(s => s.totalAmount > 0).length}
          </div>
          <div>
            <span className="font-medium">Payment Methods:</span> 
            {Object.entries(paymentMethods).map(([method, count]) => (
              <div key={method} className="text-xs">
                {method}: {count}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 text-xs">
          <strong>Sample Approved Students with Payments:</strong>
          {students.filter(s => s.isApproved && s.totalAmount > 0).slice(0, 3).map(s => (
            <div key={s.id} className="ml-2">
              {s.id}: {s.paymentMode || 'No Mode'} - ₹{s.totalAmount || 0} (Remaining: ₹{s.remainingAmount || 0})
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout pageTitle="Financial Reports">
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Toast />

          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive financial analytics and revenue tracking
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={exportToCSV}
                  disabled={generatingReport || loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 justify-center"
                >
                  {generatingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </>
                  )}
                </button>

                <button
                  onClick={exportToPDF}
                  disabled={generatingReport || loading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 justify-center"
                >
                  {generatingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={applyDateFilter}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex-1"
                >
                  Apply Filter
                </button>
                <button
                  onClick={clearDateFilter}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          <DebugInfo />

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading financial data...</p>
            </div>
          ) : (
            <>
              {/* Transactions by Student */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Transactions</h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => { setSelectedStudentId(e.target.value); fetchTransactionsForStudent(e.target.value); }}
                      className="border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">-- Select Student (filter) --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                      ))}
                    </select>
                    <button onClick={() => { setSelectedStudentId(''); setTransactions([]); }} className="text-sm text-gray-600">Clear</button>
                    <button onClick={fetchAllTransactions} className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded text-sm">
                      {loadingAllTransactions ? 'Loading...' : 'Load All Transactions'}
                    </button>
                  </div>
                </div>

                {loadingTransactions ? (
                  <div className="text-center py-8">Loading transactions...</div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="overflow-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr>
                          <th className="p-2 border-b">ID</th>
                          <th className="p-2 border-b">Amount</th>
                          <th className="p-2 border-b">Method</th>
                          <th className="p-2 border-b">Date</th>
                          <th className="p-2 border-b">Invoice Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(t => (
                          <tr key={t.id}>
                            <td className="p-2 border-b">{t.id}</td>
                            <td className="p-2 border-b">₹{Number(t.amount).toFixed(2)}</td>
                            <td className="p-2 border-b">{t.method}</td>
                            <td className="p-2 border-b">{new Date(t.createdAt).toLocaleString()}</td>
                            <td className="p-2 border-b">{t.invoiceSent ? 'Yes' : 'No'}</td>
                            <td className="p-2 border-b">
                              <div className="flex items-center gap-2">
                                <button onClick={() => previewPaymentReport(t.id)} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">Preview</button>
                                <button onClick={() => sendPaymentReport(t.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Send</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No transactions to show for selected student.</div>
                )}
              </div>
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
                {/* Total Revenue */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(reportData.totalRevenue)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Collected from approved students
                  </div>
                </div>

                {/* Total Pending */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(reportData.totalPending)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-yellow-600">
                    Awaiting payment collection
                  </div>
                </div>
              </div>

              {/* Student Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {reportData.totalStudents}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved Students</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {reportData.approvedStudents}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    {reportData.totalStudents > 0 ? 
                      `${((reportData.approvedStudents / reportData.totalStudents) * 100).toFixed(1)}% of total` 
                      : '0% of total'
                    }
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {reportData.pendingStudents}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    Awaiting super admin approval
                  </div>
                </div>
              </div>

              {/* Charts and Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department-wise Revenue */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Revenue by Department
                  </h3>
                  <div className="space-y-3">
                    {reportData.revenueByDepartment.length > 0 ? (
                      reportData.revenueByDepartment.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{item.dept}</span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(item.revenue)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No revenue data available for approved students</p>
                    )}
                  </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Payment Method Breakdown
                  </h3>
                  <div className="space-y-3">
                    {reportData.paymentMethodBreakdown.length > 0 ? (
                      reportData.paymentMethodBreakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{item.method || 'Unknown'}</span>
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No payment data available for approved students</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;