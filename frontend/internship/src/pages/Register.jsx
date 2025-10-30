import React, { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import logo from "../frontend_assets/logo.png";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr("");
    setSuccess("");

    try {
      const { data } = await API.post("/admin/register", { name, email, password });
      setSuccess(data.message || "Admin Registered Successfully!");
      setTimeout(() => nav("/login"), 1500);
    } catch (error) {
      setErr(error.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white rounded-2xl p-3 shadow-lg mb-4">
            <img src={logo} alt="RORIRI" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">RORIRI SOFTWARE SOLUTIONS</h1>
          <h2 className="text-lg font-semibold text-white/70 text-center mt-1">Admin Registration</h2>
        </div>

        {err && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-100 text-sm">
            {err}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-400/50 rounded-lg text-green-100 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-white/80 text-sm">Full Name</label>
            <input
              type="text"
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm">Email</label>
            <input
              type="email"
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm">Password</label>
            <input
              type="password"
              className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-[1.02] text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50"
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-white/50 text-sm mt-6">
          Already have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => nav("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
