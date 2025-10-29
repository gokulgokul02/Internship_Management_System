import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>
      <p>
        <Link to="/students">Manage Students</Link>
      </p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
