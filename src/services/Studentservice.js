import crypto from "node:crypto";
import { StudentModel } from "../models/StudentModel.js";
import { ProgramModel } from "../models/ProgramModel.js";
import UserModel from "../models/UserModel.js";
import { logger } from "../utils/logger.js";
import AssignStudentModel from "../models/AssignStudentModel.js";

function toPlainStudent(s) {
  const program =
    s.program && typeof s.program === "object" && "label" in s.program
      ? { id: s.program._id.toString(), label: s.program.label }
      : (s.program?.toString?.() ?? s.program);

  return {
    id: s._id.toString(),
    token: s.token,
    name: s.name,
    email: s.email,
    program,
    mode: s.mode,
    status: s.status,
    completedAt: s.completedAt,
    birthdate: s.birthdate,
    address: s.address,
    guardianName: s.guardianName,
    guardianContact: s.guardianContact,
    schedulePreference: s.schedulePreference,
    attendingSchool: s.attendingSchool,
    currentSchool: s.currentSchool,
    notes: s.notes,
    sessionFinished: s.sessionFinished,
    sessionFinishedAt: s.sessionFinishedAt,
  };
}

// Shaped specifically for the tutor-assignment picker: flat program label
// (not an object, since the UI renders it directly as text), plus the
// assignment-related fields toPlainStudent() intentionally omits.
function toAssignableStudent(s) {
  return {
    id: s._id.toString(),
    name: s.name,
    email: s.email,
    program: s.program?.label ?? "",
    mode: s.mode,
    schedulePreference: s.schedulePreference,
    scheduleDay: s.scheduleDay,
    scheduleStartTime: s.scheduleStartTime,
    scheduleEndTime: s.scheduleEndTime,
    sessionFinished: s.sessionFinished,
    assignedTutor: s.assignedTutor
      ? { id: s.assignedTutor._id.toString(), name: s.assignedTutor.name }
      : null,
  };
}

function generateEnrollmentToken() {
  return crypto.randomBytes(24).toString("hex");
}

// Login password convention: the child's birthdate as yyyy-mm-dd, e.g.
// 2004-10-15. Uses UTC getters since birthdates coerced from a plain
// "YYYY-MM-DD" string parse to UTC midnight — local getters could read
// back as the previous day in negative-offset timezones.
function birthdateToPassword(birthdate) {
  const d = new Date(birthdate);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function issueEnrollment({ name, email, program, mode }) {
  const programDoc = await ProgramModel.findById(program);
  if (!programDoc) {
    const err = new Error("Program not found");
    err.statusCode = 404;
    throw err;
  }

  const student = await StudentModel.create({
    token: generateEnrollmentToken(),
    name,
    email,
    program: programDoc._id,
    mode,
  });

  return toPlainStudent(student);
}

// Public: look up the pass by token. Returns null if the token doesn't exist
// at all; the caller decides what to do with an already-completed status.
export async function getEnrollmentInfoByToken(token) {
  const student = await StudentModel.findOne({ token }).populate(
    "program",
    "label",
  );
  return student ? toPlainStudent(student) : null;
}

// Public: guardian submits the form. Returns a sentinel string for the two
// "can't proceed" cases so the controller can map them to 404 / 409, and
// the plain student record on success. On success, also creates a login
// account for the student — email from the record, password is the
// child's birthdate as yyyy-mm-dd. Account creation failures (e.g. an
// email collision) are logged but never fail the enrollment itself, since
// the enrollment data is already saved and the guardian shouldn't be
// blocked by a login-account issue.
export async function completeEnrollmentByToken(token, payload) {
  const student = await StudentModel.findOne({ token });
  if (!student) return "not_found";
  if (student.status === "completed") return "already_completed";

  const allowed = [
    "birthdate",
    "address",
    "guardianName",
    "guardianContact",
    "schedulePreference",
    "attendingSchool",
    "currentSchool",
    "notes",
  ];
  for (const key of allowed) {
    if (payload[key] !== undefined) student[key] = payload[key];
  }
  student.status = "completed";
  student.completedAt = new Date();

  await student.save();

  try {
    const existingUser = await UserModel.findOne({ email: student.email });
    if (!existingUser) {
      await UserModel.create({
        name: student.name,
        email: student.email,
        password: birthdateToPassword(student.birthdate),
        role: "students",
      });
    } else {
      logger.info(
        { email: student.email, studentId: student._id },
        "User account already exists for this email; skipped creating a new one",
      );
    }
  } catch (error) {
    logger.error(
      { err: error, studentId: student._id },
      "Failed to create user account for completed enrollment",
    );
  }

  return toPlainStudent(student);
}

export async function listAllStudents() {
  const students = await StudentModel.find()
    .populate("program", "label")
    .sort({ createdAt: -1 });
  return students.map(toPlainStudent);
}

// Admin: students eligible for the tutor-assignment picker. Only
// "completed" enrollments are eligible — a "pending" record means the
// guardian hasn't filled in the rest of the form yet, so there's nothing
// to schedule. `filter` narrows by assignment/session state, `search`
// matches name, email, or program label, `limit` caps the result count.
export async function getAssignableStudents({
  filter = "all",
  search = "",
  limit = 50,
} = {}) {
  const query = { status: "completed" };

  if (filter === "unassigned") {
    query.sessionFinished = false;
    query.assignedTutor = null;
  } else if (filter === "assigned") {
    query.sessionFinished = false;
    query.assignedTutor = { $ne: null };
  } else if (filter === "completed") {
    query.sessionFinished = true;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    const matchingPrograms = await ProgramModel.find({ label: regex }, "_id");
    query.$or = [
      { name: regex },
      { email: regex },
      { program: { $in: matchingPrograms.map((p) => p._id) } },
    ];
  }

  const students = await StudentModel.find(query)
    .populate("program", "label")
    .populate("assignedTutor", "name")
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 50);

  return students.map(toAssignableStudent);
}

