import { DashboardService } from "../services/DashboardService.js";

export const DashboardController = {
  async getStats(req, res, next) {
    try {
      const data = await DashboardService.getStats();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
