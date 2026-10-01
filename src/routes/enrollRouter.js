import { Router } from "express";
import { validateBody } from "../middlewares/validate.js";
import {
  completeEnrollmentSchema,
  enrollSchema,
  updateStatusSchema,
} from "../schemas/enrollSchema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  completePublicEnrollment,
  getPublicEnrollmentInfo,
  inquireEnrollList,
  submitEnrollment,
  updateInquiryStatus,
} from "../controllers/EnrollController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const enrollRouter = Router();

enrollRouter.post(
  "/submit-enroll",
  validateBody(enrollSchema),
  asyncHandler(submitEnrollment),
);

enrollRouter.get(
  "/enroll/:token",
  asyncHandler(getPublicEnrollmentInfo),
);
enrollRouter.post(
  "/enroll/:token",
  validateBody(completeEnrollmentSchema),
  asyncHandler(completePublicEnrollment),
);

// protected route authorize by admin only

enrollRouter.get(
  "/inquiries",
  protect,
  authorize("admin"),
  asyncHandler(inquireEnrollList),
);

enrollRouter.patch(
  "/inquiries/:id/status",
  protect,
  authorize("admin"),
  validateBody(updateStatusSchema),
  asyncHandler(updateInquiryStatus),
);

export default enrollRouter;