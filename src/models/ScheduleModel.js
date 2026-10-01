import mongoose from "mongoose";
import { SCHEDULE_DAYS as DAYS } from "../common/index.js";

const scheduleSlotSchema = mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAYS,
      require: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
  {
    _id: true,
  },
);

const assignmentSchema = new mongoose.Schema(
  {
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
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
    schedule: {
      type: [scheduleSlotSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one schedule slot is required",
      },
    },
  },
  {
    timestamps: true,
  },
);

assignmentSchema.index({ student: 1, tutor: 1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
