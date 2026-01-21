import path from "path";
import cloudinary from "cloudinary";
import fs from "fs";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath, folder = "employees") => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const isRaw = [".pdf", ".doc", ".docx"].includes(ext);
    
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder,
      resource_type: isRaw ? "raw" : "auto", 
    });
    
    // Remove temp file after upload
    fs.unlink(filePath, () => {});
    return result;
  } catch (err) {
    throw err;
  }
};

export const deleteFromCloudinary = async (public_id) => {
  try {
    await cloudinary.v2.uploader.destroy(public_id);
  } catch (error) {
    throw error;
  }
};
