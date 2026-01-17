import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (userId, role) => 
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '365d' });

const createUserResponse = (user, role, token = null) => {
  const response = {
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: role === 'admin',
    role,
    ...(role === 'employee' && { employee_id: user.employee_id })
  };
  
  return token ? { success: true, token, user: response } : response;
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try admin login first
    const user = await User.findOne({ email }).select('+password');
    if (user && await bcrypt.compare(password, user.password)) {
      const token = generateToken(user._id, 'admin');
      return res.json(createUserResponse(user, 'admin', token));
    }

    // Try employee login
    const employee = await Employee.findOne({ email }).select('+password');
    if (employee && await bcrypt.compare(password, employee.password)) {
      const token = generateToken(employee._id, 'employee');
      return res.json(createUserResponse(employee, 'employee', token));
    }

    return res.status(401).json({ success: false, message: "Invalid email or password" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUserAccount = async (userData, isAdmin = false) => {
  const { name, email, password } = userData;
  
  const userExists = await User.findOne({ email });
  if (userExists) throw new Error("User already exists");

  return await User.create({ name, email, password, isAdmin });
};

export const register = async (req, res) => {
  try {
    const user = await createUserAccount(req.body);
    const token = generateToken(user._id, 'admin');
    
    res.status(201).json({
      token,
      user: createUserResponse(user, 'admin')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const admin = await createUserAccount(req.body, true);
    
    res.status(201).json({
      message: "Admin created successfully",
      user: createUserResponse(admin, 'admin')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await createUserAccount(req.body, false);
    
    res.status(201).json({
      message: "User created successfully",
      user: createUserResponse(user, 'admin')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
