import { z } from "zod";
import { SCHEDULE_DAYS as DAYS } from "../common/index.js";
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const scheduleSlotSchema = z
  .object({
    day: z.enum(DAYS),
    startTime: z.string().regex(timeRegex, "startTime must be HH:mm"),
    endTime: z.string().regex(timeRegex, "endTime must be HH:mm"),
  })
  .refine((slot) => slot.endTime > slot.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const createAssignmentSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  tutorId: z.string().min(1, "tutorId is required"),
  subject: z.string().min(1, "subject is required"),
  status: z.enum(["active", "paused"]).optional(),
  schedule: z
    .array(scheduleSlotSchema)
    .min(1, "At least one schedule slot is required"),
});

// All fields optional for PATCH-style updates
export const updateAssignmentSchema = createAssignmentSchema.partial();

export const toggleStatusSchema = z.object({
  status: z.enum(["active", "paused"]).optional(),
});
