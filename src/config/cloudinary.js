import { v2 as cloudinary } from "cloudinary";
import { ENV } from "../libs/environments.js";

cloudinary.config({
  cloud_name: ENV.cloudinaryCloudName,
  api_key: ENV.cloudinaryApiKey,
  api_secret: ENV.cloudinaryApiSecret,
});

// TEMPORARY — remove after confirming
console.log("Cloudinary config check:", {
  cloud_name: ENV.cloudinaryCloudName,
  api_key: ENV.cloudinaryApiKey ? `${ENV.cloudinaryApiKey.slice(0, 4)}...` : "MISSING",
  api_secret: ENV.cloudinaryApiSecret ? "present" : "MISSING",
});

export default cloudinary;