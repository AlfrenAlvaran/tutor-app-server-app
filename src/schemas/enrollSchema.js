import { z } from "zod";

const MODE_OPTIONS = ["Online", "In-person", "Hybrid"];

// Normalizes casing/spacing before matching against MODE_OPTIONS so
// "online", "In Person", "HYBRID" etc. don't silently fail validation.
// Falls through to the raw value if nothing matches, so a genuinely
// invalid value still produces the schema's own clear error message.
function normalizeMode(val) {
  if (typeof val !== "string") return val;
  const normalized = val.trim().toLowerCase().replace(/\s+/g, "-");
  const match = MODE_OPTIONS.find((opt) => opt.toLowerCase() === normalized);
  return match ?? val;
}

export const enrollSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name is too short")
      .regex(/^[\p{L}\s.'-]+$/u, "Full name contains invalid characters"),

    phone: z
      .string()
      .trim()
      // allow the common formatting characters people actually type:
      // spaces, +, -, (), and digits
      .min(7, "Contact number is too short")
      .regex(
        /^[0-9+\s()-]+$/,
        "Contact number contains invalid characters",
      )
      .transform((val) => val.replace(/[^\d+]/g, "")) // store normalized
      .refine((val) => val.replace(/\D/g, "").length >= 7, {
        message: "Contact number is too short",
      }),

    email: z.string().trim().toLowerCase().email("Invalid email address"),

    age: z.coerce
      .number()
      .int()
      .min(3)
      .max(99)
      .optional()
      .or(z.literal("").transform(() => undefined))
      .or(z.null().transform(() => undefined)),

    program: z.string().trim().min(1, "Please select a program"),

    mode: z.preprocess(
      normalizeMode,
      z.enum(MODE_OPTIONS, {
        errorMap: () => ({ message: "Please select a valid mode" }),
      }),
    ),

    message: z
      .string()
      .trim()
      .max(1000, "Message is too long")
      .optional()
      .default(""),

    website: z
      .string()
      .max(0, "Bot detected")
      .optional()
      .or(z.null().transform(() => ""))
      .default(""),
  })
  .strict();

const STATUS_OPTIONS = ["new", "contacted", "enrolled", "closed"];

export const updateStatusSchema = z
  .object({
    status: z.enum(STATUS_OPTIONS, {
      errorMap: () => ({ message: "Please provide a valid status" }),
    }),
  })
  .strict();

export const completeEnrollmentSchema = z
  .object({
    birthdate: z.coerce.date({
      errorMap: () => ({ message: "Please provide a valid birthdate" }),
    }),

    address: z
      .string()
      .trim()
      .min(5, "Address is too short")
      .max(300, "Address is too long"),

    guardianName: z
      .string()
      .trim()
      .min(2, "Guardian name is too short")
      .regex(/^[\p{L}\s.'-]+$/u, "Guardian name contains invalid characters"),

    guardianContact: z
      .string()
      .trim()
      .min(7, "Guardian contact is too short")
      .refine(
        (val) =>
          /^[0-9+\s()-]+$/.test(val) || // phone number
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), // email address
        {
          message: "Guardian contact must be a valid phone number or email address",
        },
      ),

    schedulePreference: z.string().trim().max(200).optional().default(""),

    attendingSchool: z.enum(["yes", "no", ""]).optional().default(""),

    currentSchool: z
      .string()
      .trim()
      .max(150, "Current school name is too long")
      .optional()
      .default(""),

    notes: z
      .string()
      .trim()
      .max(1000, "Notes are too long")
      .optional()
      .default(""),
  })
  .strict()
  .refine(
    (data) => data.attendingSchool !== "yes" || data.currentSchool.length > 0,
    {
      message: "Current school name is required when attending school",
      path: ["currentSchool"],
    },
  );