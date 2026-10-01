import { Router } from "express";
import * as controller from "../controllers/ParticipationController.js";
import { protect, requireRole } from "../middlewares/authMiddleware.js";

const participationRouter = Router();

participationRouter.post(
  "/generate",
  protect,
  requireRole("students"),
  controller.generateAttendanceCode,
);

participationRouter.post(
  "/check-in",
  protect,
  requireRole("tutor"),
  controller.checkInByRefCode,
);

participationRouter.post(
  "/check-out",
  protect,
  requireRole("tutor"),
  controller.checkOutByRefCode,
);

export default participationRouter;
