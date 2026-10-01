import mongoose from "mongoose";

const SCHEDULE_DAY = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "",
];

const schema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "student",
      required: true,
    },

    teacher_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tutor",
      required: true,
    },

    scheduleDay: {
      type: String,
      enum: {
        values: SCHEDULE_DAY,
        message: "{VALUE} is not a valid day",
      },
      default: "",
    },

    scheduleStartTime: {
      type: String,
      trim: true,
      default: "",
    },

    scheduleEndTime: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const AssignStudentModel = mongoose.model("assignStudent", schema);

export default AssignStudentModel;
export const ASSIGNMENT_SCHEDULE_DAYS = SCHEDULE_DAY;