import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userModel = decoded.role === 'admin' ? User : Employee;
    const user = await userModel.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    
    req.user = { ...user.toObject(), role: decoded.role, _id: decoded.userId };
    next();
  } catch (error) {
    const errorMessages = {
      'TokenExpiredError': 'Token expired.',
      'JsonWebTokenError': 'Invalid token.'
    };
    
    const message = errorMessages[error.name] || 'Authentication failed.';
    res.status(401).json({ success: false, message });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
