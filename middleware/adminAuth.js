import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'admin') {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
      req.user = { ...user.toObject(), role: 'admin' };
    } else {
      const employee = await Employee.findById(decoded.userId);
      if (!employee) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
      req.user = { ...employee.toObject(), role: 'employee' };
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
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