import mongoose from "mongoose";

const PptSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    lesson: {
      type: String,
      required: [true, "Lesson is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    // Cloudinary's public_id — needed to delete the remote file later.
    fileId: {
      type: String,
      default: null,
    },
    // Which program this PPT belongs to. Adjust ref: "program" if your
    // Program model is registered under a different name.
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: [true, "Program is required"],
    },
    // Points at the Tutor profile (not the User account) that owns this
    // PPT, consistent with the email-join pattern used for tutorId
    // elsewhere in the app.
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tutor",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const PptModel = mongoose.model("ppt", PptSchema);

export default PptModel;