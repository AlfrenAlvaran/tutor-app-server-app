import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteStudentHandler,
  editStudentHandler,
  // getAssignableStudentsHandler,
  getMyEnrollmentsHandler,
  getStudentHandler,
  issueEnrollmentHandler,
  listAllStudentsHandler,
  markSessionFinishedHandler,
} from "../controllers/Studentcontroller.js";
import {
  issueEnrollmentSchema,
  markSessionFinishedSchema,
} from "../schemas/Studentschema.js";
import { updateProgramSchema } from "../schemas/programSchema.js";
import { validateBody } from "../middlewares/validate.js";

const studentRouter = Router();

studentRouter.get(
  "/my-enrolled-program",
  protect,
  asyncHandler(getMyEnrollmentsHandler),
);
// Admin-only
studentRouter.get(
  "/all",
  protect,
  authorize("admin"),
  asyncHandler(listAllStudentsHandler),
);

// Must stay above "/:id" — otherwise Express reads "assignable" as an id.
// studentRouter.get(
//   "/assignable",
//   protect,
//   authorize("admin"),
//   asyncHandler(getAssignableStudentsHandler),
// );

studentRouter.get(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(getStudentHandler),
);

studentRouter.post(
  "/add",
  protect,
  authorize("admin"),
  validateBody(issueEnrollmentSchema),
  asyncHandler(issueEnrollmentHandler),
);

studentRouter.patch(
  "/:id",
  protect,
  authorize("admin"),
  validateBody(updateProgramSchema),
  asyncHandler(editStudentHandler),
);

studentRouter.patch(
  "/:id/session-finished",
  protect,
  authorize("admin"),
  validateBody(markSessionFinishedSchema),
  asyncHandler(markSessionFinishedHandler),
);

studentRouter.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(deleteStudentHandler),
);

studentRouter.get(
  "/all",
  authorize("admin"),
  asyncHandler(listAllStudentsHandler),
);

export default studentRouter;
