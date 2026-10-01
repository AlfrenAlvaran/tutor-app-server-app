import nodemailer from "nodemailer";
import { ENV } from "../libs/environments.js";

export const transporter = nodemailer.createTransport({
  host: ENV.smtpHost,
  port: Number(ENV.smtpPort),
  secure: true,
  auth: {
    user: ENV.smtpUser,
    pass: ENV.smtpPassword,
  },
});

export async function sendMail({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    from: ENV.mailFrom || `"Tutor Platform" <no-reply@yourdomain.com>`,
    to,
    subject,
    html,
    text,
  });

  return info
}
