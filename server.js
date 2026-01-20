import express from "express";
import connectDB from "./config/db.js";
import "dotenv/config";
import cors from "cors";
import helmet from "helmet";

// Route imports
import adminRoutes from "./routes/AdminRoutes.js";
import authRoutes from "./routes/AuthRoutes.js";
import projectRoutes from "./routes/ProjectRoutes.js";
import leadRoutes from "./routes/LeadRoutes.js";
import employeeRoutes from "./routes/EmployeeRoutes.js";
import invoiceRoutes from "./routes/InvoiceRoutes.js";
import pushRoutes from "./routes/PushRoutes.js";
import monthlyProjectRouter from "./routes/MonthlyProjectDetailsRoutes.js";
import OfficeExpenseRoutes from "./routes/officeExpenseRoutes.js";
import attendanceRoutes from "./routes/AttendanceRoutes.js";
import taskRoutes from "./routes/TaskRoutes.js";
import employeeTimesheetRoutes from "./routes/EmployeeTimesheetRoutes.js";
import unitRoutes from "./routes/UnitRoutes.js";
import settingsRoutes from "./routes/SettingsRoutes.js";
import backupRoutes from "./routes/BackupRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
const app = express();
const port = process.env.PORT || 5000;

// Database connection
await connectDB();

// Middleware configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  frameguard: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5000", 
    "https://shine-crm-backend.vercel.app",
    "https://shine-crm-backend-eight.vercel.app",
    "https://shine-crm-frontend.vercel.app",
    "https://shine-crm-frontend-sable.vercel.app"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/monthly-projects", monthlyProjectRouter);
app.use("/api/office-expenses", OfficeExpenseRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employee-timesheet", employeeTimesheetRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/backup", backupRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Shine CRM API is running securely" });
});

app.get("/health", async (req, res) => {
  try {
    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    res.json({ 
      status: 'OK', 
      database: states[dbState] || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running securely on port ${port}`);
});
