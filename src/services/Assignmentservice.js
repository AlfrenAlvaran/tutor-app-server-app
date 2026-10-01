import mongoose from "mongoose";

import { BadRequestError, NotFoundError } from "../utils/error.js";
import { Assignment } from "../models/ScheduleModel.js";
import TutorModel from "../models/TutorModel.js";

function toObjectId(id, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${label}`);
  }
  return id;
}

export async function listAssignments(filters = {}) {
  const query = {};
  if (filters.studentId)
    query.student = toObjectId(filters.studentId, "studentId");
  if (filters.tutorId) query.tutor = toObjectId(filters.tutorId, "tutorId");
  if (filters.status) query.status = filters.status;

  return Assignment.find(query)
    .populate("student", "name program")
    .populate("tutor", "name subject")
    .sort({ createdAt: -1 });
}

export async function getAssignmentById(id) {
  toObjectId(id, "assignmentId");
  const assignment = await Assignment.findById(id)
    .populate("student", "name program")
    .populate("tutor", "name subject");
  if (!assignment) throw new NotFoundError("Assignment not found");
  return assignment;
}

export async function getMyAssignedStudents(tutorEmail) {
  const tutor = await TutorModel.findOne({ email: tutorEmail.toLowerCase() });

  if (!tutor) throw new NotFoundError("Tutor not found");

  const assignments = await Assignment.find({
    tutor: tutor._id,
    status: "active",
  })
    .populate("student", "name email program mode schedulePreference")
    .populate("tutor", "name profession");

  return assignments;
}

export async function createAssignment(payload) {
  const { studentId, tutorId, subject, status, schedule } = payload;
  toObjectId(studentId, "studentId");
  toObjectId(tutorId, "tutorId");

  const assignment = await Assignment.create({
    student: studentId,
    tutor: tutorId,
    subject,
    status: status ?? "active",
    schedule,
  });

  return getAssignmentById(assignment._id);
}

export async function updateAssignment(id, payload) {
  toObjectId(id, "assignmentId");
  const update = {};
  if (payload.studentId)
    update.student = toObjectId(payload.studentId, "studentId");
  if (payload.tutorId) update.tutor = toObjectId(payload.tutorId, "tutorId");
  if (payload.subject) update.subject = payload.subject;
  if (payload.status) update.status = payload.status;
  if (payload.schedule) update.schedule = payload.schedule;

  const assignment = await Assignment.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!assignment) throw new NotFoundError("Assignment not found");

  return getAssignmentById(assignment._id);
}

export async function deleteAssignment(id) {
  toObjectId(id, "assignmentId");
  const assignment = await Assignment.findByIdAndDelete(id);
  if (!assignment) throw new NotFoundError("Assignment not found");
  return assignment;
}

export async function toggleAssignmentStatus(id, explicitStatus) {
  toObjectId(id, "assignmentId");
  const assignment = await Assignment.findById(id);
  if (!assignment) throw new NotFoundError("Assignment not found");

  assignment.status =
    explicitStatus ?? (assignment.status === "active" ? "paused" : "active");
  await assignment.save();

  return getAssignmentById(assignment._id);
}

function slotHours(slot) {
  const [sh, sm] = slot.startTime.split(":").map(Number);
  const [eh, em] = slot.endTime.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? mins / 60 : 0;
}

export async function getAssignmentStats() {
  const assignments = await Assignment.find({}, "tutor status schedule");

  const total = assignments.length;
  const active = assignments.filter((a) => a.status === "active").length;
  const tutorsInUse = new Set(assignments.map((a) => String(a.tutor))).size;
  const weeklyHours = assignments.reduce(
    (sum, a) => sum + a.schedule.reduce((s, slot) => s + slotHours(slot), 0),
    0,
  );

  return { total, active, tutorsInUse, weeklyHours };
}
