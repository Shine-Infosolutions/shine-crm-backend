import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'admin') {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      req.user = { ...user.toObject(), role: 'admin' };
    } else {
      const employee = await Employee.findById(decoded.userId);
      if (!employee) {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      req.user = { ...employee.toObject(), role: 'employee' };
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'admin' || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};