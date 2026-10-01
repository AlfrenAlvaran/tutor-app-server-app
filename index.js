import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { logger } from "./src/utils/logger.js";
import { corsOrigins, ENV } from "./src/libs/environments.js";
import { connect, disconnection } from "./src/libs/database.js";
import authRouter from "./src/routes/authRoute.js";
import hpp from "hpp";
import { pinoHttp } from "pino-http";
import { notFound } from "./src/middlewares/notFound.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import enrollRouter from "./src/routes/enrollRouter.js";
import programRouter from "./src/routes/programRouter.js";
import studentRouter from "./src/routes/Studentroutes.js";
import tutorRouter from "./src/routes/tutorRoute.js";
import { handleError } from "./src/utils/error.js";
import scheduleRouter from "./src/routes/assignmentRoute.js";
import attendanceRouter from "./src/routes/attendaceRouter.js";
import AssignStudentRouter from "./src/routes/assignStuduentRoute.js";
import participationRouter from "./src/routes/participationRoute.js";
import pptRouter from "./src/routes/Pptroutes.js";
import { DashboardController } from "./src/controllers/DashboardController.js";
import DashboardRouter from "./src/routes/DashboardRoute.js";

const app = express();

const PORT = ENV.port;
const NODE_ENV = ENV.nodeEnv;

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// --- Simplified HTTP logging ---
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} -> ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`;
    },
    // Remove the giant default req/res objects from the log output
    serializers: {
      req: () => undefined,
      res: () => undefined,
    },
    // Skip noisy polling routes (e.g. attendance/today hit every few seconds)
    autoLogging: {
      ignore: (req) => req.url.includes("/attendance/today"),
    },
  }),
);
// --------------------------------

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body);
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(hpp());

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState,
  });
});

app.use("/v1/api/auth", authRouter);
app.use("/v1/api/inquire", enrollRouter);
app.use("/v1/api/programs", programRouter);
app.use("/v1/api/students", studentRouter);
app.use("/v1/api/tutors", tutorRouter);
app.use("/v1/api/assignments", scheduleRouter);
app.use("/v1/api/attendance", attendanceRouter);
app.use("/v1/api/dashboard", DashboardRouter);
app.use("/v1/api/assign-students", AssignStudentRouter);

app.use("/v1/api/participation", participationRouter);
app.use("/v1/api/module", pptRouter);

app.use(notFound);
app.use(errorHandler);
app.use(handleError);

mongoose.set("strictQuery", true);

const startServer = async () => {
  try {
    await connect();
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnection();
      console.log("HTTP server closed. Process terminated.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

startServer();

export default app;
