import multer from "multer";

const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.ms-powerpoint", // .ppt
  "application/pdf", // .pdf
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

const ALLOWED_EXTENSIONS = /\.(pptx?|pdf|docx?)$/i;

function fileFilter(req, file, cb) {
  const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.test(file.originalname);

  if (mimeOk || extOk) {
    return cb(null, true);
  }

  cb(new Error("Only PPT, PPTX, PDF, DOC, or DOCX files are allowed."));
}

const uploadPpt = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB cap, adjust as needed
  fileFilter,
});

export default uploadPpt;