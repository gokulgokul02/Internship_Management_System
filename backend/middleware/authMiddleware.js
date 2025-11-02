// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
require("dotenv").config();

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin exists in database and get current data
    const admin = await Admin.findByPk(decoded.id, {
      attributes: ["id", "email", "type", "createdAt"]
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found or token invalid" });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      type: admin.type
    };
    
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    
    res.status(500).json({ message: "Authentication error" });
  }
};

// Middleware to require SuperAdmin role
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.admin.type !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      message: "Access denied. SuperAdmin privileges required." 
    });
  }
  
  next();
};

// Middleware to require Admin or SuperAdmin role
const requireAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.admin.type)) {
    return res.status(403).json({ 
      message: "Access denied. Admin privileges required." 
    });
  }
  
  next();
};

// Optional: Check if user can access specific resource (for user-specific operations)
const canAccessAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const requestedAdminId = parseInt(req.params.id);
  const currentAdminId = parseInt(req.admin.id);

  // SuperAdmin can access any admin, regular admin can only access themselves
  if (req.admin.type !== 'SUPER_ADMIN' && currentAdminId !== requestedAdminId) {
    return res.status(403).json({ 
      message: "Access denied. You can only access your own data." 
    });
  }
  
  next();
};

// Optional: Check if user can modify student data (add custom business logic)
const canModifyStudent = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Add any student-specific permission logic here
  // For example, restrict certain operations based on admin type
  if (req.method === 'DELETE' && req.admin.type !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      message: "Access denied. Only SuperAdmin can delete students." 
    });
  }
  
  next();
};

// Rate limiting helper (optional)
const createRateLimiter = (windowMs, maxRequests) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamp] of requests.entries()) {
      if (timestamp < windowStart) {
        requests.delete(key);
      }
    }
    
    // Check rate limit
    const userRequests = Array.from(requests.values())
      .filter(timestamp => timestamp > windowStart)
      .length;
    
    if (userRequests >= maxRequests) {
      return res.status(429).json({ 
        message: "Too many requests. Please try again later." 
      });
    }
    
    // Add current request
    requests.set(ip, now);
    
    next();
  };
};

// Apply rate limiting to auth routes
const authRateLimit = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
const generalRateLimit = createRateLimiter(60 * 1000, 60); // 60 requests per minute

module.exports = {
  protect,
  requireSuperAdmin,
  requireAdmin,
  canAccessAdmin,
  canModifyStudent,
  authRateLimit,
  generalRateLimit
};