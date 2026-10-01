import crypto from "crypto";
import { StudentModel } from "../models/StudentModel.js";
import  TutorModel  from "../models/TutorModel.js"; // adjust path if different
import AssignStudentModel from "../models/AssignStudentModel.js"; // adjust path if different
import { AttendanceModel } from "../models/ParticipationModel.js";


function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function generateRefCode() {
  // e.g. "7F3K-9QZP"
  const part = () => crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
  return `${part()}-${part()}`;
}

// A session can't be "finished" until the student has an assignment record
// (their start date lives on AssignStudentModel.createdAt, not on
// StudentModel.assignedAt) and their program has a structured
// durationInDays. Returns null if there isn't enough info to compute it yet.
function computeSessionEndDate(assignment, durationInDays) {
  if (!assignment?.createdAt || !durationInDays) return null;
  const end = new Date(assignment.createdAt);
  end.setDate(end.getDate() + durationInDays);
  return end;
}

// Checks completion and lazily persists sessionFinished/sessionFinishedAt
// the first time it's detected, so the flag stays in sync without a cron job.
async function ensureSessionFinishedFlag(student, assignment, durationInDays) {
  if (student.sessionFinished) return true;

  const endDate = computeSessionEndDate(assignment, durationInDays);
  if (!endDate || new Date() < endDate) return false;

  student.sessionFinished = true;
  student.sessionFinishedAt = endDate;
  await student.save();
  return true;
}

// ---------- STUDENT: generate ref/QR for today ----------

export async function generateAttendanceCode(req, res) {
  try {
    // req.user is the auth account (UserModel doc), not the StudentModel
    // profile — those are separate documents joined by email.
    const student = await StudentModel.findOne({ email: req.user.email }).populate("program");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (!student.assignedTutor) {
      return res.status(400).json({
        success: false,
        message: "You don't have a tutor assigned yet, so an attendance code can't be generated.",
      });
    }

    // The assignment record (not StudentModel.assignedAt) is the source of
    // truth for when this student-tutor pairing started. If a student has
    // been reassigned more than once, take the most recent one.
    const assignment = await AssignStudentModel.findOne({ student_id: student._id }).sort({
      createdAt: -1,
    });

    // Program session already completed (assignment.createdAt +
    // program.durationInDays has elapsed) — no more codes. This also
    // lazily flips sessionFinished the first time it's detected.
    const finished = await ensureSessionFinishedFlag(
      student,
      assignment,
      student.program?.durationInDays,
    );
    if (finished) {
      return res.status(403).json({
        success: false,
        message: "Your program session has already been completed. You can no longer generate an attendance code.",
        finishedAt: student.sessionFinishedAt,
      });
    }

    const today = startOfDay();

    // Reuse existing record for today instead of creating a duplicate
    // (schema has a unique index on { student, date })
    let record = await AttendanceModel.findOne({ student: student._id, date: today });

    if (record) {
      return res.status(200).json({ success: true, data: record, reused: true });
    }

    const refCode = generateRefCode();
    const qrPayload = JSON.stringify({ refCode, studentId: student._id, date: today.toISOString() });

    record = await AttendanceModel.create({
      student: student._id,
      tutor: student.assignedTutor,
      assignment: assignment?._id || null,
      date: today,
      refCode,
      qrPayload,
      status: "pending",
      expiresAt: endOfDay(),
    });

    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Attendance already generated for today" });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ---------- TEACHER: scan or type the refCode to check in ----------

const LATE_CUTOFF_HOUR = 9; // example: after 9am counts as late

export async function checkInByRefCode(req, res) {
  try {
    const { refCode } = req.body;

    if (!refCode) {
      return res.status(400).json({ success: false, message: "refCode is required" });
    }

    // Same email-join pattern as the student lookup above — req.user is
    // the auth account, TutorModel is a separate profile document.
    const tutor = await TutorModel.findOne({ email: req.user.email });

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "No tutor profile is linked to this account yet.",
      });
    }

    const record = await AttendanceModel.findOne({ refCode: refCode.trim().toUpperCase() });

    if (!record) {
      return res.status(404).json({ success: false, message: "Invalid or unknown code" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: "This code has expired" });
    }

    if (record.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: `Already marked as "${record.status}"`,
      });
    }

    const now = new Date();
    const isLate = now.getHours() >= LATE_CUTOFF_HOUR;

    record.status = isLate ? "late" : "present";
    record.checkInTime = now;
    record.tutor = tutor._id; // confirm/overwrite with the tutor who actually checked them in

    await record.save();

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ---------- optional: teacher marks checkout ----------

export async function checkOutByRefCode(req, res) {
  try {
    const { refCode } = req.body;

    const record = await AttendanceModel.findOne({ refCode: refCode.trim().toUpperCase() });

    if (!record) {
      return res.status(404).json({ success: false, message: "Invalid or unknown code" });
    }

    if (record.status === "pending" || record.status === "absent") {
      return res.status(409).json({ success: false, message: "Student was never checked in" });
    }

    record.checkOutTime = new Date();
    await record.save();

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}