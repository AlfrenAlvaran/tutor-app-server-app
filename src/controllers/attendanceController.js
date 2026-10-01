import {
  generateCheckInQr,
  generateCheckOutQr,
  getTodayAttendance,
  scanAttendanceToken,
} from "../services/attendanceService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/error.js";
import { scanAttendanceSchema } from "../validators/attendaceValidation.js";

export const requestCheckInQr = asyncHandler(async (req, res) => {
  const data = await generateCheckInQr(req.params.studentId);
  return res.json(data);
});

export const requestCheckOutQr = asyncHandler(async (req, res) => {
  const data = await generateCheckOutQr(req.params.studentId);
  return res.json(data);
});

export const getTodayAttendanceStatus = asyncHandler(async (req, res) => {
  const data = await getTodayAttendance(req.params.studentId);
  return res.json(data);
});

export const scanAttendance = asyncHandler(async (req, res) => {
  const parsed = scanAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(
      "Invalid attendance scan payload",
      parsed.error.flatten().fieldErrors,
    );
  }

  const record = await scanAttendanceToken(parsed.data.token, req.tutor._id);
  return res.json(record);
});
