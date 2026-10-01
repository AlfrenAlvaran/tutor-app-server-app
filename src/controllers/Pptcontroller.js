import mongoose from "mongoose";

import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload.js";

import TutorModel from "../models/TutorModel.js";
import PptModel from "../models/PptModel.js"; // fixed casing: was "Pptmodel.js"
import { ProgramModel } from "../models/ProgramModel.js";
import { StudentModel } from "../models/StudentModel.js";

function getFileType(fileName) {
  if (!fileName) return null;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "other";
}

function sanitizePpt(ppt) {
  return {
    id: ppt._id,
    title: ppt.title,
    lesson: ppt.lesson,
    description: ppt.description,
    fileUrl: ppt.fileUrl,
    fileName: ppt.fileName,
    fileType: getFileType(ppt.fileName),
    program: ppt.program
      ? {
          id: ppt.program._id ?? ppt.program,
          label: ppt.program.label ?? null,
        }
      : null,
    tutor: ppt.tutor,
    createdAt: ppt.createdAt,
  };
}

async function getTutorProfileForUser(user) {
  return TutorModel.findOne({ email: user.email }).select("_id");
}

async function getEnrolledProgramIdsForUser(user) {
  const email = user.email?.toLowerCase();

  const enrollments = await StudentModel.find({
    email,
    status: "completed",
  }).select("program");

  return enrollments.map((e) => e.program.toString());
}

export async function createPpt(req, res, next) {
  try {
    const { title, lesson, description, programId, tutorId } = req.body;
    const role = req.user.role;

    if (!title?.trim() || !lesson?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and lesson are required.",
      });
    }

    if (!programId || !mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({
        success: false,
        message: "A valid programId is required.",
      });
    }

    const program = await ProgramModel.findById(programId).select("_id");
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found.",
      });
    }

    let tutorRef = null;

    if (role === "tutor") {
      const tutorProfile = await getTutorProfileForUser(req.user);
      if (!tutorProfile) {
        return res.status(403).json({
          success: false,
          message: "No tutor profile is linked to this account.",
        });
      }
      tutorRef = tutorProfile._id;
    } else if (role === "admin") {
      if (tutorId) {
        if (!mongoose.Types.ObjectId.isValid(tutorId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid tutorId.",
          });
        }
        const tutorExists = await TutorModel.findById(tutorId).select("_id");
        if (!tutorExists) {
          return res.status(404).json({
            success: false,
            message: "Tutor not found.",
          });
        }
        tutorRef = tutorExists._id;
      }
      // else: admin creating without a tutorId — tutorRef stays null.
      // PptModel.tutor must NOT be `required: true` for this to save.
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not permitted to create PPTs.",
      });
    }

    let fileUrl = null;
    let fileId = null;
    let fileName = null;

    if (req.file) {
      try {
        const result = await uploadBufferToCloudinary(req.file.buffer, {
          fileName: req.file.originalname,
        });
        fileUrl = result.secure_url;
        fileId = result.public_id;
        fileName = req.file.originalname;
      } catch (uploadErr) {
        console.error(
          "Cloudinary upload failed:",
          JSON.stringify(
            {
              message: uploadErr?.message,
              http_code: uploadErr?.http_code,
              name: uploadErr?.name,
            },
            null,
            2,
          ),
        );

        const httpCode = uploadErr?.http_code;
        let message = "File upload failed. Please try again.";
        if (httpCode === 403) {
          message =
            "File storage rejected this upload (403). Your Cloudinary account likely needs phone/card verification before it allows raw file (PDF/DOC/DOCX/PPT) uploads — check the Home page or Billing > Plan Details for a verification prompt.";
        } else if (httpCode === 401) {
          message =
            "File storage rejected the request (401). Check your Cloudinary API key/secret in config/cloudinary.js.";
        }

        return res.status(502).json({ success: false, message });
      }
    }

    let ppt = await PptModel.create({
      title: title.trim(),
      lesson: lesson.trim(),
      description: description?.trim() ?? "",
      fileUrl,
      fileId,
      fileName,
      program: program._id,
      tutor: tutorRef,
    });

    ppt = await ppt.populate("program", "label");

    return res.status(201).json({
      success: true,
      message: "PPT added",
      ppt: sanitizePpt(ppt),
    });
  } catch (error) {
    next(error);
  }
}

export async function listPpts(req, res, next) {
  try {
    const { programId } = req.query;
    const role = req.user.role;

    if (programId && !mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid programId.",
      });
    }

    const filter = {};

    if (role === "tutor") {
      const tutorProfile = await getTutorProfileForUser(req.user);
      if (!tutorProfile) {
        return res.status(403).json({
          success: false,
          message: "No tutor profile is linked to this account.",
        });
      }
      filter.tutor = tutorProfile._id;
      if (programId) filter.program = programId;
    } else if (role === "students") {
      // Fixed: UserModel's role enum is "students" (plural), not
      // "student" — this branch never ran before, so every student
      // fell through to the final `else` and got a 403.
      const enrolledProgramIds = await getEnrolledProgramIdsForUser(req.user);

      if (enrolledProgramIds.length === 0) {
        return res.status(200).json({ success: true, ppts: [] });
      }

      if (programId) {
        if (!enrolledProgramIds.includes(programId)) {
          return res.status(403).json({
            success: false,
            message: "You are not enrolled in this program.",
          });
        }
        filter.program = programId;
      } else {
        filter.program = { $in: enrolledProgramIds };
      }
    } else if (role === "admin") {
      if (programId) filter.program = programId;
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not permitted to view PPTs.",
      });
    }

    const ppts = await PptModel.find(filter)
      .populate("program", "label")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      ppts: ppts.map(sanitizePpt),
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePpt(req, res, next) {
  try {
    const { id } = req.params;
    const role = req.user.role;

    const findFilter = { _id: id };

    if (role === "tutor") {
      const tutorProfile = await getTutorProfileForUser(req.user);
      if (!tutorProfile) {
        return res.status(403).json({
          success: false,
          message: "No tutor profile is linked to this account.",
        });
      }
      findFilter.tutor = tutorProfile._id;
    } else if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You are not permitted to delete PPTs.",
      });
    }

    const ppt = await PptModel.findOne(findFilter);
    if (!ppt) {
      return res
        .status(404)
        .json({ success: false, message: "PPT not found." });
    }

    if (ppt.fileId) {
      try {
        await deleteFromCloudinary(ppt.fileId);
      } catch (err) {
        console.error("Cloudinary delete failed:", err.message);
      }
    }

    await ppt.deleteOne();

    return res.status(200).json({ success: true, message: "PPT deleted" });
  } catch (error) {
    next(error);
  }
}