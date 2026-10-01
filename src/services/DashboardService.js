import { StudentModel } from "../models/StudentModel.js";
import { ProgramModel } from "../models/ProgramModel.js";

function deriveStatus(student) {
  if (student.status === "completed") return "COMPLETED";
  if (student.assignedTutor) return "IN PROGRESS";
  return "PENDING";
}

export const DashboardService = {
  async getStats() {
    const [
      enrolledStudents,
      activePrograms,
      pendingRequests,
      enrollmentByProgram,
      recentEnrollments,
    ] = await Promise.all([
      StudentModel.countDocuments({ status: "completed" }),
      ProgramModel.countDocuments({ active: true }),
      StudentModel.countDocuments({ status: "pending" }),
      StudentModel.aggregate([
        // No $match here — count every student who has a program set,
        // regardless of pending / in-progress / completed status.
        { $match: { program: { $ne: null } } },
        {
          $group: {
            _id: "$program",
            value: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "programs",
            localField: "_id",
            foreignField: "_id",
            as: "program",
          },
        },
        { $unwind: "$program" },
        {
          $project: {
            _id: 0,
            programId: "$program._id",
            name: "$program.label",
            value: 1,
          },
        },
        { $sort: { value: -1 } },
      ]),
      StudentModel.find({})
        .sort({ updatedAt: -1 })
        .limit(4)
        .populate("program", "label")
        .populate("assignedTutor", "name")
        .lean(),
    ]);

    const total = enrollmentByProgram.reduce((sum, p) => sum + p.value, 0);

    const enrollmentWithPct = enrollmentByProgram.map((p) => ({
      ...p,
      programId: p.programId.toString(),
      pct: total ? Math.round((p.value / total) * 1000) / 10 : 0,
    }));

    const recentEnrollmentRows = recentEnrollments.map((s) => ({
      id: s._id.toString(),
      child: s.name,
      program: s.program?.label ?? "—",
      tutor: s.assignedTutor?.name ?? "Unassigned",
      status: deriveStatus(s),
    }));

    return {
      stats: {
        enrolledStudents,
        activePrograms,
        pendingRequests,
      },
      enrollmentByProgram: enrollmentWithPct,
      enrollmentTotal: total,
      recentEnrollments: recentEnrollmentRows,
    };
  },
};