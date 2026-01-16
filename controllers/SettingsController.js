import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Lead from "../models/Lead.js";
import Project from "../models/Project.js";
import Attendance from "../models/Attendance.js";
import Invoice from "../models/Invoice.js";
import bcrypt from "bcryptjs";

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;
    const role = req.user.role;

    let user;
    if (role === 'admin') {
      user = await User.findById(userId).select('+password');
    } else {
      user = await Employee.findById(userId).select('+password');
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const backupData = async (req, res) => {
  try {
    const { dataType } = req.params;
    let data;

    switch (dataType) {
      case 'employees':
        data = await Employee.find().select('-password');
        break;
      case 'leads':
        data = await Lead.find();
        break;
      case 'projects':
        data = await Project.find();
        break;
      case 'attendance':
        data = await Attendance.find();
        break;
      case 'invoices':
        data = await Invoice.find();
        break;
      case 'contracts':
        // Contracts not implemented yet, return empty array
        data = [];
        break;
      default:
        return res.status(400).json({ message: `Invalid data type: ${dataType}. Supported types: employees, leads, projects, attendance, invoices, contracts` });
    }

    res.json(data);
  } catch (error) {
    console.error(`Error backing up ${req.params.dataType}:`, error);
    res.status(500).json({ message: error.message });
  }
};
