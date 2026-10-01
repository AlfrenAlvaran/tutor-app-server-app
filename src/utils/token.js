import jwt from "jsonwebtoken";
import { ENV } from "../libs/environments.js";
import crypto from "node:crypto";
const JWT_SECRET = ENV.secret;
const JWT_EXPIRES_IN = ENV.jwt_expires_in || "7d";
const COOKIE_EXPIRES_DAY = Number(ENV.jwt_cookie_expires_day) || 7;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: ENV.nodeEnv === "production",
    sameSite: "strict", // mitigates CSRF
    maxAge: COOKIE_EXPIRES_DAY * 24 * 60 * 60 * 1000,
  };
}

const ATTENDANCE_QR_SECRET = ENV.attendanceQrSecret;
if (!ATTENDANCE_QR_SECRET) {
  throw new Error("ATTENDANCE TOKEN is required");
}

const TOKEN_TTL_SECONDS = 5 * 60; // VALID FOR 5 MINS

export function attendanceToken({ studentId, tutorId, purpose }) {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { studentId, tutorId, purpose },
    ATTENDANCE_QR_SECRET,
    {
      expiresIn: TOKEN_TTL_SECONDS,
      jwtid: jti,
    },
  );

  return {
    token,
    jti,
    expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000),
  };
}
export function verifyAttendance(token) {
  const payload = jwt.verify(token, ATTENDANCE_QR_SECRET);
  return {
    studentId: payload.studentId,
    tutorId: payload.tutorId,
    purpose: payload.purpose,
    jti: payload.jti,
  };
}
