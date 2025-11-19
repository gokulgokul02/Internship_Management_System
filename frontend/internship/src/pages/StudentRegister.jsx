import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// API and Razorpay configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RZknuKOsVQcrZs";

const StudentRegister = () => {
  const { studentId } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    department: "",
    duration: "1",
    internshipType: "",
    paymentMode: "Online",
    advanceAmount: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [studentIdFromServer, setStudentIdFromServer] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [internshipTypeFromDB, setInternshipTypeFromDB] = useState(null);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0); // Track actual paid amount

  const departmentOptions = [
    "Frontend Developer",
    "Fullstack Developer",
    "Python Fullstack Developer",
    "UI/UX Designer",
    "Digital Marketing",
    "Other",
  ];

  const durationOptions = [
    { value: "1", label: "1 Month" },
    { value: "2", label: "2 Months" },
    { value: "3", label: "3 Months" },
    { value: "4", label: "4 Months" },
    { value: "5", label: "5 Months" },
    { value: "6", label: "6 Months" },
  ];

  // Configuration
  const config = {
    API_BASE_URL: "http://localhost:5000",
    RAZORPAY_KEY_ID: "rzp_test_RZknuKOsVQcrZs",
  };

  // ✅ Calculate total amount based on duration ONLY for unpaid internships
  const totalAmount =
    formData.internshipType === "unpaid"
      ? parseInt(formData.duration) * 5000
      : 0;

  // ✅ Calculate remaining amount for unpaid internships
  const advanceAmount = parseInt(formData.advanceAmount) || 0;
  const remainingAmount = Math.max(0, totalAmount - advanceAmount);

  // ✅ Check if payment section should be shown (only for unpaid + online payment)
  const shouldShowPaymentSection =
    formData.internshipType === "unpaid" &&
    formData.paymentMode === "Online" &&
    remainingAmount > 0;

  // ✅ Fetch internship type from database where id = 1
  useEffect(() => {
    fetchInternshipType();
  }, []);

  // ✅ Fetch student details if studentId is provided in URL
  useEffect(() => {
    if (studentId) {
      fetchStudentDetails(studentId);
    }
  }, [studentId]);

  const fetchInternshipType = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/api/internship-types/1`
      );
      const typeData = response.data;

      if (typeData) {
        setInternshipTypeFromDB(typeData);
        setFormData((prev) => ({
          ...prev,
          internshipType: typeData.FormType || "unpaid",
        }));
      }
    } catch (error) {
      console.error("Error fetching internship type:", error);
      setInternshipTypeFromDB({ FormType: "unpaid" });
      setFormData((prev) => ({ ...prev, internshipType: "unpaid" }));
    }
  };

  const fetchStudentDetails = async (id) => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/api/students/${id}`
      );
      const student = response.data;

      setStudentDetails(student);
      setFormData({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        college: student.college || "",
        department: student.department || "",
        duration: student.duration?.toString() || "1",
        internshipType:
          student.internshipType || internshipTypeFromDB?.FormType || "unpaid",
        paymentMode: student.paymentMode || "Online",
        advanceAmount: student.advanceAmount?.toString() || "",
      });
    } catch (error) {
      console.error("Error fetching student details:", error);
      showMessage("Error loading student information", "error");
    }
  };

  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay SDK");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle screenshot upload
  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        showMessage(
          "Please upload a valid image file (JPEG, PNG, GIF, WebP)",
          "error"
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showMessage("File size should be less than 5MB", "error");
        return;
      }

      setPaymentScreenshot(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview("");
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (
        !formData.name ||
        !formData.email ||
        !formData.college ||
        !formData.department ||
        !formData.duration ||
        !formData.internshipType
      ) {
        showMessage("Please fill in all required fields", "error");
        setLoading(false);
        return;
      }

      // ✅ For unpaid internships: Validate advance amount
      if (formData.internshipType === "unpaid") {
        const advance = parseInt(formData.advanceAmount) || 0;
        if (advance < 0 || advance > totalAmount) {
          showMessage(
            "Advance amount must be between 0 and total amount",
            "error"
          );
          setLoading(false);
          return;
        }
      }

      // ✅ Create student record with proper data types and field names
      const studentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        college: formData.college,
        department: formData.department,
        duration: parseInt(formData.duration),
        internshipType: formData.internshipType,
        stipendType: formData.internshipType === "paid" ? "Paid" : "Unpaid",
        stipendAmount: formData.internshipType === "paid" ? 0 : null,
        paymentMode:
          formData.internshipType === "unpaid" ? formData.paymentMode : null,
        totalAmount: formData.internshipType === "unpaid" ? totalAmount : 0,
        advanceAmount: formData.internshipType === "unpaid" ? advanceAmount : 0,
        remainingAmount:
          formData.internshipType === "unpaid" ? remainingAmount : 0,
        paymentStatus:
          formData.internshipType === "paid"
            ? "Completed"
            : advanceAmount > 0
            ? "Partially_Paid"
            : "Pending",
        isApproved: false,
      };

      console.log("🎯 Submitting student data:", studentData);

      let response;
      if (studentId) {
        response = await axios.put(
          `${API_BASE_URL}/api/students/${studentId}`,
          studentData
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/students`,
          studentData
        );
      }

      console.log("✅ Registration response:", response.data);

      if (response.data && response.data.success) {
        // ✅ Extract student ID properly from response
        let newStudentId;
        if (studentId) {
          newStudentId = studentId;
        } else if (response.data.id) {
          newStudentId = response.data.id;
        } else if (response.data.student && response.data.student.id) {
          newStudentId = response.data.student.id;
        }

        if (newStudentId) {
          setStudentIdFromServer(newStudentId);

          // Fetch full student and dispatch notification to admin
          try {
            const studentResp = await axios.get(
              `${API_BASE_URL}/api/students/${newStudentId}`
            );
            const createdStudent = studentResp.data;
            window.dispatchEvent(
              new CustomEvent("student:registered", { detail: createdStudent })
            );
            try {
              const existing = JSON.parse(
                localStorage.getItem("newRegistrations") || "[]"
              );
              existing.unshift({
                id: createdStudent.id,
                name: createdStudent.name,
                time: new Date().toISOString(),
              });
              localStorage.setItem(
                "newRegistrations",
                JSON.stringify(existing)
              );
            } catch (e) {
              console.error(
                "Failed to persist new registration notification",
                e
              );
            }
          } catch (fetchErr) {
            console.error(
              "Failed to fetch/notify after registration",
              fetchErr
            );
          }

          if (shouldShowPaymentSection) {
            setShowPaymentSection(true);
            showMessage(
              "Registration details saved. Please proceed with payment.",
              "success"
            );
          } else {
            setRegistrationCompleted(true);
            setShowSuccessCard(true);
            if (
              formData.internshipType === "unpaid" &&
              formData.paymentMode === "Cash"
            ) {
              if (advanceAmount > 0) {
                showMessage(
                  `Registration submitted successfully! ₹${advanceAmount} paid as advance. Please visit our office to pay remaining ₹${remainingAmount}.`,
                  "success"
                );
              } else {
                showMessage(
                  "Registration submitted successfully! Please visit our office to complete the payment.",
                  "success"
                );
              }
            } else if (formData.internshipType === "paid") {
              showMessage(
                "Paid internship registration completed successfully!",
                "success"
              );
            } else if (advanceAmount === totalAmount) {
              showMessage(
                "Registration completed successfully! Full payment received.",
                "success"
              );
            } else {
              showMessage("Registration completed successfully!", "success");
            }
          }
        } else {
          throw new Error("Failed to get student ID from server response");
        }
      } else {
        throw new Error(response.data?.message || "Registration failed");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Registration failed. Please try again.";
      showMessage(errorMessage, "error");
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      console.log(
        "💳 Starting payment process for student:",
        studentIdFromServer,
        "Amount:",
        remainingAmount
      );

      // ✅ FIXED: Pass the correct amount (remainingAmount) to payment initiation
      await initiateRazorpayPayment(studentIdFromServer, remainingAmount);
    } catch (error) {
      console.error("Payment initiation error:", error);
      showMessage("Payment initiation failed. Please try again.", "error");
      setLoading(false);
    }
  };

  const initiateRazorpayPayment = async (studentId, amount) => {
    try {
      console.log(
        "💰 Initiating Razorpay payment for student:",
        studentId,
        "Amount:",
        amount
      );

      // Load Razorpay SDK first
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        showMessage(
          "Payment gateway loading failed. Please refresh and try again.",
          "error"
        );
        setLoading(false);
        return;
      }

      // Send rupees to backend (backend converts to paise)
      const paymentAmount = Math.max(amount, 1);

      if (paymentAmount < 1) {
        showMessage("Payment amount must be at least ₹1", "error");
        setLoading(false);
        return;
      }

      console.log("📦 Creating order with amount:", paymentAmount);

      const orderResponse = await axios.post(
        `${API_BASE_URL}/api/payments/create-order`,
        {
          studentId: studentId,
          amount: paymentAmount,
          currency: "INR",
        }
      );

      console.log("📦 Order response:", orderResponse.data);

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || "Order creation failed");
      }

      const { order } = orderResponse.data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "RORIRI SOFTWARE SOLUTIONS",
        description: "Unpaid Internship Registration Fee",
        order_id: order.id,
        handler: async function (response) {
          console.log("✅ Payment successful, verifying...", response);
          await verifyPayment(response, studentId, amount);
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          student_id: studentId,
          type: "unpaid_internship",
          amount: amount,
        },
        theme: {
          color: "#0066cc",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("❌ Payment failed:", response);
        const errorDescription =
          response.error?.description || "Payment failed due to unknown reason";
        showMessage(`Payment failed: ${errorDescription}`, "error");
        setLoading(false);
      });

      razorpay.open();
      setLoading(false);
    } catch (error) {
      console.error("❌ Razorpay initiation error:", error);
      let errorMessage = "Payment initialization failed. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Payment service unavailable. Please contact support.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showMessage(errorMessage, "error");
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse, studentId, paidAmount) => {
    try {
      // Validate input first
      if (!paymentResponse || !studentId) {
        showMessage("Payment response or student ID is missing.", "error");
        return;
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        paymentResponse;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        showMessage("Payment response is missing required fields.", "error");
        return;
      }

      // ✅ CRITICAL: Ensure paidAmount is a number and log exact value
      const exactPaidAmount = parseFloat(paidAmount);
      if (isNaN(exactPaidAmount) || exactPaidAmount <= 0) {
        showMessage("Invalid payment amount", "error");
        return;
      }

      console.log(
        "🔍 Verifying payment for student:",
        studentId,
        "Exact Amount to Record:",
        exactPaidAmount,
        "Type:",
        typeof exactPaidAmount,
        "Payment response:",
        paymentResponse
      );

      // Prompt user for UPI ID
      const senderUpiId =
        prompt("Please enter your UPI ID used for payment:") || "Not Provided";

      // ✅ FIXED: Send the EXACT paid amount to backend
      const verifyResponse = await axios.post(
        `${API_BASE_URL}/api/payments/verify`,
        {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          studentId,
          senderUpiId,
          paidAmount: exactPaidAmount, // ✅ Send the exact amount user paid
        }
      );

      console.log("🔍 Verify response:", verifyResponse.data);

      if (verifyResponse.data.success) {
        // ✅ Payment successful: update frontend state
        setPaymentCompleted(true);
        setShowPaymentSection(false);
        setPaidAmount(paidAmount);

        // Update local state with new advance/remaining from backend
        const { newAdvance, newRemaining } = verifyResponse.data;
        if (newAdvance !== undefined && newRemaining !== undefined) {
          setFormData((prev) => ({
            ...prev,
            advanceAmount: String(newAdvance),
          }));
          setStudentDetails(verifyResponse.data.student || null);
          console.log(
            `💳 Payment verified: Advance updated to ₹${newAdvance}, Remaining: ₹${newRemaining}`
          );
        }

        showMessage(
          "Payment completed successfully! Please upload your payment screenshot for verification.",
          "success"
        );
      } else {
        // Backend returned success: false
        showMessage(
          verifyResponse.data.message || "Payment verification failed.",
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Payment verification error:", error);

      let errorMessage = "Payment verification failed. Please contact support.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showMessage(errorMessage, "error");
    }
  };

  const handleScreenshotSubmit = async () => {
    if (!paymentScreenshot) {
      showMessage("Please select a payment screenshot to upload", "error");
      return;
    }

    setLoading(true);
    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append("screenshot", paymentScreenshot);
      formDataToUpload.append("studentId", studentIdFromServer);

      console.log("📸 Uploading screenshot for student:", studentIdFromServer);

      const uploadResponse = await axios.post(
        `${config.API_BASE_URL}/api/students/upload-payment-screenshot`,
        formDataToUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      console.log("✅ Upload response:", uploadResponse.data);

      if (uploadResponse.data.success) {
        setRegistrationCompleted(true);
        setShowSuccessCard(true);
        showMessage(
          "Payment screenshot uploaded successfully! Your registration is complete.",
          "success"
        );
      } else {
        showMessage(
          uploadResponse.data.message || "Screenshot upload failed",
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Screenshot upload error:", error);

      let errorMessage = "Screenshot upload failed. Please try again.";

      if (error.response?.status === 413) {
        errorMessage =
          "File too large. Please select a smaller image (max 5MB).";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Upload timeout. Please try again.";
      }

      showMessage(errorMessage, "error");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      college: "",
      department: "",
      duration: "1",
      internshipType: internshipTypeFromDB?.FormType || "unpaid",
      paymentMode: "Online",
      advanceAmount: "",
    });
    setPaymentScreenshot(null);
    setScreenshotPreview("");
    setStudentIdFromServer(null);
    setPaymentCompleted(false);
    setShowPaymentSection(false);
    setRegistrationCompleted(false);
    setShowSuccessCard(false);
    setPaidAmount(0);
    setLoading(false);
  };

  // Balloon Component
  const Balloon = ({ color, style }) => (
    <div className={`balloon balloon-${color}`} style={style}>
      <div className="balloon-string"></div>
    </div>
  );

  // Flower Component
  const Flower = ({ style }) => (
    <div className="flower" style={style}>
      <div className="flower-center"></div>
      <div className="flower-petal petal-1"></div>
      <div className="flower-petal petal-2"></div>
      <div className="flower-petal petal-3"></div>
      <div className="flower-petal petal-4"></div>
      <div className="flower-petal petal-5"></div>
      <div className="flower-petal petal-6"></div>
    </div>
  );

  // Confetti Component
  const Confetti = ({ style }) => (
    <div className="confetti" style={style}></div>
  );

  // Star Component
  const Star = ({ style }) => (
    <div className="star" style={style}>
      <div className="star-inner"></div>
    </div>
  );

  // Firework Component
  const Firework = ({ style }) => (
    <div className="firework" style={style}>
      <div className="firework-particle"></div>
      <div className="firework-particle"></div>
      <div className="firework-particle"></div>
      <div className="firework-particle"></div>
      <div className="firework-particle"></div>
      <div className="firework-particle"></div>
      <div className="firework-particle"></div>
      <div className="firework-particle"></div>
    </div>
  );

  // Success Celebration Component
  const SuccessCelebration = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Background Elements */}
      <div className="celebration-background">
        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <Star
            key={`star-${i}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Balloons */}
        {[...Array(15)].map((_, i) => (
          <Balloon
            key={`balloon-${i}`}
            color={["red", "blue", "green", "yellow", "purple", "pink"][i % 6]}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Flowers */}
        {[...Array(10)].map((_, i) => (
          <Flower
            key={`flower-${i}`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${6 + Math.random() * 3}s`,
            }}
          />
        ))}

        {/* Confetti */}
        {[...Array(100)].map((_, i) => (
          <Confetti
            key={`confetti-${i}`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: [
                "#ff6b6b",
                "#74b9ff",
                "#55efc4",
                "#fdcb6e",
                "#a29bfe",
                "#fd79a8",
                "#ffeaa7",
                "#fd79a8",
                "#6c5ce7",
                "#a29bfe",
              ][Math.floor(Math.random() * 10)],
            }}
          />
        ))}

        {/* Fireworks */}
        {[...Array(8)].map((_, i) => (
          <Firework
            key={`firework-${i}`}
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Success Card */}
      <div className="success-card">
        {/* Animated Checkmark */}
        <div className="success-icon">
          <div className="checkmark-circle">
            <div className="checkmark-stem"></div>
            <div className="checkmark-kick"></div>
          </div>
        </div>

        {/* Content */}
        <div className="success-content">
          <h1 className="success-title">🎉 Congratulations!</h1>
          <p className="success-message">
            Your registration has been successfully completed!
          </p>

          <div className="student-details">
            <div className="detail-item">
              <span className="detail-label">Student ID:</span>
              <span className="detail-value">{studentIdFromServer}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{formData.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Department:</span>
              <span className="detail-value">{formData.department}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">
                {formData.duration} Month{formData.duration !== "1" ? "s" : ""}
              </span>
            </div>
            {formData.internshipType === "unpaid" && (
              <div className="detail-item">
                <span className="detail-label">Total Paid:</span>
                <span className="detail-value text-green-600 font-bold">
                  ₹{paidAmount}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <button
              onClick={() => setShowSuccessCard(false)}
              className="btn-secondary"
            >
              Close
            </button>
          </div>

          {/* Welcome Message */}
          <div className="welcome-message">
            <p>Welcome to RORIRI SOFTWARE SOLUTIONS!</p>
            <p>We're excited to have you onboard. 🚀</p>
          </div>
        </div>
      </div>

      {/* Celebration Styles */}
      <style jsx>{`
        .celebration-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 5;
          overflow: hidden;
        }

        /* Balloon Styles */
        .balloon {
          position: absolute;
          bottom: -100px;
          width: 40px;
          height: 50px;
          border-radius: 50%;
          animation: floatUp 8s linear infinite;
        }

        .balloon-string {
          position: absolute;
          top: 50px;
          left: 20px;
          width: 2px;
          height: 60px;
          background: #ccc;
        }

        .balloon-red {
          background: radial-gradient(circle at 30% 30%, #ff6b6b, #ff4757);
        }

        .balloon-blue {
          background: radial-gradient(circle at 30% 30%, #74b9ff, #0984e3);
        }

        .balloon-green {
          background: radial-gradient(circle at 30% 30%, #55efc4, #00b894);
        }

        .balloon-yellow {
          background: radial-gradient(circle at 30% 30%, #ffeaa7, #fdcb6e);
        }

        .balloon-purple {
          background: radial-gradient(circle at 30% 30%, #a29bfe, #6c5ce7);
        }

        .balloon-pink {
          background: radial-gradient(circle at 30% 30%, #fd79a8, #e84393);
        }

        /* Flower Styles */
        .flower {
          position: absolute;
          bottom: -50px;
          width: 30px;
          height: 30px;
          animation: floatUp 6s ease-in infinite;
        }

        .flower-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background: #fdcb6e;
          border-radius: 50%;
          z-index: 2;
        }

        .flower-petal {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #e17055;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform-origin: center;
        }

        .petal-1 {
          transform: translate(-50%, -50%) rotate(0deg) translateX(15px);
        }
        .petal-2 {
          transform: translate(-50%, -50%) rotate(60deg) translateX(15px);
        }
        .petal-3 {
          transform: translate(-50%, -50%) rotate(120deg) translateX(15px);
        }
        .petal-4 {
          transform: translate(-50%, -50%) rotate(180deg) translateX(15px);
        }
        .petal-5 {
          transform: translate(-50%, -50%) rotate(240deg) translateX(15px);
        }
        .petal-6 {
          transform: translate(-50%, -50%) rotate(300deg) translateX(15px);
        }

        /* Confetti Styles */
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          opacity: 0;
          animation: confettiFall 4s linear infinite;
        }

        /* Firework Styles */
        .firework {
          position: absolute;
          bottom: 20%;
          width: 4px;
          height: 4px;
          animation: fireworkLaunch 2s ease-out infinite;
        }

        .firework-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ff6b6b;
          animation: fireworkExplode 2s ease-out infinite;
        }

        .firework-particle:nth-child(1) {
          transform: rotate(0deg) translateX(20px);
        }
        .firework-particle:nth-child(2) {
          transform: rotate(45deg) translateX(20px);
          background: #74b9ff;
        }
        .firework-particle:nth-child(3) {
          transform: rotate(90deg) translateX(20px);
          background: #55efc4;
        }
        .firework-particle:nth-child(4) {
          transform: rotate(135deg) translateX(20px);
          background: #fdcb6e;
        }
        .firework-particle:nth-child(5) {
          transform: rotate(180deg) translateX(20px);
          background: #a29bfe;
        }
        .firework-particle:nth-child(6) {
          transform: rotate(225deg) translateX(20px);
          background: #fd79a8;
        }
        .firework-particle:nth-child(7) {
          transform: rotate(270deg) translateX(20px);
          background: #ff6b6b;
        }
        .firework-particle:nth-child(8) {
          transform: rotate(315deg) translateX(20px);
          background: #74b9ff;
        }

        /* Success Card Styles */
        .success-card {
          background: white;
          border-radius: 24px;
          padding: 40px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          position: relative;
          z-index: 10;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: scaleIn 0.5s ease-out;
        }

        .success-icon {
          margin-bottom: 24px;
        }

        .checkmark-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00b894, #00a085);
          margin: 0 auto;
          position: relative;
          animation: checkmarkScale 0.3s ease-out 0.5s both;
        }

        .checkmark-stem {
          position: absolute;
          width: 6px;
          height: 30px;
          background: white;
          left: 38px;
          top: 22px;
          transform: rotate(45deg);
          animation: checkmarkStem 0.3s ease-out 0.8s both;
        }

        .checkmark-kick {
          position: absolute;
          width: 6px;
          height: 15px;
          background: white;
          left: 28px;
          top: 38px;
          transform: rotate(-45deg);
          animation: checkmarkKick 0.3s ease-out 1.1s both;
        }

        .success-content {
          margin-bottom: 8px;
        }

        .success-title {
          font-size: 28px;
          font-weight: bold;
          color: #2d3436;
          margin-bottom: 12px;
          animation: bounceIn 0.6s ease-out 0.3s both;
        }

        .success-message {
          font-size: 16px;
          color: #636e72;
          margin-bottom: 24px;
          line-height: 1.5;
          animation: fadeInUp 0.6s ease-out 0.6s both;
        }

        .student-details {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #dee2e6;
          animation: slideInUp 0.6s ease-out 0.9s both;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .detail-item:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 600;
          color: #495057;
        }

        .detail-value {
          font-weight: 700;
          color: #2d3436;
        }

        .success-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
          animation: fadeInUp 0.6s ease-out 1.2s both;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
          background: #f8f9fa;
          color: #495057;
          border: 2px solid #dee2e6;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: #e9ecef;
          transform: translateY(-2px);
        }

        .welcome-message {
          border-top: 1px solid #dee2e6;
          padding-top: 16px;
          animation: fadeInUp 0.6s ease-out 1.5s both;
        }

        .welcome-message p {
          font-size: 14px;
          color: #636e72;
          margin-bottom: 4px;
        }

        /* Animations */
        @keyframes floatUp {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes fireworkLaunch {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-300px) scale(1);
            opacity: 0;
          }
        }

        @keyframes fireworkExplode {
          0% {
            transform: rotate(var(--rotation)) translateX(0);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation)) translateX(50px);
            opacity: 0;
          }
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          0% {
            transform: translateY(50px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes checkmarkScale {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes checkmarkStem {
          0% {
            height: 0;
          }
          100% {
            height: 30px;
          }
        }

        @keyframes checkmarkKick {
          0% {
            height: 0;
          }
          100% {
            height: 15px;
          }
        }
      `}</style>
    </div>
  );

  // Show loading while fetching internship type
  if (!formData.internshipType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  // Show success card instead of form when registration is completed
  if (showSuccessCard) {
    return <SuccessCelebration />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 px-3 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col items-center justify-center mb-6 sm:mb-8">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg mb-4 sm:mb-6 flex items-center justify-center border border-gray-100">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br white rounded-lg sm:rounded-xl flex items-center justify-center">
                <img src="./logo.png" alt="RORIRI Logo" className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                RORIRI SOFTWARE SOLUTIONS
              </h1>
              <div className="w-16 sm:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto"></div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700">
                Internship Registration
              </h2>
              <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base leading-relaxed px-2">
                Launch your career with hands-on experience in software
                development
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">
            {/* Message Alert */}
            {message && (
              <div
                className={`mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 ${
                  messageType === "success"
                    ? "bg-green-50 border-green-400 text-green-700"
                    : "bg-red-50 border-red-400 text-red-700"
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {messageType === "success" ? (
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Internship Type Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formData.internshipType === "paid"
                      ? "Paid Internship"
                      : "Unpaid Internship"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.internshipType === "paid"
                      ? "This is a paid internship program."
                      : "Registration fee applicable for this internship program."}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Internship type is set by administrator
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    formData.internshipType === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {formData.internshipType === "paid" ? "Paid" : "Unpaid"}
                </div>
              </div>
            </div>

            {!showPaymentSection &&
            !paymentCompleted &&
            !registrationCompleted ? (
              // Registration Form
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                {/* Personal Information */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-5 sm:w-2 sm:h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Personal Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm sm:text-base"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm sm:text-base"
                        placeholder="Enter your email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm sm:text-base"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Educational Information */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-5 sm:w-2 sm:h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Educational Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        College/University{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="college"
                        value={formData.college}
                        onChange={handleChange}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm sm:text-base"
                        placeholder="Enter your college name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department/Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm sm:text-base"
                      >
                        <option value="">Select your department</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Internship Duration */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-5 sm:w-2 sm:h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Internship Duration
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm sm:text-base"
                      >
                        <option value="">Select duration</option>
                        {durationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ✅ Display calculated amount only for unpaid internships */}
                  {formData.internshipType === "unpaid" &&
                    formData.duration && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-blue-800 font-medium">
                              Total Registration Fee:
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              ₹{totalAmount}
                            </span>
                          </div>
                          <div className="text-sm text-blue-600">
                            (₹5000 × {formData.duration}{" "}
                            {formData.duration === "1" ? "month" : "months"})
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* Payment Section - Only for Unpaid Internships */}
                {formData.internshipType === "unpaid" && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-1.5 h-5 sm:w-2 sm:h-6 bg-blue-600 rounded-full"></div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        Payment Information
                      </h3>
                    </div>

                    {/* Payment Mode (moved above Advance) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Mode of Payment <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {[
                          {
                            value: "Online",
                            label: "Online Payment",
                            description: "Pay via Razorpay gateway",
                          },
                          {
                            value: "Cash",
                            label: "Cash Payment",
                            description: "Pay directly at office",
                          },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`relative flex cursor-pointer rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all duration-200 ${
                              formData.paymentMode === option.value
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMode"
                              value={option.value}
                              checked={formData.paymentMode === option.value}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between w-full">
                              <div className="flex-1">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {option.label}
                                  </div>
                                  <div className="text-gray-500 text-xs sm:text-sm">
                                    {option.description}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`flex-shrink-0 w-4 h-4 border-2 rounded-full ml-3 ${
                                  formData.paymentMode === option.value
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              ></div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Advance Amount (only show if Online payment) */}
                    {formData.paymentMode === "Online" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Advance Amount (₹)
                          <span className="text-gray-500 text-xs ml-1">
                            Optional - Pay now to reduce remaining amount
                          </span>
                        </label>
                        <input
                          type="number"
                          name="advanceAmount"
                          value={formData.advanceAmount}
                          onChange={handleChange}
                          min="0"
                          max={totalAmount}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-sm sm:text-base"
                          placeholder="Enter advance amount (optional)"
                        />
                        {formData.advanceAmount && (
                          <div className="mt-2 text-sm text-gray-600">
                            <div>Advance: ₹{advanceAmount}</div>
                            <div>Remaining: ₹{remainingAmount}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Payment Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Amount:</span>
                          <span className="font-medium">₹{totalAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Advance Paid:</span>
                          <span className="font-medium">₹{advanceAmount}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2">
                          <span className="font-semibold">
                            {formData.paymentMode === "Online"
                              ? "Amount to Pay Online:"
                              : "Remaining Amount to Pay at Office:"}
                          </span>
                          <span
                            className={`font-bold ${
                              remainingAmount > 0
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            ₹{remainingAmount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div
                      className={`p-3 sm:p-4 rounded-lg border ${
                        formData.paymentMode === "Online"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-start">
                        <div
                          className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 mt-0.5 ${
                            formData.paymentMode === "Online"
                              ? "text-blue-500"
                              : "text-green-500"
                          }`}
                        >
                          {formData.paymentMode === "Online" ? (
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <h4
                            className={`text-sm font-medium ${
                              formData.paymentMode === "Online"
                                ? "text-blue-800"
                                : "text-green-800"
                            }`}
                          >
                            {formData.paymentMode === "Online"
                              ? "Online Payment Information"
                              : "Cash Payment Information"}
                          </h4>
                          <p
                            className={`text-xs sm:text-sm mt-1 ${
                              formData.paymentMode === "Online"
                                ? "text-blue-700"
                                : "text-green-700"
                            }`}
                          >
                            {formData.paymentMode === "Online"
                              ? remainingAmount > 0
                                ? `After submitting the form, you will be redirected to make payment of ₹${remainingAmount} via Razorpay.`
                                : "No payment required. Your advance covers the full amount."
                              : remainingAmount > 0
                              ? `Please visit our office to complete the registration process and pay the remaining amount of ₹${remainingAmount}.`
                              : "No payment required. Your advance covers the full amount."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 sm:py-4 px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent mr-2 sm:mr-3"></div>
                        <span className="text-sm sm:text-base">
                          Processing Registration...
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
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
                        <span className="text-sm sm:text-base">
                          {formData.internshipType === "paid"
                            ? "Complete Registration"
                            : formData.paymentMode === "Online" &&
                              remainingAmount > 0
                            ? `Register & Pay ₹${advanceAmount}`
                            : `Complete Registration`}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Privacy Note */}
                <div className="text-center pt-4">
                  <p className="text-xs text-gray-500 px-2">
                    By registering, you agree to our{" "}
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Privacy Policy
                    </a>
                    . Your data will be stored securely.
                  </p>
                </div>
              </form>
            ) : showPaymentSection ? (
              // Payment Section - Only for Unpaid Online Internships with remaining amount
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Complete Your Payment
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Please complete the payment of ₹{remainingAmount} to proceed
                    with your registration
                  </p>
                </div>

                {/* Payment Details */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Total Registration Fee
                      </span>
                      <span className="font-semibold">₹{totalAmount}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance Paid</span>
                      <span className="font-semibold text-green-600">
                        - ₹{advanceAmount}.00
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Rate: ₹5000 per month</span>
                      <span>₹5000 × {formData.duration}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3">
                      <span className="text-gray-800 font-medium">
                        Amount to Pay
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        ₹{remainingAmount}.00
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pay Buttons: allow paying advance OR remaining */}
                <div className="pt-4 sm:pt-6 border-t border-gray-200">
                  {advanceAmount > 0 ? (
                    <div className="flex justify-center">
                      <button
                        onClick={() =>
                          initiateRazorpayPayment(
                            studentIdFromServer,
                            advanceAmount
                          )
                        }
                        disabled={loading}
                        className="
    w-full max-w-xs
    bg-gradient-to-r from-yellow-500 to-yellow-600
    hover:from-yellow-600 hover:to-yellow-700
    disabled:from-gray-400 disabled:to-gray-500
    text-white
    py-3 sm:py-4 px-6
    rounded-xl
    font-semibold
    text-base sm:text-lg
    transition-all duration-200
    transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed
    flex items-center justify-center gap-3
    shadow-lg hover:shadow-xl
  "
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                        ) : (
                          <span className="text-sm sm:text-base">
                            Pay Advance ₹{advanceAmount}
                          </span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        initiateRazorpayPayment(
                          studentIdFromServer,
                          remainingAmount
                        )
                      }
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 sm:py-4 px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent mr-2 sm:mr-3"></div>
                          <span className="text-sm sm:text-base">
                            Processing Payment...
                          </span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <span className="text-sm sm:text-base">
                            Pay ₹{remainingAmount} Now
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Back Button */}
                <div className="text-center">
                  <button
                    onClick={() => setShowPaymentSection(false)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    ← Back to Registration
                  </button>
                </div>
              </div>
            ) : paymentCompleted ? (
              // Screenshot Upload Section (After Online Payment)
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
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
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Payment Successful!
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Please upload your payment screenshot for verification
                  </p>
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Screenshot <span className="text-red-500">*</span>
                  </label>

                  {!screenshotPreview ? (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-8 h-8 mb-4 text-gray-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 16"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                            />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">
                              Click to upload
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF (MAX. 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Screenshot Preview
                        </span>
                        <button
                          type="button"
                          onClick={removeScreenshot}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <img
                          src={screenshotPreview}
                          alt="Payment screenshot preview"
                          className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            {paymentScreenshot?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(paymentScreenshot?.size / 1024 / 1024).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Upload a screenshot of your payment confirmation. Supported
                    formats: JPG, PNG, GIF, WebP (max 5MB)
                  </p>
                </div>

                {/* Submit Screenshot Button */}
                <div className="pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    onClick={handleScreenshotSubmit}
                    disabled={loading || !paymentScreenshot}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 sm:py-4 px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent mr-2 sm:mr-3"></div>
                        <span className="text-sm sm:text-base">
                          Uploading Screenshot...
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-sm sm:text-base">
                          Complete Registration
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
