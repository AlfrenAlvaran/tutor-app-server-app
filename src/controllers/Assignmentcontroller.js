import {
  createAssignment,
  deleteAssignment,
  getAssignmentStats,
  getMyAssignedStudents,
  listAssignments,
  toggleAssignmentStatus,
  updateAssignment,
} from "../services/assignmentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/error.js";
import {
  createAssignmentSchema,
  toggleStatusSchema,
  updateAssignmentSchema,
} from "../validators/Assignmentvalidation.js";

export const getAssignments = asyncHandler(async (req, res) => {
  const { studentId, tutorId, status } = req.query;
  const assignments = await listAssignments({ studentId, tutorId, status });
  return res.json({ ok: true, assignments });
});

export const getAssignmentStatsHandler = asyncHandler(async (req, res) => {
  const stats = await getAssignmentStats();
  return res.json({ ok: true, stats });
});

export const createAssignmentHandler = asyncHandler(async (req, res) => {
  const parsed = createAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(
      "Invalid assignment payload",
      parsed.error.flatten().fieldErrors,
    );
  }

  const assignment = await createAssignment(parsed.data);
  return res.status(201).json({ ok: true, assignment });
});

export const updateAssignmentHandler = asyncHandler(async (req, res) => {
  const parsed = updateAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError(
      "Invalid assignment payload",
      parsed.error.flatten().fieldErrors,
    );
  }

  const assignment = await updateAssignment(req.params.id, parsed.data);
  return res.json({ ok: true, assignment });
});

export const toggleAssignmentStatusHandler = asyncHandler(async (req, res) => {
  const parsed = toggleStatusSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new BadRequestError(
      "Invalid status payload",
      parsed.error.flatten().fieldErrors,
    );
  }

  const assignment = await toggleAssignmentStatus(
    req.params.id,
    parsed.data.status,
  );
  return res.json({ ok: true, assignment });
});

export const deleteAssignmentHandler = asyncHandler(async (req, res) => {
  await deleteAssignment(req.params.id);
  return res.status(200).json({ ok: true });
});

export const getMyAssignedStudentsHandler = asyncHandler(async (req, res) => {
  const email = req.user?.email;

  if (!email)
    return res.status(401).json({ ok: false, message: "Not authenticated" });


  const assigned = await getMyAssignedStudents(email)

  return res.json({ ok: true, assignments });
});
