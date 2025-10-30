import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import PrivateRoute from "./components/PrivateRoute";
import Certificates from "./pages/Certificates";
import Register from "./pages/Register";
import Admins from "./pages/Admins"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
        <Route path="/register" element={<PrivateRoute><Register/></PrivateRoute>} />
        <Route path="/students" element={<PrivateRoute><Students/></PrivateRoute>} />
        <Route path="/certificates" element={<PrivateRoute><Certificates/></PrivateRoute>} />
        <Route path="/admins" element={<PrivateRoute><Admins/></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
