import cloudinary from "../config/cloudinary.js";

export function uploadBufferToCloudinary(
  buffer,
  { fileName, folder = "ppts" },
) {
  return new Promise((resolve, reject) => {
    const safeName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 60);

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder,
        public_id: `${safeName}-${Date.now()}`,
        use_filename: true,
        unique_filename: true,
        type: "upload",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export function deleteFromCloudinary(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}