import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController.js";

const DashboardRouter = Router();

DashboardRouter.get("/stats", DashboardController.getStats);

export default DashboardRouter;
