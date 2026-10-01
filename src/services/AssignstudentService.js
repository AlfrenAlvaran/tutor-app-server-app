import mongoose from "mongoose";
import AssignStudentModel, {
  ASSIGNMENT_SCHEDULE_DAYS,
} from "../models/AssignStudentModel.js";
import { StudentModel } from "../models/StudentModel.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getAssignableStudents = async ({ search, limit } = {}) => {
  const query = {};

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ name: regex }, { email: regex }];
  }

  let cursor = StudentModel.find(query)
    .populate("program", "label")
    .populate("assignedTutor", "name");

  if (limit) {
    cursor = cursor.limit(Number(limit));
  }

  return cursor;
};

export const getStudentById = async (id) => {
  if (!isValidId(id)) {
    const err = new Error("Invalid student Id");
    err.status = 400;
    throw err;
  }

  const student = await StudentModel.findById(id)
    .populate("program", "label")
    .populate("assignedTutor", "name");

  return student;
};

export const getAllStudents = async () => {
  return StudentModel.find()
    .populate("program", "label")
    .populate("assignedTutor", "name")
    .sort({ createdAt: -1 });
};

const validateSchedule = ({
  scheduleDay,
  scheduleStartTime,
  scheduleEndTime,
}) => {
  if (scheduleDay && !ASSIGNMENT_SCHEDULE_DAYS.includes(scheduleDay)) {
    const err = new Error(`${scheduleDay} is not a valid day`);
    err.status = 400;
    throw err;
  }

  if (
    (scheduleStartTime && !scheduleEndTime) ||
    (!scheduleStartTime && scheduleEndTime)
  ) {
    const err = new Error("Both a start time and end time are required");
    err.status = 400;
    throw err;
  }
};

const syncStudentSchedule = async (studentId, teacherId, schedule) => {
  const update = {
    assignedTutor: teacherId,
    assignedAt: new Date(),
  };

  if (schedule.scheduleDay !== undefined)
    update.scheduleDay = schedule.scheduleDay;
  if (schedule.scheduleStartTime !== undefined) {
    update.scheduleStartTime = schedule.scheduleStartTime;
  }
  if (schedule.scheduleEndTime !== undefined) {
    update.scheduleEndTime = schedule.scheduleEndTime;
  }

  await StudentModel.findByIdAndUpdate(studentId, update);
};

export const assignStudentToTeacher = async (
  studentId,
  teacherId,
  schedule = {},
) => {
  if (!isValidId(studentId) || !isValidId(teacherId)) {
    const err = new Error("Invalid student or teacher id");
    err.status = 400;
    throw err;
  }

  validateSchedule(schedule);

  const student = await StudentModel.findById(studentId);
  if (!student) {
    const err = new Error("Student not found");
    err.status = 404;
    throw err;
  }

  const existing = await AssignStudentModel.findOne({
    student_id: studentId,
    teacher_id: teacherId,
  });
  if (existing) {
    const err = new Error("Student is already assigned to this teacher");
    err.status = 409;
    throw err;
  }

  const assignment = await AssignStudentModel.create({
    student_id: studentId,
    teacher_id: teacherId,
    scheduleDay: schedule.scheduleDay || "",
    scheduleStartTime: schedule.scheduleStartTime || "",
    scheduleEndTime: schedule.scheduleEndTime || "",
  });

  await syncStudentSchedule(studentId, teacherId, schedule);

  return assignment;
};

export const reassignStudent = async (
  assignmentId,
  newTeacherId,
  schedule = {},
) => {
  if (!isValidId(assignmentId) || !isValidId(newTeacherId)) {
    const err = new Error("Invalid assignment or teacher id");
    err.status = 400;
    throw err;
  }

  validateSchedule(schedule);

  const assignment = await AssignStudentModel.findById(assignmentId);
  if (!assignment) {
    const err = new Error("Assignment not found");
    err.status = 404;
    throw err;
  }

  assignment.teacher_id = newTeacherId;
  if (schedule.scheduleDay !== undefined)
    assignment.scheduleDay = schedule.scheduleDay;
  if (schedule.scheduleStartTime !== undefined) {
    assignment.scheduleStartTime = schedule.scheduleStartTime;
  }
  if (schedule.scheduleEndTime !== undefined) {
    assignment.scheduleEndTime = schedule.scheduleEndTime;
  }
  await assignment.save();

  await syncStudentSchedule(assignment.student_id, newTeacherId, schedule);

  return assignment;
};

export const unassignStudent = async (assignmentId) => {
  if (!isValidId(assignmentId)) {
    const err = new Error("Invalid assignment id");
    err.status = 400;
    throw err;
  }

  const assignment = await AssignStudentModel.findByIdAndDelete(assignmentId);
  if (!assignment) {
    const err = new Error("Assignment not found");
    err.status = 404;
    throw err;
  }

  await StudentModel.findByIdAndUpdate(assignment.student_id, {
    assignedTutor: null,
    assignedAt: null,
    scheduleDay: "",
    scheduleStartTime: "",
    scheduleEndTime: "",
  });

  return assignment;
};

export const getAllAssignments = async () => {
  return AssignStudentModel.find()
    .populate({
      path: "student_id",
      select: "name email status program",
      populate: { path: "program", select: "label" },
    })
    .populate("teacher_id")
    .sort({ createdAt: -1 });
};

export const getAssignmentById = async (assignmentId) => {
  if (!isValidId(assignmentId)) {
    const err = new Error("Invalid assignment id");
    err.status = 400;
    throw err;
  }

  const assignment = await AssignStudentModel.findById(assignmentId)
    .populate({
      path: "student_id",
      select: "name email status program",
      populate: { path: "program", select: "label" },
    })
    .populate("teacher_id");

  if (!assignment) {
    const err = new Error("Assignment not found");
    err.status = 404;
    throw err;
  }

  return assignment;
};

export const getAssignmentsByStudent = async (studentId) => {
  if (!isValidId(studentId)) {
    const err = new Error("Invalid student id");
    err.status = 400;
    throw err;
  }

  return AssignStudentModel.find({ student_id: studentId }).populate(
    "teacher_id",
  );
};

export const getAssignmentsByTeacher = async (teacherId) => {
  if (!isValidId(teacherId)) {
    const err = new Error("Invalid teacher id");
    err.status = 400;
    throw err;
  }

  return AssignStudentModel.find({ teacher_id: teacherId })
    .populate("teacher_id")
    .populate({
      path: "student_id",
      select: "name email status program",
      populate: { path: "program", select: "label" },
    });
};