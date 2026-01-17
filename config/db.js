import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    mongoose.connection.on("connected", () => {
      console.log("✅ Connected to MongoDB securely");
    });
    
    await mongoose.connect(process.env.MONGODB_URI, options);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
