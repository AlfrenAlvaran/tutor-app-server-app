import {
  createTutorSchema,
  tutorIdSchema,
  updateTutorSchema,
} from "../schemas/tutorSchema.js";
import * as TutorService from "../services/tutorService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { changePasswordSchema } from "../validators/userValidator.js";

export const fetchAllTutors = asyncHandler(async (req, res) => {
  const tutors = await TutorService.listAllTutors();
  return res.status(200).json({ success: true, data: tutors });
});

export const createTutor = asyncHandler(async (req, res) => {
  const parsed = createTutorSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid tutor data",
      error: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await TutorService.createTutor(parsed.data);

  if (result === "duplicate_email") {
    return res.status(409).json({
      success: false,
      message: "A tutor with this email already exists.",
    });
  }

  return res.status(201).json({
    success: true,
    data: result.tutor,
    message: "Teacher created. Login credentials sent via email.",
  });
});

export const updateTutor = asyncHandler(async (req, res) => {
  // id comes from the route param (PATCH /:id), not the body
  const idCheck = tutorIdSchema.safeParse(req.params);

  if (!idCheck.success) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tutor id" });
  }

  const parsed = updateTutorSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid tutor data",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const result = await TutorService.updateTutor(idCheck.data.id, parsed.data);

  if (result === "duplicate_email") {
    return res.status(409).json({
      success: false,
      message: "A tutor with this email already exists.",
    });
  }

  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "Tutor not found." });
  }

  return res.status(200).json({ success: true, data: result });
});

export const deleteTutor = asyncHandler(async (req, res) => {
  const idCheck = tutorIdSchema.safeParse(req.params);

  if (!idCheck.success) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tutor id" });
  }

  const result = await TutorService.deleteTutor(idCheck.data.id);

  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "Tutor not found." });
  }

  return res.status(200).json({ success: true, message: "Tutor deleted." });
});

export const resendTutorPassword = asyncHandler(async (req, res) => {
  const idCheck = tutorIdSchema.safeParse(req.params);

  if (!idCheck.success) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid tutor id" });
  }

  const result = await TutorService.resendTutorPassword(idCheck.data.id);

  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "Tutor not found." });
  }

  return res.status(200).json({
    success: true,
    data: result,
    message: "New login credentials sent via email.",
  });
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid password data",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const result = TutorService.changeOwnPassword(req.user.id, parsed.data);

  if (result === "not_found") {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  if (result === "invalid_current_password") {
    return res
      .status(401)
      .json({ success: false, message: "Current password is incorrect." });
  }

  if (result === "same_password") {
    return res.status(400).json({
      success: false,
      message: "New password must be different from the current password.",
    });
  }

  return res.status(200).json({ success: true, message: "Password updated." });
});
