import { Router } from "express";
import {
  requestCheckInQr,
  requestCheckOutQr,
  getTodayAttendanceStatus,
  scanAttendance,
} from "../controllers/attendanceController.js";
// import {  restrictTo } from "../middleware/auth.js"; // adjust path to wherever protect/restrictTo actually live
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const attendanceRouter = Router();

// Student-facing: generate the QR shown on the kiosk screen
attendanceRouter.get("/students/:studentId/attendance/today", getTodayAttendanceStatus);
attendanceRouter.get("/students/:studentId/attendance/check-in-qr", requestCheckInQr);
attendanceRouter.get("/students/:studentId/attendance/check-out-qr", requestCheckOutQr);

// Tutor-facing: scan a student's QR to check them in/out.
// protect() populates req.user from the auth cookie; only tutors may scan.
attendanceRouter.post("/attendance/scan", protect, restrictTo("tutor"), scanAttendance);

export default attendanceRouter;