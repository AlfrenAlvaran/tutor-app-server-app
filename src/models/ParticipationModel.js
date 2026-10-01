import mongoose from "mongoose";

const ATTENDANCE_STATUSES = ["pending", "present", "absent", "late"];

const schema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: [true, "Student is required"],
    },

    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tutor",
      required: [true, "Tutor is required"],
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "assignStudent",
      default: null,
    },

    // Calendar day this record belongs to, normalized to 00:00:00.
    date: {
      type: Date,
      required: true,
    },

    // Human-typeable code, e.g. "7F3K-9QZP". Unique per record.
    refCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Raw string encoded into the QR image (kept separate from refCode
    // in case you later want to sign/encrypt the QR payload).
    qrPayload: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: {
        values: ATTENDANCE_STATUSES,
        message: "{VALUE} is not a valid attendance status",
      },
      default: "pending",
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    // The code stops being valid at the end of the day it was created.
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes are too long"],
      default: "",
    },
  },
  { timestamps: true },
);

// A student can only have one attendance record per calendar day.
schema.index({ student: 1, date: 1 }, { unique: true });

export const AttendanceModel = mongoose.model("participation", schema);
export const ATTENDANCE_STATUS_LIST = ATTENDANCE_STATUSES;