// Admin: all students enrolled in a given program. Only "completed"
// enrollments count as actually enrolled — a "pending" record means the
// admin created the pass but the guardian hasn't filled in the
// completion form yet, so it isn't a real enrollment yet.
export async function getStudentsByProgram(programId) {
  const programDoc = await ProgramModel.findById(programId);
  if (!programDoc) {
    const err = new Error("Program not found");
    err.statusCode = 404;
    throw err;
  }

  const students = await StudentModel.find({
    program: programId,
    status: "completed",
  })
    .populate("program", "label")
    .sort({ createdAt: -1 });

  return students.map(toPlainStudent);
}

// Self-service: the enrollment(s) belonging to the currently logged-in
// student, matched by email — the same email the student's login account
// was created with in completeEnrollmentByToken. Returns every record for
// that email (a student could have enrolled in more than one program over
// time), newest first.
export async function getMyEnrollments(email) {
  const students = await StudentModel.find({ email: email.toLowerCase() })
    .populate("program", "label")
    .sort({ createdAt: -1 });

  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);

  const assignments = await AssignStudentModel.find({
    student_id: { $in: studentIds },
  })
    .populate("teacher_id", "name email profession bio")
    .sort({ createdAt: -1 });

  const assignmentByStudentId = new Map();
  for (const assignment of assignments) {
    const key = assignment.student_id.toString();
    if (!assignmentByStudentId.has(key)) {
      assignmentByStudentId.set(key, assignment);
    }
  }

  return students.map((student) => {
    const plain = toPlainStudent(student);
    const assignment = assignmentByStudentId.get(student._id.toString());
    const tutor = assignment?.teacher_id;

    return {
      ...plain,
      tutor: tutor
        ? {
            id: tutor._id.toString(),
            name: tutor.name,
            profession: tutor.profession,
          }
        : null,
      scheduleDay: assignment?.scheduleDay || "",
      scheduleStartTime: assignment?.scheduleStartTime || "",
      scheduleEndTime: assignment?.scheduleEndTime || "",
    };
  });
  // return students.map(toPlainStudent);
}

export async function getStudentById(id) {
  const student = await StudentModel.findById(id).populate("program", "label");
  return student ? toPlainStudent(student) : null;
}

export async function updateStudent(id, updates) {
  const allowed = [
    "name",
    "program",
    "mode",
    "birthdate",
    "address",
    "guardianName",
    "guardianContact",
    "schedulePreference",
    "attendingSchool",
    "currentSchool",
    "notes",
  ];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }

  const student = await StudentModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate("program", "label");

  return student ? toPlainStudent(student) : null;
}

// Admin: flip whether the child has finished the program/session. Clearing
// the flag also clears the timestamp so the two stay in sync.
export async function markSessionFinished(
  id,
  { sessionFinished, sessionFinishedAt },
) {
  const payload = {
    sessionFinished,
    sessionFinishedAt: sessionFinished
      ? (sessionFinishedAt ?? new Date())
      : null,
  };

  const student = await StudentModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).populate("program", "label");

  return student ? toPlainStudent(student) : null;
}

export async function deleteStudent(id) {
  const student = await StudentModel.findByIdAndDelete(id);
  return student ? toPlainStudent(student) : null;
}
