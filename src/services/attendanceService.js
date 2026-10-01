import { AttendanceModel } from "../models/AttendaceModel.js";
import { StudentModel } from "../models/StudentModel.js";
import { Assignment } from "../models/ScheduleModel.js";
import { attendanceToken, verifyAttendance } from "../utils/token.js";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fail(message, status) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export async function generateCheckInQr(studentId) {
  try {
    console.log("Student ID: " + studentId);

    const student = await StudentModel.findById(studentId).populate(
      "program",
      "label",
    );

    if (!student) {
      fail("Student not found", 404);
    }

    const assignment = await Assignment.findOne({
      student: studentId,
      status: "active",
    });

    if (!assignment) {
      fail("Student has no active tutor assignment", 400);
    }

    const existing = await AttendanceModel.findOne({
      student: studentId,
      date: startOfToday(),
    });

    if (existing) {
      fail("Attendance already started for today", 400);
    }

    const { token, expiresAt } = attendanceToken({
      studentId: String(student._id),
      tutorId: String(assignment.tutor),
      purpose: "check-in",
    });

    return {
      qrToken: token,
      expiresAt,
      display: {
        name: student.name,
        program: student.program?.label ?? "",
        scheduleDay: student.scheduleDay,
        scheduleStartTime: student.scheduleStartTime,
      },
    };
  } catch (err) {
    console.error("!!! generateCheckInQr crashed:", err);
    throw err;
  }
}

export async function generateCheckOutQr(studentId) {
  const record = await AttendanceModel.findOne({
    student: studentId,
    date: startOfToday(),
  });

  if (!record) {
    fail("No active check-in to check out of", 400);
  }

  const { token, expiresAt } = attendanceToken({
    studentId: String(record.student),
    tutorId: String(record.tutor),
    purpose: "check-out",
  });

  return { qrToken: token, expiresAt };
}

export async function scanAttendanceToken(rawToken, scanningTutorId) {
  let payload;
  try {
    payload = verifyAttendance(rawToken);
  } catch (error) {
    fail("QR code invalid or has expired: " + error, 400);
  }

  const { studentId, tutorId, purpose, jti } = payload;

  if (String(scanningTutorId) !== String(tutorId)) {
    fail("This QR isn't assigned to you", 403);
  }

  if (purpose === "check-in") {
    return handleCheckIn({ studentId, tutorId, jti });
  }

  if (purpose === "check-out") {
    return handleCheckOut({ studentId, jti });
  }

  fail("Unknown QR purpose", 400);
}

async function handleCheckIn({ studentId, tutorId, jti }) {
  const alreadyExist = await AttendanceModel.findOne({
    student: studentId,
    date: startOfToday(),
  });

  if (alreadyExist) {
    fail("Student is already checked in today", 400);
  }

  const student = await StudentModel.findById(studentId);
  if (!student) fail("Student not found", 404);

  const record = await AttendanceModel.create({
    student: studentId,
    tutor: tutorId,
    program: student.program,
    date: startOfToday(),
    status: "check_in",
    checkInAt: new Date(),
    checkInTokenId: jti,
  });

  return record;
}

async function handleCheckOut({ studentId, jti }) {
  const record = await AttendanceModel.findOne({
    student: studentId,
    date: startOfToday(),
  });

  if (!record || record.status !== "check_in") {
    fail("No active check-in to close out", 400);
  }

  if (record.checkOutTokenId === jti) {
    fail("This QR has already been used", 400);
  }

  record.status = "completed";
  record.checkOutAt = new Date();
  record.checkOutTokenId = jti;
  await record.save();

  return record;
}

export async function getTodayAttendance(studentId) {
  const record = await AttendanceModel.findOne({
    student: studentId,
    date: startOfToday(),
  });

  return {
    status: record?.status ?? null,
  };
}