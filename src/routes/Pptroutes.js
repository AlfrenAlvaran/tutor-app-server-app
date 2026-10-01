import express from "express";
import { protect, requireRole } from "../middlewares/authMiddleware.js";
import { createPpt, deletePpt, listPpts } from "../controllers/Pptcontroller.js";
import uploadPpt from "../middlewares/uploadPpt.js";

const pptRouter = express.Router();

pptRouter.use(protect);

pptRouter.get("/ppts", requireRole("tutor", "admin", "students"), listPpts);
pptRouter.post("/ppts", requireRole("tutor", "admin"), uploadPpt.single("file"), createPpt);
pptRouter.delete("/ppts/:id", requireRole("tutor", "admin"), deletePpt);

export default pptRouter;