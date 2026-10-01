import * as assignStudentService from "../services/AssignstudentService.js";

const extractSchedule = (body) => ({
  scheduleDay: body.scheduleDay,
  scheduleStartTime: body.scheduleStartTime,
  scheduleEndTime: body.scheduleEndTime,
});

export const getAssignableStudents = async (req, res) => {
  try {
    const { search, limit } = req.query;
    const students = await assignStudentService.getAssignableStudents({
      search,
      limit,
    });

    return res.status(200).json({ success: true, data: students });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch assignable students",
    });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await assignStudentService.getAllStudents();
    return res.status(200).json({ success: true, data: students });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch students",
    });
  }
};

export const assignStudent = async (req, res) => {
  try {
    const { student_id, teacher_id } = req.body;

    if (!student_id || !teacher_id) {
      return res.status(400).json({
        success: false,
        message: "student_id and teacher_id are required",
      });
    }

    const assignment = await assignStudentService.assignStudentToTeacher(
      student_id,
      teacher_id,
      extractSchedule(req.body),
    );

    return res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to assign student",
    });
  }
};

export const reassignStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id } = req.body;

    if (!teacher_id) {
      return res
        .status(400)
        .json({ success: false, message: "teacher_id is required" });
    }

    const assignment = await assignStudentService.reassignStudent(
      id,
      teacher_id,
      extractSchedule(req.body),
    );

    return res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to reassign student",
    });
  }
};

export const unassignStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await assignStudentService.unassignStudent(id);

    return res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to unassign student",
    });
  }
};

export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await assignStudentService.getAllAssignments();
    return res.status(200).json({ success: true, data: assignments });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch assignments",
    });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await assignStudentService.getAssignmentById(id);
    return res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch assignment",
    });
  }
};

export const getAssignmentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const assignments =
      await assignStudentService.getAssignmentsByStudent(studentId);
    return res.status(200).json({ success: true, data: assignments });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch assignments for student",
    });
  }
};

export const getAssignmentsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const assignments =
      await assignStudentService.getAssignmentsByTeacher(teacherId);
    return res.status(200).json({ success: true, data: assignments });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch assignments for teacher",
    });
  }
};