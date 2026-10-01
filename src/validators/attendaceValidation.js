import { z } from "zod";

export const scanAttendanceSchema = z
  .object({
    token: z.string().min(10, "token is required"),
  })
  .strict();
