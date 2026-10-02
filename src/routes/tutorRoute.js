import { Router } from "express";
import {
  changePasswordController,
  createTutor,
  deleteTutor,
  fetchAllTutors,
  updateTutor,
} from "../controllers/TutorContoller.js";
import { adminWriteLimiter } from "../middlewares/rateLimiter.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  monitorAllTutors,
  monitorOneTutor,
} from "../controllers/tutorMonitor.js";

const tutorRouter = Router();

tutorRouter.get("/", fetchAllTutors);

tutorRouter.get("/monitor/tutors", monitorAllTutors);
tutorRouter.get("/monitor/tutors/:tutorId", monitorOneTutor);

tutorRouter.patch("/change-password", protect, changePasswordController);

tutorRouter.post(
  "/add",
  adminWriteLimiter,
  protect,
  authorize("admin"),
  createTutor,
);
tutorRouter.patch(
  "/:id",
  adminWriteLimiter,
  protect,
  authorize("admin"),
  updateTutor,
);

tutorRouter.delete(
  "/:id",
  adminWriteLimiter,
  protect,
  authorize("admin"),
  deleteTutor,
);

export default tutorRouter;
