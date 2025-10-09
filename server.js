import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import "dotenv/config";
//import fileUpload from "express-fileupload";
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


//import "./config/sendReminders.js"
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Allowed Origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://shine-crm-backend.vercel.app",
  "https://shine-crm-frontend.vercel.app",
];

await connectDB();

// Middleware Configuration
app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));
// app.use(fileUpload({
//   useTempFiles: true,
//   tempFileDir: "/tmp/",
// }));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
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


app.get("/", (req, res) => {
  res.send("API is working..");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
