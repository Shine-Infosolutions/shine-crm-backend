import mongoose from "mongoose";
import Unit from "./models/Unit.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const seedUnits = async () => {
  try {
    await connectDB();
    
    const defaultUnits = [
      { name: "Unit", abbreviation: "" },
      { name: "Pieces", abbreviation: "pcs" },
      { name: "Kilograms", abbreviation: "kg" },
      { name: "Liters", abbreviation: "L" },
      { name: "Pack", abbreviation: "pack" },
      { name: "Dozen", abbreviation: "dz" },
      { name: "Meters", abbreviation: "m" },
      { name: "Square Feet", abbreviation: "sq ft" },
      { name: "Hours", abbreviation: "hrs" },
      { name: "Days", abbreviation: "days" },
    ];

    await Unit.deleteMany({});
    await Unit.insertMany(defaultUnits);
    
    console.log("Units seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding units:", error);
    process.exit(1);
  }
};

seedUnits();