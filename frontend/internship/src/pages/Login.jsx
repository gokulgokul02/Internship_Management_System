import React, { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import logo from "../frontend_assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setErr("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setErr("");

    try {
      const { data } = await API.post("/admin/login", { email, password });

      if (!data.token || !data.admin) {
        setErr("Invalid response from server");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      localStorage.setItem("adminType", data.admin.type);

      setErr(`✅ Login successful! Welcome ${data.admin.type}`);
      
      setTimeout(() => navigate("/"), 1000);

    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      setErr(error.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const getAdminTypeBadge = (type) => {
    const badgeStyles = {
      SUPER_ADMIN: "bg-gradient-to-r from-purple-500 to-pink-500",
      ADMIN: "bg-gradient-to-r from-blue-500 to-cyan-500",
    };

    const displayText = {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
    };

    return (
      <span className={`${badgeStyles[type]} text-white text-xs font-bold px-3 py-1 rounded-full`}>
        {displayText[type]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">

      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Company Logo" className="w-16 h-16 mb-3" />
          <h1 className="text-white text-2xl font-bold">RORIRI SOFTWARE SOLUTIONS</h1>
          <p className="text-white/70 mt-2">Admin Portal</p>
        </div>

        {err && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${err.includes("✅") ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"}`}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Enter email"
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <input
            type="password"
            placeholder="Enter password"
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-xs text-white/50 mt-6">
          © {new Date().getFullYear()} RORIRI SOFTWARE SOLUTIONS
        </div>
      </div>
    </div>
  );
};

export default Login;
