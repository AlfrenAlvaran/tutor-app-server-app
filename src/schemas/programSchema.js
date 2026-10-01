import { z } from "zod";

const baseFields = {
  label: z
    .string()
    .trim()
    .min(2, "Program label is too short")
    .max(150, "Program label is too long"),
  category: z
    .string()
    .trim()
    .min(2, "Program category is too short")
    .max(100, "Program category is too long"),
  price: z.number().min(0, "Price cannot be negative"),
  duration: z.string().trim().max(50, "Duration text is too long"),
  durationInDays: z
    .number()
    .int("Duration in days must be a whole number")
    .min(1, "Duration in days must be at least 1"),
  description: z.string().trim().max(2000, "Description is too long"),
  active: z.boolean(),
};

// Create: optional fields get defaults
export const createProgramSchema = z
  .object({
    ...baseFields,
    duration: baseFields.duration.optional().default(""),
    description: baseFields.description.optional().default(""),
    active: baseFields.active.optional().default(true),
  })
  .strict();

// Update: no defaults, so a PATCH like { active: false } doesn't wipe other fields
export const updateProgramSchema = z
  .object(baseFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });
