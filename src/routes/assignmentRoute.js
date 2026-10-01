import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  createAssignmentHandler,
  deleteAssignmentHandler,
  getAssignments,
  getAssignmentStatsHandler,
  toggleAssignmentStatusHandler,
  updateAssignmentHandler,
} from "../controllers/Assignmentcontroller.js";

const scheduleRouter = Router();

scheduleRouter.get("/all", protect, authorize("admin"), getAssignments);
scheduleRouter.get("/stats", protect, authorize("admin"), getAssignmentStatsHandler);
scheduleRouter.post("/add", protect, authorize("admin"), createAssignmentHandler);
scheduleRouter.patch("/:id", protect, authorize("admin"), updateAssignmentHandler);
scheduleRouter.patch("/:id/status", protect, authorize("admin"), toggleAssignmentStatusHandler);
scheduleRouter.delete("/:id", protect, authorize("admin"), deleteAssignmentHandler);

export default scheduleRouter