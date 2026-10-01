import mongoose from "mongoose";

const STATUSES = ["check_in", "completed"];

const schema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "student",
    required: true,
  },

  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tutor",
    required: true,
  },

  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Program",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: STATUSES,
    default: "check_in",
  },

  checkInAt: {
    type: Date,
    default: null,
  },
  checkOutAt: {
    type: Date,
    default: null,
  },

  checkInTokenId: {
    type: String,
    default: null,
  },
  checkOutTokenId: {
    type: String,
    default: null,
  },
}, {
    timestamps: true
});


schema.index({ student: 1, date: 1 }, { unique: true });

export const AttendanceModel = mongoose.model("attendance", schema)

export const ATTENDANCE_STATUSES = STATUSES