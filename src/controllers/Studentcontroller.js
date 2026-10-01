
import {
  listAllStudents,
  getStudentById,
  issueEnrollment,
  updateStudent,
  markSessionFinished,
  deleteStudent,
  getStudentsByProgram,
  getMyEnrollments,
} from "../services/Studentservice.js";

export async function listAllStudentsHandler(req, res, next) {
  try {
    const students = await listAllStudents();
    res.status(200).json({ ok: true, students });
  } catch (err) {
    next(err);
  }
}

export async function getStudentHandler(req, res, next) {
  try {
    const student = await getStudentById(req.params.id);
    res.status(200).json({ ok: true, student });
  } catch (err) {
    next(err);
  }
}

export async function issueEnrollmentHandler(req, res, next) {
  try {
    const { name, program, mode } = req.body;
    const student = await issueEnrollment({ name, program, mode });
    res.status(201).json({ ok: true, student });
  } catch (err) {
    next(err);
  }
}

export async function editStudentHandler(req, res, next) {
  try {
    const student = await updateStudent(req.params.id, req.body);
    res.status(200).json({ ok: true, student });
  } catch (err) {
    next(err);
  }
}

export async function markSessionFinishedHandler(req, res, next) {
  try {
    const { sessionFinished, sessionFinishedAt } = req.body;
    const student = await markSessionFinished(req.params.id, {
      sessionFinished,
      sessionFinishedAt,
    });
    res.status(200).json({ ok: true, student });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudentHandler(req, res, next) {
  try {
    await deleteStudent(req.params.id);
    res.status(200).json({ ok: true, message: "Student record deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getStudentsByProgramHandler(req, res, next) {
  try {
    const students = await getStudentsByProgram(req.params.programId);
    res.status(200).json({ ok: true, students });
  } catch (err) {
    next(err);
  }
}

export async function getMyEnrollmentsHandler(req, res, next) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ ok: false, message: "Not authenticated" });
    }

    const enrollments = await getMyEnrollments(email);
    res.status(200).json({ ok: true, enrollments });
  } catch (err) {
    next(err);
  }
}
